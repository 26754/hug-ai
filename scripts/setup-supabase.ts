import { getSupabaseAdmin } from "../src/storage/supabase/client";

async function setupSupabase() {
  console.log("🔍 检查 Supabase 连接...");
  
  const supabase = getSupabaseAdmin();

  // 测试连接
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("❌ Supabase 连接失败:", error.message);
    return;
  }
  
  console.log("✅ Supabase 连接成功!");
  console.log("📊 当前用户数量:", data.users.length);
  
  // 显示现有用户
  if (data.users.length > 0) {
    console.log("\n👥 现有用户:");
    data.users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} (${user.id})`);
    });
  }
  
  console.log("\n📝 用户扩展表创建 SQL:");
  console.log(`
-- 创建用户扩展信息表
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户只能查看自己的资料" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户只能更新自己的资料" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户可以创建自己的资料" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
  `);
  
  return { success: true, users: data.users };
}

setupSupabase()
  .then(result => {
    console.log("\n✅ 设置完成:", result);
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ 设置失败:", err);
    process.exit(1);
  });
