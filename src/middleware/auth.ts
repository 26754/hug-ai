/**
 * 认证中间件
 * 用于保护需要认证的路由
 */

import { Request, Response, NextFunction } from 'express'
import { verifyJWT } from '@/services/neonAuth'

// 白名单路径
const WHITE_LIST = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/login/refresh',
  '/api/other/getVersion'
]

/**
 * 认证中间件
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 检查白名单
  const isWhiteListed = WHITE_LIST.some(path => 
    req.path === path || req.path === path + '/'
  )
  
  if (isWhiteListed) {
    return next()
  }

  // 从 header 获取 token
  const rawToken = req.headers.authorization || (req.query.token as string) || ''
  const token = rawToken.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供token' })
  }

  // 验证 Token
  const result = verifyJWT(token)

  if (!result.valid) {
    return res.status(401).json({ code: 401, message: result.error || '无效的token' })
  }

  // 注入用户信息
  ;(req as any).user = {
    id: result.payload?.sub,
    email: result.payload?.email,
    username: result.payload?.username
  }
  
  next()
}

export default authMiddleware
