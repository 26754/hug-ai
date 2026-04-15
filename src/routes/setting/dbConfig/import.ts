import { Router } from "express";
import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import Busboy from "busboy";

const router = Router();
const dbPath = path.join(process.cwd(), "data/db2.sqlite");
const backupDir = path.join(process.cwd(), "data/backups");

// 导入数据库
router.post("/import", async (req: Request, res: Response) => {
  try {
    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 创建备份
    const timestamp = Date.now();
    const backupPath = path.join(backupDir, `backup-${timestamp}.sqlite`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`数据库已备份到: ${backupPath}`);

    // 解析 multipart form data
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      res.status(400).json({ success: false, message: "需要 multipart/form-data 格式" });
      return;
    }

    let fileBuffer: Buffer | null = null;
    let filename = "";

    // 使用 busboy 解析
    await new Promise<void>((resolve, reject) => {
      const busboy = Busboy({
        headers: {
          "content-type": contentType,
        },
      });

      busboy.on("file", (fieldname, file, info) => {
        filename = info.filename;
        const chunks: Buffer[] = [];
        file.on("data", (chunk) => chunks.push(chunk));
        file.on("end", () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      busboy.on("finish", () => resolve());
      busboy.on("error", (err) => reject(err));

      if (req.body) {
        busboy.write(req.body as any);
      }
      (req as any).pipe(busboy);
    });

    if (!fileBuffer) {
      res.status(400).json({ success: false, message: "未接收到文件" });
      return;
    }

    // 验证 SQLite 文件头
    const header = fileBuffer.slice(0, 16).toString("hex");
    if (!header.startsWith("53514c69746520666f726d6174203300")) {
      res.status(400).json({ success: false, message: "文件格式无效，需要 SQLite 数据库文件" });
      return;
    }

    // 写入新数据库
    fs.writeFileSync(dbPath, fileBuffer);

    res.json({
      success: true,
      message: "数据库导入成功",
      backupPath: backupPath,
    });
  } catch (error) {
    console.error("导入数据库失败:", error);
    res.status(500).json({
      success: false,
      message: `导入失败: ${error instanceof Error ? error.message : "未知错误"}`,
    });
  }
});

export default router;
