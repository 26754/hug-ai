import { getSupabaseAdmin } from "@/storage/supabase/client";
import { UserMetadata } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 创建用户资料
 */
export async function createUserProfile(
  userId: string,
  profile: {
    username: string;
    display_name?: string;
    avatar_url?: string;
    email?: string;
  }
): Promise<UserProfile | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      id: userId,
      username: profile.username,
      display_name: profile.display_name || profile.username,
      avatar_url: profile.avatar_url,
      email: profile.email,
    })
    .select()
    .single();

  if (error) {
    console.error("创建用户资料失败:", error);
    return null;
  }

  return data as UserProfile;
}

/**
 * 获取用户资料
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("获取用户资料失败:", error);
    return null;
  }

  return data as UserProfile;
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    username: string;
    display_name: string;
    avatar_url: string;
    bio: string;
    phone: string;
  }>
): Promise<UserProfile | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("更新用户资料失败:", error);
    return null;
  }

  return data as UserProfile;
}

/**
 * 通过用户名获取用户资料
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    return null;
  }

  return data as UserProfile;
}

/**
 * 检查用户名是否可用
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const profile = await getUserProfileByUsername(username);
  return profile === null;
}
