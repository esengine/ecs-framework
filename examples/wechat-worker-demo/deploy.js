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

// 创建 game.js - 完整物理球可视化演示
// Create game.js - Full physics ball visualization demo
const gameJs = `/**
 * ESEngine Worker System 微信小游戏物理演示
 * ESEngine Worker System WeChat Mini Game Physics Demo
 *
 * 演示 Worker 线程处理物理计算，主线程渲染
 * Demonstrates Worker thread physics + main thread rendering
 */

// ============ 配置 | Configuration ============
var CONFIG = {
    BALL_COUNT: 20,           // 球数量 | Number of balls
    GRAVITY: 400,             // 重力 | Gravity
    GROUND_FRICTION: 0.98,    // 地面摩擦 | Ground friction
    BALL_BOUNCE: 0.85,        // 弹性系数 | Bounce factor
    MIN_RADIUS: 8,            // 最小半径 | Min radius
    MAX_RADIUS: 20,           // 最大半径 | Max radius
    COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
};

// ============ 全局状态 | Global State ============
var canvas = wx.createCanvas();
var ctx = canvas.getContext('2d');
var worker = null;
var entities = [];
var lastTime = Date.now();
var frameCount = 0;
var fps = 0;
var workerReady = false;
var pendingRequest = false;

console.log('====================================');
console.log('ESEngine Worker 物理演示');
console.log('Canvas:', canvas.width, 'x', canvas.height);
console.log('====================================');

// ============ 初始化实体 | Initialize Entities ============
function initEntities() {
    entities = [];
    for (var i = 0; i < CONFIG.BALL_COUNT; i++) {
        var radius = CONFIG.MIN_RADIUS + Math.random() * (CONFIG.MAX_RADIUS - CONFIG.MIN_RADIUS);
        entities.push({
            id: i + 1,
            x: radius + Math.random() * (canvas.width - radius * 2),
            y: radius + Math.random() * (canvas.height * 0.5),  // 上半部分生成
            dx: (Math.random() - 0.5) * 200,
            dy: Math.random() * 100,
            mass: radius * 0.1,
            bounce: CONFIG.BALL_BOUNCE,
            friction: CONFIG.GROUND_FRICTION,
            radius: radius,
            color: CONFIG.COLORS[i % CONFIG.COLORS.length]
        });
    }
    console.log('Created', entities.length, 'balls');
}

// ============ 创建 Worker | Create Worker ============
function createWorker() {
    try {
        worker = wx.createWorker('workers/physics-worker.js', {
            useExperimentalWorker: true
        });

        worker.onMessage(function(res) {
            pendingRequest = false;

            if (res.error) {
                console.error('Worker error:', res.error);
                return;
            }

            if (res.result && Array.isArray(res.result)) {
                // 更新实体位置（保留颜色等渲染属性）
                // Update entity positions (keep rendering properties like color)
                for (var i = 0; i < res.result.length; i++) {
                    var updated = res.result[i];
                    var entity = entities[i];
                    if (entity && updated) {
                        entity.x = updated.x;
                        entity.y = updated.y;
                        entity.dx = updated.dx;
                        entity.dy = updated.dy;
                    }
                }
            }
        });

        workerReady = true;
        console.log('Worker created successfully!');
    } catch (error) {
        console.error('Worker creation failed:', error.message);
        workerReady = false;
    }
}

// ============ 发送物理更新到 Worker | Send Physics Update to Worker ============
function sendToWorker(deltaTime) {
    if (!worker || !workerReady || pendingRequest) return;

    // 准备发送数据（只发送物理相关属性）
    // Prepare data (only physics-related properties)
    var physicsData = [];
    for (var i = 0; i < entities.length; i++) {
        var e = entities[i];
        physicsData.push({
            id: e.id,
            x: e.x,
            y: e.y,
            dx: e.dx,
            dy: e.dy,
            mass: e.mass,
            bounce: e.bounce,
            friction: e.friction,
            radius: e.radius
        });
    }

    pendingRequest = true;
    worker.postMessage({
        id: Date.now(),
        entities: physicsData,
        deltaTime: deltaTime,
        systemConfig: {
            gravity: CONFIG.GRAVITY,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            groundFriction: CONFIG.GROUND_FRICTION
        }
    });
}

// ============ 渲染 | Render ============
function render() {
    // 清屏 - 深色背景
    // Clear screen - dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制地面
    // Draw ground
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    // 绘制所有球
    // Draw all balls
    for (var i = 0; i < entities.length; i++) {
        var e = entities[i];

        // 球体渐变效果
        // Ball gradient effect
        var gradient = ctx.createRadialGradient(
            e.x - e.radius * 0.3, e.y - e.radius * 0.3, 0,
            e.x, e.y, e.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, e.color);
        gradient.addColorStop(1, shadeColor(e.color, -30));

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 球体边框
        // Ball border
        ctx.strokeStyle = shadeColor(e.color, -50);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 绘制 UI
    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ESEngine Worker Physics Demo', 10, 25);
    ctx.fillText('FPS: ' + fps + ' | Balls: ' + entities.length, 10, 45);
    ctx.fillText('Worker: ' + (workerReady ? 'Active' : 'Failed'), 10, 65);

    // 提示文字
    // Hint text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    ctx.font = '12px Arial';
    ctx.fillText('Physics calculated in Worker thread', canvas.width / 2, canvas.height - 20);
}

// 颜色加深/减淡工具函数
// Color shade utility function
function shadeColor(color, percent) {
    var num = parseInt(color.replace('#', ''), 16);
    var amt = Math.round(2.55 * percent);
    var R = (num >> 16) + amt;
    var G = (num >> 8 & 0x00FF) + amt;
    var B = (num & 0x0000FF) + amt;
    R = Math.max(0, Math.min(255, R));
    G = Math.max(0, Math.min(255, G));
    B = Math.max(0, Math.min(255, B));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ============ 游戏循环 | Game Loop ============
function gameLoop() {
    var now = Date.now();
    var deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    // 限制 deltaTime 防止跳帧
    // Clamp deltaTime to prevent frame skip
    if (deltaTime > 0.1) deltaTime = 0.1;

    // FPS 计算
    // FPS calculation
    frameCount++;
    if (frameCount >= 30) {
        fps = Math.round(30 / ((now - (lastTime - deltaTime * 1000 * 30)) / 1000));
        frameCount = 0;
    }

    // 发送物理计算到 Worker
    // Send physics calculation to Worker
    sendToWorker(deltaTime);

    // 渲染
    // Render
    render();

    // 下一帧
    // Next frame
    requestAnimationFrame(gameLoop);
}

// ============ 启动 | Start ============
initEntities();
createWorker();

// 简单的 FPS 计算变量
var fpsLastTime = Date.now();
var fpsFrameCount = 0;

// 覆盖 FPS 计算逻辑
setInterval(function() {
    var now = Date.now();
    fps = Math.round(fpsFrameCount * 1000 / (now - fpsLastTime));
    fpsLastTime = now;
    fpsFrameCount = 0;
}, 1000);

// 修改 gameLoop 中的帧计数
var originalGameLoop = gameLoop;
gameLoop = function() {
    fpsFrameCount++;

    var now = Date.now();
    var deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    if (deltaTime > 0.1) deltaTime = 0.1;

    sendToWorker(deltaTime);
    render();
    requestAnimationFrame(gameLoop);
};

// 开始游戏循环
// Start game loop
console.log('Starting game loop...');
requestAnimationFrame(gameLoop);

// 触摸重置
// Touch to reset
wx.onTouchStart(function(e) {
    console.log('Touch detected - resetting balls');
    initEntities();
});
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
