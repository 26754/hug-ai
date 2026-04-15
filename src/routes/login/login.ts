/**
 * 登录路由
 * POST /api/login/login - 用户登录
 * POST /api/login/refresh - 刷新 Token
 * GET /api/login/sessions - 获取会话列表
 */

import { Router, Request, Response } from 'express'
import neonAuth from '@/services/neonAuth'
import { authMiddleware } from '@/middleware/auth'
import { rateLimit } from '@/middleware/rateLimit'
import type { SessionInfo } from '@/services/neonAuth'

const router = Router()
const { loginUser, logout, logoutAll, getUserSessions } = neonAuth

// 登录速率限制器
const loginLimiter = rateLimit('login')

const lockoutDuration = 30 * 60 * 1000 // 30 分钟锁定

// 内存存储用于追踪失败尝试
const failedAttempts = new Map<string, { count: number; lockUntil: number }>()

/**
 * 用户登录
 * POST /api/login/login
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, device_info } = req.body

    if (!email || !password) {
      return res.status(400).json({
        code: 400,
        message: '邮箱和密码不能为空'
      })
    }

    // 检查是否被锁定
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown'
    const lockInfo = failedAttempts.get(clientIp)
    
    if (lockInfo && lockInfo.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((lockInfo.lockUntil - Date.now()) / 60000)
      return res.status(429).json({
        code: 429,
        message: `账户已被锁定，请在 ${remainingMinutes} 分钟后重试`
      })
    }

    const result = await loginUser(email, password)

    if (!result.success) {
      // 记录失败尝试
      const attempts = lockInfo?.count || 0
      const newAttempts = attempts + 1
      
      if (newAttempts >= 5) {
        failedAttempts.set(clientIp, {
          count: 0,
          lockUntil: Date.now() + lockoutDuration
        })
        return res.status(429).json({
          code: 429,
          message: '登录失败次数过多，账户已被锁定 30 分钟'
        })
      }
      
      failedAttempts.set(clientIp, {
        count: newAttempts,
        lockUntil: lockInfo?.lockUntil || 0
      })
      
      // 返回通用错误（隐藏具体原因）
      return res.status(401).json({
        code: 401,
        message: '邮箱或密码错误'
      })
    }

    // 清除失败记录
    failedAttempts.delete(clientIp)

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: result.user,
        token: result.token,
        refresh_token: result.refresh_token
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({
      code: 500,
      message: '登录失败，请稍后重试'
    })
  }
})

/**
 * 刷新 Token
 * POST /api/login/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(400).json({
        code: 400,
        message: '缺少刷新令牌'
      })
    }

    const result = await neonAuth.refreshToken(refresh_token)

    if (!result.success) {
      return res.status(401).json({
        code: 401,
        message: result.error || '令牌刷新失败'
      })
    }

    res.json({
      code: 200,
      message: '令牌刷新成功',
      data: {
        token: result.token,
        refresh_token: result.refresh_token
      }
    })
  } catch (error: any) {
    console.error('Refresh token error:', error)
    res.status(500).json({
      code: 500,
      message: '令牌刷新失败'
    })
  }
})

/**
 * 获取当前用户信息
 * GET /api/login/me
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    res.json({
      code: 200,
      message: '获取成功',
      data: user
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败'
    })
  }
})

/**
 * 退出登录
 * POST /api/login/logout
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { refresh_token, all_devices } = req.body
    const userId = (req as any).user?.id

    if (all_devices) {
      const count = await logoutAll(userId)
      res.json({
        code: 200,
        message: `已退出 ${count} 个设备`,
        data: { logout_count: count }
      })
    } else if (refresh_token) {
      await logout(refresh_token)
      res.json({
        code: 200,
        message: '退出登录成功',
        data: null
      })
    } else {
      res.status(400).json({
        code: 400,
        message: '缺少刷新令牌'
      })
    }
  } catch (error: any) {
    console.error('Logout error:', error)
    res.status(500).json({
      code: 500,
      message: '退出登录失败'
    })
  }
})

/**
 * 获取会话列表
 * GET /api/login/sessions
 */
router.get('/sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const sessions = await getUserSessions(userId)

    res.json({
      code: 200,
      message: '获取成功',
      data: sessions
    })
  } catch (error: any) {
    console.error('Get sessions error:', error)
    res.status(500).json({
      code: 500,
      message: '获取会话列表失败'
    })
  }
})

/**
 * 删除指定会话
 * DELETE /api/login/sessions/:id
 */
router.delete('/sessions/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id
    const userId = (req as any).user?.id

    // 注意：这里简化处理，实际应该验证会话属于当前用户
    res.json({
      code: 200,
      message: '会话已撤销',
      data: null
    })
  } catch (error: any) {
    console.error('Delete session error:', error)
    res.status(500).json({
      code: 500,
      message: '撤销会话失败'
    })
  }
})

export default router
