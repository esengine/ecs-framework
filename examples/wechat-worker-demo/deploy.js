/**
 * 部署脚本 - 复制文件到微信小游戏项目
 * Deploy script - copy files to WeChat Mini Game project
 */
const fs = require('fs');
const path = require('path');

// 微信小游戏项目路径
const WECHAT_PROJECT = 'F:/MiniGame';

// 需要复制的文件
const filesToCopy = [
    // Worker 文件
    { src: 'workers/physics-worker.js', dest: 'workers/physics-worker.js' },
    // 注意：worker-mapping.json 不要放在 workers 目录，微信会把它当 JS 编译
    // Note: Don't put worker-mapping.json in workers dir, WeChat will try to compile it as JS
];

// ECS 框架库
const ecsFrameworkSrc = path.join(__dirname, '../../packages/core/dist/index.umd.js');
const ecsFrameworkDest = path.join(WECHAT_PROJECT, 'libs/ecs-framework.js');

// 确保目录存在
function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

console.log('Deploying to WeChat Mini Game project:', WECHAT_PROJECT);
console.log('');

// 复制 ECS 框架
ensureDir(ecsFrameworkDest);
if (fs.existsSync(ecsFrameworkSrc)) {
    fs.copyFileSync(ecsFrameworkSrc, ecsFrameworkDest);
    console.log('Copied: ecs-framework.js');
} else {
    console.warn('Warning: ECS framework not found at', ecsFrameworkSrc);
    console.warn('Please run "pnpm build" in packages/core first');
}

// 复制 Worker 文件
for (const file of filesToCopy) {
    const srcPath = path.join(__dirname, file.src);
    const destPath = path.join(WECHAT_PROJECT, file.dest);

    if (fs.existsSync(srcPath)) {
        ensureDir(destPath);
        fs.copyFileSync(srcPath, destPath);
        console.log('Copied:', file.dest);
    } else {
        console.warn('Warning: File not found:', srcPath);
    }
}

// 创建 game.js
const gameJs = `/**
 * ESEngine Worker System 微信小游戏测试
 * ESEngine Worker System WeChat Mini Game Test
 */

console.log('====================================');
console.log('ESEngine Worker 微信小游戏测试');
console.log('====================================');

// 检查 Worker API
console.log('\\n[1] 检查环境...');
console.log('wx.createWorker:', typeof wx.createWorker);

// 创建 Worker
console.log('\\n[2] 创建 Worker...');
var worker = null;

try {
    worker = wx.createWorker('workers/physics-worker.js', {
        useExperimentalWorker: true
    });
    console.log('Worker 创建成功!');
} catch (error) {
    console.error('Worker 创建失败:', error.message);
}

if (worker) {
    // 设置消息处理
    worker.onMessage(function(res) {
        console.log('\\n[4] 收到 Worker 响应!');

        if (res.error) {
            console.error('Worker 错误:', res.error);
        } else if (res.result) {
            console.log('Worker 处理成功!');
            console.log('实体数量:', res.result.length);

            // 显示前 3 个实体
            for (var i = 0; i < Math.min(3, res.result.length); i++) {
                var e = res.result[i];
                console.log('  实体 ' + e.id + ': (' + e.x.toFixed(1) + ', ' + e.y.toFixed(1) + ')');
            }

            console.log('\\n========== Worker 测试成功! ==========');
        }
    });

    // 创建测试数据
    console.log('\\n[3] 发送测试数据...');

    var entities = [];
    for (var i = 0; i < 10; i++) {
        entities.push({
            id: i + 1,
            x: Math.random() * 300 + 37,
            y: Math.random() * 400 + 100,
            dx: (Math.random() - 0.5) * 100,
            dy: (Math.random() - 0.5) * 50,
            mass: 1 + Math.random(),
            bounce: 0.8,
            friction: 0.98,
            radius: 5 + Math.random() * 5
        });
    }

    worker.postMessage({
        id: Date.now(),
        entities: entities,
        deltaTime: 0.016,
        systemConfig: {
            gravity: 200,
            canvasWidth: 375,
            canvasHeight: 667,
            groundFriction: 0.98
        }
    });

    console.log('已发送 ' + entities.length + ' 个实体');
}

// 创建 Canvas 显示
var canvas = wx.createCanvas();
var ctx = canvas.getContext('2d');

ctx.fillStyle = '#1a1a2e';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = '#ffffff';
ctx.font = '18px Arial';
ctx.textAlign = 'center';
ctx.fillText('ESEngine Worker 测试', canvas.width / 2, 50);

ctx.font = '14px Arial';
ctx.fillStyle = '#aaaaaa';
ctx.fillText('查看控制台日志', canvas.width / 2, 80);

ctx.fillStyle = worker ? '#00ff00' : '#ff0000';
ctx.fillText('Worker: ' + (worker ? '已创建' : '创建失败'), canvas.width / 2, 110);
`;

const gameJsPath = path.join(WECHAT_PROJECT, 'game.js');
fs.writeFileSync(gameJsPath, gameJs);
console.log('Created: game.js');

// 确保 game.json 配置正确
const gameJsonPath = path.join(WECHAT_PROJECT, 'game.json');
const gameJson = {
    deviceOrientation: 'portrait',
    workers: 'workers'
};
fs.writeFileSync(gameJsonPath, JSON.stringify(gameJson, null, 2));
console.log('Updated: game.json');

console.log('\\nDeploy complete!');
console.log('Open WeChat DevTools and load:', WECHAT_PROJECT);
