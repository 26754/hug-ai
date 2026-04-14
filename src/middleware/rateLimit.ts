/**
 * 频率限制中间件 - 防暴力破解
 * 使用内存存储，适用于单机部署
 * 生产环境建议使用 Redis
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

// 存储各 IP 的请求记录
const rateLimitStore = new Map<string, RateLimitEntry>();

// 配置
const RATE_LIMIT_CONFIG = {
  // 登录限制
  login: {
    maxAttempts: 5,        // 5 次尝试
    windowMs: 15 * 60 * 1000, // 15 分钟窗口
    lockoutMs: 30 * 60 * 1000, // 锁定 30 分钟
  },
  // 注册限制
  register: {
    maxAttempts: 3,        // 3 次尝试
    windowMs: 60 * 60 * 1000, // 1 小时窗口
    lockoutMs: 24 * 60 * 60 * 1000, // 锁定 24 小时
  },
  // Token 刷新限制
  refresh: {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000, // 5 分钟窗口
    lockoutMs: 15 * 60 * 1000, // 锁定 15 分钟
  },
};

type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

/**
 * 清理过期记录（每小时执行一次）
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // 删除超过锁定时间的记录
    if (now - entry.lastAttempt > 2 * 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

// 启动定时清理
setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

/**
 * 创建频率限制中间件
 * @param type 限制类型：login | register | refresh
 * @param keyExtractor 从请求中提取标识的函数
 */
export function rateLimit(
  type: RateLimitType,
  keyExtractor?: (req: any) => string
) {
  return (req: any, res: any, next: any) => {
    const config = RATE_LIMIT_CONFIG[type];
    const now = Date.now();
    
    // 默认使用 IP 作为标识
    const identifier = keyExtractor 
      ? keyExtractor(req) 
      : (req.ip || req.connection.remoteAddress || 'unknown');
    
    const entry = rateLimitStore.get(identifier);
    
    // 检查是否在锁定期间
    if (entry) {
      const timeSinceFirstAttempt = now - entry.firstAttempt;
      const timeSinceLastAttempt = now - entry.lastAttempt;
      
      // 如果在锁定期间
      if (timeSinceFirstAttempt < config.windowMs && entry.count >= config.maxAttempts) {
        const remainingLockout = Math.ceil((config.lockoutMs - timeSinceLastAttempt) / 1000);
        if (remainingLockout > 0) {
          return res.status(429).send({
            code: 429,
            data: null,
            message: `操作过于频繁，请在 ${Math.ceil(remainingLockout / 60)} 分钟后重试`,
          });
        }
      }
      
      // 重置计数（如果窗口已过）
      if (timeSinceFirstAttempt >= config.windowMs) {
        rateLimitStore.delete(identifier);
      }
    }
    
    // 更新记录
    const currentEntry = rateLimitStore.get(identifier) || {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
    };
    
    currentEntry.count++;
    currentEntry.lastAttempt = now;
    rateLimitStore.set(identifier, currentEntry);
    
    // 添加响应头
    const remaining = config.maxAttempts - currentEntry.count;
    res.set({
      'X-RateLimit-Limit': config.maxAttempts,
      'X-RateLimit-Remaining': Math.max(0, remaining),
      'X-RateLimit-Reset': Math.ceil((currentEntry.firstAttempt + config.windowMs) / 1000),
    });
    
    next();
  };
}

/**
 * 获取限制状态（用于调试）
 */
export function getRateLimitStatus(identifier: string) {
  return rateLimitStore.get(identifier);
}

/**
 * 清除限制（管理员使用）
 */
export function clearRateLimit(identifier: string) {
  rateLimitStore.delete(identifier);
}

/**
 * 清除所有限制（管理员使用）
 */
export function clearAllRateLimits() {
  rateLimitStore.clear();
}

export default rateLimit;
