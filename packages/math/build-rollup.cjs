const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('开始构建 @esengine/ecs-framework-math...');

try {
  // 检查bin目录是否存在
  if (!fs.existsSync('bin')) {
    console.error('错误: bin目录不存在，请先运行 npm run build');
    process.exit(1);
  }

  // 创建dist目录
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  // 运行rollup构建
  execSync('npx rollup -c rollup.config.cjs', { stdio: 'inherit' });

  // 复制package.json到dist
  const pkg = require('./package.json');
  const distPkg = {
    ...pkg,
    main: 'index.cjs.js',
    module: 'index.esm.js',
    types: 'index.d.ts',
    scripts: undefined,
    devDependencies: undefined
  };

  fs.writeFileSync(
    path.join('dist', 'package.json'),
    JSON.stringify(distPkg, null, 2)
  );

  // 复制README（如果存在）
  if (fs.existsSync('README.md')) {
    fs.copyFileSync('README.md', path.join('dist', 'README.md'));
  }

  console.log('✓ @esengine/ecs-framework-math 构建完成');

} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
}