#!/usr/bin/env node

/**
 * ECS框架性能基准测试入口
 * 
 * 使用方法:
 * node benchmark.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 启动ECS框架性能基准测试...\n');

try {
    // 运行性能测试
    execSync('npm run test:framework:benchmark', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, 'source')
    });
    
} catch (error) {
    console.error('❌ 性能测试失败:', error.message);
    process.exit(1);
} 