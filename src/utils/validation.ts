import { z } from "zod";

/**
 * 密码强度验证规则：
 * - 至少 8 个字符
 * - 至少包含一个大写字母
 * - 至少包含一个小写字母
 * - 至少包含一个数字
 */
export const passwordSchema = z
  .string()
  .min(8, "密码至少8个字符")
  .regex(/[A-Z]/, "密码需包含至少一个大写字母")
  .regex(/[a-z]/, "密码需包含至少一个小写字母")
  .regex(/[0-9]/, "密码需包含至少一个数字");

/**
 * 用户名验证规则：
 * - 3-20 个字符
 * - 只能包含字母、数字、下划线
 * - 必须以字母开头
 */
export const usernameSchema = z
  .string()
  .min(3, "用户名至少3个字符")
  .max(20, "用户名最多20个字符")
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "用户名只能包含字母、数字、下划线，且以字母开头");

/**
 * 注册表单验证
 */
export const registerSchema = z.object({
  email: z.string().email("无效的邮箱格式"),
  password: passwordSchema,
  username: usernameSchema.optional(),
});

/**
 * 登录表单验证
 */
export const loginSchema = z.object({
  email: z.string().email("无效的邮箱格式"),
  password: z.string().min(1, "请输入密码"),
});

/**
 * 验证密码强度并返回详细错误
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("密码至少8个字符");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("密码需包含至少一个大写字母");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("密码需包含至少一个小写字母");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("密码需包含至少一个数字");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 获取密码强度等级
 */
export function getPasswordStrengthLevel(password: string): {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "弱", color: "red" };
  if (score <= 2) return { level: 2, label: "较弱", color: "orange" };
  if (score <= 3) return { level: 3, label: "中等", color: "yellow" };
  if (score <= 4) return { level: 4, label: "强", color: "green" };
  return { level: 4, label: "非常强", color: "darkgreen" };
}
