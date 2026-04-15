/**
 * Neon 数据库客户端
 * 支持 Serverless PostgreSQL 连接
 */

import { Pool } from 'pg'

// Neon 连接配置
const NEON_CONFIG = {
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}

// 全局连接池
let pool: Pool | null = null

/**
 * 获取 Neon 数据库连接池
 */
export function getNeonPool(): Pool {
  if (!pool) {
    if (!NEON_CONFIG.connectionString) {
      console.warn('NEON_CONNECTION_STRING not configured, using mock mode')
      // 返回一个 mock pool 用于开发
      return createMockPool()
    }
    pool = new Pool(NEON_CONFIG)
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle Neon client', err)
    })
  }
  return pool
}

/**
 * 执行查询
 */
export async function neonQuery<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = getNeonPool()
  const start = Date.now()
  
  try {
    const result = await client.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'dev') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount })
    }
    
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0
    }
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}

/**
 * 获取单个结果
 */
export async function neonQueryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await neonQuery<T>(text, params)
  return result.rows[0] || null
}

/**
 * 初始化数据库表
 */
export async function initNeonSchema(): Promise<void> {
  const client = getNeonPool()
  
  // 用户表
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      username VARCHAR(100),
      display_name VARCHAR(255),
      avatar_url TEXT,
      bio TEXT,
      phone VARCHAR(50),
      email_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  // 用户资料表
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      username VARCHAR(100) UNIQUE,
      display_name VARCHAR(255),
      avatar_url TEXT,
      bio TEXT,
      phone VARCHAR(50),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  // 会话表
  await client.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash VARCHAR(255) NOT NULL,
      device_info VARCHAR(255),
      ip_address VARCHAR(50),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  // 索引
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token_hash);
  `)

  console.log('Neon schema initialized')
}

/**
 * Mock Pool 用于开发环境
 */
function createMockPool(): Pool {
  const mockRows: any[] = []
  
  return {
    query: async (text: string, params?: any[]) => {
      console.log('[Mock Neon] Query:', text.substring(0, 100), params)
      return { rows: mockRows, rowCount: 0 }
    },
    on: () => {},
    connect: async () => ({
      query: async () => ({ rows: mockRows, rowCount: 0 }),
      release: () => {}
    }),
    end: async () => {}
  } as unknown as Pool
}

export default {
  getNeonPool,
  neonQuery,
  neonQueryOne,
  initNeonSchema
}
