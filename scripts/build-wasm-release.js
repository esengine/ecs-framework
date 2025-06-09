const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 构建 WASM 发布包（支持 Cocos Creator）...');

async function main() {
    try {
        // 构建 Cocos Creator 版本
        console.log('🎮 构建 Cocos Creator 版本...');
        await buildCocosVersion();

        // 构建通用版本（保持兼容性）
        console.log('🌐 构建通用版本...');
        await buildUniversalVersion();

        console.log('\n✅ WASM 发布包构建完成！');
        console.log('📦 输出目录:');
        console.log('  - cocos-release/ (Cocos Creator 专用包)');
        console.log('  - wasm-release/ (通用包)');
        console.log('💡 可以将整个目录打包为 zip 文件上传到 GitHub Release');

    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
}

async function buildCocosVersion() {
    // 确保 Cocos 版本已构建
    if (!fs.existsSync('./cocos-pkg')) {
        console.log('📦 构建 Cocos Creator WASM...');
        execSync('scripts\\build-cocos.bat', { stdio: 'inherit' });
    }

    // 创建 Cocos 发布目录
    const releaseDir = './cocos-release';
    if (fs.existsSync(releaseDir)) {
        execSync(`rimraf ${releaseDir}`, { stdio: 'inherit' });
    }
    fs.mkdirSync(releaseDir);

    // 复制 Cocos 包文件
    console.log('📁 复制 Cocos Creator 文件...');
    const cocosDir = './cocos-pkg';
    fs.readdirSync(cocosDir).forEach(file => {
        fs.copyFileSync(
            path.join(cocosDir, file),
            path.join(releaseDir, file)
        );
        console.log(`  ✓ ${file}`);
    });

    // 生成 Cocos 包信息
    console.log('📋 生成 Cocos Creator 包信息...');
    generateCocosPackageInfo(releaseDir);

    // 复制 build-templates 示例
    generateBuildTemplate(releaseDir);

    // 显示结果
    showReleaseResults(releaseDir, 'Cocos Creator');
}

async function buildUniversalVersion() {
    // 确保通用 WASM 已构建
    if (!fs.existsSync('./bin/wasm')) {
        console.log('📦 构建通用 WASM...');
        execSync('npm run build:wasm', { stdio: 'inherit' });
    }

    // 创建通用发布目录
    const releaseDir = './wasm-release';
    if (fs.existsSync(releaseDir)) {
        execSync(`rimraf ${releaseDir}`, { stdio: 'inherit' });
    }
    fs.mkdirSync(releaseDir);

    // 复制通用 WASM 文件
    console.log('📁 复制通用 WASM 文件...');
    const wasmDir = './bin/wasm';
    fs.readdirSync(wasmDir).forEach(file => {
        if (file !== '.gitignore') {
            fs.copyFileSync(
                path.join(wasmDir, file),
                path.join(releaseDir, file)
            );
            console.log(`  ✓ ${file}`);
        }
    });

    // 创建使用说明
    console.log('📋 生成通用使用说明...');
    generateUsageInstructions(releaseDir);

    // 显示结果
    showReleaseResults(releaseDir, '通用');
}

function generateCocosPackageInfo(releaseDir) {
    const packageInfo = {
        name: "@esengine/ecs-framework-wasm-cocos",
        version: "1.0.0",
        description: "ECS Framework WASM 加速模块 - Cocos Creator 专用版",
        main: "ecs_wasm_core.ts",
        files: [
            "ecs_wasm_core.ts",
            "ecs_wasm_core_bg.bin",
            "ecs_wasm_core_bg.wasm",
            "*.d.ts",
            "README.md",
            "build-templates/"
        ],
        keywords: ["ecs", "wasm", "cocos-creator", "game-engine"],
        author: "ESEngine Team",
        license: "MIT",
        peerDependencies: {
            "@esengine/ecs-framework": "^1.0.0"
        },
        engines: {
            "cocos-creator": ">=3.8.0"
        }
    };

    fs.writeFileSync(
        path.join(releaseDir, 'package.json'),
        JSON.stringify(packageInfo, null, 2)
    );
}

function generateBuildTemplate(releaseDir) {
    const templateDir = path.join(releaseDir, 'build-templates', 'wechatgame');
    fs.mkdirSync(templateDir, { recursive: true });

    const buildScript = `/**
 * 微信小游戏 build-templates 脚本
 * 自动将 WASM 文件复制到发布目录
 * 
 * 使用方法：
 * 1. 将此文件复制到项目的 build-templates/wechatgame/ 目录
 * 2. 重命名为 build-finish.js
 * 3. 构建微信小游戏时会自动执行
 */

const fs = require('fs');
const path = require('path');

function copyWasmFiles(options, callback) {
    const { buildPath } = options;
    
    console.log('🎮 复制 ECS WASM 文件到微信小游戏目录...');
    
    // WASM 源文件路径（需要根据实际项目结构调整）
    const wasmSourcePath = path.join(__dirname, '../../assets/scripts/ecs_wasm_core_bg.wasm');
    const wasmTargetPath = path.join(buildPath, 'ecs_wasm_core_bg.wasm');
    
    try {
        if (fs.existsSync(wasmSourcePath)) {
            fs.copyFileSync(wasmSourcePath, wasmTargetPath);
            console.log('✅ WASM 文件复制成功');
        } else {
            console.warn('⚠️ WASM 文件不存在，跳过复制');
        }
    } catch (error) {
        console.error('❌ 复制 WASM 文件失败:', error.message);
    }
    
    if (callback) callback();
}

module.exports = {
    onBuildFinished: copyWasmFiles
};`;

    fs.writeFileSync(path.join(templateDir, 'build-finish.js'), buildScript);
}

function generateUsageInstructions(releaseDir) {
    const instructions = `# ECS Framework WASM 支持包

这个包包含了 @esengine/ecs-framework 的 WASM 加速模块。

## 包含文件

- \`ecs_wasm_core.js\` - WASM胶水代码
- \`ecs_wasm_core.d.ts\` - TypeScript类型定义
- \`ecs_wasm_core_bg.wasm\` - WASM二进制文件
- \`ecs_wasm_core_bg.wasm.d.ts\` - WASM类型定义
- \`package.json\` - 包信息

## 使用方法

### 1. 其他环境（浏览器/Node.js）

\`\`\`typescript
import { ecsCore } from '@esengine/ecs-framework';

// 1. 导入胶水代码
import('./ecs_wasm_core.js').then(({ default: wasmFactory }) => {
    // 2. 加载WASM文件
    fetch('./ecs_wasm_core_bg.wasm').then(response => response.arrayBuffer()).then((wasmFile) => {
        // 3. 初始化WASM支持
        ecsCore.initializeWasm(wasmFactory, wasmFile).then((success) => {
            if (success) {
                console.log("ECS WASM加速已启用");
            } else {
                console.log("回退到JavaScript实现");
            }
        });
    });
});
\`\`\`

### 2. Webpack/Vite 等构建工具

\`\`\`typescript
import { ecsCore } from '@esengine/ecs-framework';
import wasmFactory from './ecs_wasm_core.js';
import wasmUrl from './ecs_wasm_core_bg.wasm?url';

async function initWasm() {
    try {
        const wasmFile = await fetch(wasmUrl).then(r => r.arrayBuffer());
        const success = await ecsCore.initializeWasm(wasmFactory, wasmFile);
        
        if (success) {
            console.log("ECS WASM加速已启用");
        } else {
            console.log("回退到JavaScript实现");
        }
    } catch (error) {
        console.error("WASM初始化失败:", error);
    }
}

initWasm();
\`\`\`

## 注意事项

1. 如果不使用此WASM包，框架会自动使用JavaScript实现，功能完全正常
2. WASM主要提供查询性能优化，对于大多数应用场景JavaScript实现已足够
3. 确保在ECS系统初始化之前调用\`initializeWasm\`方法

## Cocos Creator 用户

Cocos Creator 用户请使用专门的 Cocos Creator 包：\`cocos-release/\`

## 技术支持

如遇问题，请访问：
- [GitHub Issues](https://github.com/esengine/ecs-framework/issues)
- [主项目文档](https://github.com/esengine/ecs-framework#readme)
`;

    fs.writeFileSync(path.join(releaseDir, 'README.md'), instructions);
}

function showReleaseResults(releaseDir, packageType = '') {
    console.log(`\n📊 ${packageType} WASM 发布包内容:`);
    fs.readdirSync(releaseDir).forEach(file => {
        const filePath = path.join(releaseDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
            console.log(`  📁 ${file}/`);
            // 显示子目录内容
            try {
                fs.readdirSync(filePath).forEach(subFile => {
                    const subFilePath = path.join(filePath, subFile);
                    const subStats = fs.statSync(subFilePath);
                    if (subStats.isFile()) {
                        const size = (subStats.size / 1024).toFixed(1);
                        console.log(`     ${subFile}: ${size}KB`);
                    } else {
                        console.log(`     📁 ${subFile}/`);
                    }
                });
            } catch (e) {
                // 忽略读取错误
            }
        } else {
            const size = (stats.size / 1024).toFixed(1);
            console.log(`  ${file}: ${size}KB`);
        }
    });
}

main().catch(console.error); 