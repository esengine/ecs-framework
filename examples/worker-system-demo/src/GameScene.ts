import { Scene } from '@esengine/ecs-framework';
import { PhysicsWorkerSystem, RenderSystem, LifetimeSystem } from './systems';
import { Position, Velocity, Physics, Renderable, Lifetime } from './components';

export class GameScene extends Scene {
    private canvas: HTMLCanvasElement;
    private physicsSystem!: PhysicsWorkerSystem;
    private renderSystem!: RenderSystem;
    private lifetimeSystem!: LifetimeSystem;

    constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas;
    }

    override initialize(): void {
        this.name = "WorkerDemoScene";

        // 创建系统
        this.physicsSystem = new PhysicsWorkerSystem(true); // 默认启用Worker
        this.renderSystem = new RenderSystem(this.canvas);
        this.lifetimeSystem = new LifetimeSystem();

        // 设置系统执行顺序
        this.physicsSystem.updateOrder = 1;
        this.lifetimeSystem.updateOrder = 2;
        this.renderSystem.updateOrder = 3;

        // 添加系统到场景
        this.addSystem(this.physicsSystem);
        this.addSystem(this.lifetimeSystem);
        this.addSystem(this.renderSystem);
    }

    override onStart(): void {
        console.log("Worker演示场景已启动");
        this.spawnInitialEntities();
    }

    override unload(): void {
        console.log("Worker演示场景已卸载");
    }

    /**
     * 生成初始实体
     */
    public spawnInitialEntities(count: number = 1000): void {
        this.clearAllEntities();

        for (let i = 0; i < count; i++) {
            this.createParticle();
        }
    }

    /**
     * 创建一个粒子实体
     */
    public createParticle(): void {
        const entity = this.createEntity(`Particle_${Date.now()}_${Math.random()}`);

        // 随机位置
        const x = Math.random() * (this.canvas.width - 20) + 10;
        const y = Math.random() * (this.canvas.height - 20) + 10;

        // 随机速度
        const dx = (Math.random() - 0.5) * 200;
        const dy = (Math.random() - 0.5) * 200;

        const mass = Math.random() * 3 + 2;
        const bounce = 0.85 + Math.random() * 0.15;
        const friction = 0.998 + Math.random() * 0.002;

        // 随机颜色和大小 - 增加更多颜色提高多样性
        const colors = [
            '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ffffff',
            '#ff8844', '#88ff44', '#4488ff', '#ff4488', '#88ff88', '#8888ff', '#ffaa44',
            '#aaff44', '#44aaff', '#ff44aa', '#aa44ff', '#44ffaa', '#cccccc'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 6 + 3;

        // 添加组件
        entity.addComponent(new Position(x, y));
        entity.addComponent(new Velocity(dx, dy));
        entity.addComponent(new Physics(mass, bounce, friction));
        entity.addComponent(new Renderable(color, size, 'circle'));
        entity.addComponent(new Lifetime(5 + Math.random() * 10)); // 5-15秒生命周期
    }

    /**
     * 生成粒子爆发效果
     */
    public spawnParticleExplosion(centerX: number, centerY: number, count: number = 50): void {
        for (let i = 0; i < count; i++) {
            const entity = this.createEntity(`Explosion_${Date.now()}_${i}`);

            // 在中心点周围随机分布
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const distance = Math.random() * 30;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            // 爆炸速度
            const speed = 100 + Math.random() * 150;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;

            const mass = 0.5 + Math.random() * 1;
            const bounce = 0.8 + Math.random() * 0.2;

            // 亮色
            const colors = ['#ffaa00', '#ff6600', '#ff0066', '#ff3300', '#ffff00'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 4 + 2;

            entity.addComponent(new Position(x, y));
            entity.addComponent(new Velocity(dx, dy));
            entity.addComponent(new Physics(mass, bounce, 0.999));
            entity.addComponent(new Renderable(color, size, 'circle'));
            entity.addComponent(new Lifetime(2 + Math.random() * 3)); // 短生命周期
        }
    }

    /**
     * 清空所有实体
     */
    public clearAllEntities(): void {
        const entities = [...this.entities.buffer]; // 复制数组避免修改原数组
        for (const entity of entities) {
            entity.destroy();
        }
    }

    /**
     * 切换Worker启用状态
     */
    public toggleWorker(): boolean {
        const workerInfo = this.physicsSystem.getWorkerInfo();
        const newWorkerEnabled = !workerInfo.enabled;

        // 重新创建物理系统
        this.removeSystem(this.physicsSystem);
        this.physicsSystem = new PhysicsWorkerSystem(newWorkerEnabled);
        this.physicsSystem.updateOrder = 1;
        this.addSystem(this.physicsSystem);

        return newWorkerEnabled;
    }

    /**
     * 更新Worker配置
     */
    public updateWorkerConfig(config: { gravity?: number; friction?: number }): void {
        if (config.gravity !== undefined || config.friction !== undefined) {
            const physicsConfig = this.physicsSystem.getPhysicsConfig();
            this.physicsSystem.updatePhysicsConfig({
                gravity: config.gravity ?? physicsConfig.gravity,
                groundFriction: config.friction ?? physicsConfig.groundFriction
            });
        }
    }

    /**
     * 获取系统信息
     */
    public getSystemInfo() {
        return {
            physics: this.physicsSystem.getWorkerInfo(),
            entityCount: this.entities.count,
            physicsConfig: this.physicsSystem.getPhysicsConfig()
        };
    }
}