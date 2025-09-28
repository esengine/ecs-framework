import { Core } from '@esengine/ecs-framework';
import { GameScene } from './GameScene';

// 性能监控
interface PerformanceStats {
    fps: number;
    frameTime: number;
    physicsTime: number;
    renderTime: number;
    memoryUsage: number;
}

class WorkerDemo {
    private gameScene: GameScene;
    private canvas: HTMLCanvasElement;
    private isRunning = false;
    private lastTime = 0;
    private frameCount = 0;
    private fpsUpdateTime = 0;
    private currentFPS = 0;
    private lastWorkerStatusUpdate = 0;

    // UI元素
    private elements: { [key: string]: HTMLElement } = {};

    constructor() {
        // 获取canvas
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        // 初始化UI元素引用
        this.initializeUIElements();

        // 初始化ECS Core
        Core.create({
            debug: true,
            enableEntitySystems: true
        });

        // 创建游戏场景
        this.gameScene = new GameScene(this.canvas);

        // 设置场景
        Core.setScene(this.gameScene);

        // 绑定事件
        this.bindEvents();

        // 启动演示
        this.start();
    }

    private initializeUIElements(): void {
        const elementIds = [
            'entityCount', 'entityCountValue', 'toggleWorker',
            'gravity', 'gravityValue', 'friction', 'frictionValue', 'spawnParticles',
            'clearEntities', 'resetDemo', 'fps', 'entityCountStat', 'workerStatus', 'workerLoad',
            'physicsTime', 'renderTime', 'frameTime', 'memoryUsage'
        ];

        for (const id of elementIds) {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        }
    }

    private bindEvents(): void {
        // 实体数量滑块
        if (this.elements.entityCount && this.elements.entityCountValue) {
            const slider = this.elements.entityCount as HTMLInputElement;
            slider.addEventListener('input', () => {
                this.elements.entityCountValue.textContent = slider.value;
            });

            slider.addEventListener('change', () => {
                const count = parseInt(slider.value);
                this.gameScene.spawnInitialEntities(count);
            });
        }

        // Worker切换按钮
        if (this.elements.toggleWorker) {
            this.elements.toggleWorker.addEventListener('click', () => {
                const workerEnabled = this.gameScene.toggleWorker();
                this.elements.toggleWorker.textContent = workerEnabled ? '禁用 Worker' : '启用 Worker';
                this.updateWorkerStatus();
            });
        }


        // 重力滑块
        if (this.elements.gravity && this.elements.gravityValue) {
            const slider = this.elements.gravity as HTMLInputElement;
            slider.addEventListener('input', () => {
                this.elements.gravityValue.textContent = slider.value;
            });

            slider.addEventListener('change', () => {
                const gravity = parseInt(slider.value);
                this.gameScene.updateWorkerConfig({ gravity });
            });
        }

        // 摩擦力滑块
        if (this.elements.friction && this.elements.frictionValue) {
            const slider = this.elements.friction as HTMLInputElement;
            slider.addEventListener('input', () => {
                const value = parseInt(slider.value);
                this.elements.frictionValue.textContent = `${value}%`;
            });

            slider.addEventListener('change', () => {
                const friction = parseInt(slider.value) / 100;
                this.gameScene.updateWorkerConfig({ friction });
            });
        }

        // 生成粒子按钮
        if (this.elements.spawnParticles) {
            this.elements.spawnParticles.addEventListener('click', () => {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                this.gameScene.spawnParticleExplosion(centerX, centerY, 100);
            });
        }

        // 清空实体按钮
        if (this.elements.clearEntities) {
            this.elements.clearEntities.addEventListener('click', () => {
                this.gameScene.clearAllEntities();
            });
        }

        // 重置演示按钮
        if (this.elements.resetDemo) {
            this.elements.resetDemo.addEventListener('click', () => {
                this.resetDemo();
            });
        }

        // Canvas点击事件 - 在点击位置生成粒子爆发
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.gameScene.spawnParticleExplosion(x, y, 30);
        });
    }

    private start(): void {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        console.log('Worker演示已启动');
    }

    private gameLoop = (): void => {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
        this.lastTime = currentTime;

        // 更新ECS框架
        const frameStartTime = performance.now();
        Core.update(deltaTime);
        const frameEndTime = performance.now();

        // 更新性能统计
        this.updatePerformanceStats({
            fps: this.currentFPS,
            frameTime: frameEndTime - frameStartTime,
            physicsTime: (window as any).physicsExecutionTime || 0,
            renderTime: (window as any).renderExecutionTime || 0,
            memoryUsage: this.getMemoryUsage()
        });

        // 更新FPS计算
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        // 更新UI
        this.updateUI();

        // 继续循环
        requestAnimationFrame(this.gameLoop);
    };

    private updatePerformanceStats(stats: PerformanceStats): void {
        if (this.elements.fps) {
            this.elements.fps.textContent = stats.fps.toString();
            this.elements.fps.className = stats.fps >= 55 ? 'performance-high' :
                                         stats.fps >= 30 ? 'performance-medium' : 'performance-low';
        }

        if (this.elements.frameTime) {
            this.elements.frameTime.textContent = stats.frameTime.toFixed(2);
            this.elements.frameTime.className = stats.frameTime <= 16 ? 'performance-high' :
                                               stats.frameTime <= 33 ? 'performance-medium' : 'performance-low';
        }

        if (this.elements.physicsTime) {
            this.elements.physicsTime.textContent = stats.physicsTime.toFixed(2);
            this.elements.physicsTime.className = stats.physicsTime <= 8 ? 'performance-high' :
                                                 stats.physicsTime <= 16 ? 'performance-medium' : 'performance-low';
        }

        if (this.elements.renderTime) {
            this.elements.renderTime.textContent = stats.renderTime.toFixed(2);
            this.elements.renderTime.className = stats.renderTime <= 8 ? 'performance-high' :
                                                stats.renderTime <= 16 ? 'performance-medium' : 'performance-low';
        }

        if (this.elements.memoryUsage) {
            this.elements.memoryUsage.textContent = stats.memoryUsage.toFixed(1);
        }
    }

    private updateUI(): void {
        const currentTime = performance.now();
        const systemInfo = this.gameScene.getSystemInfo();

        // 更新实体数量（每帧更新）
        if (this.elements.entityCountStat) {
            this.elements.entityCountStat.textContent = systemInfo.entityCount.toString();
        }

        // 更新Worker状态（每500ms更新一次即可）
        if (currentTime - this.lastWorkerStatusUpdate >= 500) {
            this.updateWorkerStatus();
            this.lastWorkerStatusUpdate = currentTime;
        }

        // 更新全局Worker信息供其他系统使用
        (window as any).workerInfo = systemInfo.physics;
    }

    private updateWorkerStatus(): void {
        const systemInfo = this.gameScene.getSystemInfo();
        const workerInfo = systemInfo.physics;
        const entityCount = systemInfo.entityCount;

        if (this.elements.workerStatus) {
            if (workerInfo.enabled) {
                this.elements.workerStatus.textContent = `启用 (${workerInfo.workerCount} Workers)`;
                this.elements.workerStatus.className = 'worker-enabled';
            } else {
                this.elements.workerStatus.textContent = '禁用';
                this.elements.workerStatus.className = 'worker-disabled';
            }
        }

        if (this.elements.workerLoad) {
            if (workerInfo.enabled && entityCount > 0) {
                const entitiesPerWorker = Math.ceil(entityCount / workerInfo.workerCount);
                this.elements.workerLoad.textContent = `${entitiesPerWorker}/Worker (共${workerInfo.workerCount}个)`;
            } else {
                this.elements.workerLoad.textContent = 'N/A';
            }
        }
    }

    private getMemoryUsage(): number {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            return memory.usedJSHeapSize / (1024 * 1024); // MB
        }
        return 0;
    }

    private resetDemo(): void {
        // 重置所有控件到默认值
        if (this.elements.entityCount) {
            (this.elements.entityCount as HTMLInputElement).value = '1000';
            this.elements.entityCountValue.textContent = '1000';
        }


        if (this.elements.gravity) {
            (this.elements.gravity as HTMLInputElement).value = '100';
            this.elements.gravityValue.textContent = '100';
        }

        if (this.elements.friction) {
            (this.elements.friction as HTMLInputElement).value = '95';
            this.elements.frictionValue.textContent = '95%';
        }

        // 确保Worker被启用
        const workerInfo = this.gameScene.getSystemInfo().physics;
        if (!workerInfo.enabled) {
            this.gameScene.toggleWorker(); // 只有在禁用时才切换
        }
        if (this.elements.toggleWorker) {
            this.elements.toggleWorker.textContent = '禁用 Worker';
        }

        // 重新生成实体
        this.gameScene.spawnInitialEntities(1000);

        // 重置配置
        this.gameScene.updateWorkerConfig({
            gravity: 100,
            friction: 0.95
        });

        console.log('演示已重置');
    }

    public stop(): void {
        this.isRunning = false;
    }
}

// 启动演示
document.addEventListener('DOMContentLoaded', () => {
    try {
        new WorkerDemo();
    } catch (error) {
        console.error('启动演示失败:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h1>启动失败</h1>
                <p>错误: ${error}</p>
                <p>请确保浏览器支持Web Workers和Canvas API</p>
            </div>
        `;
    }
});