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
const filesToBundle = [
    {
        src: path.join(rootPath, 'packages/platform-web/dist/runtime.browser.js'),
        dst: path.join(bundleDir, 'runtime.browser.js')
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

// Update tauri.conf.json to include runtime directory
if (success) {
    const tauriConfigPath = path.join(editorPath, 'src-tauri', 'tauri.conf.json');
    const config = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));

    // Add runtime directory to resources
    if (!config.bundle) {
        config.bundle = {};
    }
    if (!config.bundle.resources) {
        config.bundle.resources = {};
    }

    // Handle both array and object format for resources
    if (Array.isArray(config.bundle.resources)) {
        if (!config.bundle.resources.includes('runtime/**/*')) {
            config.bundle.resources.push('runtime/**/*');
            fs.writeFileSync(tauriConfigPath, JSON.stringify(config, null, 2));
            console.log('✓ Updated tauri.conf.json with runtime resources');
        }
    } else if (typeof config.bundle.resources === 'object') {
        // Object format - add runtime files if not present
        if (!config.bundle.resources['runtime/**/*']) {
            config.bundle.resources['runtime/**/*'] = '.';
            fs.writeFileSync(tauriConfigPath, JSON.stringify(config, null, 2));
            console.log('✓ Updated tauri.conf.json with runtime resources');
        }
    }
}

if (!success) {
    console.error('Runtime bundling failed');
    process.exit(1);
}

console.log('Runtime files bundled successfully!');