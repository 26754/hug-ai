import express from "express";
import { getSupabaseAdmin, getSupabase } from "@/storage/supabase/client";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { passwordSchema, usernameSchema } from "@/utils/validation";
import { createUserProfile } from "@/services/userProfile";
import { rateLimit } from "@/middleware/rateLimit";
import { registerSession } from "@/services/sessionManager";

const router = express.Router();

/**
 * 注册错误消息（隐藏具体原因）
 */
const REGISTER_ERROR_MESSAGES = {
  emailExists: "该邮箱已被注册",
  usernameExists: "用户名已被使用",
  failed: "注册失败，请稍后重试",
  rateLimit: "注册操作过于频繁，请稍后再试",
};

/**
 * POST /api/auth/register
 * 用户注册
 * 
 * @body { email: string, password: string, username?: string }
 */
router.post(
  "/",
  rateLimit("register"), // 防滥用
  validateFields({
    email: z.string()
      .email("无效的邮箱格式")
      .max(255, "邮箱长度不能超过 255 个字符"),
    password: passwordSchema,
    username: usernameSchema.optional(),
  }),
  async (req, res) => {
    const { email, password, username } = req.body;

    try {
      const supabase = getSupabaseAdmin();
      const supabaseClient = getSupabase();
      
      // 标准化邮箱（转小写、去空格）
      const normalizedEmail = email.toLowerCase().trim();
      const generatedUsername = username?.trim() || `user_${Date.now().toString(36)}`;

      // 检查用户名是否已存在（如果提供了用户名）
      if (username) {
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("username")
          .eq("username", username.toLowerCase().trim())
          .single();
        
        if (existingProfile) {
          return res.status(400).send(error(REGISTER_ERROR_MESSAGES.usernameExists));
        }
      }

      // 使用 Supabase Auth 注册
      const { data, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true, // 自动确认邮箱（可配置为 false 以启用邮件验证）
        user_metadata: {
          username: generatedUsername,
          registration_ip: req.ip || req.connection.remoteAddress,
          registered_at: new Date().toISOString(),
        },
      });

      if (authError) {
        console.error("Supabase 注册失败:", authError);
        
        // 隐藏具体错误，防止枚举攻击
        if (authError.message.includes("already been registered") ||
            authError.message.includes("already exists")) {
          return res.status(400).send(error(REGISTER_ERROR_MESSAGES.emailExists));
        }
        
        // 检查频率限制错误
        if (authError.message.includes("rate limit") ||
            authError.message.includes("too many requests")) {
          return res.status(429).send(error(REGISTER_ERROR_MESSAGES.rateLimit));
        }
        
        return res.status(400).send(error(REGISTER_ERROR_MESSAGES.failed));
      }

      if (!data.user) {
        return res.status(400).send(error(REGISTER_ERROR_MESSAGES.failed));
      }

      // 创建用户资料（异步，不阻塞响应）
      const profilePromise = createUserProfile(data.user.id, {
        username: generatedUsername,
        email: normalizedEmail,
      }).catch((err) => {
        console.error("创建用户资料失败:", err);
        return null;
      });

      // 注册成功后自动登录
      const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      // 等待资料创建完成
      await profilePromise;

      // 如果自动登录失败，返回成功但标记需要重新登录
      if (signInError || !sessionData.session) {
        console.error("自动登录失败:", signInError);
        return res.status(200).send(
          success(
            {
              id: data.user?.id,
              email: data.user?.email,
              username: generatedUsername,
              created_at: data.user?.created_at,
              need_relogin: true,
            },
            "注册成功，请登录"
          )
        );
      }

      // 注册会话
      const sessionId = sessionData.session.session_id || sessionData.session.access_token;
      registerSession(data.user!.id, sessionId, req);

      // 返回用户信息和 Token
      return res.status(200).send(
        success(
          {
            id: data.user?.id,
            email: data.user?.email,
            username: generatedUsername,
            created_at: data.user?.created_at,
            token: `Bearer ${sessionData.session.access_token}`,
            refresh_token: sessionData.session.refresh_token,
            expires_at: sessionData.session.expires_at,
            session_id: sessionData.session.session_id,
            user: {
              id: data.user?.id,
              email: data.user?.email,
              username: generatedUsername,
            },
          },
          "注册成功"
        )
      );
    } catch (err: any) {
      console.error("注册失败:", err);
      
      // 检查频率限制
      if (err.message?.includes("rate limit") ||
          err.message?.includes("too many")) {
        return res.status(429).send(error(REGISTER_ERROR_MESSAGES.rateLimit));
      }
      
      return res.status(500).send(error("服务器错误，请稍后重试"));
    }
  }
);

/**
 * POST /api/auth/verify-email
 * 验证邮箱（发送验证邮件）
 * 
 * @body { email: string }
 */
router.post(
  "/verify-email",
  rateLimit("refresh"), // 复用 refresh 限制
  validateFields({
    email: z.string().email("无效的邮箱格式"),
  }),
  async (req, res) => {
    const { email } = req.body;

    try {
      const supabase = getSupabase();
      const normalizedEmail = email.toLowerCase().trim();

      const { error: verifyError } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
      });

      if (verifyError) {
        console.error("发送验证邮件失败:", verifyError);
        
        if (verifyError.message.includes("rate limit")) {
          return res.status(429).send(error("发送次数过多，请稍后再试"));
        }
        
        return res.status(400).send(error("发送验证邮件失败"));
      }

      return res.status(200).send(
        success({ sent: true }, "验证邮件已发送")
      );
    } catch (err: any) {
      console.error("验证邮件发送失败:", err);
      return res.status(500).send(error("服务器错误，请稍后重试"));
    }
  }
);

export default router;
