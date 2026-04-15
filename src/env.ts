// 判断是否为打包后的 Electron 环境
const isElectron = typeof process.versions?.electron !== "undefined";
let isPackaged = false;
if (isElectron) {
  const { app } = require("electron");
  isPackaged = app.isPackaged;
}

// 加载 .env 环境变量文件
try {
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line: string) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=");
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
    console.log("[环境变量：已加载 .env 文件]");
  }
} catch (err) {
  console.log("[环境变量：.env 文件加载失败]", err);
}

// 加载环境变量（服务器部署默认使用 prod）
const env = process.env.NODE_ENV;
if (!env) {
  // 非 Electron 环境默认使用 prod（服务器部署场景）
  if (typeof process.versions?.electron === "undefined") {
    process.env.NODE_ENV = "prod";
  } else if (isPackaged) {
    process.env.NODE_ENV = "prod";
  } else {
    process.env.NODE_ENV = "dev";
  }
  console.log(`[环境变量：${process.env.NODE_ENV}]`);
}

// 输出 Supabase 配置状态
if (process.env.SUPABASE_URL) {
  console.log("[Supabase：已配置]");
} else {
  console.log("[Supabase：未配置]");
}
