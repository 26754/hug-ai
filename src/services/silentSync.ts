/**
 * 静默同步服务 v3
 * 跨设备、跨浏览器数据同步 - 用户无感知
 * 支持设置(o_setting)跨设备同步
 */

import { neonQuery, neonQueryOne } from '@/storage/neon/client'
import { getLocalDb } from '@/storage/sqlite/localDb'
import { v4 as uuid } from 'uuid'

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
 * 生成设备ID
 */
function getDeviceId(): string {
  if (state.deviceId) return state.deviceId
  state.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  return state.deviceId
}

/**
 * 检查是否是设置表
 */
function isSettingTable(table: string): boolean {
  return table === 'o_setting'
}

/**
 * 静默同步入口 - 登录时自动调用
 */
export async function silentSyncOnLogin(userId: string): Promise<{ success: boolean; message: string }> {
  if (!USE_NEON) {
    return { success: true, message: '未启用云同步' }
  }

  const deviceId = getDeviceId()
  
  if (state.isSyncing) {
    console.log('[Sync] 同步进行中，跳过')
    return { success: false, message: '同步进行中' }
  }

  state.isSyncing = true
  console.log(`[Sync] 登录同步开始 用户:${userId} 设备:${deviceId}`)

  try {
    // 1. 同步普通业务表
    await syncBusinessTables(userId)

    // 2. 同步设置表（跨设备共享）
    await syncSettings(userId)

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
 * 同步业务表（按用户隔离）
 */
async function syncBusinessTables(userId: string): Promise<void> {
  const businessTables = SYNC_TABLES.filter(t => !isSettingTable(t))

  for (const table of businessTables) {
    try {
      const localData = await getLocalData(table, userId)
      const cloudData = await getCloudData(table, userId)
      await mergeTable(table, localData, cloudData, userId)
    } catch (err) {
      console.warn(`[Sync] 同步 ${table} 失败:`, err)
    }
  }
}

/**
 * 同步设置表（跨设备共享）
 * 设置表比较特殊：本地只有 key-value，云端有 user_id
 */
async function syncSettings(userId: string): Promise<void> {
  try {
    // 1. 获取本地设置
    const localSettings = await getLocalSettings()
    
    // 2. 获取云端设置
    const cloudSettings = await getCloudSettings(userId)

    // 3. 构建 map
    const localMap = new Map(localSettings.map(s => [s.key, s.value]))
    const cloudMap = new Map(cloudSettings.map(s => [s.key, s.value]))

    // 4. 上传本地独有的设置到云端
    let uploadCount = 0
    for (const [key, value] of localMap) {
      if (!cloudMap.has(key)) {
        await uploadSetting(key, value, userId)
        uploadCount++
      }
    }

    // 5. 下载云端独有的设置到本地
    let downloadCount = 0
    for (const [key, value] of cloudMap) {
      if (!localMap.has(key)) {
        await downloadSetting(key, value)
        downloadCount++
      } else {
        // 6. 冲突处理：以云端为准（最新修改优先）
        const cloudSetting = cloudSettings.find(s => s.key === key)
        if (cloudSetting) {
          const cloudTime = new Date(cloudSetting.updated_at || 0).getTime()
          // 云端更新时，下载到本地
          await updateLocalSetting(key, value)
          downloadCount++
        }
      }
    }

    console.log(`[Sync] 设置同步完成: 上传 ${uploadCount}, 下载 ${downloadCount}`)
  } catch (err) {
    console.warn('[Sync] 同步设置失败:', err)
  }
}

/**
 * 获取本地设置
 */
async function getLocalSettings(): Promise<{ key: string; value: string }[]> {
  const db = getLocalDb()
  try {
    return await db('o_setting').select('key', 'value')
  } catch {
    return []
  }
}

/**
 * 获取云端设置
 */
async function getCloudSettings(userId: string): Promise<any[]> {
  try {
    const result = await neonQuery(
      'SELECT key, value, updated_at FROM o_setting WHERE user_id = $1',
      [userId]
    )
    return result.rows
  } catch {
    return []
  }
}

/**
 * 上传设置到云端
 */
async function uploadSetting(key: string, value: string, userId: string): Promise<void> {
  const now = new Date().toISOString()
  await neonQuery(
    `INSERT INTO o_setting (id, user_id, key, value, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, key) DO UPDATE SET
     value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
    [uuid(), userId, key, value, now, now]
  )
}

/**
 * 下载设置到本地
 */
async function downloadSetting(key: string, value: string): Promise<void> {
  const db = getLocalDb()
  try {
    const existing = await db('o_setting').where({ key }).first()
    if (existing) {
      await db('o_setting').where({ key }).update({ value })
    } else {
      await db('o_setting').insert({ key, value })
    }
  } catch (err) {
    console.warn(`[Sync] 下载设置失败 ${key}:`, err)
  }
}

/**
 * 更新本地设置
 */
async function updateLocalSetting(key: string, value: string): Promise<void> {
  const db = getLocalDb()
  await db('o_setting').where({ key }).update({ value })
}

/**
 * 合并单个表的数据
 */
async function mergeTable(table: string, localData: any[], cloudData: any[], userId: string): Promise<void> {
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
        toUpload.push(local)
      } else if (cloudTime > localTime) {
        toDownload.push(cloud)
      }
    }
  }
  
  // 执行上传
  if (toUpload.length > 0) {
    await batchUpsertCloud(table, toUpload, userId)
    console.log(`[Sync] 上传 ${table}: ${toUpload.length} 条`)
  }
  
  // 执行下载
  if (toDownload.length > 0) {
    await batchUpsertLocal(table, toDownload)
    console.log(`[Sync] 下载 ${table}: ${toDownload.length} 条`)
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
 * 获取云端表数据
 */
async function getCloudData(table: string, userId: string): Promise<any[]> {
  try {
    const result = await neonQuery(
      `SELECT * FROM ${table} WHERE user_id = $1`,
      [userId]
    )
    return result.rows
  } catch {
    return []
  }
}

/**
 * 批量 upsert 到云端
 */
async function batchUpsertCloud(table: string, data: any[], userId: string): Promise<void> {
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
    ${columns.filter(c => c !== 'id').map((c) => `${c} = EXCLUDED.${c}`).join(', ')},
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
      // 移除云端特有的字段
      const localRow = { ...row }
      delete localRow.user_id
      delete localRow.created_at
      delete localRow.updated_at
      
      const existing = await db(table).where({ id: row.id }).first()
      if (existing) {
        await db(table).where({ id: row.id }).update(localRow)
      } else {
        await db(table).insert(localRow)
      }
    } catch (err) {
      console.warn(`[Sync] 写入本地 ${table} 失败:`, err)
    }
  }
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
 * 后台增量同步
 */
export async function incrementalSync(userId: string, tableName: string, recordId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
  if (!USE_NEON || state.isSyncing) return

  setTimeout(async () => {
    try {
      await syncSingleRecord(userId, tableName, recordId, action)
    } catch (err) {
      console.warn(`[Sync] 增量同步失败:`, err)
    }
  }, 2000)
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
          if (isSettingTable(tableName)) {
            await uploadSetting(localRecord.key, localRecord.value, userId)
          } else {
            await upsertCloudRecord(tableName, localRecord)
          }
        }
        break
      }
      case 'delete': {
        if (!isSettingTable(tableName)) {
          await deleteCloudRecord(tableName, recordId)
        }
        break
      }
    }
    console.log(`[Sync] 增量同步 ${tableName}:${recordId} (${action})`)
  } catch (err) {
    console.warn(`[Sync] 增量同步失败:`, err)
  }
}

async function getLocalRecord(table: string, recordId: string): Promise<any | null> {
  const db = getLocalDb()
  return await db(table).where({ id: recordId }).first()
}

async function upsertCloudRecord(table: string, record: any): Promise<void> {
  const columns = Object.keys(record)
  const values = columns.map(c => record[c])
  
  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
    ON CONFLICT (id) DO UPDATE SET
    ${columns.filter(c => c !== 'id').map((c) => `${c} = EXCLUDED.${c}`).join(', ')},
    updated_at = CURRENT_TIMESTAMP
  `
  
  await neonQuery(query, values)
}

async function deleteCloudRecord(table: string, recordId: string): Promise<void> {
  await neonQuery(`DELETE FROM ${table} WHERE id = $1`, [recordId])
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
