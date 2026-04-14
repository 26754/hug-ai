import express from "express";
import { getSupabase } from "@/storage/supabase/client";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { getUserProfile } from "@/services/userProfile";

const router = express.Router();

/**
 * 登录错误消息（隐藏具体原因，防止枚举攻击）
 */
const LOGIN_ERROR_MESSAGE = "邮箱或密码错误";

/**
 * POST /api/login/login
 * 用户登录
 * 
 * @body { email: string, password: string }
 */
router.post(
  "/",
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
        return res.status(401).send(error(LOGIN_ERROR_MESSAGE));
      }

      if (!data.session || !data.user) {
        return res.status(401).send(error(LOGIN_ERROR_MESSAGE));
      }

      // 获取用户资料
      const profile = await getUserProfile(data.user.id);

      // 返回用户信息和 Token
      return res.status(200).send(
        success(
          {
            token: `Bearer ${data.session.access_token}`,
            refresh_token: data.session.refresh_token,
            user: {
              id: data.user.id,
              email: data.user.email,
              username: profile?.username || data.user.user_metadata?.username || data.user.email?.split("@")[0],
              display_name: profile?.display_name,
              avatar_url: profile?.avatar_url,
            },
            expires_at: data.session.expires_at,
          },
          "登录成功"
        )
      );
    } catch (err: any) {
      console.error("登录失败:", err);
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

      return res.status(200).send(
        success(
          {
            token: `Bearer ${data.session?.access_token}`,
            refresh_token: data.session?.refresh_token,
            expires_at: data.session?.expires_at,
          },
          "Token 刷新成功"
        )
      );
    } catch (err: any) {
      console.error("Token 刷新失败:", err);
      return res.status(500).send(error("服务器错误"));
    }
  }
);

export default router;
