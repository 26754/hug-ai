// esbuild 后端构建配置
const esbuild = require('esbuild')

const config = {
  entryPoints: ['src/app.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'data/serve/app.js',
  alias: {
    '@': './src'
  },
  external: [
    'better-sqlite3',
    'sharp',
    'mysql',
    'mysql2',
    'pg',
    'pg-query-stream',
    'oracledb',
    'tedious',
    'mssql',
    'sqlite3',
    'electron',
    '@huggingface/transformers',
    'onnxruntime-web',
    'onnxruntime-node',
    'vm2'
  ],
  format: 'cjs',
  logLevel: 'info'
}

esbuild.build(config).then(() => {
  console.log('Build complete')
}).catch(() => {
  process.exit(1)
})
