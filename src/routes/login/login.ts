import express from "express";
import { getSupabase } from "@/storage/supabase/client";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { getUserProfile } from "@/services/userProfile";
import { rateLimit } from "@/middleware/rateLimit";
import { registerSession, extractSessionId } from "@/services/sessionManager";

const router = express.Router();

/**
 * 登录错误消息（隐藏具体原因，防止枚举攻击）
 */
const LOGIN_ERROR_MESSAGE = "邮箱或密码错误";
const RATE_LIMIT_MESSAGE = "登录尝试次数过多，请稍后再试";

/**
 * POST /api/login/login
 * 用户登录
 * 
 * @body { email: string, password: string }
 */
router.post(
  "/",
  rateLimit("login"), // 防暴力破解
  validateFields({
    email: z.string().email("无效的邮箱格式"),
    password: z.string().min(1, "请输入密码"),
  }),
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const supabase = getSupabase();

      // 使用 Supabase Auth 登录
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 隐藏具体错误原因
      if (authError) {
        console.error("登录失败:", authError.message);
        
        // 检查是否是频率限制
        if (authError.message.includes("rate limit") || 
            authError.message.includes("too many attempts")) {
          return res.status(429).send(error(RATE_LIMIT_MESSAGE));
        }
        
        return res.status(401).send(error(LOGIN_ERROR_MESSAGE));
      }

      if (!data.session || !data.user) {
        return res.status(401).send(error(LOGIN_ERROR_MESSAGE));
      }

      // 注册会话
      const sessionId = extractSessionId(req) || data.session.access_token;
      registerSession(data.user.id, sessionId, req);

      // 获取用户资料
      const profile = await getUserProfile(data.user.id);

      // 返回用户信息和 Token
      return res.status(200).send(
        success(
          {
            token: `Bearer ${data.session.access_token}`,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            session_id: data.session.session_id,
            user: {
              id: data.user.id,
              email: data.user.email,
              username: profile?.username || data.user.user_metadata?.username || data.user.email?.split("@")[0],
              display_name: profile?.display_name,
              avatar_url: profile?.avatar_url,
            },
          },
          "登录成功"
        )
      );
    } catch (err: any) {
      console.error("登录失败:", err);
      
      // 检查是否是频率限制错误
      if (err.message?.includes("rate limit")) {
        return res.status(429).send(error(RATE_LIMIT_MESSAGE));
      }
      
      return res.status(500).send(error("服务器错误，请稍后重试"));
    }
  }
);

/**
 * POST /api/login/refresh
 * 刷新 Token
 * 
 * @body { refresh_token: string }
 */
router.post(
  "/refresh",
  rateLimit("refresh"), // 防滥用
  validateFields({
    refresh_token: z.string(),
  }),
  async (req, res) => {
    const { refresh_token } = req.body;

    try {
      const supabase = getSupabase();

      const { data, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (refreshError) {
        console.error("Token 刷新失败:", refreshError.message);
        return res.status(401).send(error("会话已过期，请重新登录"));
      }

      if (!data.session || !data.user) {
        return res.status(401).send(error("会话已过期，请重新登录"));
      }

      // 更新会话活跃时间
      const sessionId = data.session.session_id || data.session.access_token;
      const { updateSessionActivity } = await import("@/services/sessionManager");
      updateSessionActivity(sessionId);

      // 返回新的 Token
      return res.status(200).send(
        success(
          {
            token: `Bearer ${data.session.access_token}`,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            session_id: data.session.session_id,
          },
          "Token 刷新成功"
        )
      );
    } catch (err: any) {
      console.error("Token 刷新失败:", err);
      return res.status(500).send(error("服务器错误，请稍后重试"));
    }
  }
);

/**
 * GET /api/login/sessions
 * 获取当前用户的会话列表
 */
router.get("/sessions", async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).send(error("未登录"));
    }

    const { getUserSessions } = await import("@/services/sessionManager");
    const sessions = getUserSessions(user.id);
    
    // 敏感信息脱敏
    const sanitizedSessions = sessions.map(s => ({
      id: s.id,
      device_info: s.deviceInfo,
      ip_address: s.ipAddress,
      created_at: new Date(s.createdAt).toISOString(),
      last_active_at: new Date(s.lastActiveAt).toISOString(),
      is_current: s.isCurrent,
    }));

    return res.status(200).send(
      success(sanitizedSessions, "获取会话列表成功")
    );
  } catch (err: any) {
    console.error("获取会话列表失败:", err);
    return res.status(500).send(error("获取会话列表失败"));
  }
});

/**
 * DELETE /api/login/sessions/:sessionId
 * 撤销指定会话（强制下线）
 */
router.delete("/sessions/:sessionId", async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).send(error("未登录"));
    }

    const { sessionId } = req.params;
    const { revokeSession, getUserSessions } = await import("@/services/sessionManager");
    
    // 验证会话属于当前用户
    const sessions = getUserSessions(user.id);
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res.status(404).send(error("会话不存在"));
    }

    await revokeSession(sessionId);

    return res.status(200).send(
      success({ revoked: true }, "会话已撤销")
    );
  } catch (err: any) {
    console.error("撤销会话失败:", err);
    return res.status(500).send(error("撤销会话失败"));
  }
});

/**
 * DELETE /api/login/sessions
 * 撤销所有其他会话（除了当前）
 */
router.delete("/sessions", async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).send(error("未登录"));
    }

    const currentSessionId = req.headers['x-session-id'] as string || 
                              extractSessionId(req);
    
    const { revokeOtherSessions } = await import("@/services/sessionManager");
    const revokedCount = await revokeOtherSessions(user.id, currentSessionId || '');

    return res.status(200).send(
      success({ revoked_count: revokedCount }, `已撤销 ${revokedCount} 个会话`)
    );
  } catch (err: any) {
    console.error("撤销会话失败:", err);
    return res.status(500).send(error("撤销会话失败"));
  }
});

export default router;
