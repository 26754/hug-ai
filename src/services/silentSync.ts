/**
 * 静默同步服务 v2
 * 跨设备、跨浏览器数据同步 - 用户无感知
 */

import { neonQuery, neonQueryOne } from '@/storage/neon/client'
import { getLocalDb } from '@/storage/sqlite/localDb'

// 检查是否使用 Neon
const USE_NEON = !!process.env.NEON_CONNECTION_STRING

// 同步状态
interface SyncState {
  isSyncing: boolean
  lastSyncAt: Date | null
  syncVersion: number
  deviceId: string
}

const state: SyncState = {
  isSyncing: false,
  lastSyncAt: null,
  syncVersion: 1,
  deviceId: ''
}

// 需要同步的表（按依赖顺序）
const SYNC_TABLES = [
  'o_project',        // 1. 项目（顶层）
  'o_novel',          // 2. 小说
  'o_script',         // 3. 剧本
  'o_scene',          // 4. 场景
  'o_character',      // 5. 角色
  'o_character_image',// 6. 角色图片
  'o_storyboard',     // 7. 分镜
  'o_storyboard_frame',// 8. 分镜帧
  'o_image',          // 9. 图片
  'o_video',          // 10. 视频
  'o_audio',          // 11. 音频
  'o_setting',       // 12. 设置
  'o_vendor',         // 13. 供应商
  'o_vendor_input'    // 14. 供应商输入配置
]

/**
 * 生成设备ID
 */
function getDeviceId(req?: any): string {
  if (state.deviceId) return state.deviceId
  
  // 从请求头或生成唯一ID
  const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  state.deviceId = deviceId
  return deviceId
}

/**
 * 静默同步入口 - 登录时自动调用
 * 用户无感知：后台静默执行
 */
export async function silentSyncOnLogin(userId: string, req?: any): Promise<{ success: boolean; message: string }> {
  if (!USE_NEON) {
    return { success: true, message: '未启用云同步' }
  }

  const deviceId = getDeviceId(req)
  
  if (state.isSyncing) {
    console.log('[Sync] 同步进行中，跳过')
    return { success: false, message: '同步进行中' }
  }

  state.isSyncing = true
  console.log(`[Sync] 登录同步开始 用户:${userId} 设备:${deviceId}`)

  try {
    // 1. 检查云端是否有该用户数据
    const hasCloudData = await checkUserHasCloudData(userId)
    
    // 2. 检查本地是否有该用户数据
    const hasLocalData = await checkUserHasLocalData(userId)
    
    if (!hasCloudData && !hasLocalData) {
      // 首次使用，无数据
      console.log('[Sync] 首次使用，无需同步')
    } else if (!hasCloudData && hasLocalData) {
      // 本地有数据，云端无数据 → 上传本地到云端
      console.log('[Sync] 首次登录，上传本地数据到云端')
      await uploadLocalToCloud(userId)
    } else if (hasCloudData && !hasLocalData) {
      // 云端有数据，本地无数据 → 下载云端到本地
      console.log('[Sync] 新设备登录，下载云端数据到本地')
      await downloadCloudToLocal(userId)
    } else {
      // 双方都有数据 → 合并同步
      console.log('[Sync] 多设备同步，合并数据')
      await mergeSync(userId)
    }

    // 3. 记录同步日志
    await logSync(userId, deviceId, 'login_sync', 'success')
    
    state.lastSyncAt = new Date()
    state.syncVersion++
    
    console.log('[Sync] 登录同步完成')
    return { success: true, message: '数据已同步' }
  } catch (err) {
    console.error('[Sync] 登录同步失败:', err)
    await logSync(userId, deviceId, 'login_sync', 'failed', String(err))
    return { success: false, message: '同步失败，将在稍后重试' }
  } finally {
    state.isSyncing = false
  }
}

/**
 * 后台增量同步 - 数据变更时自动调用
 */
export async function incrementalSync(userId: string, tableName: string, recordId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
  if (!USE_NEON || state.isSyncing) return

  // 延迟执行，避免频繁同步
  setTimeout(async () => {
    try {
      await syncSingleRecord(userId, tableName, recordId, action)
    } catch (err) {
      console.warn(`[Sync] 增量同步失败 ${tableName}:`, err)
    }
  }, 2000) // 2秒后执行，合并频繁变更
}

/**
 * 同步单条记录
 */
async function syncSingleRecord(userId: string, tableName: string, recordId: string, action: string): Promise<void> {
  if (!SYNC_TABLES.includes(tableName)) return

  try {
    switch (action) {
      case 'create':
      case 'update': {
        const localRecord = await getLocalRecord(tableName, recordId)
        if (localRecord) {
          await upsertCloudRecord(tableName, localRecord)
        }
        break
      }
      case 'delete': {
        await deleteCloudRecord(tableName, recordId)
        break
      }
    }
    console.log(`[Sync] 增量同步 ${tableName}:${recordId} (${action})`)
  } catch (err) {
    console.warn(`[Sync] 增量同步失败:`, err)
  }
}

/**
 * 检查云端是否有该用户数据
 */
async function checkUserHasCloudData(userId: string): Promise<boolean> {
  try {
    const result = await neonQueryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM o_project WHERE user_id = $1 LIMIT 1',
      [userId]
    )
    return result ? Number(result.count) > 0 : false
  } catch {
    return false
  }
}

/**
 * 检查本地是否有该用户数据
 */
async function checkUserHasLocalData(userId: string): Promise<boolean> {
  try {
    const db = getLocalDb()
    const result = await db('o_project').where({ user_id: userId }).count('* as count').first()
    return result ? Number(result.count) > 0 : false
  } catch {
    return false
  }
}

/**
 * 上传本地数据到云端
 */
async function uploadLocalToCloud(userId: string): Promise<void> {
  for (const table of SYNC_TABLES) {
    try {
      const localData = await getLocalData(table, userId)
      if (localData.length > 0) {
        await batchUpsertCloud(table, localData)
        console.log(`[Sync] 上传 ${table}: ${localData.length} 条`)
      }
    } catch (err) {
      console.warn(`[Sync] 上传 ${table} 失败:`, err)
    }
  }
}

/**
 * 下载云端数据到本地
 */
async function downloadCloudToLocal(userId: string): Promise<void> {
  for (const table of SYNC_TABLES) {
    try {
      const cloudData = await getCloudData(table, userId)
      if (cloudData.length > 0) {
        await batchUpsertLocal(table, cloudData)
        console.log(`[Sync] 下载 ${table}: ${cloudData.length} 条`)
      }
    } catch (err) {
      console.warn(`[Sync] 下载 ${table} 失败:`, err)
    }
  }
}

/**
 * 合并同步 - 双向同步
 */
async function mergeSync(userId: string): Promise<void> {
  for (const table of SYNC_TABLES) {
    try {
      await mergeTable(table, userId)
    } catch (err) {
      console.warn(`[Sync] 合并 ${table} 失败:`, err)
    }
  }
}

/**
 * 合并单个表的数据
 */
async function mergeTable(table: string, userId: string): Promise<void> {
  const localData = await getLocalData(table, userId)
  const cloudData = await getCloudData(table, userId)
  
  const localMap = new Map(localData.map(r => [r.id, r]))
  const cloudMap = new Map(cloudData.map(r => [r.id, r]))
  
  const toUpload: any[] = []
  const toDownload: any[] = []
  
  // 本地有，云端没有 → 上传
  for (const [id, local] of localMap) {
    if (!cloudMap.has(id)) {
      toUpload.push(local)
    }
  }
  
  // 云端有，本地没有 → 下载
  for (const [id, cloud] of cloudMap) {
    if (!localMap.has(id)) {
      toDownload.push(cloud)
    }
  }
  
  // 双方都有 → 以最新时间为准
  for (const [id, local] of localMap) {
    const cloud = cloudMap.get(id)
    if (cloud) {
      const localTime = new Date(local.updated_at || local.created_at || 0).getTime()
      const cloudTime = new Date(cloud.updated_at || cloud.created_at || 0).getTime()
      
      if (localTime > cloudTime) {
        toUpload.push(local) // 本地更新，上传
      } else if (cloudTime > localTime) {
        toDownload.push(cloud) // 云端更新，下载
      }
    }
  }
  
  // 执行上传和下载
  if (toUpload.length > 0) {
    await batchUpsertCloud(table, toUpload)
    console.log(`[Sync] 上传更新 ${table}: ${toUpload.length} 条`)
  }
  
  if (toDownload.length > 0) {
    await batchUpsertLocal(table, toDownload)
    console.log(`[Sync] 下载更新 ${table}: ${toDownload.length} 条`)
  }
}

/**
 * 获取本地表数据
 */
async function getLocalData(table: string, userId: string): Promise<any[]> {
  const db = getLocalDb()
  return await db(table).where({ user_id: userId }).select('*')
}

/**
 * 获取本地单条记录
 */
async function getLocalRecord(table: string, recordId: string): Promise<any | null> {
  const db = getLocalDb()
  return await db(table).where({ id: recordId }).first()
}

/**
 * 获取云端表数据
 */
async function getCloudData(table: string, userId: string): Promise<any[]> {
  try {
    const result = await neonQuery(`SELECT * FROM ${table} WHERE user_id = $1`, [userId])
    return result.rows
  } catch {
    return []
  }
}

/**
 * 批量 upsert 到云端
 */
async function batchUpsertCloud(table: string, data: any[]): Promise<void> {
  if (data.length === 0) return

  const columns = Object.keys(data[0]).filter(c => c !== 'created_at' && c !== 'updated_at')
  const allColumns = ['created_at', 'updated_at', ...columns]
  
  const values: any[] = []
  const placeholders: string[] = []
  
  data.forEach((row, i) => {
    const rowValues: any[] = [
      new Date().toISOString(),
      new Date().toISOString(),
      ...columns.map(col => row[col])
    ]
    values.push(...rowValues)
    placeholders.push(`($${i * allColumns.length + 1}, $${i * allColumns.length + 2}${columns.map((_, j) => `, $${i * allColumns.length + 3 + j}`).join('')})`)
  })
  
  const query = `
    INSERT INTO ${table} (${allColumns.join(', ')})
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (id) DO UPDATE SET
    ${columns.map((c, i) => `${c} = EXCLUDED.${c}`).join(', ')},
    updated_at = EXCLUDED.updated_at
  `
  
  await neonQuery(query, values)
}

/**
 * 批量 upsert 到本地
 */
async function batchUpsertLocal(table: string, data: any[]): Promise<void> {
  if (data.length === 0) return

  const db = getLocalDb()
  
  for (const row of data) {
    try {
      await db(table).upsert(row, { id: row.id })
    } catch (err) {
      console.warn(`[Sync] 写入本地 ${table} 失败:`, err)
    }
  }
}

/**
 * Upsert 单条到云端
 */
async function upsertCloudRecord(table: string, record: any): Promise<void> {
  const columns = Object.keys(record)
  const values = columns.map(c => record[c])
  
  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
    ON CONFLICT (id) DO UPDATE SET
    ${columns.filter(c => c !== 'id').map((c, i) => `${c} = $${columns.indexOf(c) + 1}`).join(', ')},
    updated_at = CURRENT_TIMESTAMP
  `
  
  await neonQuery(query, values)
}

/**
 * 删除云端记录
 */
async function deleteCloudRecord(table: string, recordId: string): Promise<void> {
  await neonQuery(`DELETE FROM ${table} WHERE id = $1`, [recordId])
}

/**
 * 记录同步日志
 */
async function logSync(userId: string, deviceId: string, syncType: string, status: string, message?: string): Promise<void> {
  try {
    await neonQuery(
      `INSERT INTO o_sync_log (user_id, device_id, sync_type, status, message) VALUES ($1, $2, $3, $4, $5)`,
      [userId, deviceId, syncType, status, message || null]
    )
  } catch {
    // 忽略日志写入失败
  }
}

/**
 * 获取同步状态
 */
export function getSyncStatus(): { isSyncing: boolean; lastSyncAt: Date | null; syncVersion: number; isCloudEnabled: boolean } {
  return {
    isSyncing: state.isSyncing,
    lastSyncAt: state.lastSyncAt,
    syncVersion: state.syncVersion,
    isCloudEnabled: USE_NEON
  }
}

/**
 * 强制同步
 */
export async function forceSync(userId: string): Promise<{ success: boolean; message: string }> {
  return silentSyncOnLogin(userId)
}
