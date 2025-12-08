const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 使用 Rollup 构建npm包...');

async function main() {
    try {
        // 清理旧的dist目录
        if (fs.existsSync('./dist')) {
            console.log('🧹 清理旧的构建文件...');
            execSync('rimraf ./dist', { stdio: 'inherit' });
        }

        // 执行Rollup构建
        console.log('📦 执行 Rollup 构建...');
        execSync('npx rollup -c rollup.config.cjs', { stdio: 'inherit' });

        // 生成package.json
        console.log('📋 生成 package.json...');
        generatePackageJson();

        // 输出构建结果
        showBuildResults();

        console.log('✅ 构建完成！');
        console.log('\n🚀 发布命令:');
        console.log('cd dist && npm publish');

    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
}

function generatePackageJson() {
    const sourcePackage = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

    const distPackage = {
        name: sourcePackage.name,
        version: sourcePackage.version,
        description: sourcePackage.description,
        main: 'index.cjs',
        module: 'index.mjs',
        unpkg: 'index.umd.js',
        types: 'index.d.ts',
        exports: {
            '.': {
                import: './index.mjs',
                require: './index.cjs',
                types: './index.d.ts'
            }
        },
        files: [
            'index.mjs',
            'index.mjs.map',
            'index.cjs',
            'index.cjs.map',
            'index.umd.js',
            'index.umd.js.map',
            'index.d.ts'
        ],
        keywords: sourcePackage.keywords,
        author: sourcePackage.author,
        license: sourcePackage.license,
        repository: sourcePackage.repository,
        bugs: sourcePackage.bugs,
        homepage: sourcePackage.homepage,
        peerDependencies: {
            '@esengine/ecs-framework': '^2.2.8'
        },
        engines: {
            node: '>=16.0.0'
        },
        sideEffects: false
    };

    fs.writeFileSync('./dist/package.json', JSON.stringify(distPackage, null, 2));
}

function showBuildResults() {
    const distDir = './dist';
    const files = ['index.mjs', 'index.cjs', 'index.umd.js', 'index.d.ts'];

    console.log('\n📊 构建结果:');
    files.forEach(file => {
        const filePath = path.join(distDir, file);
        if (fs.existsSync(filePath)) {
            const size = fs.statSync(filePath).size;
            console.log(`  ${file}: ${(size / 1024).toFixed(1)}KB`);
        }
    });
}

main().catch(console.error);
