/**
 * Neon Auth 服务
 * 用户注册、登录、Token 管理
 * 支持内存存储（开发模式）和 Neon 数据库（生产模式）
 */

import { neonQuery, neonQueryOne } from '@/storage/neon/client'
import * as crypto from 'crypto'
import * as bcrypt from 'bcrypt'

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'toonflow-dev-secret-key-change-in-production'
const JWT_EXPIRES_IN = '1h'
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000 // 7 天

// 密码哈希配置
const SALT_ROUNDS = 12

// 检查是否使用 Neon
const USE_NEON = !!process.env.NEON_CONNECTION_STRING

// 内存存储（开发模式）
interface MemoryUser {
  id: string
  email: string
  password_hash: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  phone?: string
  created_at: Date
}

interface MemorySession {
  id: string
  user_id: string
  refresh_token_hash: string
  device_info?: string
  ip_address?: string
  expires_at: Date
  created_at: Date
  last_active_at: Date
}

const memoryUsers = new Map<string, MemoryUser>()
const memorySessions = new Map<string, MemorySession>()
const emailIndex = new Map<string, string>() // email -> userId
const usernameIndex = new Map<string, string>() // username -> userId

// ==================== JWT Token ====================

/**
 * 生成 JWT Token
 */
function generateJWT(payload: object, expiresIn: string = JWT_EXPIRES_IN): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const exp = expiresIn === '7d' 
    ? now + 7 * 24 * 60 * 60 
    : now + 60 * 60 // 1 hour
  
  const payloadStr = Buffer.from(JSON.stringify({
    ...payload,
    iat: now,
    exp
  })).toString('base64url')
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payloadStr}`)
    .digest('base64url')
  
  return `${header}.${payloadStr}.${signature}`
}

/**
 * 验证 JWT Token
 */
export function verifyJWT(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' }
    }
    
    const [header, payload, signature] = parts
    
    // 验证签名
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url')
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' }
    }
    
    // 解析 payload
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    
    // 检查过期
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' }
    }
    
    return { valid: true, payload: decoded }
  } catch (err) {
    return { valid: false, error: 'Invalid token' }
  }
}

/**
 * 生成刷新令牌
 */
function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

/**
 * 哈希刷新令牌
 */
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ==================== Neon 数据库实现 ====================

async function registerUserNeon(
  email: string,
  password: string,
  username: string
): Promise<{ success: boolean; user?: UserInfo; token?: string; refresh_token?: string; error?: string }> {
  // 初始化表
  try {
    await neonQuery(`
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
    
    await neonQuery(`
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
    
    await neonQuery(`
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
  } catch (e) {
    console.error('Failed to initialize tables:', e)
  }

  // 检查邮箱
  const existingUser = await neonQueryOne(
    'SELECT id FROM users WHERE email = $1',
    [email]
  )
  
  if (existingUser) {
    return { success: false, error: '该邮箱已被注册' }
  }

  // 检查用户名
  if (username) {
    const existingUsername = await neonQueryOne(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    )
    
    if (existingUsername) {
      return { success: false, error: '用户名已被使用' }
    }
  }

  // 哈希密码
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  // 创建用户
  const userResult = await neonQueryOne<any>(
    `INSERT INTO users (email, password_hash, username) 
     VALUES ($1, $2, $3) 
     RETURNING id, email, username, created_at`,
    [email, passwordHash, username]
  )

  if (!userResult) {
    return { success: false, error: '创建用户失败' }
  }

  // 创建用户资料
  await neonQuery(
    `INSERT INTO user_profiles (id, username) VALUES ($1, $2)`,
    [userResult.id, username]
  )

  // 生成 Token
  const token = generateJWT({
    sub: userResult.id,
    email: userResult.email,
    username: userResult.username
  })

  const refreshToken = generateRefreshToken()
  
  // 存储刷新令牌
  await neonQuery(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at) 
     VALUES ($1, $2, $3)`,
    [userResult.id, hashRefreshToken(refreshToken), new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN)]
  )

  return {
    success: true,
    user: {
      id: userResult.id,
      email: userResult.email,
      username: userResult.username,
      created_at: userResult.created_at.toString()
    },
    token: `Bearer ${token}`,
    refresh_token: refreshToken
  }
}

async function loginUserNeon(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserInfo; token?: string; refresh_token?: string; error?: string }> {
  const user = await neonQueryOne<any>(
    'SELECT id, email, password_hash, username, created_at FROM users WHERE email = $1',
    [email]
  )

  if (!user) {
    return { success: false, error: '邮箱或密码错误' }
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash)
  
  if (!passwordValid) {
    return { success: false, error: '邮箱或密码错误' }
  }

  const token = generateJWT({
    sub: user.id,
    email: user.email,
    username: user.username
  })

  const refreshToken = generateRefreshToken()
  
  await neonQuery(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at) 
     VALUES ($1, $2, $3)`,
    [user.id, hashRefreshToken(refreshToken), new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN)]
  )

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created_at.toString()
    },
    token: `Bearer ${token}`,
    refresh_token: refreshToken
  }
}

// ==================== 内存存储实现（开发模式） ====================

async function registerUserMemory(
  email: string,
  password: string,
  username: string
): Promise<{ success: boolean; user?: UserInfo; token?: string; refresh_token?: string; error?: string }> {
  const normalizedEmail = email.toLowerCase()
  const normalizedUsername = username.toLowerCase()
  
  // 检查邮箱
  if (emailIndex.has(normalizedEmail)) {
    return { success: false, error: '该邮箱已被注册' }
  }
  
  // 检查用户名
  if (username && usernameIndex.has(normalizedUsername)) {
    return { success: false, error: '用户名已被使用' }
  }

  // 哈希密码
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  // 创建用户
  const userId = crypto.randomUUID()
  const user: MemoryUser = {
    id: userId,
    email: normalizedEmail,
    password_hash: passwordHash,
    username: username,
    created_at: new Date()
  }
  
  memoryUsers.set(userId, user)
  emailIndex.set(normalizedEmail, userId)
  if (username) {
    usernameIndex.set(normalizedUsername, userId)
  }

  // 生成 Token
  const token = generateJWT({
    sub: userId,
    email: normalizedEmail,
    username: username
  })

  const refreshToken = generateRefreshToken()
  
  // 存储刷新令牌
  const session: MemorySession = {
    id: crypto.randomUUID(),
    user_id: userId,
    refresh_token_hash: hashRefreshToken(refreshToken),
    expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
    created_at: new Date(),
    last_active_at: new Date()
  }
  memorySessions.set(session.id, session)

  return {
    success: true,
    user: {
      id: userId,
      email: normalizedEmail,
      username: username,
      created_at: user.created_at.toISOString()
    },
    token: `Bearer ${token}`,
    refresh_token: refreshToken
  }
}

async function loginUserMemory(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserInfo; token?: string; refresh_token?: string; error?: string }> {
  const normalizedEmail = email.toLowerCase()
  
  const userId = emailIndex.get(normalizedEmail)
  if (!userId) {
    return { success: false, error: '邮箱或密码错误' }
  }
  
  const user = memoryUsers.get(userId)
  if (!user) {
    return { success: false, error: '邮箱或密码错误' }
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash)
  
  if (!passwordValid) {
    return { success: false, error: '邮箱或密码错误' }
  }

  const token = generateJWT({
    sub: user.id,
    email: user.email,
    username: user.username
  })

  const refreshToken = generateRefreshToken()
  
  const session: MemorySession = {
    id: crypto.randomUUID(),
    user_id: user.id,
    refresh_token_hash: hashRefreshToken(refreshToken),
    expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
    created_at: new Date(),
    last_active_at: new Date()
  }
  memorySessions.set(session.id, session)

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created_at.toISOString()
    },
    token: `Bearer ${token}`,
    refresh_token: refreshToken
  }
}

// ==================== 公开 API ====================

/**
 * 注册新用户
 */
export async function registerUser(
  email: string,
  password: string,
  username?: string
): Promise<{
  success: boolean
  user?: UserInfo
  token?: string
  refresh_token?: string
  error?: string
}> {
  const normalizedEmail = email.toLowerCase().trim()
  const generatedUsername = username?.trim() || `user_${Date.now().toString(36)}`

  try {
    if (USE_NEON) {
      return await registerUserNeon(normalizedEmail, password, generatedUsername)
    } else {
      console.log('[Neon Auth] Using memory storage (development mode)')
      return await registerUserMemory(normalizedEmail, password, generatedUsername)
    }
  } catch (err: any) {
    console.error('Register error:', err)
    // 如果 Neon 失败，回退到内存存储
    if (USE_NEON) {
      console.log('[Neon Auth] Falling back to memory storage')
      return await registerUserMemory(normalizedEmail, password, generatedUsername)
    }
    return { success: false, error: '注册失败，请稍后重试' }
  }
}

/**
 * 用户登录
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{
  success: boolean
  user?: UserInfo
  token?: string
  refresh_token?: string
  error?: string
}> {
  const normalizedEmail = email.toLowerCase().trim()

  try {
    if (USE_NEON) {
      return await loginUserNeon(normalizedEmail, password)
    } else {
      console.log('[Neon Auth] Using memory storage (development mode)')
      return await loginUserMemory(normalizedEmail, password)
    }
  } catch (err: any) {
    console.error('Login error:', err)
    // 如果 Neon 失败，回退到内存存储
    if (USE_NEON) {
      console.log('[Neon Auth] Falling back to memory storage')
      return await loginUserMemory(normalizedEmail, password)
    }
    return { success: false, error: '登录失败，请稍后重试' }
  }
}

/**
 * 刷新 Token
 */
export async function refreshTokenFn(
  refreshToken: string
): Promise<{
  success: boolean
  token?: string
  refresh_token?: string
  error?: string
}> {
  const tokenHash = hashRefreshToken(refreshToken)

  try {
    if (USE_NEON) {
      const session = await neonQueryOne<any>(
        `SELECT s.id, s.user_id, u.email, u.username 
         FROM sessions s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.refresh_token_hash = $1`,
        [tokenHash]
      )

      if (!session) {
        return { success: false, error: '无效的刷新令牌' }
      }

      if (new Date(session.expires_at) < new Date()) {
        await neonQuery('DELETE FROM sessions WHERE id = $1', [session.id])
        return { success: false, error: '刷新令牌已过期' }
      }

      const newToken = generateJWT({ sub: session.user_id, email: session.email, username: session.username })
      const newRefreshToken = generateRefreshToken()

      await neonQuery(
        `UPDATE sessions SET refresh_token_hash = $1, expires_at = $2 WHERE id = $3`,
        [hashRefreshToken(newRefreshToken), new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN), session.id]
      )

      return {
        success: true,
        token: `Bearer ${newToken}`,
        refresh_token: newRefreshToken
      }
    } else {
      // 内存存储
      for (const [sessionId, session] of memorySessions) {
        if (session.refresh_token_hash === tokenHash) {
          if (session.expires_at < new Date()) {
            memorySessions.delete(sessionId)
            return { success: false, error: '刷新令牌已过期' }
          }
          
          const user = memoryUsers.get(session.user_id)
          if (!user) {
            return { success: false, error: '用户不存在' }
          }
          
          const newToken = generateJWT({ sub: user.id, email: user.email, username: user.username })
          const newRefreshToken = generateRefreshToken()
          
          session.refresh_token_hash = hashRefreshToken(newRefreshToken)
          session.expires_at = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN)
          session.last_active_at = new Date()
          
          return {
            success: true,
            token: `Bearer ${newToken}`,
            refresh_token: newRefreshToken
          }
        }
      }
      
      return { success: false, error: '无效的刷新令牌' }
    }
  } catch (err: any) {
    console.error('Refresh token error:', err)
    return { success: false, error: '令牌刷新失败' }
  }
}

/**
 * 获取用户信息
 */
export async function getUserById(userId: string): Promise<UserInfo | null> {
  try {
    if (USE_NEON) {
      const user = await neonQueryOne<any>(
        `SELECT u.id, u.email, u.username, p.display_name, p.avatar_url, p.bio, p.phone, u.created_at 
         FROM users u 
         LEFT JOIN user_profiles p ON u.id = p.id 
         WHERE u.id = $1`,
        [userId]
      )
      
      return user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        phone: user.phone,
        created_at: user.created_at?.toString() || new Date().toISOString()
      } : null
    } else {
      const user = memoryUsers.get(userId)
      return user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        phone: user.phone,
        created_at: user.created_at.toISOString()
      } : null
    }
  } catch (err) {
    console.error('Get user error:', err)
    return null
  }
}

/**
 * 退出登录
 */
export async function logout(refreshToken: string): Promise<boolean> {
  try {
    const tokenHash = hashRefreshToken(refreshToken)

    if (USE_NEON) {
      await neonQuery('DELETE FROM sessions WHERE refresh_token_hash = $1', [tokenHash])
    } else {
      for (const [sessionId, session] of memorySessions) {
        if (session.refresh_token_hash === tokenHash) {
          memorySessions.delete(sessionId)
          break
        }
      }
    }
    return true
  } catch (err) {
    console.error('Logout error:', err)
    return false
  }
}

/**
 * 退出所有设备
 */
export async function logoutAll(userId: string): Promise<number> {
  try {
    if (USE_NEON) {
      const result = await neonQuery('DELETE FROM sessions WHERE user_id = $1', [userId])
      return result.rowCount
    } else {
      let count = 0
      for (const [sessionId, session] of memorySessions) {
        if (session.user_id === userId) {
          memorySessions.delete(sessionId)
          count++
        }
      }
      return count
    }
  } catch (err) {
    console.error('Logout all error:', err)
    return 0
  }
}

/**
 * 获取用户会话列表
 */
export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  try {
    if (USE_NEON) {
      const sessions = await neonQuery<any>(
        `SELECT id, device_info, ip_address, created_at, last_active_at, expires_at 
         FROM sessions 
         WHERE user_id = $1 
         ORDER BY last_active_at DESC`,
        [userId]
      )
      
      return sessions.rows.map(s => ({
        id: s.id,
        device_info: s.device_info || 'Unknown',
        ip_address: s.ip_address || 'Unknown',
        created_at: s.created_at?.toString() || new Date().toISOString(),
        last_active_at: s.last_active_at?.toString() || new Date().toISOString(),
        is_current: false
      }))
    } else {
      const sessions: SessionInfo[] = []
      for (const session of memorySessions.values()) {
        if (session.user_id === userId) {
          sessions.push({
            id: session.id,
            device_info: session.device_info || 'Unknown',
            ip_address: session.ip_address || 'Unknown',
            created_at: session.created_at.toISOString(),
            last_active_at: session.last_active_at.toISOString(),
            is_current: false
          })
        }
      }
      return sessions
    }
  } catch (err) {
    console.error('Get sessions error:', err)
    return []
  }
}

// 类型定义
export interface UserInfo {
  id: string
  email: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  phone?: string
  created_at: string
}

export interface SessionInfo {
  id: string
  device_info: string
  ip_address: string
  created_at: string
  last_active_at: string
  is_current: boolean
}

export default {
  registerUser,
  loginUser,
  refreshToken: refreshTokenFn,
  getUserById,
  logout,
  logoutAll,
  getUserSessions,
  verifyJWT
}
