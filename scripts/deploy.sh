#!/bin/bash
# HUG AI 部署脚本
cd "$(dirname "$0")/.."
PROJDIR=$PWD

# 忽略 DEP 警告，不中断脚本
export NODE_OPTIONS="--no-deprecation"

echo "[1/5] 安装依赖..."
pnpm install --ignore-scripts 2>/dev/null || true

echo "[2/5] 编译 better-sqlite3..."
cd node_modules/.pnpm/better-sqlite3@12.9.0/node_modules/better-sqlite3 2>/dev/null || cd $PROJDIR
npx -y node-gyp@10.1.0 rebuild --release 2>/dev/null || true
cd $PROJDIR

echo "[3/5] 构建前端..."
cd src-web && pnpm install && pnpm build && cd $PROJDIR

echo "[4/5] 构建后端..."
mkdir -p data/serve data/web
node scripts/esbuild.config.js

echo "[5/5] 复制前端产物..."
cp -r src-web/dist/* data/web/ 2>/dev/null || true

echo "构建完成"
