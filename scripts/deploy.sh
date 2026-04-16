#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "[1/4] 安装依赖..."
pnpm install --ignore-scripts

echo "[2/4] 编译 better-sqlite3..."
cd node_modules/.pnpm/better-sqlite3@12.9.0/node_modules/better-sqlite3
npx -y node-gyp@10.1.0 rebuild --release
cd ../../..

echo "[3/4] 构建前端..."
cd src-web && pnpm install && pnpm build && cd ..

echo "[4/4] 构建后端..."
mkdir -p data/serve
./node_modules/.pnpm/esbuild@0.28.0/node_modules/esbuild/bin/esbuild src/app.ts \
  --bundle --platform=node --outfile=data/serve/app.js \
  --alias:@=./src \
  --external:better-sqlite3 --external:sharp --external:mysql \
  --external:mysql2 --external:pg --external:oracledb --external:tedious \
  --external:mssql --external:sqlite3 --external:electron \
  --external:@huggingface/transformers --external:onnxruntime-web --external:vm2

mkdir -p data/web
cp -r src-web/dist/* data/web/ 2>/dev/null || true

echo "构建完成"
