// esbuild 后端构建配置
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
    'vm2'
  ],
  format: 'cjs',
  outExtension: { '.js': '.js' },
  logLevel: 'info'
}

require('esbuild').build(config).catch(() => process.exit(1))
