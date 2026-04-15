#!/bin/bash
set -e

echo "=== HUG AI 部署脚本 ==="

# 项目目录
PROJECT_DIR="${COZE_WORKSPACE_PATH:-/workspace/projects}"

echo "项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 设置环境
export NODE_ENV=prod
export DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-5000}"

echo "1/5 安装依赖..."
pnpm install --ignore-scripts

echo "2/5 编译原生模块..."
cd "$PROJECT_DIR/node_modules/.pnpm/better-sqlite3@12.9.0/node_modules/better-sqlite3"
npx -y node-gyp@10.1.0 rebuild --release

echo "3/5 构建前端..."
cd "$PROJECT_DIR/src-web"
pnpm build

echo "4/5 构建后端..."
cd "$PROJECT_DIR"
NODE_PATH="$PROJECT_DIR/node_modules/.pnpm/node_modules" \
  node "$PROJECT_DIR/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.cjs" scripts/build.ts

echo "5/5 准备产物..."
mkdir -p "$PROJECT_DIR/data/serve"
mkdir -p "$PROJECT_DIR/data/web"

# 复制前端构建产物 (vite 输出到 data/web)
if [ -d "$PROJECT_DIR/src-web/dist" ]; then
  cp -r "$PROJECT_DIR/src-web/dist/"* "$PROJECT_DIR/data/web/"
fi

# 复制后端产物
if [ -f "$PROJECT_DIR/build/app.js" ]; then
  cp "$PROJECT_DIR/build/app.js" "$PROJECT_DIR/data/serve/app.js"
fi

echo "=== 部署完成 ==="
