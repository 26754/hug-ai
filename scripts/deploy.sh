#!/bin/bash
set -e

echo "========== HUG AI 部署脚本 =========="
echo "时间: $(date)"

# 项目目录
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "项目目录: $PROJECT_DIR"

# 1. 安装依赖
echo ""
echo "[1/5] 安装依赖..."
pnpm install --ignore-scripts

# 2. 编译原生模块
echo ""
echo "[2/5] 编译 better-sqlite3 原生模块..."
cd node_modules/.pnpm/better-sqlite3@12.9.0/node_modules/better-sqlite3
npx -y node-gyp@10.1.0 rebuild --release
cd "$PROJECT_DIR"

# 3. 构建前端
echo ""
echo "[3/5] 构建前端..."
cd src-web
pnpm install
pnpm build
cd "$PROJECT_DIR"

# 4. 构建后端 (使用 esbuild 直接构建)
echo ""
echo "[4/5] 构建后端..."
mkdir -p data/serve
npx esbuild src/app.ts --bundle --platform=node --outfile=data/serve/app.js \
  --alias:@=./src \
  --external:better-sqlite3 --external:sharp --external:mysql --external:mysql2 \
  --external:pg --external:oracledb --external:tedious --external:mssql \
  --external:sqlite3 --external:electron --external:@huggingface/transformers \
  --external:onnxruntime-web --external:vm2
echo "后端构建完成"

# 5. 准备产物
echo ""
echo "[5/5] 准备部署产物..."
mkdir -p "$PROJECT_DIR/data/serve"
mkdir -p "$PROJECT_DIR/data/web"

# 复制前端产物
if [ -d "$PROJECT_DIR/src-web/dist" ]; then
  cp -r "$PROJECT_DIR/src-web/dist/"* "$PROJECT_DIR/data/web/"
  echo "前端产物已复制到 data/web/"
fi

echo ""
echo "========== 部署完成 =========="
