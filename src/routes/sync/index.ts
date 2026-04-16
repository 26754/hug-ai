/**
 * 同步状态 API
 * GET /api/sync/status - 获取同步状态
 * POST /api/sync/force - 强制同步
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '@/middleware/auth'
import { getSyncStatus, silentSyncOnLogin } from '@/services/silentSync'

const router = Router()

/**
 * 获取同步状态
 * GET /api/sync/status
 */
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const status = getSyncStatus()
    
    res.json({
      code: 200,
      data: {
        isSyncing: status.isSyncing,
        lastSyncAt: status.lastSyncAt,
        syncVersion: status.syncVersion,
        isCloudEnabled: !!process.env.NEON_CONNECTION_STRING
      }
    })
  } catch (error: any) {
    console.error('Get sync status error:', error)
    res.status(500).json({
      code: 500,
      message: '获取同步状态失败'
    })
  }
})

/**
 * 强制同步
 * POST /api/sync/force
 */
router.post('/force', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    
    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      })
    }

    // 异步执行，不阻塞响应
    silentSyncOnLogin(userId).catch(err => {
      console.error('[Sync] 强制同步失败:', err)
    })

    res.json({
      code: 200,
      message: '同步已开始'
    })
  } catch (error: any) {
    console.error('Force sync error:', error)
    res.status(500).json({
      code: 500,
      message: '同步失败'
    })
  }
})

export default router
