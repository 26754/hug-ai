import express from "express";
import { success, error } from "@/lib/responseFormat";
import { getUserProfile } from "@/services/userProfile";

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

    // 获取用户资料
    const profile = await getUserProfile(user.id);

    return res.status(200).send(
      success(
        {
          id: user.id,
          email: user.email,
          username: profile?.username || user.username,
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          bio: profile?.bio,
          phone: profile?.phone,
          created_at: profile?.created_at,
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
