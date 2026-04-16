/**
 * 静默同步服务
 * 用户无感知的数据同步 - 登录即同步、后台自动同步
 */

import { neonQuery, neonQueryOne } from '@/storage/neon/client'

// 检查是否使用 Neon
const USE_NEON = !!process.env.NEON_CONNECTION_STRING

// 同步状态
interface SilentSyncState {
  isSyncing: boolean
  lastSyncAt: Date | null
  syncVersion: number
}

const state: SilentSyncState = {
  isSyncing: false,
  lastSyncAt: null,
  syncVersion: 1
}

// 需要同步的表
const SYNC_TABLES = [
  'o_project',
  'o_novel',
  'o_script',
  'o_scene',
  'o_character',
  'o_character_image',
  'o_storyboard',
  'o_storyboard_frame',
  'o_image',
  'o_video',
  'o_audio',
  'o_setting',
  'o_vendor',
  'o_vendor_input'
]

/**
 * 静默同步入口 - 登录时自动调用
 * 用户无感知：后台静默执行
 */
export async function silentSyncOnLogin(userId: string): Promise<{ success: boolean; message: string }> {
  if (!USE_NEON) {
    return { success: true, message: '未启用云同步' }
  }

  if (state.isSyncing) {
    return { success: false, message: '同步进行中' }
  }

  state.isSyncing = true
  console.log('[SilentSync] 登录同步开始，用户:', userId)

  try {
    // 1. 检查 Neon 中是否有该用户数据
    const hasData = await checkUserHasCloudData(userId)
    
    if (!hasData) {
      // 2. 首次登录：上传本地数据到云端
      console.log('[SilentSync] 首次登录，上传本地数据')
      await uploadLocalToCloud(userId)
    } else {
      // 3. 非首次登录：合并云端和本地数据
      console.log('[SilentSync] 同步云端与本地数据')
      await mergeCloudAndLocal(userId)
    }

    state.lastSyncAt = new Date()
    state.syncVersion++
    
    console.log('[SilentSync] 登录同步完成')
    return { success: true, message: '数据已同步' }
  } catch (err) {
    console.error('[SilentSync] 登录同步失败:', err)
    return { success: false, message: '同步失败，将在后台重试' }
  } finally {
    state.isSyncing = false
  }
}

/**
 * 检查云端是否有该用户数据
 */
async function checkUserHasCloudData(userId: string): Promise<boolean> {
  try {
    const result = await neonQueryOne(
      'SELECT COUNT(*) as count FROM o_project WHERE user_id = $1 LIMIT 1',
      [userId]
    )
    return result && Number(result.count) > 0
  } catch {
    return false
  }
}

/**
 * 首次登录：上传本地数据到云端
 */
async function uploadLocalToCloud(userId: string): Promise<void> {
  // 获取所有本地数据库表
  for (const table of SYNC_TABLES) {
    try {
      const localData = await getLocalData(table, userId)
      if (localData.length > 0) {
        await uploadTableToCloud(table, localData)
        console.log(`[SilentSync] 上传 ${table}: ${localData.length} 条`)
      }
    } catch (err) {
      console.warn(`[SilentSync] 上传 ${table} 失败:`, err)
    }
  }
}

/**
 * 获取本地表数据
 */
async function getLocalData(table: string, userId: string): Promise<any[]> {
  // 动态导入 db 以避免循环依赖
  const db = (await import('@/utils/db')).default
  return await db(table).where({ user_id: userId }).select('*')
}

/**
 * 上传表数据到云端
 */
async function uploadTableToCloud(table: string, data: any[]): Promise<void> {
  if (data.length === 0) return

  const columns = Object.keys(data[0])
  const values = data.map(row => columns.map(col => row[col]))
  
  // 批量插入
  const placeholders = values.map((_, i) => 
    `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
  ).join(', ')

  const flatValues = values.flat()
  
  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${placeholders}
    ON CONFLICT (id) DO UPDATE SET
    ${columns.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ')}
  `

  await neonQuery(query, flatValues)
}

/**
 * 合并云端和本地数据
 */
async function mergeCloudAndLocal(userId: string): Promise<void> {
  // 1. 拉取云端数据到本地
  for (const table of SYNC_TABLES) {
    try {
      const cloudData = await getCloudData(table, userId)
      if (cloudData.length > 0) {
        await pullCloudToLocal(table, cloudData)
        console.log(`[SilentSync] 拉取 ${table}: ${cloudData.length} 条`)
      }
    } catch (err) {
      console.warn(`[SilentSync] 拉取 ${table} 失败:`, err)
    }
  }

  // 2. 上传本地新增的未同步数据
  for (const table of SYNC_TABLES) {
    try {
      const localOnlyData = await getLocalOnlyData(table, userId)
      if (localOnlyData.length > 0) {
        await uploadTableToCloud(table, localOnlyData)
        console.log(`[SilentSync] 上传本地独有 ${table}: ${localOnlyData.length} 条`)
      }
    } catch (err) {
      console.warn(`[SilentSync] 上传 ${table} 失败:`, err)
    }
  }
}

/**
 * 获取云端表数据
 */
async function getCloudData(table: string, userId: string): Promise<any[]> {
  try {
    return await neonQuery(
      `SELECT * FROM ${table} WHERE user_id = $1`,
      [userId]
    )
  } catch {
    return []
  }
}

/**
 * 拉取云端数据到本地
 */
async function pullCloudToLocal(table: string, cloudData: any[]): Promise<void> {
  if (cloudData.length === 0) return

  const db = (await import('@/utils/db')).default
  
  for (const row of cloudData) {
    try {
      await db(table).upsert(row, { id: row.id })
    } catch (err) {
      console.warn(`[SilentSync] 写入本地 ${table} 失败:`, err)
    }
  }
}

/**
 * 获取本地独有的数据（云端没有的）
 */
async function getLocalOnlyData(table: string, userId: string): Promise<any[]> {
  const db = (await import('@/utils/db')).default
  const localData = await db(table).where({ user_id: userId }).select('*')
  const cloudData = await getCloudData(table, userId)
  const cloudIds = new Set(cloudData.map((r: any) => r.id))
  
  return localData.filter((r: any) => !cloudIds.has(r.id))
}

/**
 * 后台静默同步 - 定时任务
 * 定期检查并同步变更
 */
export async function backgroundSync(userId: string): Promise<void> {
  if (!USE_NEON || state.isSyncing) return

  // 延迟执行，避免阻塞主流程
  setTimeout(async () => {
    state.isSyncing = true
    try {
      await syncPendingChanges(userId)
      state.lastSyncAt = new Date()
    } catch (err) {
      console.warn('[SilentSync] 后台同步失败:', err)
    } finally {
      state.isSyncing = false
    }
  }, 5000) // 5秒后执行
}

/**
 * 同步待处理的变更
 */
async function syncPendingChanges(userId: string): Promise<void> {
  for (const table of SYNC_TABLES) {
    try {
      // 检查本地变更
      const localData = await getLocalData(table, userId)
      const cloudData = await getCloudData(table, userId)
      
      // 找出差异
      const diff = findDifferences(localData, cloudData)
      
      if (diff.toUpload.length > 0) {
        await uploadTableToCloud(table, diff.toUpload)
      }
      
      if (diff.toPull.length > 0) {
        await pullCloudToLocal(table, diff.toPull)
      }
    } catch (err) {
      console.warn(`[SilentSync] 同步 ${table} 失败:`, err)
    }
  }
}

/**
 * 找出本地和云端数据的差异
 */
function findDifferences(local: any[], cloud: any[]) {
  const cloudMap = new Map(cloud.map(r => [r.id, r]))
  const localMap = new Map(local.map(r => [r.id, r]))
  
  const toUpload: any[] = []  // 本地有但云端没有或更新的
  const toPull: any[] = []     // 云端有但本地没有或更新的
  
  // 检查本地数据
  for (const row of local) {
    const cloudRow = cloudMap.get(row.id)
    if (!cloudRow) {
      toUpload.push(row)
    } else if (isNewer(row, cloudRow)) {
      toUpload.push(row)
    }
  }
  
  // 检查云端数据
  for (const row of cloud) {
    const localRow = localMap.get(row.id)
    if (!localRow) {
      toPull.push(row)
    } else if (isNewer(row, localRow)) {
      toPull.push(row)
    }
  }
  
  return { toUpload, toPull }
}

/**
 * 比较两条记录的新旧
 * 以 updated_at 或 created_at 为准
 */
function isNewer(a: any, b: any): boolean {
  const timeA = new Date(a.updated_at || a.created_at || 0).getTime()
  const timeB = new Date(b.updated_at || b.created_at || 0).getTime()
  return timeA > timeB
}

/**
 * 获取同步状态
 */
export function getSyncStatus(): SilentSyncState {
  return { ...state }
}
