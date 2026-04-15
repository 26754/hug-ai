import { Router } from "express";
import type { Request, Response } from "express";
import Database from "better-sqlite3";
import path from "path";

const router = Router();
const dbPath = path.join(process.cwd(), "data/db2.sqlite");

// 获取所有素材资产
router.post("/getAllAssets", async (req: Request, res: Response) => {
  try {
    const db = new Database(dbPath);
    const { projectId } = req.body;

    let query = `
      SELECT 
        a.id,
        a.name,
        a.type,
        a.prompt,
        a.filePath,
        a.state,
        a.model,
        a.resolution,
        a.describe,
        a.projectId,
        a.createdAt,
        a.updatedAt
      FROM o_assets a
      WHERE 1=1
    `;

    const params: any[] = [];
    if (projectId) {
      query += " AND a.projectId = ?";
      params.push(projectId);
    }

    query += " ORDER BY a.updatedAt DESC";

    const assets = db.prepare(query).all(...params);
    db.close();

    // 格式化数据
    const formattedAssets = assets.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      prompt: asset.prompt || "",
      filePath: asset.filePath,
      state: asset.state || "pending",
      model: asset.model || "",
      resolution: asset.resolution || "2K",
      describe: asset.describe || "",
      projectId: asset.projectId,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      historyImages: [], // 可扩展：查询历史版本
    }));

    res.json({
      success: true,
      data: formattedAssets,
    });
  } catch (error) {
    console.error("获取资产失败:", error);
    res.status(500).json({ success: false, message: "获取资产失败" });
  }
});

// 批量生成提示词
router.post("/batchGeneratePrompt", async (req: Request, res: Response) => {
  try {
    const { assetIds } = req.body;

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      res.status(400).json({ success: false, message: "请选择资产" });
      return;
    }

    // TODO: 调用 AI 生成提示词
    // 这里可以集成到 Agent 中进行批量处理

    res.json({
      success: true,
      message: "批量生成提示词任务已提交",
      data: { count: assetIds.length },
    });
  } catch (error) {
    console.error("批量生成提示词失败:", error);
    res.status(500).json({ success: false, message: "批量生成提示词失败" });
  }
});

// 批量生成图片
router.post("/batchGenerateImage", async (req: Request, res: Response) => {
  try {
    const { assetIds, model, resolution } = req.body;

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      res.status(400).json({ success: false, message: "请选择资产" });
      return;
    }

    if (!model) {
      res.status(400).json({ success: false, message: "请选择模型" });
      return;
    }

    const db = new Database(dbPath);

    // 更新资产状态
    const updateStmt = db.prepare(`
      UPDATE o_assets 
      SET state = 'generating', 
          model = ?, 
          resolution = ?,
          updatedAt = ?
      WHERE id = ?
    `);

    const now = Date.now();
    for (const id of assetIds) {
      updateStmt.run(model, resolution || "2K", now, id);
    }

    db.close();

    // TODO: 将任务加入队列进行实际生成
    // 可以使用 Bull/BullMQ 或其他任务队列

    res.json({
      success: true,
      message: `已提交 ${assetIds.length} 个生成任务`,
      data: { count: assetIds.length },
    });
  } catch (error) {
    console.error("批量生成图片失败:", error);
    res.status(500).json({ success: false, message: "批量生成图片失败" });
  }
});

// 获取单个资产详情
router.post("/getAssetDetail", async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const db = new Database(dbPath);

    const asset = db.prepare(`
      SELECT * FROM o_assets WHERE id = ?
    `).get(id);

    db.close();

    if (!asset) {
      res.status(404).json({ success: false, message: "资产不存在" });
      return;
    }

    // 获取历史版本
    const historyImages = db.prepare(`
      SELECT id, filePath, createdAt 
      FROM o_assets_history 
      WHERE assetId = ? 
      ORDER BY createdAt DESC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...asset,
        historyImages,
      },
    });
  } catch (error) {
    console.error("获取资产详情失败:", error);
    res.status(500).json({ success: false, message: "获取资产详情失败" });
  }
});

export default router;
