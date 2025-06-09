#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

/**
 * ECS Framework 打包脚本
 * 将bin目录中的所有文件合并成一个压缩文件
 */

const config = {
    // 输入配置
    entryPoint: './bin/index.js',
    
    // 输出配置
    outputDir: './dist',
    outputFile: 'ecs-framework.min.js',
    
    // 压缩配置
    minify: true,
    sourcemap: true,
    
    // 包含WASM文件
    includeWasm: true,
    
    // 目标环境
    target: ['es2017'],
    format: 'esm'
};

async function createBundle() {
    console.log('🚀 开始打包 ECS Framework...');
    
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
            platform: 'browser',
            
            // 外部依赖（如果有的话）
            external: [],
            
            // 定义全局变量
            define: {
                'process.env.NODE_ENV': '"production"'
            },
            
            // 处理WASM文件
            loader: {
                '.wasm': 'binary'
            },
            
            // 插件配置
            plugins: [
                {
                    name: 'wasm-loader',
                    setup(build) {
                        // 处理WASM文件导入
                        build.onLoad({ filter: /\.wasm$/ }, async (args) => {
                            const wasmBuffer = await fs.promises.readFile(args.path);
                            const base64 = wasmBuffer.toString('base64');
                            
                            return {
                                contents: `
                                    const wasmBase64 = "${base64}";
                                    const wasmBinary = Uint8Array.from(atob(wasmBase64), c => c.charCodeAt(0));
                                    export default wasmBinary;
                                `,
                                loader: 'js'
                            };
                        });
                    }
                }
            ],
            
            // 元信息
            metafile: true,
            
            // 日志级别
            logLevel: 'info'
        });

        // 显示打包结果
        if (result.metafile) {
            const analysis = await esbuild.analyzeMetafile(result.metafile);
            console.log('📊 打包分析：');
            console.log(analysis);
        }

        // 第二步：复制WASM文件到dist目录
        if (config.includeWasm) {
            console.log('📁 复制 WASM 文件...');
            await copyWasmFiles();
        }

        // 第三步：生成压缩包信息
        await generateBundleInfo();

        console.log('✅ 打包完成！');
        console.log(`📄 输出文件: ${path.join(config.outputDir, config.outputFile)}`);
        
        // 显示文件大小
        const stats = fs.statSync(path.join(config.outputDir, config.outputFile));
        console.log(`📏 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error('❌ 打包失败:', error);
        process.exit(1);
    }
}

/**
 * 复制WASM文件到dist目录
 */
async function copyWasmFiles() {
    const wasmDir = './bin/wasm';
    const distWasmDir = path.join(config.outputDir, 'wasm');
    
    if (fs.existsSync(wasmDir)) {
        if (!fs.existsSync(distWasmDir)) {
            fs.mkdirSync(distWasmDir, { recursive: true });
        }
        
        const wasmFiles = fs.readdirSync(wasmDir);
        for (const file of wasmFiles) {
            // 排除 .gitignore 文件
            if (file === '.gitignore') {
                console.log(`  ⏭️  跳过: ${file}`);
                continue;
            }
            
            const srcPath = path.join(wasmDir, file);
            const destPath = path.join(distWasmDir, file);
            
            if (fs.statSync(srcPath).isFile()) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`  ✓ 复制: ${file}`);
            }
        }
    }
}

/**
 * 生成打包信息文件
 */
async function generateBundleInfo() {
    const bundleInfo = {
        name: '@esengine/ecs-framework',
        version: require('../package.json').version,
        buildTime: new Date().toISOString(),
        files: {
            main: config.outputFile,
            sourcemap: config.outputFile + '.map',
            wasm: 'wasm/'
        },
        target: config.target,
        format: config.format,
        minified: config.minify,
        size: {
            main: fs.statSync(path.join(config.outputDir, config.outputFile)).size,
            wasm: getWasmSize()
        }
    };
    
    const infoPath = path.join(config.outputDir, 'bundle-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(bundleInfo, null, 2));
    console.log(`📋 生成打包信息: ${infoPath}`);
}

/**
 * 获取WASM文件总大小
 */
function getWasmSize() {
    const wasmDir = path.join(config.outputDir, 'wasm');
    let totalSize = 0;
    
    if (fs.existsSync(wasmDir)) {
        const files = fs.readdirSync(wasmDir);
        for (const file of files) {
            const filePath = path.join(wasmDir, file);
            if (fs.statSync(filePath).isFile()) {
                totalSize += fs.statSync(filePath).size;
            }
        }
    }
    
    return totalSize;
}

// 运行打包
if (require.main === module) {
    createBundle();
}

module.exports = { createBundle, config }; 