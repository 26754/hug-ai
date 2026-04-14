import express from "express";
import { getSupabase } from "@/storage/supabase/client";
import { success } from "@/lib/responseFormat";

const router = express.Router();

/**
 * POST /
 * 用户退出登录
 */
router.post("/", async (req, res) => {
  try {
    const supabase = getSupabase();

    // 获取请求中的 token
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      // 尝试登出（如果 token 无效会失败，但不阻塞流程）
      await supabase.auth.signOut();
    }

    return res.status(200).send(success(null, "退出登录成功"));
  } catch (err: any) {
    console.error("退出登录失败:", err);
    // 即使失败也返回成功，因为客户端会清除本地 token
    return res.status(200).send(success(null, "退出登录成功"));
  }
});

export default router;
