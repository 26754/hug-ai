# Toonflow AI 短剧漫剧工具

## 项目概览

- **名称**: Toonflow
- **版本**: 1.1.4
- **描述**: AI 短剧漫剧工具，能够利用 AI 技术将小说自动转化为剧本，并结合 AI 生成的图片和视频，实现高效的短剧创作
- **作者**: HBAI-Ltd <ltlctools@outlook.com>
- **许可证**: Apache-2.0
- **仓库**: https://github.com/HBAI-Ltd/Toonflow-app

## 技术栈

- **运行时**: Node.js 24+
- **语言**: TypeScript
- **框架**: Express.js + Vue.js 3
- **数据库**: SQLite (better-sqlite3)
- **AI SDK**: @ai-sdk (支持 Anthropic, DeepSeek, Google, OpenAI, XAI 等)
- **打包**: esbuild, Electron (可选)
- **包管理器**: pnpm

## 目录结构

```
/workspace/projects/
├── src/                    # 源代码
│   ├── app.ts             # Express 服务器入口
│   ├── router.ts          # 路由配置
│   ├── routes/            # API 路由
│   ├── agents/            # AI Agent 实现
│   ├── utils/             # 工具函数
│   └── socket/            # WebSocket 处理
├── scripts/               # 构建脚本
│   └── build.ts           # 项目打包配置
├── data/                  # 数据目录
│   ├── db2.sqlite        # SQLite 数据库
│   ├── oss/               # 对象存储
│   ├── skills/            # 技能数据
│   └── assets/            # 资源文件
├── build/                 # 构建输出
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
└── .coze                  # Coze 部署配置
```

## 构建和运行命令

### Coze 环境 (推荐)

```bash
# 安装依赖 (忽略 Electron postinstall)
pnpm install --ignore-scripts

# 构建项目
NODE_PATH=/workspace/projects/node_modules/.pnpm/node_modules node /workspace/projects/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.cjs scripts/build.ts

# 启动服务 (端口 5000)
coze dev
```

### 手动运行

```bash
# 编译 better-sqlite3 原生模块 (如需要)
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

## API 接口

项目提供 REST API 接口，需要 Bearer Token 认证：

- `/api/login/login` - 登录 (白名单)
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
