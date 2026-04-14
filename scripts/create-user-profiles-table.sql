/**
 * 创建用户资料表的 SQL
 * 需要在 Supabase Dashboard 或通过 SQL Editor 执行
 */

-- 创建用户资料扩展表
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全策略
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "用户只能查看自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "用户只能更新自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "用户可以创建自己的资料" ON public.user_profiles;
DROP POLICY IF EXISTS "启用公开读取" ON public.user_profiles;
DROP POLICY IF EXISTS "启用插入" ON public.user_profiles;
DROP POLICY IF EXISTS "启用更新" ON public.user_profiles;

-- 创建 RLS 策略
-- 允许公开读取用户名（用于展示）
CREATE POLICY "启用公开读取" ON public.user_profiles
  FOR SELECT USING (true);

-- 仅用户自己可以更新资料
CREATE POLICY "用户只能更新自己的资料" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 允许插入（由服务端触发创建）
CREATE POLICY "启用插入" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
