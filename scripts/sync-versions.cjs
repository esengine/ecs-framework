const fs = require('fs');
const path = require('path');

console.log('同步包版本...');

function updateNetworkPeerDependency() {
    try {
        // 读取core包版本
        const corePackageJsonPath = path.join(__dirname, '..', 'packages', 'core', 'package.json');
        const corePackageJson = JSON.parse(fs.readFileSync(corePackageJsonPath, 'utf8'));
        const coreVersion = corePackageJson.version;
        
        console.log(`Core版本: ${coreVersion}`);
        
        // 更新network包的peerDependencies
        const networkPackageJsonPath = path.join(__dirname, '..', 'packages', 'network', 'package.json');
        const networkPackageJson = JSON.parse(fs.readFileSync(networkPackageJsonPath, 'utf8'));
        
        const oldPeerDep = networkPackageJson.peerDependencies['@esengine/ecs-framework'];
        networkPackageJson.peerDependencies['@esengine/ecs-framework'] = `>=${coreVersion}`;
        
        fs.writeFileSync(networkPackageJsonPath, JSON.stringify(networkPackageJson, null, 2) + '\n');
        
        console.log(`Network peerDependencies更新: ${oldPeerDep} -> >=${coreVersion}`);
        console.log('版本同步完成！');
        
    } catch (error) {
        console.error('版本同步失败:', error.message);
        process.exit(1);
    }
}

updateNetworkPeerDependency();