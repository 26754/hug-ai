import express from "express";
import { getSupabaseAdmin, getSupabase } from "@/storage/supabase/client";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { passwordSchema, usernameSchema } from "@/utils/validation";
import { createUserProfile } from "@/services/userProfile";

const router = express.Router();

/**
 * POST /api/auth/register
 * 用户注册
 * 
 * @body { email: string, password: string, username?: string }
 */
router.post(
  "/",
  validateFields({
    email: z.string().email("无效的邮箱格式"),
    password: passwordSchema,
    username: usernameSchema.optional(),
  }),
  async (req, res) => {
    const { email, password, username } = req.body;

    try {
      const supabase = getSupabaseAdmin();
      const generatedUsername = username || `user_${Date.now()}`;

      // 检查用户名是否已存在（如果提供了用户名）
      if (username) {
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("username")
          .eq("username", username)
          .single();
        
        if (existingProfile) {
          return res.status(400).send(error("用户名已被使用"));
        }
      }

      // 使用 Supabase Auth 注册
      const { data, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 自动确认邮箱（生产环境建议设为 false）
        user_metadata: {
          username: generatedUsername,
        },
      });

      if (authError) {
        console.error("Supabase 注册失败:", authError);
        // 隐藏具体错误，防止枚举攻击
        if (authError.message.includes("already been registered")) {
          return res.status(400).send(error("该邮箱已被注册"));
        }
        return res.status(400).send(error("注册失败，请稍后重试"));
      }

      // 创建用户资料
      await createUserProfile(data.user!.id, {
        username: generatedUsername,
        email: email,
      });

      // 注册成功后自动登录
      const { data: sessionData, error: signInError } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !sessionData.session) {
        // 注册成功但自动登录失败，仍然返回成功
        return res.status(200).send(
          success(
            {
              id: data.user?.id,
              email: data.user?.email,
              username: generatedUsername,
              created_at: data.user?.created_at,
              need_relogin: true, // 标记需要重新登录
            },
            "注册成功"
          )
        );
      }

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
          },
          "注册成功"
        )
      );
    } catch (err: any) {
      console.error("注册失败:", err);
      return res.status(500).send(error("服务器错误，请稍后重试"));
    }
  }
);

export default router;
