import { Router } from "express";
import type { Request, Response } from "express";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const router = Router();
const dbPath = path.join(process.cwd(), "data/db2.sqlite");

// 获取数据库信息
router.post("/getInfo", async (req: Request, res: Response) => {
  try {
    const db = new Database(dbPath, { readonly: true });

    // 获取表统计
    const tables = [
      "o_user",
      "o_project",
      "o_novel",
      "o_event",
      "o_outline",
      "o_script",
      "o_assets",
      "o_storyboard",
      "o_image",
      "o_video",
      "memories",
    ];

    const stats: Record<string, number> = {};
    for (const table of tables) {
      try {
        const result = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as {
          cnt: number;
        };
        stats[table] = result.cnt;
      } catch {
        stats[table] = 0;
      }
    }

    db.close();

    // 获取文件信息
    const fileStats = fs.statSync(dbPath);
    const sizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

    res.json({
      success: true,
      data: {
        path: dbPath,
        size: `${sizeMB} MB`,
        tableCount: Object.keys(stats).length,
        totalRecords: Object.values(stats).reduce((a, b) => a + b, 0),
        ...stats,
        // 兼容前端命名
        novelCount: stats.o_novel || 0,
        scriptCount: stats.o_script || 0,
        projectCount: stats.o_project || 0,
        assetsCount: stats.o_assets || 0,
      },
    });
  } catch (error) {
    console.error("获取数据库信息失败:", error);
    res.status(500).json({ success: false, message: "获取数据库信息失败" });
  }
});

export default router;
