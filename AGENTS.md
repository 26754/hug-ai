# HUG AI - AI 短剧漫剧工具

## 项目概览

- **名称**: HUG AI
- **版本**: 1.1.6
- **描述**: AI 短剧漫剧工具，能够利用 AI 技术将小说自动转化为剧本，并结合 AI 生成的图片和视频，实现高效的短剧创作
- **作者**: HBAI-Ltd <ltlctools@outlook.com>
- **许可证**: Apache-2.0

## 技术栈

### 后端
- **运行时**: Node.js 24+
- **语言**: TypeScript / JavaScript
- **框架**: Express.js 5
- **数据库**: SQLite (better-sqlite3) + Neon PostgreSQL
- **AI SDK**: @ai-sdk (支持 Anthropic, DeepSeek, Google, OpenAI, XAI 等)
- **构建**: esbuild

### 前端
- **框架**: Vue 3 + Vite 6
- **UI组件**: TDesign Vue Next
- **状态管理**: Pinia
- **路由**: Vue Router
- **多语言**: Vue I18n

## 目录结构

```
/workspace/projects/
├── src/                    # 后端源代码
│   ├── app.ts             # Express 服务器入口
│   ├── router.ts          # API 路由配置
│   ├── routes/            # API 路由
│   ├── agents/            # AI Agent 实现
│   ├── utils/             # 工具函数
│   ├── socket/            # WebSocket 处理
│   ├── services/          # 服务层 (neonAuth, dataSync)
│   └── middleware/         # 中间件
├── src-web/               # 前端应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/     # 通用组件
│   │   └── ...
│   └── dist/              # 构建输出
├── data/                  # 数据目录
│   ├── db2.sqlite        # SQLite 数据库
│   ├── web/               # 前端静态资源
│   ├── oss/               # 对象存储
│   └── assets/            # 资源文件
├── scripts/
│   ├── deploy.sh          # 部署脚本
│   └── build.ts           # 构建脚本
├── package.json
├── .coze                  # Coze 部署配置
└── .env                   # 环境变量
```

## 构建和运行

### 部署命令 (Coze)

```bash
# 1. 安装依赖
pnpm install --ignore-scripts

# 2. 编译 better-sqlite3
cd node_modules/.pnpm/better-sqlite3@12.9.0/node_modules/better-sqlite3
npx -y node-gyp@10.1.0 rebuild --release
cd ../../..

# 3. 构建前端
cd src-web && pnpm install && pnpm build && cd ..

# 4. 构建后端
npx esbuild src/app.ts --bundle --platform=node --outfile=data/serve/app.js \
  --alias:@=./src \
  --external:better-sqlite3 --external:sharp --external:mysql --external:mysql2 \
  --external:pg --external:oracledb --external:tedious --external:mssql \
  --external:sqlite3 --external:electron --external:@huggingface/transformers \
  --external:onnxruntime-web --external:vm2

# 5. 启动服务
node data/serve/app.js
```

### .coze 配置

```toml
[project]
requires = ["nodejs-24"]
entrypoint = "src/app.ts"

[dev]
build = ["pnpm", "install"]
run = ["npx", "tsx", "src/app.ts"]

[deploy]
build = ["bash", "scripts/deploy.sh"]
run = ["node", "data/serve/app.js"]
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DEPLOY_RUN_PORT` | 服务监听端口 | 5000 |
| `NODE_ENV` | 运行环境 | prod |
| `JWT_SECRET` | JWT 签名密钥 | (内置默认值) |
| `NEON_CONNECTION_STRING` | Neon 数据库连接字符串 | (可选) |

## API 接口

- `/api/auth/*` - 认证相关
- `/api/setting/*` - 设置相关
- `/api/project/*` - 项目管理
- `/api/agent/*` - AI Agent 接口
- `/api/novel/*` - 小说管理
- `/api/script/*` - 剧本管理
- `/api/image/*` - 图片生成
- `/api/video/*` - 视频生成

## WebSocket

- `/api/socket/productionAgent` - 制作 Agent
- `/api/socket/scriptAgent` - 脚本 Agent

## 注意事项

1. **better-sqlite3**: 需要编译原生模块，使用 `--ignore-scripts` 安装后需手动编译
2. **Token 认证**: 除登录接口外，所有 API 需要有效的 Bearer Token
3. **SPA 路由**: 前端使用 Vue Router History 模式，服务器配置了 SPA 回退
4. **延迟加载**: vm2、transformers 等重型模块使用动态 import 延迟加载
