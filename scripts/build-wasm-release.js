const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 构建 WASM 发布包...');

async function main() {
    try {
        // 构建通用版本
        console.log('🌐 构建通用 WASM 版本...');
        await buildUniversalVersion();

        console.log('\n✅ WASM 发布包构建完成！');
        console.log('📦 输出目录: wasm-release/');
        console.log('💡 可以将整个目录打包为 zip 文件上传到 GitHub Release');

    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
}



async function buildUniversalVersion() {
    // 确保通用 WASM 已构建
    if (!fs.existsSync('./bin/wasm')) {
        console.log('📦 构建通用 WASM...');
        execSync('npm run build:wasm', { stdio: 'inherit' });
    }

    // 创建发布目录
    const releaseDir = './wasm-release';
    if (fs.existsSync(releaseDir)) {
        execSync(`rimraf ${releaseDir}`, { stdio: 'inherit' });
    }
    fs.mkdirSync(releaseDir);

    // 复制 WASM 文件
    console.log('📁 复制 WASM 文件...');
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

    // 生成包信息
    console.log('📋 生成包信息...');
    generatePackageInfo(releaseDir);

    // 创建使用说明
    console.log('📋 生成使用说明...');
    generateUsageInstructions(releaseDir);

    // 显示结果
    showReleaseResults(releaseDir);
}

function generatePackageInfo(releaseDir) {
    const packageInfo = {
        name: "@esengine/ecs-framework-wasm",
        version: "1.0.0",
        description: "ECS Framework WASM 加速模块",
        main: "ecs_wasm_core.js",
        files: [
            "ecs_wasm_core.js",
            "ecs_wasm_core_bg.wasm",
            "*.d.ts",
            "README.md"
        ],
        keywords: ["ecs", "wasm", "game-engine", "performance"],
        author: "ESEngine Team",
        license: "MIT",
        peerDependencies: {
            "@esengine/ecs-framework": "^1.0.0"
        }
    };

    fs.writeFileSync(
        path.join(releaseDir, 'package.json'),
        JSON.stringify(packageInfo, null, 2)
    );
}

function generateUsageInstructions(releaseDir) {
    const instructions = `# ECS Framework WASM 支持包

这个包包含了 @esengine/ecs-framework 的 WASM 加速模块。

## 包含文件

- \`ecs_wasm_core.js\` - WASM 胶水代码
- \`ecs_wasm_core.d.ts\` - TypeScript 类型定义
- \`ecs_wasm_core_bg.wasm\` - WASM 二进制文件
- \`ecs_wasm_core_bg.wasm.d.ts\` - WASM 类型定义
- \`package.json\` - 包信息

## 使用方法

### Node.js 环境

\`\`\`javascript
import init, { EcsCore } from './ecs_wasm_core.js';

async function useWasm() {
    // 初始化 WASM 模块
    await init();
    
    // 创建 ECS 核心实例
    const ecsCore = new EcsCore();
    
    // 使用 WASM 加速的 ECS 功能
    const entity = ecsCore.create_entity();
    console.log('创建实体:', entity);
}

useWasm();
\`\`\`

### 浏览器环境

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import init, { EcsCore } from './ecs_wasm_core.js';
        
        async function main() {
            await init();
            const ecsCore = new EcsCore();
            const entity = ecsCore.create_entity();
            console.log('Entity created:', entity);
        }
        
        main();
    </script>
</head>
<body>
    <h1>ECS Framework WASM Demo</h1>
</body>
</html>
\`\`\`

### TypeScript 支持

确保包含类型定义：

\`\`\`typescript
import init, { EcsCore } from './ecs_wasm_core.js';

async function typedExample(): Promise<void> {
    await init();
    
    const ecsCore = new EcsCore();
    const entityId: number = ecsCore.create_entity();
    
    // 使用类型安全的 API
    const mask = BigInt(0b1010);
    ecsCore.update_entity_mask(entityId, mask);
}
\`\`\`

## 性能优势

WASM 模块主要优化以下操作：

- 🚀 实体查询（10-100x 性能提升）
- 🔥 组件掩码操作
- ⚡ 批量实体处理

## 兼容性

- **浏览器**: 支持 WebAssembly 的现代浏览器
- **Node.js**: 16.0+ 版本
- **TypeScript**: 4.0+ 版本

## 许可证

MIT License - 详见 LICENSE 文件
`;

    fs.writeFileSync(path.join(releaseDir, 'README.md'), instructions);
}

function showReleaseResults(releaseDir) {
    const files = fs.readdirSync(releaseDir);
    const totalSize = files.reduce((size, file) => {
        const filePath = path.join(releaseDir, file);
        const stats = fs.statSync(filePath);
        return size + stats.size;
    }, 0);

    console.log(`\n📦 发布包内容 (${releaseDir}):`);
    files.forEach(file => {
        const filePath = path.join(releaseDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`  ✓ ${file} (${sizeKB} KB)`);
    });

    console.log(`\n📊 总计 ${files.length} 个文件，大小: ${(totalSize / 1024).toFixed(1)} KB`);
}

if (require.main === module) {
    main();
}

module.exports = { main }; 