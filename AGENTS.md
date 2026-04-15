# Toonflow AI 短剧漫剧工具

## 项目概览

- **名称**: Toonflow
- **版本**: 1.1.5
- **描述**: AI 短剧漫剧工具，能够利用 AI 技术将小说自动转化为剧本，并结合 AI 生成的图片和视频，实现高效的短剧创作
- **作者**: HBAI-Ltd <ltlctools@outlook.com>
- **许可证**: Apache-2.0
- **仓库**: https://github.com/HBAI-Ltd/Toonflow-app

## 技术栈

- **运行时**: Node.js 24+
- **语言**: TypeScript / JavaScript
- **后端**: Express.js + Vue.js 3
- **前端**: Vue 3 + Vite + Pinia + Vue Router
- **数据库**: SQLite (better-sqlite3) + Neon (Serverless PostgreSQL)
- **认证**: Neon Auth (自实现 JWT)
- **AI SDK**: @ai-sdk (支持 Anthropic, DeepSeek, Google, OpenAI, XAI 等)
- **打包**: esbuild, Vite
- **包管理器**: pnpm
- **认证**: Neon Auth (JWT Token)

## 目录结构

```
/workspace/projects/
├── src/                    # 后端源代码
│   ├── app.ts             # Express 服务器入口
│   ├── router.ts          # 路由配置
│   ├── routes/            # API 路由
│   ├── agents/            # AI Agent 实现
│   ├── utils/             # 工具函数
│   ├── socket/            # WebSocket 处理
│   ├── services/          # 服务层 (neonAuth, dataSync)
│   ├── storage/neon/      # Neon 数据库客户端
│   └── middleware/        # 中间件 (auth, rateLimit)
├── src-web/               # 前端应用 (可独立部署)
│   ├── src/
│   │   ├── pages/         # 页面组件 (Login, Register, Home)
│   │   ├── components/     # 通用组件
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── router/        # Vue Router 配置
│   │   ├── utils/         # 工具函数
│   │   └── styles/        # CSS 样式
│   ├── dist/              # 构建输出
│   ├── vite.config.js     # Vite 配置
│   └── package.json       # 前端依赖
├── scripts/               # 构建脚本
│   └── build.ts           # 项目打包配置
├── data/                  # 数据目录
│   ├── db2.sqlite        # SQLite 数据库
│   ├── web/               # 前端静态文件
│   ├── oss/               # 对象存储
│   ├── skills/            # 技能数据
│   └── assets/            # 资源文件
├── build/                 # 构建输出
├── package.json           # 后端依赖
├── tsconfig.json          # TypeScript 配置
└── .coze                  # Coze 部署配置
```

## 构建和运行命令

### 前端应用 (src-web/)

```bash
cd src-web

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

### 后端服务 (src/)

#### Coze 环境 (推荐)

```bash
# 安装依赖 (忽略 Electron postinstall)
pnpm install --ignore-scripts

# 构建项目
NODE_PATH=/workspace/projects/node_modules/.pnpm/node_modules node /workspace/projects/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.cjs scripts/build.ts

# 启动服务 (端口 5000)
coze dev
```

#### 手动运行

```bash
# 编译 better-sqlite3 原生模块 (需要 node-gyp)
cd node_modules/.pnpm/better-sqlite3@12.9.0/node_modules/better-sqlite3
node-gyp rebuild

# 构建
NODE_ENV=prod tsx scripts/build.ts

# 启动 (使用环境变量端口)
node data/serve/app.js
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DEPLOY_RUN_PORT` | 服务监听端口 | 5000 |
| `NODE_ENV` | 运行环境 | prod |
| `JWT_SECRET` | JWT 签名密钥 | (内置默认值) |
| `NEON_CONNECTION_STRING` | Neon 数据库连接字符串 | (可选) |

## Neon Auth 认证系统

项目使用自实现的 Neon Auth 认证系统，支持内存存储（开发模式）和 Neon 数据库（生产模式）。

### 核心服务

| 文件 | 说明 |
|------|------|
| `src/storage/neon/client.ts` | Neon PostgreSQL 客户端 |
| `src/services/neonAuth.ts` | 用户认证服务（注册、登录、Token） |
| `src/services/dataSync.ts` | 数据同步服务 |
| `src/middleware/auth.ts` | 认证中间件 |

### 认证 API 接口

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | 否 |
| `/api/auth/register/login` | POST | 用户登录 (Neon) | 否 |
| `/api/login/login/refresh` | POST | 刷新 Token | 否 |
| `/api/login/refresh` | POST | 刷新 Token (别名) | 否 |
| `/api/auth/me` | GET | 获取当前用户信息 | 是 |
| `/api/auth/logout` | POST | 退出登录 | 是 |

### 前端页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 跳转到登录或首页 |
| 登录 | `/login` | 用户登录 |
| 注册 | `/register` | 用户注册 |
| 首页 | `/home` | 登录后首页（需认证） |

### 安全功能

1. **频率限制（Rate Limiting）**：
   - 登录：15 分钟内最多 5 次尝试，锁定 30 分钟
   - 注册：1 小时内最多 3 次尝试，锁定 24 小时
   - Token 刷新：5 分钟内最多 10 次，锁定 15 分钟
   - 配置文件：`src/middleware/rateLimit.ts`

2. **密码验证**：
   - 至少 8 个字符
   - 必须包含小写字母、大写字母和数字
   - 配置文件：`src/routes/auth/register.ts`

3. **错误隐藏**：
   - 登录失败返回通用错误信息，防止枚举攻击

### JWT Token 结构

```typescript
interface JWTPayload {
  sub: string;      // 用户 ID
  email: string;    // 用户邮箱
  username: string; // 用户名
  iat: number;      // 签发时间
  exp: number;      // 过期时间
}
```

### 存储模式

- **开发模式**：使用内存存储，无需配置
- **生产模式**：配置 `NEON_CONNECTION_STRING` 使用 Neon PostgreSQL

## API 接口

项目提供 REST API 接口，需要 Bearer Token 认证（除白名单外）：

- `/api/login/*` - 登录相关
- `/api/auth/*` - 认证相关
- `/api/setting/*` - 设置相关
- `/api/project/*` - 项目管理
- `/api/agent/*` - AI Agent 接口
- `/api/novel/*` - 小说管理
- `/api/script/*` - 剧本管理
- `/api/image/*` - 图片生成
- `/api/video/*` - 视频生成

## WebSocket

支持 Socket.IO 实时通信：

- `/api/socket/productionAgent` - 制作 Agent
- `/api/socket/scriptAgent` - 脚本 Agent

## 注意事项

1. **Electron GUI**: 云端环境无法运行 Electron GUI，仅支持后端 API 服务
2. **原生模块**: better-sqlite3 需要编译原生模块，使用 `--ignore-scripts` 安装后需手动编译
3. **Token 认证**: 除登录接口外，所有 API 需要有效的 Bearer Token
4. **数据库**: SQLite 数据库文件位于 `data/db2.sqlite`
5. **Neon**: 用户认证支持 Neon PostgreSQL，需配置 `NEON_CONNECTION_STRING`
6. **SPA 路由**: 前端使用 Vue Router History 模式，服务器配置了 SPA 回退

## 部署说明

### better-sqlite3 编译问题

部署时 `better-sqlite3` 原生模块可能编译失败，需要使用 npmmirror 镜像：

```bash
export npm_config_disturl=https://registry.npmmirror.com/mirrors/node
export npm_config_build_from_source=false
pnpm install --ignore-scripts
cd node_modules/.pnpm/better-sqlite3@12.9.0/node_modules/better-sqlite3
npx -y node-gyp@10.1.0 rebuild --release
```

`.coze` 文件已配置自动编译步骤。

### Neon 数据库连接

生产环境需要配置 Neon 数据库连接字符串：

```bash
export NEON_CONNECTION_STRING='postgresql://user:password@host/neondb?sslmode=require'
```

## 常见问题

### better-sqlite3 编译失败

```bash
cd node_modules/.pnpm/better-sqlite3@12.9.0/node_modules/better-sqlite3
node-gyp rebuild
```

### 端口被占用

```bash
# 检查端口占用
ss -tuln | grep 5000

# 杀死进程
pkill -f "coze dev"
```
