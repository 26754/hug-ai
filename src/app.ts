// import "./logger";
import "./err";
import "./env";
import express, { Request, Response, NextFunction } from "express";
import { Server } from "socket.io";
import http from "node:http";
import expressWs from "express-ws";
import logger from "morgan";
import cors from "cors";
import buildRoute from "@/core";
import fs from "fs";
import u from "@/utils";
import jwt from "jsonwebtoken";
import socketInit from "@/socket/index";

const app = express();
const server = http.createServer(app);

export default async function startServe(randomPort: Boolean = false) {
  await u.writeVersion();
  const io = new Server(server, { cors: { origin: "*" } });
  socketInit(io);

  if (process.env.NODE_ENV == "dev") await buildRoute();

  expressWs(app);

  app.use(logger("dev"));
  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // oss 静态资源
  const ossDir = u.getPath("oss");
  if (!fs.existsSync(ossDir)) {
    fs.mkdirSync(ossDir, { recursive: true });
  }
  console.log("文件目录:", ossDir);
  app.use("/oss", express.static(ossDir, { acceptRanges: false }));
  // skills 静态资源
  const skillsDir = u.getPath("skills");
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }
  console.log("文件目录:", skillsDir);
  // 只允许图片文件访问
  app.use(
    "/skills",
    (req, res, next) => {
      /\.(jpe?g|png|gif|webp|svg|ico|bmp)$/i.test(req.path) ? next() : res.status(403).end();
    },
    express.static(skillsDir, { acceptRanges: false }),
  );

  // assets 静态资源
  const assetsDir = u.getPath("assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  console.log("文件目录:", assetsDir);
  app.use("/assets", express.static(assetsDir, { acceptRanges: false }));

  // 已移除 data/web 静态网站，启动页功能已禁用

  // Supabase Token 验证中间件
  app.use(async (req, res, next) => {
    // 白名单路径（不需要认证）- 使用精确匹配
    const whiteList = [
      "/api/login/login",          // 登录
      "/api/login/login/refresh", // 刷新 token (在 login 路由下)
      "/api/auth/register",        // 注册
      "/api/auth/verify-email",   // 验证邮箱
      "/api/other/getVersion",    // 获取版本
    ];
    
    // 精确匹配白名单路径
    const isWhiteListed = whiteList.some(path => 
      req.path === path || req.path === path + "/"
    );
    
    if (isWhiteListed) {
      return next();
    }

    // 从 header 获取 token
    const rawToken = req.headers.authorization || (req.query.token as string) || "";
    const token = rawToken.replace("Bearer ", "");

    if (!token) {
      return res.status(401).send({ message: "未提供token" });
    }

    try {
      const { getSupabase } = await import("@/storage/supabase/client");
      const supabase = getSupabase();
      
      // 验证 Supabase JWT Token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).send({ message: "无效的token" });
      }
      
      (req as any).user = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username,
      };
      next();
    } catch (err) {
      console.error("Token 验证失败:", err);
      return res.status(401).send({ message: "token验证失败" });
    }
  });

  const router = await import("@/router");
  await router.default(app);

  // 404 处理
  app.use((_, res, next: NextFunction) => {
    return res.status(404).send({ message: "API 404 Not Found" });
  });

  // 错误处理
  app.use((err: any, _: Request, res: Response, __: NextFunction) => {
    res.locals.message = err.message;
    res.locals.error = err;
    console.error(err);
    res.status(err.status || 500).send(err);
  });

  const defaultPort = process.env.DEPLOY_RUN_PORT ? parseInt(process.env.DEPLOY_RUN_PORT) : 5000;
  const port = randomPort ? 0 : defaultPort;
  return await new Promise((resolve) => {
    server.listen(port, async () => {
      const address = server.address();
      const realPort = typeof address === "string" ? address : address?.port;
      console.log(`[服务启动成功]: http://localhost:${realPort}`);
      resolve(realPort);
    });
  });
}

// 支持await关闭
export function closeServe(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err?: Error) => {
        if (err) return reject(err);
        console.log("[服务已关闭]");
        resolve();
      });
    } else {
      resolve();
    }
  });
}

const isElectron = typeof process.versions?.electron !== "undefined";
if (!isElectron) startServe();
