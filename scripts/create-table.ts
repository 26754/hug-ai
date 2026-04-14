/**
 * Supabase 数据库设置脚本
 * 使用 REST API 创建表和配置 RLS
 */

const SUPABASE_URL = "https://ptrjrkeraivjwkepjphd.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cmpya2VyYWl2andrZXBqcGhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE0OTI2MywiZXhwIjoyMDkxNzI1MjYzfQ.bXfvAJUElnxvZqTCOtFCo9KtqjXmLBiUCLsNRMLbt0g";

async function createTable() {
  console.log("📝 创建用户扩展表...\n");

  // SQL 语句创建表和 RLS
  const sql = `
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

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "用户只能查看自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "用户只能更新自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "用户可以创建自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "启用用户读取" ON public.user_profiles;
DROP POLICY IF EXISTS "启用用户插入" ON public.user_profiles;
DROP POLICY IF EXISTS "启用用户更新" ON public.user_profiles;
DROP POLICY IF EXISTS "启用用户删除" ON public.user_profiles;

-- 创建 RLS 策略
CREATE POLICY "启用用户读取" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "启用用户插入" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "启用用户更新" ON public.user_profiles FOR UPDATE USING (true);
CREATE POLICY "启用用户删除" ON public.user_profiles FOR DELETE USING (true);
`;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({ query_sql: sql }),
    });

    if (response.ok) {
      console.log("✅ 表创建成功!");
    } else {
      // 可能没有 exec_sql 函数，尝试其他方式
      console.log("⚠️ RPC 方式不可用，尝试直接调用...");
      const errorText = await response.text();
      console.log("响应:", errorText);
    }
  } catch (err) {
    console.log("⚠️ 无法执行 SQL，请手动在 Supabase Dashboard 执行:");
    console.log(sql);
  }
}

// 检查表是否存在
async function checkTable() {
  console.log("\n🔍 检查表是否存在...\n");

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_profiles?limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (response.ok) {
    const data = await response.json();
    console.log("✅ user_profiles 表存在!");
    console.log("当前数据:", data);
    return true;
  } else {
    console.log("❌ user_profiles 表不存在");
    return false;
  }
}

async function main() {
  const tableExists = await checkTable();
  
  if (!tableExists) {
    await createTable();
    // 再次检查
    await checkTable();
  }

  console.log("\n📋 下一步:");
  console.log("1. 如果表不存在，请在 Supabase Dashboard > SQL Editor 执行上面的 SQL");
  console.log("2. 然后重新运行此脚本验证");
}

main();
