import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { rateLimit } from "@/middleware/rateLimit";
import { registerUser, loginUser } from "@/services/neonAuth";

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
 * 密码验证规则
 */
const passwordSchema = z
  .string()
  .min(8, "密码长度至少为 8 个字符")
  .regex(/[a-z]/, "密码必须包含小写字母")
  .regex(/[A-Z]/, "密码必须包含大写字母")
  .regex(/[0-9]/, "密码必须包含数字");

/**
 * POST /api/auth/register
 * 用户注册
 * 
 * @body { email: string, password: string, username?: string }
 */
router.post(
  "/",
  rateLimit("register"),
  validateFields({
    email: z.string()
      .email("无效的邮箱格式")
      .max(255, "邮箱长度不能超过 255 个字符"),
    password: passwordSchema,
    username: z.string().max(100, "用户名不能超过 100 个字符").optional(),
  }),
  async (req, res) => {
    const { email, password, username } = req.body;

    try {
      const result = await registerUser(email, password, username);

      if (!result.success) {
        return res.status(400).send(error(result.error || REGISTER_ERROR_MESSAGES.failed));
      }

      // 返回用户信息和 Token
      return res.status(200).send(
        success(
          {
            id: result.user?.id,
            email: result.user?.email,
            username: result.user?.username,
            created_at: result.user?.created_at,
            token: result.token,
            refresh_token: result.refresh_token,
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

/**
 * POST /api/auth/login
 * 用户登录（Neon Auth 版本）
 * 
 * @body { email: string, password: string }
 */
router.post(
  "/login",
  rateLimit("login"),
  validateFields({
    email: z.string().email("无效的邮箱格式"),
    password: z.string().min(1, "请输入密码"),
  }),
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await loginUser(email, password);

      if (!result.success) {
        // 隐藏具体错误，防止枚举攻击
        return res.status(401).send(error("邮箱或密码错误"));
      }

      // 返回用户信息和 Token
      return res.status(200).send(
        success(
          {
            token: result.token,
            refresh_token: result.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            user: {
              id: result.user?.id,
              email: result.user?.email,
              username: result.user?.username,
            },
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

export default router;
