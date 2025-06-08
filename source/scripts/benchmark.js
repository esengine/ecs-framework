#!/usr/bin/env node

/**
 * ECS框架性能基准测试入口
 * 
 * 使用方法:
 * node benchmark.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 启动ECS框架性能基准测试...\n');

const sourceDir = path.join(__dirname, '..');

try {
    console.log('📦 准备构建项目...');
    
    // 构建TypeScript代码
    console.log('🔨 构建TypeScript代码...');
    execSync('npm run build', { 
        stdio: 'inherit',
        cwd: sourceDir
    });
    console.log('✅ TypeScript构建完成\n');
    
    // 运行性能测试
    console.log('🏃 运行性能基准测试...');
    execSync('node bin/Testing/Performance/benchmark.js', { 
        stdio: 'inherit',
        cwd: sourceDir
    });
    
} catch (error) {
    console.error('❌ 性能测试失败:', error.message);
    process.exit(1);
} 