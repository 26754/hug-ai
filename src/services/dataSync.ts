/**
 * 数据同步服务
 * 支持本地数据与 Neon 数据库的实时同步
 */

import { neonQuery, neonQueryOne } from '@/storage/neon/client'

// 同步状态
interface SyncStatus {
  lastSyncAt: Date | null
  pendingChanges: number
  syncInProgress: boolean
}

const syncStatus: SyncStatus = {
  lastSyncAt: null,
  pendingChanges: 0,
  syncInProgress: false
}

// 待同步的数据队列
interface SyncQueueItem {
  id: string
  table: string
  operation: 'insert' | 'update' | 'delete'
  data: any
  timestamp: number
}

const syncQueue: SyncQueueItem[] = []

/**
 * 添加到同步队列
 */
export function queueSync(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: any,
  id?: string
): string {
  const itemId = id || `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  syncQueue.push({
    id: itemId,
    table,
    operation,
    data,
    timestamp: Date.now()
  })
  
  syncStatus.pendingChanges = syncQueue.length
  
  // 触发异步同步
  processSyncQueue()
  
  return itemId
}

/**
 * 处理同步队列
 */
async function processSyncQueue(): Promise<void> {
  if (syncStatus.syncInProgress || syncQueue.length === 0) {
    return
  }
  
  syncStatus.syncInProgress = true
  
  try {
    while (syncQueue.length > 0) {
      const item = syncQueue[0]
      
      try {
        await executeSync(item)
        syncQueue.shift()
      } catch (err) {
        console.error('Sync error for item:', item.id, err)
        // 稍后重试
        break
      }
    }
    
    syncStatus.lastSyncAt = new Date()
  } finally {
    syncStatus.pendingChanges = syncQueue.length
    syncStatus.syncInProgress = false
  }
}

/**
 * 执行同步操作
 */
async function executeSync(item: SyncQueueItem): Promise<void> {
  const { table, operation, data, id } = item
  
  switch (operation) {
    case 'insert':
      await executeInsert(table, data)
      break
    case 'update':
      await executeUpdate(table, data)
      break
    case 'delete':
      await executeDelete(table, id!)
      break
  }
}

/**
 * 执行插入
 */
async function executeInsert(table: string, data: any): Promise<void> {
  const columns = Object.keys(data)
  const values = Object.values(data)
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
  
  await neonQuery(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  )
}

/**
 * 执行更新
 */
async function executeUpdate(table: string, data: any): Promise<void> {
  if (!data.id) {
    throw new Error('Update requires id')
  }
  
  const { id, ...updateData } = data
  const sets = Object.keys(updateData)
    .map((key, i) => `${key} = $${i + 2}`)
    .join(', ')
  
  await neonQuery(
    `UPDATE ${table} SET ${sets}, updated_at = NOW() WHERE id = $1`,
    [id, ...Object.values(updateData)]
  )
}

/**
 * 执行删除
 */
async function executeDelete(table: string, id: string): Promise<void> {
  await neonQuery(`DELETE FROM ${table} WHERE id = $1`, [id])
}

/**
 * 获取同步状态
 */
export function getSyncStatus(): SyncStatus & { queue: number } {
  return {
    ...syncStatus,
    queue: syncQueue.length
  }
}

/**
 * 强制同步
 */
export async function forceSync(): Promise<{ success: boolean; synced: number }> {
  const beforeCount = syncQueue.length
  await processSyncQueue()
  const synced = beforeCount - syncQueue.length
  
  return {
    success: syncQueue.length === 0,
    synced
  }
}

/**
 * 清除同步队列
 */
export function clearSyncQueue(): void {
  syncQueue.length = 0
  syncStatus.pendingChanges = 0
}

// ==================== 数据表同步 ====================

/**
 * 项目表同步
 */
export async function syncProjectsTable(): Promise<void> {
  // 创建项目表
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      source_novel_id UUID,
      status VARCHAR(50) DEFAULT 'draft',
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  
  await neonQuery(`
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)
  `)
}

/**
 * 剧本表同步
 */
export async function syncScriptsTable(): Promise<void> {
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS scripts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      order_index INTEGER DEFAULT 0,
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  
  await neonQuery(`
    CREATE INDEX IF NOT EXISTS idx_scripts_project_id ON scripts(project_id)
  `)
}

/**
 * 图片表同步
 */
export async function syncImagesTable(): Promise<void> {
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
      user_id UUID NOT NULL,
      prompt TEXT,
      image_url TEXT,
      width INTEGER,
      height INTEGER,
      style VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  
  await neonQuery(`
    CREATE INDEX IF NOT EXISTS idx_images_project_id ON images(project_id)
  `)
  await neonQuery(`
    CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id)
  `)
}

/**
 * 视频表同步
 */
export async function syncVideosTable(): Promise<void> {
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS videos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      title VARCHAR(255),
      video_url TEXT,
      duration INTEGER,
      resolution VARCHAR(20),
      status VARCHAR(50) DEFAULT 'pending',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  
  await neonQuery(`
    CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id)
  `)
  await neonQuery(`
    CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)
  `)
}

/**
 * 初始化所有同步表
 */
export async function initSyncTables(): Promise<void> {
  await syncProjectsTable()
  await syncScriptsTable()
  await syncImagesTable()
  await syncVideosTable()
  console.log('Sync tables initialized')
}

/**
 * 完整数据导出
 */
export async function exportUserData(userId: string): Promise<{
  projects: any[]
  scripts: any[]
  images: any[]
  videos: any[]
}> {
  const [projects, images, videos] = await Promise.all([
    neonQuery('SELECT * FROM projects WHERE user_id = $1', [userId]),
    neonQuery('SELECT * FROM images WHERE user_id = $1', [userId]),
    neonQuery('SELECT * FROM videos WHERE user_id = $1', [userId])
  ])
  
  // 获取所有项目相关的剧本
  const projectIds = projects.rows.map((p: any) => p.id)
  let scripts = { rows: [] }
  if (projectIds.length > 0) {
    scripts = await neonQuery(
      `SELECT * FROM scripts WHERE project_id = ANY($1)`,
      [projectIds]
    )
  }
  
  return {
    projects: projects.rows,
    scripts: scripts.rows,
    images: images.rows,
    videos: videos.rows
  }
}

/**
 * 导入用户数据
 */
export async function importUserData(
  userId: string,
  data: {
    projects?: any[]
    scripts?: any[]
    images?: any[]
    videos?: any[]
  }
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0
  const errors: string[] = []
  
  try {
    if (data.projects) {
      for (const project of data.projects) {
        try {
          await neonQuery(
            `INSERT INTO projects (id, user_id, name, description, status, settings)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               description = EXCLUDED.description,
               status = EXCLUDED.status`,
            [project.id, userId, project.name, project.description, project.status, project.settings]
          )
          imported++
        } catch (e: any) {
          errors.push(`Project ${project.name}: ${e.message}`)
        }
      }
    }
    
    if (data.scripts) {
      for (const script of data.scripts) {
        try {
          await neonQuery(
            `INSERT INTO scripts (id, project_id, title, content, order_index, settings)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               content = EXCLUDED.content`,
            [script.id, script.project_id, script.title, script.content, script.order_index, script.settings]
          )
          imported++
        } catch (e: any) {
          errors.push(`Script ${script.title}: ${e.message}`)
        }
      }
    }
    
    // images 和 videos 类似...
    
  } catch (err: any) {
    errors.push(`Import failed: ${err.message}`)
  }
  
  return { imported, errors }
}

export default {
  queueSync,
  getSyncStatus,
  forceSync,
  clearSyncQueue,
  initSyncTables,
  exportUserData,
  importUserData
}
