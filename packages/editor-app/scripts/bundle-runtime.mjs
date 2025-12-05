/**
 * Bundle runtime files for production build
 * 为生产构建打包运行时文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const editorPath = path.resolve(__dirname, '..');
const rootPath = path.resolve(editorPath, '../..');
const bundleDir = path.join(editorPath, 'src-tauri', 'runtime');

// Create bundle directory
if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
    console.log(`Created bundle directory: ${bundleDir}`);
}

// Files to bundle
// 需要打包的文件
const filesToBundle = [
    {
        src: path.join(rootPath, 'packages/platform-web/dist/index.mjs'),
        dst: path.join(bundleDir, 'platform-web.mjs')
    },
    {
        src: path.join(rootPath, 'packages/engine/pkg/es_engine_bg.wasm'),
        dst: path.join(bundleDir, 'es_engine_bg.wasm')
    },
    {
        src: path.join(rootPath, 'packages/engine/pkg/es_engine.js'),
        dst: path.join(bundleDir, 'es_engine.js')
    }
];

// Type definition files for IDE intellisense
// 用于 IDE 智能感知的类型定义文件
const typesDir = path.join(bundleDir, 'types');
if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
    console.log(`Created types directory: ${typesDir}`);
}

const typeFilesToBundle = [
    {
        src: path.join(rootPath, 'packages/core/dist/index.d.ts'),
        dst: path.join(typesDir, 'ecs-framework.d.ts')
    },
    {
        src: path.join(rootPath, 'packages/engine-core/dist/index.d.ts'),
        dst: path.join(typesDir, 'engine-core.d.ts')
    }
];

// Copy files
let success = true;
for (const { src, dst } of filesToBundle) {
    try {
        if (!fs.existsSync(src)) {
            console.error(`Source file not found: ${src}`);
            console.log('Please build the runtime modules first:');
            console.log('  npm run build --workspace=@esengine/platform-web');
            console.log('  cd packages/engine && wasm-pack build --target web');
            success = false;
            continue;
        }

        fs.copyFileSync(src, dst);
        const stats = fs.statSync(dst);
        console.log(`✓ Bundled ${path.basename(dst)} (${(stats.size / 1024).toFixed(2)} KB)`);
    } catch (error) {
        console.error(`Failed to bundle ${path.basename(src)}: ${error.message}`);
        success = false;
    }
}

// Copy type definition files (optional - don't fail if not found)
// 复制类型定义文件（可选 - 找不到不报错）
for (const { src, dst } of typeFilesToBundle) {
    try {
        if (!fs.existsSync(src)) {
            console.warn(`Type definition not found: ${src}`);
            console.log('  Build packages first: pnpm --filter @esengine/core build');
            continue;
        }

        fs.copyFileSync(src, dst);
        const stats = fs.statSync(dst);
        console.log(`✓ Bundled type definition ${path.basename(dst)} (${(stats.size / 1024).toFixed(2)} KB)`);
    } catch (error) {
        console.warn(`Failed to bundle type definition ${path.basename(src)}: ${error.message}`);
    }
}

// Copy engine modules directory from dist/engine to src-tauri/engine
// 复制引擎模块目录从 dist/engine 到 src-tauri/engine
const engineSrcDir = path.join(editorPath, 'dist', 'engine');
const engineDstDir = path.join(editorPath, 'src-tauri', 'engine');

/**
 * Recursively copy directory
 * 递归复制目录
 */
function copyDirRecursive(src, dst) {
    if (!fs.existsSync(src)) {
        return false;
    }

    if (!fs.existsSync(dst)) {
        fs.mkdirSync(dst, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const dstPath = path.join(dst, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, dstPath);
        } else {
            fs.copyFileSync(srcPath, dstPath);
        }
    }
    return true;
}

if (fs.existsSync(engineSrcDir)) {
    // Remove old engine directory if exists
    if (fs.existsSync(engineDstDir)) {
        fs.rmSync(engineDstDir, { recursive: true });
    }

    if (copyDirRecursive(engineSrcDir, engineDstDir)) {
        // Count files
        let fileCount = 0;
        function countFiles(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    countFiles(path.join(dir, entry.name));
                } else {
                    fileCount++;
                }
            }
        }
        countFiles(engineDstDir);
        console.log(`✓ Copied engine modules directory (${fileCount} files)`);
    }
} else {
    console.warn(`Engine modules directory not found: ${engineSrcDir}`);
    console.log('  Build editor-app first: pnpm --filter @esengine/editor-app build');
}

// Copy esbuild binary for user code compilation
// 复制 esbuild 二进制文件用于用户代码编译
const binDir = path.join(editorPath, 'src-tauri', 'bin');
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
    console.log(`Created bin directory: ${binDir}`);
}

// Platform-specific esbuild binary paths
// 平台特定的 esbuild 二进制路径
const esbuildSources = {
    win32: path.join(rootPath, 'node_modules/@esbuild/win32-x64/esbuild.exe'),
    darwin: path.join(rootPath, 'node_modules/@esbuild/darwin-x64/bin/esbuild'),
    linux: path.join(rootPath, 'node_modules/@esbuild/linux-x64/bin/esbuild'),
};

const platform = process.platform;
const esbuildSrc = esbuildSources[platform];
const esbuildDst = path.join(binDir, platform === 'win32' ? 'esbuild.exe' : 'esbuild');

let esbuildBundled = false;
if (esbuildSrc && fs.existsSync(esbuildSrc)) {
    try {
        fs.copyFileSync(esbuildSrc, esbuildDst);
        // Ensure executable permission on Unix
        if (platform !== 'win32') {
            fs.chmodSync(esbuildDst, 0o755);
        }
        const stats = fs.statSync(esbuildDst);
        console.log(`✓ Bundled esbuild binary (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        esbuildBundled = true;
    } catch (error) {
        console.warn(`Failed to bundle esbuild: ${error.message}`);
        console.log('  User code compilation will require global esbuild installation');
    }
} else {
    console.warn(`esbuild binary not found for platform ${platform}: ${esbuildSrc}`);
    console.log('  User code compilation will require global esbuild installation');
}

// Create a placeholder file if esbuild was not bundled
// Tauri requires resources patterns to match at least one file
// 如果 esbuild 没有打包，创建占位文件
// Tauri 要求资源模式至少匹配一个文件
if (!esbuildBundled) {
    const placeholderPath = path.join(binDir, '.gitkeep');
    fs.writeFileSync(placeholderPath, '# Placeholder for Tauri resources\n# esbuild binary will be bundled during release build\n');
    console.log('✓ Created placeholder in bin directory');
}

if (!success) {
    console.error('Runtime bundling failed');
    process.exit(1);
}

console.log('Runtime files bundled successfully!');