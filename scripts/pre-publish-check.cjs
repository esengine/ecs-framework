const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('发布前检查...');

async function main() {
    try {
        // 1. 检查所有包的package.json是否存在
        console.log('\n检查包结构...');
        const packagesDir = path.join(__dirname, '..', 'packages');
        const packages = fs.readdirSync(packagesDir);
        
        for (const pkg of packages) {
            const pkgPath = path.join(packagesDir, pkg);
            const packageJsonPath = path.join(pkgPath, 'package.json');
            
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error(`包 ${pkg} 缺少 package.json`);
            }
            
            console.log(`  [OK] ${pkg}: package.json 存在`);
        }

        // 2. 检查构建输出是否存在
        console.log('\n检查构建输出...');
        for (const pkg of packages) {
            const pkgPath = path.join(packagesDir, pkg);
            const binPath = path.join(pkgPath, 'bin');
            
            if (!fs.existsSync(binPath)) {
                throw new Error(`包 ${pkg} 缺少构建输出 (bin目录不存在)`);
            }
            
            const indexPath = path.join(binPath, 'index.js');
            if (!fs.existsSync(indexPath)) {
                throw new Error(`包 ${pkg} 缺少入口文件 (bin/index.js 不存在)`);
            }
            
            console.log(`  [OK] ${pkg}: 构建输出存在`);
        }

        // 3. 检查版本依赖一致性
        console.log('\n检查依赖版本...');
        const corePackageJson = JSON.parse(fs.readFileSync(
            path.join(packagesDir, 'core', 'package.json'), 
            'utf8'
        ));
        const networkPackageJson = JSON.parse(fs.readFileSync(
            path.join(packagesDir, 'network', 'package.json'),
            'utf8'
        ));

        const coreVersion = corePackageJson.version;
        const networkPeerDep = networkPackageJson.peerDependencies['@esengine/esengine'];
        
        console.log(`  Core版本: ${coreVersion}`);
        console.log(`  Network依赖: ${networkPeerDep}`);
        
        // 检查network的peerDependencies是否兼容core的当前版本
        const semver = require('semver');
        if (!semver.satisfies(coreVersion, networkPeerDep)) {
            console.warn(`  [WARN] 版本可能不兼容，但继续检查...`);
        } else {
            console.log(`  [OK] 版本兼容性检查通过`);
        }

        // 4. 检查Git状态
        console.log('\n检查Git状态...');
        try {
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            if (gitStatus.trim()) {
                console.warn('  [WARN] 工作目录有未提交的更改:');
                console.warn(gitStatus);
            } else {
                console.log('  [OK] 工作目录干净');
            }
        } catch (error) {
            console.warn('  [WARN] 无法检查Git状态');
        }

        // 5. 运行测试
        console.log('\n运行测试...');
        try {
            execSync('npm test', { stdio: 'inherit', cwd: path.join(packagesDir, 'core') });
            console.log('  [OK] Core包测试通过');
        } catch (error) {
            console.warn('  [WARN] Core包测试失败，请检查');
        }

        try {
            execSync('npm test', { stdio: 'inherit', cwd: path.join(packagesDir, 'network') });
            console.log('  [OK] Network包测试通过');
        } catch (error) {
            console.warn('  [WARN] Network包测试失败，请检查');
        }

        console.log('\n发布前检查完成！');
        console.log('\n可以运行以下命令进行发布:');
        console.log('npm run publish:all');

    } catch (error) {
        console.error('\n发布前检查失败:', error.message);
        process.exit(1);
    }
}

main().catch(console.error);