#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * ECS Framework 压缩脚本
 * 将bin目录压缩成ZIP文件
 */

const config = {
    sourceDir: './bin',
    outputDir: './dist',
    outputFile: 'ecs-framework-bin.zip',
    compressionLevel: 9, // 最高压缩级别
    includeSourceMaps: false // 是否包含source map文件
};

async function createCompressedArchive() {
    console.log('🗜️  开始压缩 bin 目录...');
    
    try {
        // 确保输出目录存在
        if (!fs.existsSync(config.outputDir)) {
            fs.mkdirSync(config.outputDir, { recursive: true });
        }

        const outputPath = path.join(config.outputDir, config.outputFile);
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: config.compressionLevel }
        });

        // 监听事件
        output.on('close', () => {
            const sizeKB = (archive.pointer() / 1024).toFixed(2);
            console.log('✅ 压缩完成！');
            console.log(`📄 输出文件: ${outputPath}`);
            console.log(`📏 压缩后大小: ${sizeKB} KB`);
            console.log(`📊 压缩了 ${archive.pointer()} 字节`);
            
            // 生成压缩信息
            generateCompressionInfo(outputPath, archive.pointer());
        });

        output.on('end', () => {
            console.log('数据已全部写入');
        });

        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('⚠️  警告:', err);
            } else {
                throw err;
            }
        });

        archive.on('error', (err) => {
            throw err;
        });

        // 连接输出流
        archive.pipe(output);

        // 添加bin目录中的所有文件
        console.log('📁 添加文件到压缩包...');
        
        // 递归添加目录
        archive.directory(config.sourceDir, false, (entry) => {
            // 过滤文件
            if (!config.includeSourceMaps && entry.name.endsWith('.map')) {
                console.log(`  ⏭️  跳过: ${entry.name}`);
                return false;
            }
            
            // 排除 .gitignore 文件
            if (entry.name === '.gitignore' || entry.name.endsWith('/.gitignore')) {
                console.log(`  ⏭️  跳过: ${entry.name}`);
                return false;
            }
            
            console.log(`  ✓ 添加: ${entry.name}`);
            return entry;
        });

        // 完成压缩
        await archive.finalize();

    } catch (error) {
        console.error('❌ 压缩失败:', error);
        process.exit(1);
    }
}

/**
 * 生成压缩信息文件
 */
function generateCompressionInfo(outputPath, compressedSize) {
    const originalSize = getDirectorySize(config.sourceDir);
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    
    const compressionInfo = {
        name: '@esengine/ecs-framework',
        version: require('../package.json').version,
        compressionTime: new Date().toISOString(),
        files: {
            archive: config.outputFile
        },
        size: {
            original: originalSize,
            compressed: compressedSize,
            ratio: `${compressionRatio}%`
        },
        settings: {
            compressionLevel: config.compressionLevel,
            includeSourceMaps: config.includeSourceMaps
        }
    };
    
    const infoPath = path.join(config.outputDir, 'compression-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(compressionInfo, null, 2));
    console.log(`📋 生成压缩信息: ${infoPath}`);
    console.log(`📈 压缩率: ${compressionRatio}%`);
}

/**
 * 获取目录总大小
 */
function getDirectorySize(dirPath) {
    let totalSize = 0;
    
    function calculateSize(currentPath) {
        const stats = fs.statSync(currentPath);
        
        if (stats.isDirectory()) {
            const files = fs.readdirSync(currentPath);
            for (const file of files) {
                calculateSize(path.join(currentPath, file));
            }
        } else {
            // 过滤source map文件
            if (!config.includeSourceMaps && currentPath.endsWith('.map')) {
                return;
            }
            
            // 排除 .gitignore 文件
            if (currentPath.endsWith('.gitignore')) {
                return;
            }
            
            totalSize += stats.size;
        }
    }
    
    calculateSize(dirPath);
    return totalSize;
}

// 运行压缩
if (require.main === module) {
    createCompressedArchive();
}

module.exports = { createCompressedArchive, config }; 