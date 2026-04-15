import { Router } from "express";
import type { Request, Response } from "express";
import Database from "better-sqlite3";
import path from "path";

const router = Router();
const dbPath = path.join(process.cwd(), "data/db2.sqlite");

// 初始化模型映射表
function initTable() {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS o_model_map (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor TEXT NOT NULL,
      internalModel TEXT NOT NULL,
      externalModel TEXT NOT NULL,
      modelType TEXT DEFAULT 'text',
      enabled INTEGER DEFAULT 1,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // 添加默认映射
  const defaultMaps = [
    { vendor: "hugai", internalModel: "claude-3-5-sonnet", externalModel: "claude-3-5-sonnet-20241022", modelType: "text" },
    { vendor: "hugai", internalModel: "gpt-4o", externalModel: "gpt-4o-2024-08-06", modelType: "text" },
    { vendor: "hugai", internalModel: "deepseek-chat", externalModel: "deepseek-chat", modelType: "text" },
    { vendor: "hugai", internalModel: "flux", externalModel: "flux-1.1-pro", modelType: "image" },
    { vendor: "hugai", internalModel: "minimax-video", externalModel: "minimax-01", modelType: "video" },
  ];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO o_model_map (vendor, internalModel, externalModel, modelType)
    VALUES (?, ?, ?, ?)
  `);

  for (const map of defaultMaps) {
    insertStmt.run(map.vendor, map.internalModel, map.externalModel, map.modelType);
  }

  db.close();
}

// 获取所有模型映射
router.post("/getModelMap", async (req: Request, res: Response) => {
  try {
    initTable();
    const db = new Database(dbPath);

    const maps = db.prepare(`
      SELECT id, vendor, internalModel, externalModel, modelType, enabled, createdAt, updatedAt
      FROM o_model_map
      ORDER BY vendor, modelType, internalModel
    `).all();

    db.close();

    res.json({
      success: true,
      data: maps.map((m: any) => ({
        ...m,
        enabled: Boolean(m.enabled),
      })),
    });
  } catch (error) {
    console.error("获取模型映射失败:", error);
    res.status(500).json({ success: false, message: "获取模型映射失败" });
  }
});

// 添加模型映射
router.post("/addModelMap", async (req: Request, res: Response) => {
  try {
    initTable();
    const { vendor, internalModel, externalModel, modelType, enabled } = req.body;

    if (!vendor || !internalModel || !externalModel) {
      res.status(400).json({ success: false, message: "缺少必填字段" });
      return;
    }

    const db = new Database(dbPath);

    const result = db.prepare(`
      INSERT INTO o_model_map (vendor, internalModel, externalModel, modelType, enabled)
      VALUES (?, ?, ?, ?, ?)
    `).run(vendor, internalModel, externalModel, modelType || "text", enabled ? 1 : 0);

    db.close();

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error("添加模型映射失败:", error);
    res.status(500).json({ success: false, message: "添加模型映射失败" });
  }
});

// 更新模型映射
router.post("/updateModelMap", async (req: Request, res: Response) => {
  try {
    const { id, vendor, internalModel, externalModel, modelType, enabled } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: "缺少映射 ID" });
      return;
    }

    const db = new Database(dbPath);

    const updates: string[] = [];
    const params: any[] = [];

    if (vendor !== undefined) {
      updates.push("vendor = ?");
      params.push(vendor);
    }
    if (internalModel !== undefined) {
      updates.push("internalModel = ?");
      params.push(internalModel);
    }
    if (externalModel !== undefined) {
      updates.push("externalModel = ?");
      params.push(externalModel);
    }
    if (modelType !== undefined) {
      updates.push("modelType = ?");
      params.push(modelType);
    }
    if (enabled !== undefined) {
      updates.push("enabled = ?");
      params.push(enabled ? 1 : 0);
    }

    updates.push("updatedAt = strftime('%s', 'now')");
    params.push(id);

    db.prepare(`UPDATE o_model_map SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    db.close();

    res.json({ success: true });
  } catch (error) {
    console.error("更新模型映射失败:", error);
    res.status(500).json({ success: false, message: "更新模型映射失败" });
  }
});

// 删除模型映射
router.post("/deleteModelMap", async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: "缺少映射 ID" });
      return;
    }

    const db = new Database(dbPath);
    db.prepare("DELETE FROM o_model_map WHERE id = ?").run(id);
    db.close();

    res.json({ success: true });
  } catch (error) {
    console.error("删除模型映射失败:", error);
    res.status(500).json({ success: false, message: "删除模型映射失败" });
  }
});

export default router;
