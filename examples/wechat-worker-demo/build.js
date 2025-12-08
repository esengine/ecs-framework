/**
 * 构建脚本 - 打包为微信小游戏可用的 JS 文件
 * Build script - bundle for WeChat Mini Game
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, 'dist');

// 确保输出目录存在
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// 打包主程序
esbuild.buildSync({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/game-bundle.js',
    format: 'iife',
    globalName: 'GameDemo',
    target: ['es2015'],
    platform: 'browser',
    external: [], // 不排除任何依赖，全部打包
    minify: false,
    sourcemap: true,
});

console.log('Build complete: dist/game-bundle.js');
