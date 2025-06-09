#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

/**
 * ECS Framework 单文件构建脚本
 * 专门用于npm包发布的单文件版本
 */

const config = {
    // 输入配置
    entryPoint: './bin/index.js',
    
    // 输出配置
    outputDir: './dist',
    outputFile: 'index.js',
    
    // 压缩配置
    minify: true,
    sourcemap: true,
    
    // 目标环境 - 支持BigInt等ES2020特性
    target: ['es2020'],
    format: 'esm',
    
    // npm包配置
    generatePackageJson: true,
    generateTypes: true
};

async function buildSingleFile() {
    console.log('🚀 构建单文件npm包...');
    
    try {
        // 确保输出目录存在
        if (!fs.existsSync(config.outputDir)) {
            fs.mkdirSync(config.outputDir, { recursive: true });
        }

        // 第一步：使用esbuild打包
        console.log('📦 使用 esbuild 打包...');
        
        const result = await esbuild.build({
            entryPoints: [config.entryPoint],
            bundle: true,
            minify: config.minify,
            sourcemap: config.sourcemap,
            target: config.target,
            format: config.format,
            outfile: path.join(config.outputDir, config.outputFile),
            platform: 'browser', // 浏览器环境
            
            // 外部依赖
            external: [],
            
            // 定义Node.js模块的浏览器替代
            inject: [],
            
            // 定义全局变量
            define: {
                'process.env.NODE_ENV': '"production"',
                'require': 'undefined',
                '__filename': '""',
                '__dirname': '""'
            },
            
            // 元信息
            metafile: true,
            
            // 日志级别
            logLevel: 'info',
            
            // 保持类名（便于调试）
            keepNames: true,
            
            // 生成更兼容的代码
            legalComments: 'none'
        });

        // 显示打包结果
        if (result.metafile) {
            const analysis = await esbuild.analyzeMetafile(result.metafile);
            console.log('📊 打包分析：');
            console.log(analysis);
        }

        // 第二步：生成类型定义文件
        if (config.generateTypes) {
            console.log('📝 生成类型定义文件...');
            await generateTypeDefinitions();
        }

        // 第三步：生成package.json
        if (config.generatePackageJson) {
            console.log('📋 生成package.json...');
            await generatePackageJson();
        }

        // 第四步：复制必要文件
        await copyEssentialFiles();

        console.log('✅ 单文件构建完成！');
        console.log(`📄 主文件: ${path.join(config.outputDir, config.outputFile)}`);
        
        // 显示文件大小
        const stats = fs.statSync(path.join(config.outputDir, config.outputFile));
        console.log(`📏 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);

        console.log('\n🚀 发布到npm:');
        console.log('cd dist && npm publish');

    } catch (error) {
        console.error('❌ 构建失败:', error);
        process.exit(1);
    }
}

/**
 * 生成类型定义文件
 */
async function generateTypeDefinitions() {
    const sourceTypesFile = './bin/index.d.ts';
    const targetTypesFile = path.join(config.outputDir, 'index.d.ts');
    
    if (fs.existsSync(sourceTypesFile)) {
        // 读取原始类型定义
        let typesContent = fs.readFileSync(sourceTypesFile, 'utf8');
        
        // 处理相对路径导入，将其转换为绝对导入
        typesContent = typesContent.replace(/from ['"]\.\//g, "from './");
        typesContent = typesContent.replace(/from ['"]\.\.\//g, "from './");
        
        // 添加版本信息注释
        const header = `/**
 * @esengine/ecs-framework
 * 高性能ECS框架 - 适用于Cocos Creator和Laya引擎
 * 版本: ${require('../package.json').version}
 * 构建时间: ${new Date().toISOString()}
 */

`;
        
        fs.writeFileSync(targetTypesFile, header + typesContent);
        console.log(`  ✓ 生成: ${targetTypesFile}`);
    }
}

/**
 * 生成npm包的package.json
 */
async function generatePackageJson() {
    const sourcePackage = require('../package.json');
    
    // 创建完全干净的package.json，只包含发布必需的字段
    const distPackage = {};
    
    // 按顺序添加字段，确保没有任何开发相关字段
    distPackage.name = sourcePackage.name;
    distPackage.version = sourcePackage.version;
    distPackage.description = sourcePackage.description;
    distPackage.main = 'index.js';
    distPackage.types = 'index.d.ts';
    distPackage.module = 'index.js';
    distPackage.type = 'module';
    
    // 导出配置
    distPackage.exports = {
        ".": {
            "import": "./index.js",
            "types": "./index.d.ts"
        }
    };
    
    // 文件配置
    distPackage.files = [
        'index.js',
        'index.js.map',
        'index.d.ts',
        'wasm/**/*',
        'README.md',
        'LICENSE'
    ];
    
    // 关键词
    distPackage.keywords = [
        ...sourcePackage.keywords,
        'single-file',
        'bundled',
        'minified'
    ];
    
    // 元信息
    distPackage.author = sourcePackage.author;
    distPackage.license = sourcePackage.license;
    
    // Repository信息
    distPackage.repository = {
        type: 'git',
        url: 'git+https://github.com/esengine/ecs-framework.git'
    };
    
    // 发布配置
    distPackage.publishConfig = {
        access: 'public'
    };
    
    // 引擎兼容性
    distPackage.engines = {
        node: '>=16.0.0'
    };
    
    const packagePath = path.join(config.outputDir, 'package.json');
    fs.writeFileSync(packagePath, JSON.stringify(distPackage, null, 2));
    console.log(`  ✓ 生成: ${packagePath}`);
}

/**
 * 复制必要文件
 */
async function copyEssentialFiles() {
    console.log('📁 复制必要文件...');
    
    const filesToCopy = [
        { src: '../README.md', dest: 'README.md' },
        { src: '../LICENSE', dest: 'LICENSE', optional: true }
    ];
    
    for (const file of filesToCopy) {
        const srcPath = path.resolve(file.src);
        const destPath = path.join(config.outputDir, file.dest);
        
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  ✓ 复制: ${file.dest}`);
        } else if (!file.optional) {
            console.warn(`  ⚠️  文件不存在: ${srcPath}`);
        }
    }
    
    // 复制WASM文件
    await copyWasmFiles();
}

/**
 * 复制WASM文件
 */
async function copyWasmFiles() {
    const wasmSrcDir = './bin/wasm';
    const wasmDestDir = path.join(config.outputDir, 'wasm');
    
    if (fs.existsSync(wasmSrcDir)) {
        console.log('📦 复制WASM文件...');
        
        // 创建目标目录
        if (!fs.existsSync(wasmDestDir)) {
            fs.mkdirSync(wasmDestDir, { recursive: true });
        }
        
        // 复制所有WASM相关文件
        const wasmFiles = fs.readdirSync(wasmSrcDir);
        for (const file of wasmFiles) {
            // 排除.gitignore文件
            if (file === '.gitignore') continue;
            
            const srcPath = path.join(wasmSrcDir, file);
            const destPath = path.join(wasmDestDir, file);
            
            if (fs.statSync(srcPath).isFile()) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`  ✓ 复制WASM: ${file}`);
            }
        }
    } else {
        console.warn('  ⚠️  WASM目录不存在: ' + wasmSrcDir);
    }
}

// 运行构建
if (require.main === module) {
    buildSingleFile();
}

module.exports = { buildSingleFile, config }; 