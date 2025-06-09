const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 构建WASM发布包...');

async function main() {
    try {
        // 确保WASM已构建
        if (!fs.existsSync('./bin/wasm')) {
            console.log('📦 构建WASM...');
            execSync('npm run build:wasm', { stdio: 'inherit' });
        }

        // 创建发布目录
        const releaseDir = './wasm-release';
        if (fs.existsSync(releaseDir)) {
            execSync(`rimraf ${releaseDir}`, { stdio: 'inherit' });
        }
        fs.mkdirSync(releaseDir);

        // 复制WASM文件
        console.log('📁 复制WASM文件...');
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
        console.log('📋 生成使用说明...');
        generateUsageInstructions(releaseDir);

        // 显示结果
        showReleaseResults(releaseDir);

        console.log('\n✅ WASM发布包构建完成！');
        console.log(`📦 发布目录: ${releaseDir}`);
        console.log('💡 可以将整个目录打包为zip文件上传到GitHub Release');

    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
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

### 1. Cocos Creator 3.8+

\`\`\`typescript
import { ecsCore } from '@esengine/ecs-framework';

// 1. 将WASM文件导入到项目资源中
// 2. 导入胶水代码
import('./ecs_wasm_core.js').then(({ default: wasmFactory }) => {
    // 3. 使用Cocos API加载WASM文件
    this.loadWasmOrAsm("wasmFiles", "ecs_wasm_core", "your-wasm-uuid").then((wasmFile) => {
        // 4. 初始化WASM支持
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

### 2. 其他环境（浏览器/Node.js）

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

## 注意事项

1. 如果不使用此WASM包，框架会自动使用JavaScript实现，功能完全正常
2. WASM主要提供查询性能优化，对于大多数应用场景JavaScript实现已足够
3. 确保在ECS系统初始化之前调用\`initializeWasm\`方法

## 技术支持

如遇问题，请访问：
- [GitHub Issues](https://github.com/esengine/ecs-framework/issues)
- [主项目文档](https://github.com/esengine/ecs-framework#readme)
`;

    fs.writeFileSync(path.join(releaseDir, 'README.md'), instructions);
}

function showReleaseResults(releaseDir) {
    console.log('\n📊 WASM发布包内容:');
    fs.readdirSync(releaseDir).forEach(file => {
        const filePath = path.join(releaseDir, file);
        const size = fs.statSync(filePath).size;
        console.log(`  ${file}: ${(size / 1024).toFixed(1)}KB`);
    });
}

main().catch(console.error); 