import express from "express";
import { getSupabaseAdmin } from "@/storage/supabase/client";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";

const router = express.Router();

/**
 * POST /api/auth/register
 * 使用 Supabase Auth 注册用户
 * 
 * @body { email: string, password: string, username?: string }
 */
router.post(
  "/",
  validateFields({
    email: z.string().email("无效的邮箱格式"),
    password: z.string().min(6, "密码至少6个字符"),
    username: z.string().optional(),
  }),
  async (req, res) => {
    const { email, password, username } = req.body;

    try {
      const supabase = getSupabaseAdmin();

      // 使用 Supabase Auth 注册
      const { data, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 自动确认邮箱（生产环境建议设为 false）
        user_metadata: {
          username: username || email.split("@")[0],
        },
      });

      if (authError) {
        console.error("Supabase 注册失败:", authError);
        return res.status(400).send(error(authError.message));
      }

      // 生成自定义 JWT Token
      const { data: tokenData } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

      // 返回用户信息
      return res.status(200).send(
        success(
          {
            id: data.user?.id,
            email: data.user?.email,
            username: data.user?.user_metadata?.username || username || email.split("@")[0],
            created_at: data.user?.created_at,
          },
          "注册成功"
        )
      );
    } catch (err: any) {
      console.error("注册失败:", err);
      return res.status(500).send(error(err.message || "注册失败"));
    }
  }
);

export default router;
