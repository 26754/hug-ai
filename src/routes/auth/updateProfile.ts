import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { updateUserProfile, isUsernameAvailable } from "@/services/userProfile";
import { z } from "zod";

const router = express.Router();

/**
 * PUT /api/auth/profile
 * 更新当前用户资料
 */
router.put(
  "/profile",
  validateFields({
    display_name: z.string().optional(),
    avatar_url: z.string().url().optional().or(z.literal("")),
    bio: z.string().max(500).optional(),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional().or(z.literal("")),
  }),
  async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.id) {
        return res.status(401).send(error("未登录"));
      }

      const { display_name, avatar_url, bio, phone } = req.body;

      const updatedProfile = await updateUserProfile(user.id, {
        display_name,
        avatar_url,
        bio,
        phone,
      });

      if (!updatedProfile) {
        return res.status(400).send(error("更新资料失败"));
      }

      return res.status(200).send(
        success(
          {
            id: user.id,
            email: user.email,
            username: updatedProfile.username,
            display_name: updatedProfile.display_name,
            avatar_url: updatedProfile.avatar_url,
            bio: updatedProfile.bio,
            phone: updatedProfile.phone,
            updated_at: updatedProfile.updated_at,
          },
          "更新资料成功"
        )
      );
    } catch (err: any) {
      console.error("更新用户资料失败:", err);
      return res.status(500).send(error(err.message || "更新资料失败"));
    }
  }
);

export default router;
