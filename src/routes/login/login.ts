import express from "express";
import { getSupabase } from "@/storage/supabase/client";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";

const router = express.Router();

/**
 * POST /api/login/login
 * 使用 Supabase Auth 登录
 * 
 * @body { email: string, password: string }
 */
router.post(
  "/",
  validateFields({
    email: z.string().email("无效的邮箱格式"),
    password: z.string(),
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

      if (authError) {
        console.error("Supabase 登录失败:", authError);
        return res.status(401).send(error(authError.message));
      }

      if (!data.session || !data.user) {
        return res.status(401).send(error("登录失败"));
      }

      // 返回用户信息和 Token
      return res.status(200).send(
        success(
          {
            token: `Bearer ${data.session.access_token}`,
            refresh_token: data.session.refresh_token,
            user: {
              id: data.user.id,
              email: data.user.email,
              username: data.user.user_metadata?.username || data.user.email?.split("@")[0],
              avatar_url: data.user.user_metadata?.avatar_url,
            },
            expires_at: data.session.expires_at,
          },
          "登录成功"
        )
      );
    } catch (err: any) {
      console.error("登录失败:", err);
      return res.status(500).send(error(err.message || "登录失败"));
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
        return res.status(401).send(error(refreshError.message));
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
      return res.status(500).send(error(err.message || "Token 刷新失败"));
    }
  }
);

export default router;
