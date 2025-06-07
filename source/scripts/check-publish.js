#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 发布前检查...\n');

// 检查必要文件
const requiredFiles = [
    'package.json',
    'README.md',
    'LICENSE',
    'bin/index.js',
    'bin/index.d.ts'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} 存在`);
    } else {
        console.log(`❌ ${file} 不存在`);
        allFilesExist = false;
    }
});

// 检查package.json配置
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('\n📦 Package.json 检查:');
console.log(`✅ 包名: ${packageJson.name}`);
console.log(`✅ 版本: ${packageJson.version}`);
console.log(`✅ 主入口: ${packageJson.main}`);
console.log(`✅ 类型定义: ${packageJson.types}`);

// 检查bin目录
if (fs.existsSync('bin')) {
    const binFiles = fs.readdirSync('bin', { recursive: true });
    const jsFiles = binFiles.filter(f => f.endsWith('.js')).length;
    const dtsFiles = binFiles.filter(f => f.endsWith('.d.ts')).length;
    
    console.log(`\n🏗️  编译文件检查:`);
    console.log(`✅ JavaScript 文件: ${jsFiles} 个`);
    console.log(`✅ 类型定义文件: ${dtsFiles} 个`);
} else {
    console.log('\n❌ bin 目录不存在，请先运行 npm run build');
    allFilesExist = false;
}

// 检查git状态
const { execSync } = require('child_process');
try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
        console.log('\n⚠️  Git 状态检查:');
        console.log('有未提交的更改，建议先提交代码');
    } else {
        console.log('\n✅ Git 状态: 工作目录干净');
    }
} catch (e) {
    console.log('\n⚠️  无法检查git状态');
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
    console.log('🎉 所有检查通过！可以发布了');
    console.log('\n发布命令:');
    console.log('  npm run publish:patch  # 补丁版本');
    console.log('  npm run publish:minor  # 次要版本');
    console.log('  npm run publish:major  # 主要版本');
} else {
    console.log('❌ 检查失败，请修复问题后再发布');
    process.exit(1);
} 