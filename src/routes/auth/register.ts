import express from "express";
import bcrypt from "bcryptjs";
import u from "@/utils";
import jwt from "jsonwebtoken";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";

const router = express.Router();

// 注册
router.post(
  "/",
  validateFields({
    username: z.string().min(3, "用户名至少3个字符"),
    password: z.string().min(6, "密码至少6个字符"),
  }),
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // 检查用户名是否已存在
      const existingUser = await u.db("o_user").where("name", "=", username).first();
      if (existingUser) {
        return res.status(400).send(error("用户名已存在"));
      }

      // 加密密码
      const hashedPassword = bcrypt.hashSync(password, 10);

      // 创建用户
      const result = await u.db("o_user").insert({
        name: username,
        password: hashedPassword,
      });

      // 生成 token
      const tokenData = await u.db("o_setting").where("key", "tokenKey").first();
      if (!tokenData) {
        return res.status(400).send(error("未找到 tokenKey"));
      }

      const token = (jwt.sign as any)(
        {
          id: result.id || 1,
          name: username,
        },
        tokenData.value as string,
        { expiresIn: "180Days" }
      );

      return res.status(200).send(
        success(
          {
            token: "Bearer " + token,
            name: username,
            id: result.id || 1,
          },
          "注册成功"
        )
      );
    } catch (err) {
      console.error("注册失败:", err);
      return res.status(500).send(error("注册失败"));
    }
  }
);

export default router;
