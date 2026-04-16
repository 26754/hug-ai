/**
 * 本地 SQLite 数据库访问
 * 封装 better-sqlite3 操作
 */

import getPath from '@/utils/getPath'
import type BetterSqlite3 from 'better-sqlite3'

let db: BetterSqlite3.Database | null = null

/**
 * 获取本地数据库实例
 */
export function getLocalDb(): BetterSqlite3.Database {
  if (!db) {
    const Database = require('better-sqlite3')
    const dbPath = getPath('db2.sqlite')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
  }
  return db
}

/**
 * 关闭数据库连接
 */
export function closeLocalDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
