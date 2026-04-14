import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 获取环境变量
function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL || process.env.COZE_SUPABASE_URL || "";
}

function getSupabaseAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || "";
}

function getSupabaseServiceKey(): string {
  return process.env.SUPABASE_SERVICE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || "";
}

// 延迟创建客户端（运行时初始化）
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// 创建匿名客户端（用于浏览器端）
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    if (!url || !key) {
      throw new Error("Supabase URL or Anon Key is not configured");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// 创建服务角色客户端（用于服务端，不受 RLS 限制）
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = getSupabaseUrl();
    const key = getSupabaseServiceKey();
    if (!url || !key) {
      throw new Error("Supabase URL or Service Key is not configured");
    }
    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// 导出默认实例（向后兼容）
export const supabase = {
  get client() {
    return getSupabase();
  },
};

export const supabaseAdmin = {
  get client() {
    return getSupabaseAdmin();
  },
};

// 类型定义
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: UserProfile | null;
  session: any;
  error: string | null;
}
