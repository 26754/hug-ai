import { Router } from "express";
import type { Request, Response } from "express";
import path from "path";
import fs from "fs";

const router = Router();
const dbPath = path.join(process.cwd(), "data/db2.sqlite");

// 导出数据库
router.get("/export", async (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(dbPath)) {
      res.status(404).json({ success: false, message: "数据库文件不存在" });
      return;
    }

    // 读取数据库文件
    const buffer = fs.readFileSync(dbPath);

    // 设置响应头
    const filename = `hug-ai-backup-${new Date().toISOString().slice(0, 10)}.sqlite`;
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);

    // 发送文件
    res.send(buffer);
  } catch (error) {
    console.error("导出数据库失败:", error);
    res.status(500).json({ success: false, message: "导出数据库失败" });
  }
});

export default router;
