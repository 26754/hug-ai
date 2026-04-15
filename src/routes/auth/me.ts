import express from "express";
import { success, error } from "@/lib/responseFormat";
import { getUserById } from "@/services/neonAuth";

const router = express.Router();

/**
 * GET /
 * 获取当前登录用户的信息
 */
router.get("/", async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user || !user.id) {
      return res.status(401).send(error("未登录"));
    }

    // 获取用户信息
    const userInfo = await getUserById(user.id);

    if (!userInfo) {
      return res.status(404).send(error("用户不存在"));
    }

    return res.status(200).send(
      success(
        {
          id: userInfo.id,
          email: userInfo.email,
          username: userInfo.username,
          display_name: userInfo.display_name,
          avatar_url: userInfo.avatar_url,
          bio: userInfo.bio,
          phone: userInfo.phone,
          created_at: userInfo.created_at,
        },
        "获取用户信息成功"
      )
    );
  } catch (err: any) {
    console.error("获取用户信息失败:", err);
    return res.status(500).send(error("获取用户信息失败"));
  }
});

export default router;
