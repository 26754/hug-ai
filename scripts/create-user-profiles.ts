/**
 * Supabase 用户资料表设置脚本
 * 使用 Supabase REST API 创建表和配置 RLS
 */

const SUPABASE_URL = "https://ptrjrkeraivjwkepjphd.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cmpya2VyYWl2andrZXBqcGhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE0OTI2MywiZXhwIjoyMDkxNzI1MjYzfQ.bXfvAJUElnxvZqTCOtFCo9KtqjXmLBiUCLsNRMLbt0g";

async function createUserProfilesTable() {
  console.log("📝 创建用户资料表...\n");

  // SQL 创建表和 RLS
  const sql = `
-- ============================================
-- 用户资料表
-- ============================================

-- 创建用户扩展信息表
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "用户可以查看所有资料" ON public.user_profiles;
DROP POLICY IF EXISTS "用户只能查看自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "用户只能更新自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "用户可以创建自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "用户可以删除自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "启用插入" ON public.user_profiles;
DROP POLICY IF EXISTS "启用读取" ON public.user_profiles;
DROP POLICY IF EXISTS "启用更新" ON public.user_profiles;

-- 创建 RLS 策略
-- 允许所有人查看资料（公开）
CREATE POLICY "用户可以查看所有资料" ON public.user_profiles
  FOR SELECT USING (true);

-- 允许用户创建自己的资料
CREATE POLICY "用户可以创建自己的资料" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的资料
CREATE POLICY "用户只能更新自己的资料" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 允许用户删除自己的资料
CREATE POLICY "用户可以删除自己的资料" ON public.user_profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================
-- 更新历史表（可选，用于记录资料变更）
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profile_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.user_profile_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户可以查看自己的历史" ON public.user_profile_history;
DROP POLICY IF EXISTS "系统可以记录历史" ON public.user_profile_history;

CREATE POLICY "用户可以查看自己的历史" ON public.user_profile_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "系统可以记录历史" ON public.user_profile_history
  FOR INSERT WITH CHECK (true);
`;

  try {
    // 使用 Supabase REST API 执行 SQL
    // 注意：标准 API 不支持 DDL，需要使用 pg endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query_sql: sql }),
    });

    console.log("执行状态:", response.status);
    
    if (response.ok) {
      console.log("✅ 表创建成功!");
    } else {
      const errorText = await response.text();
      console.log("⚠️ RPC 方式可能不可用");
      console.log("请在 Supabase Dashboard > SQL Editor 执行以下 SQL:");
      console.log("\n" + sql);
    }
  } catch (err) {
    console.log("⚠️ 执行出错，请手动在 Supabase Dashboard 执行 SQL");
    console.log("\n" + sql);
  }
}

// 检查表是否存在
async function checkTables() {
  console.log("\n🔍 检查现有表...\n");

  const tables = ["user_profiles", "user_profile_history"];

  for (const table of tables) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?limit=1`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );

    if (response.ok) {
      console.log(`✅ ${table} 表存在`);
    } else {
      console.log(`❌ ${table} 表不存在`);
    }
  }
}

// 插入一个测试用户资料
async function insertTestProfile() {
  console.log("\n📝 创建测试用户资料...\n");

  // 先获取一个用户 ID
  const usersResponse = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (!usersResponse.ok) {
    console.log("❌ 无法获取用户列表");
    return;
  }

  const usersData = await usersResponse.json();
  if (!usersData.users || usersData.users.length === 0) {
    console.log("⚠️ 没有用户可测试");
    return;
  }

  const userId = usersData.users[0].id;
  const email = usersData.users[0].email;
  const username = email.split("@")[0];

  // 插入用户资料
  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: userId,
      username: username,
      display_name: username,
      bio: "Toonflow 用户",
    }),
  });

  if (insertResponse.status === 201) {
    const data = await insertResponse.json();
    console.log("✅ 测试用户资料创建成功:", data);
  } else {
    const errorText = await insertResponse.text();
    if (errorText.includes("duplicate")) {
      console.log("ℹ️ 用户资料已存在，跳过创建");
    } else {
      console.log("⚠️ 创建失败:", errorText);
    }
  }
}

async function main() {
  console.log("==========================================");
  console.log("   Supabase 用户资料表设置");
  console.log("==========================================\n");

  await createUserProfilesTable();
  await checkTables();
  await insertTestProfile();

  console.log("\n==========================================");
  console.log("   设置完成");
  console.log("==========================================");
  console.log("\n下一步:");
  console.log("1. 如果表未创建，请在 Supabase Dashboard 执行 SQL");
  console.log("2. 运行 npm run build && npm start 重启服务");
  console.log("3. 测试注册和登录功能");
}

main().catch(console.error);
