import express from "express";
import { getSupabase } from "@/storage/supabase/client";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { rateLimit } from "@/middleware/rateLimit";

const router = express.Router();

/**
 * POST /api/auth/verify-email
 * 验证邮箱（发送验证邮件）
 * 
 * @body { email: string }
 */
router.post(
  "/",
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
