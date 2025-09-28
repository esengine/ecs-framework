#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEMO_DIST_DIR = 'examples/worker-system-demo/dist';
const VITEPRESS_DEMO_DIR = 'docs/public/demos/worker-system';

function updateWorkerDemo() {
    console.log('🔄 更新 Worker System Demo 资源...');

    try {
        // 1. 清理旧的 JS 文件
        const assetsDir = path.join(VITEPRESS_DEMO_DIR, 'assets');
        if (fs.existsSync(assetsDir)) {
            const files = fs.readdirSync(assetsDir);
            const jsFiles = files.filter(file => file.startsWith('index-') && file.endsWith('.js'));

            for (const jsFile of jsFiles) {
                const filePath = path.join(assetsDir, jsFile);
                fs.unlinkSync(filePath);
                console.log(`🗑️  删除旧文件: ${jsFile}`);
            }
        }

        // 2. 复制新的资源文件
        const sourceAssetsDir = path.join(DEMO_DIST_DIR, 'assets');
        if (!fs.existsSync(sourceAssetsDir)) {
            throw new Error(`源目录不存在: ${sourceAssetsDir}`);
        }

        // 确保目标目录存在
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        const sourceFiles = fs.readdirSync(sourceAssetsDir);
        const newJsFile = sourceFiles.find(file => file.startsWith('index-') && file.endsWith('.js'));

        if (!newJsFile) {
            throw new Error('未找到新的 JS 文件');
        }

        // 复制新的 JS 文件
        const sourcePath = path.join(sourceAssetsDir, newJsFile);
        const targetPath = path.join(assetsDir, newJsFile);
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`📁 复制新文件: ${newJsFile}`);

        // 3. 更新 index.html 中的引用
        const indexHtmlPath = path.join(VITEPRESS_DEMO_DIR, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
            let content = fs.readFileSync(indexHtmlPath, 'utf-8');

            // 更新 script 标签中的文件名
            const scriptRegex = /src="\/ecs-framework\/demos\/worker-system\/assets\/index-[^"]+\.js"/;
            const newScriptSrc = `/ecs-framework/demos/worker-system/assets/${newJsFile}`;
            content = content.replace(scriptRegex, `src="${newScriptSrc}"`);

            fs.writeFileSync(indexHtmlPath, content);
            console.log(`📝 更新 index.html 引用: ${newJsFile}`);
        }

        console.log('✅ Worker System Demo 资源更新完成！');
        console.log('💡 提示：运行 npm run docs:build 来重新构建文档');

    } catch (error) {
        console.error('❌ 更新失败:', error.message);
        process.exit(1);
    }
}

updateWorkerDemo();