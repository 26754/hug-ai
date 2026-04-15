import express from "express";
import { success } from "@/lib/responseFormat";
import { logout } from "@/services/neonAuth";

const router = express.Router();

/**
 * POST /
 * 用户退出登录
 */
router.post("/", async (req, res) => {
  try {
    // 获取 refresh_token
    const { refresh_token } = req.body || {};
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    // 如果提供了 refresh_token，则撤销会话
    if (refresh_token) {
      await logout(refresh_token);
    }

    return res.status(200).send(success(null, "退出登录成功"));
  } catch (err: any) {
    console.error("退出登录失败:", err);
    // 即使失败也返回成功，因为客户端会清除本地 token
    return res.status(200).send(success(null, "退出登录成功"));
  }
});

/**
 * POST /all
 * 用户退出所有设备
 */
router.post("/all", async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user || !user.id) {
      return res.status(401).send({ message: "未登录" });
    }

    const { logoutAll } = await import("@/services/neonAuth");
    const count = await logoutAll(user.id);

    return res.status(200).send(success({ count }, `已退出 ${count} 个设备`));
  } catch (err: any) {
    console.error("退出所有设备失败:", err);
    return res.status(500).send({ message: "退出失败" });
  }
});

export default router;
