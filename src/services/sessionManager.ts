/**
 * 会话管理服务
 * 管理用户会话，支持：
 * - 多设备登录控制
 * - 强制下线
 * - 会话列表
 */

import { getSupabaseAdmin } from "@/storage/supabase/client";

interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: number;
  lastActiveAt: number;
  isCurrent: boolean;
}

// 内存会话缓存（生产环境建议使用 Redis）
const sessionCache = new Map<string, SessionInfo>();
const userSessionsCache = new Map<string, Set<string>>();

// 配置
const SESSION_CONFIG = {
  maxDevices: 5,           // 最大同时在线设备数
  sessionTimeoutMs: 7 * 24 * 60 * 60 * 1000, // 7 天会话超时
  cleanupIntervalMs: 60 * 60 * 1000, // 1 小时清理间隔
};

/**
 * 清理过期会话
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessionCache.entries()) {
    if (now - session.lastActiveAt > SESSION_CONFIG.sessionTimeoutMs) {
      sessionCache.delete(sessionId);
      
      // 从用户会话列表中移除
      const userSessions = userSessionsCache.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          userSessionsCache.delete(session.userId);
        }
      }
    }
  }
}

// 启动定时清理
let cleanupInterval: NodeJS.Timeout | null = null;

export function startSessionCleanup() {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanupExpiredSessions, SESSION_CONFIG.cleanupIntervalMs);
  }
}

export function stopSessionCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * 创建设备信息字符串
 */
export function createDeviceInfo(req: any): string {
  const userAgent = req.headers['user-agent'] || 'unknown';
  return userAgent.substring(0, 200);
}

/**
 * 获取 IP 地址
 */
export function getIpAddress(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * 注册新会话
 */
export function registerSession(
  userId: string,
  sessionId: string,
  req: any
): SessionInfo {
  const now = Date.now();
  
  const sessionInfo: SessionInfo = {
    id: sessionId,
    userId,
    deviceInfo: createDeviceInfo(req),
    ipAddress: getIpAddress(req),
    createdAt: now,
    lastActiveAt: now,
    isCurrent: true,
  };
  
  // 检查用户会话数量
  let userSessions = userSessionsCache.get(userId);
  if (!userSessions) {
    userSessions = new Set();
    userSessionsCache.set(userId, userSessions);
  }
  
  // 如果超过最大设备数，移除最早的会话
  if (userSessions.size >= SESSION_CONFIG.maxDevices) {
    let oldestSessionId: string | null = null;
    let oldestTime = Infinity;
    
    for (const sid of userSessions) {
      const session = sessionCache.get(sid);
      if (session && session.createdAt < oldestTime) {
        oldestTime = session.createdAt;
        oldestSessionId = sid;
      }
    }
    
    if (oldestSessionId) {
      // 从 Supabase 撤销该会话
      revokeSessionFromSupabase(oldestSessionId);
      
      // 从缓存移除
      sessionCache.delete(oldestSessionId);
      userSessions.delete(oldestSessionId);
    }
  }
  
  // 添加新会话
  sessionCache.set(sessionId, sessionInfo);
  userSessions.add(sessionId);
  
  return sessionInfo;
}

/**
 * 更新会话活跃时间
 */
export function updateSessionActivity(sessionId: string): void {
  const session = sessionCache.get(sessionId);
  if (session) {
    session.lastActiveAt = Date.now();
  }
}

/**
 * 从 Supabase 撤销会话
 */
async function revokeSessionFromSupabase(sessionId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    // Supabase 7.x 版本使用 sessions API
    const { error } = await supabase.auth.admin.signOut(sessionId);
    if (error) {
      console.error('撤销会话失败:', error);
    }
  } catch (err) {
    console.error('撤销会话异常:', err);
  }
}

/**
 * 获取用户的所有会话
 */
export function getUserSessions(userId: string): SessionInfo[] {
  const sessionIds = userSessionsCache.get(userId);
  if (!sessionIds) return [];
  
  return Array.from(sessionIds)
    .map(id => sessionCache.get(id))
    .filter((s): s is SessionInfo => s !== undefined);
}

/**
 * 撤销指定会话
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  const session = sessionCache.get(sessionId);
  if (!session) return false;
  
  await revokeSessionFromSupabase(sessionId);
  
  sessionCache.delete(sessionId);
  const userSessions = userSessionsCache.get(session.userId);
  if (userSessions) {
    userSessions.delete(sessionId);
  }
  
  return true;
}

/**
 * 撤销用户所有其他会话（除了当前）
 */
export async function revokeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
  const sessions = getUserSessions(userId);
  let revokedCount = 0;
  
  for (const session of sessions) {
    if (session.id !== currentSessionId) {
      const success = await revokeSession(session.id);
      if (success) revokedCount++;
    }
  }
  
  return revokedCount;
}

/**
 * 撤销用户所有会话
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  const sessions = getUserSessions(userId);
  let revokedCount = 0;
  
  for (const session of sessions) {
    const success = await revokeSession(session.id);
    if (success) revokedCount++;
  }
  
  return revokedCount;
}

/**
 * 验证会话是否有效
 */
export function isSessionValid(sessionId: string): boolean {
  const session = sessionCache.get(sessionId);
  if (!session) return false;
  
  const now = Date.now();
  return now - session.lastActiveAt <= SESSION_CONFIG.sessionTimeoutMs;
}

/**
 * 从请求中提取会话 ID
 */
export function extractSessionId(req: any): string | null {
  // 优先从 token 中解析
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // JWT payload 第二段
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.ses || payload.session_id || null;
    } catch {
      return null;
    }
  }
  return null;
}

export default {
  registerSession,
  updateSessionActivity,
  getUserSessions,
  revokeSession,
  revokeOtherSessions,
  revokeAllUserSessions,
  isSessionValid,
  extractSessionId,
  startSessionCleanup,
  stopSessionCleanup,
  createDeviceInfo,
  getIpAddress,
};
