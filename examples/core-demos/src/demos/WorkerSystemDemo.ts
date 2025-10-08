import { DemoBase, DemoInfo } from './DemoBase';
import { Component, ECSComponent, WorkerEntitySystem, EntitySystem, Matcher, Entity, ECSSystem, PlatformManager, Time } from '@esengine/ecs-framework';
import { BrowserAdapter } from '../platform/BrowserAdapter';

// ============ 组件定义 ============

@ECSComponent('WorkerDemo_Position')
class Position extends Component {
    x: number = 0;
    y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }

    set(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('WorkerDemo_Velocity')
class Velocity extends Component {
    dx: number = 0;
    dy: number = 0;

    constructor(dx: number = 0, dy: number = 0) {
        super();
        this.dx = dx;
        this.dy = dy;
    }

    set(dx: number, dy: number): void {
        this.dx = dx;
        this.dy = dy;
    }
}

@ECSComponent('WorkerDemo_Physics')
class Physics extends Component {
    mass: number = 1;
    bounce: number = 0.8;
    friction: number = 0.95;

    constructor(mass: number = 1, bounce: number = 0.8, friction: number = 0.95) {
        super();
        this.mass = mass;
        this.bounce = bounce;
        this.friction = friction;
    }
}

@ECSComponent('WorkerDemo_Renderable')
class Renderable extends Component {
    color: string = '#ffffff';
    size: number = 5;
    shape: 'circle' | 'square' = 'circle';

    constructor(color: string = '#ffffff', size: number = 5, shape: 'circle' | 'square' = 'circle') {
        super();
        this.color = color;
        this.size = size;
        this.shape = shape;
    }
}

@ECSComponent('WorkerDemo_Lifetime')
class Lifetime extends Component {
    maxAge: number = 5;
    currentAge: number = 0;

    constructor(maxAge: number = 5) {
        super();
        this.maxAge = maxAge;
        this.currentAge = 0;
    }

    isDead(): boolean {
        return this.currentAge >= this.maxAge;
    }
}

// ============ 系统定义 ============

interface PhysicsEntityData {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    mass: number;
    bounce: number;
    friction: number;
    radius: number;
}

interface PhysicsConfig {
    gravity: number;
    canvasWidth: number;
    canvasHeight: number;
    groundFriction: number;
}

@ECSSystem('PhysicsWorkerSystem')
class PhysicsWorkerSystem extends WorkerEntitySystem<PhysicsEntityData> {
    private physicsConfig: PhysicsConfig;

    constructor(enableWorker: boolean, canvasWidth: number, canvasHeight: number) {
        const defaultConfig = {
            gravity: 100,
            canvasWidth,
            canvasHeight,
            groundFriction: 0.98
        };

        const isSharedArrayBufferAvailable = typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;

        super(
            Matcher.empty().all(Position, Velocity, Physics),
            {
                enableWorker,
                workerCount: isSharedArrayBufferAvailable ? (navigator.hardwareConcurrency || 2) : 1,
                systemConfig: defaultConfig,
                useSharedArrayBuffer: true
            }
        );

        this.physicsConfig = defaultConfig;
    }

    protected extractEntityData(entity: Entity): PhysicsEntityData {
        const position = entity.getComponent(Position)!;
        const velocity = entity.getComponent(Velocity)!;
        const physics = entity.getComponent(Physics)!;
        const renderable = entity.getComponent(Renderable)!;

        return {
            id: entity.id,
            x: position.x,
            y: position.y,
            dx: velocity.dx,
            dy: velocity.dy,
            mass: physics.mass,
            bounce: physics.bounce,
            friction: physics.friction,
            radius: renderable.size
        };
    }

    protected workerProcess(
        entities: PhysicsEntityData[],
        deltaTime: number,
        systemConfig?: PhysicsConfig
    ): PhysicsEntityData[] {
        const config = systemConfig || this.physicsConfig;
        const result = entities.map(e => ({ ...e }));

        for (let i = 0; i < result.length; i++) {
            const entity = result[i];

            entity.dy += config.gravity * deltaTime;
            entity.x += entity.dx * deltaTime;
            entity.y += entity.dy * deltaTime;

            if (entity.x <= entity.radius) {
                entity.x = entity.radius;
                entity.dx = -entity.dx * entity.bounce;
            } else if (entity.x >= config.canvasWidth - entity.radius) {
                entity.x = config.canvasWidth - entity.radius;
                entity.dx = -entity.dx * entity.bounce;
            }

            if (entity.y <= entity.radius) {
                entity.y = entity.radius;
                entity.dy = -entity.dy * entity.bounce;
            } else if (entity.y >= config.canvasHeight - entity.radius) {
                entity.y = config.canvasHeight - entity.radius;
                entity.dy = -entity.dy * entity.bounce;
                entity.dx *= config.groundFriction;
            }

            entity.dx *= entity.friction;
            entity.dy *= entity.friction;
        }

        for (let i = 0; i < result.length; i++) {
            for (let j = i + 1; j < result.length; j++) {
                const ball1 = result[i];
                const ball2 = result[j];

                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = ball1.radius + ball2.radius;

                if (distance < minDistance && distance > 0) {
                    const nx = dx / distance;
                    const ny = dy / distance;

                    const overlap = minDistance - distance;
                    const separationX = nx * overlap * 0.5;
                    const separationY = ny * overlap * 0.5;

                    ball1.x -= separationX;
                    ball1.y -= separationY;
                    ball2.x += separationX;
                    ball2.y += separationY;

                    const relativeVelocityX = ball2.dx - ball1.dx;
                    const relativeVelocityY = ball2.dy - ball1.dy;
                    const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

                    if (velocityAlongNormal > 0) continue;

                    const restitution = (ball1.bounce + ball2.bounce) * 0.5;
                    const impulseScalar = -(1 + restitution) * velocityAlongNormal / (1/ball1.mass + 1/ball2.mass);

                    const impulseX = impulseScalar * nx;
                    const impulseY = impulseScalar * ny;

                    ball1.dx -= impulseX / ball1.mass;
                    ball1.dy -= impulseY / ball1.mass;
                    ball2.dx += impulseX / ball2.mass;
                    ball2.dy += impulseY / ball2.mass;

                    const energyLoss = 0.98;
                    ball1.dx *= energyLoss;
                    ball1.dy *= energyLoss;
                    ball2.dx *= energyLoss;
                    ball2.dy *= energyLoss;
                }
            }
        }

        return result;
    }

    protected applyResult(entity: Entity, result: PhysicsEntityData): void {
        if (!entity || !entity.enabled) return;

        const position = entity.getComponent(Position);
        const velocity = entity.getComponent(Velocity);

        if (!position || !velocity) return;

        position.set(result.x, result.y);
        velocity.set(result.dx, result.dy);
    }

    public updatePhysicsConfig(newConfig: Partial<PhysicsConfig>): void {
        Object.assign(this.physicsConfig, newConfig);
        this.updateConfig({ systemConfig: this.physicsConfig });
    }

    public getPhysicsConfig(): PhysicsConfig {
        return { ...this.physicsConfig };
    }

    protected getDefaultEntityDataSize(): number {
        return 9;
    }

    protected writeEntityToBuffer(entityData: PhysicsEntityData, offset: number): void {
        const sharedArray = (this as any).sharedFloatArray as Float32Array;
        if (!sharedArray) return;

        // 在第一个位置存储当前实体数量
        const currentEntityCount = Math.floor(offset / 9) + 1;
        sharedArray[0] = currentEntityCount;

        // 数据从索引9开始存储（第一个9个位置用作元数据区域）
        const dataOffset = offset + 9;
        sharedArray[dataOffset + 0] = entityData.id;
        sharedArray[dataOffset + 1] = entityData.x;
        sharedArray[dataOffset + 2] = entityData.y;
        sharedArray[dataOffset + 3] = entityData.dx;
        sharedArray[dataOffset + 4] = entityData.dy;
        sharedArray[dataOffset + 5] = entityData.mass;
        sharedArray[dataOffset + 6] = entityData.bounce;
        sharedArray[dataOffset + 7] = entityData.friction;
        sharedArray[dataOffset + 8] = entityData.radius;
    }

    protected readEntityFromBuffer(offset: number): PhysicsEntityData | null {
        const sharedArray = (this as any).sharedFloatArray as Float32Array;
        if (!sharedArray) return null;

        // 数据从索引9开始存储
        const dataOffset = offset + 9;
        return {
            id: sharedArray[dataOffset + 0],
            x: sharedArray[dataOffset + 1],
            y: sharedArray[dataOffset + 2],
            dx: sharedArray[dataOffset + 3],
            dy: sharedArray[dataOffset + 4],
            mass: sharedArray[dataOffset + 5],
            bounce: sharedArray[dataOffset + 6],
            friction: sharedArray[dataOffset + 7],
            radius: sharedArray[dataOffset + 8]
        };
    }

    protected getSharedArrayBufferProcessFunction(): any {
        return function(sharedFloatArray: Float32Array, startIndex: number, endIndex: number, deltaTime: number, systemConfig?: any) {
            const config = systemConfig || {
                gravity: 100,
                canvasWidth: 800,
                canvasHeight: 600,
                groundFriction: 0.98
            };

            const actualEntityCount = sharedFloatArray[0];

            // 基础物理更新
            for (let i = startIndex; i < endIndex && i < actualEntityCount; i++) {
                const offset = i * 9 + 9;

                const id = sharedFloatArray[offset + 0];
                if (id === 0) continue;

                let x = sharedFloatArray[offset + 1];
                let y = sharedFloatArray[offset + 2];
                let dx = sharedFloatArray[offset + 3];
                let dy = sharedFloatArray[offset + 4];
                const bounce = sharedFloatArray[offset + 6];
                const friction = sharedFloatArray[offset + 7];
                const radius = sharedFloatArray[offset + 8];

                // 应用重力
                dy += config.gravity * deltaTime;

                // 更新位置
                x += dx * deltaTime;
                y += dy * deltaTime;

                // 边界碰撞
                if (x <= radius) {
                    x = radius;
                    dx = -dx * bounce;
                } else if (x >= config.canvasWidth - radius) {
                    x = config.canvasWidth - radius;
                    dx = -dx * bounce;
                }

                if (y <= radius) {
                    y = radius;
                    dy = -dy * bounce;
                } else if (y >= config.canvasHeight - radius) {
                    y = config.canvasHeight - radius;
                    dy = -dy * bounce;
                    dx *= config.groundFriction;
                }

                // 空气阻力
                dx *= friction;
                dy *= friction;

                // 写回数据
                sharedFloatArray[offset + 1] = x;
                sharedFloatArray[offset + 2] = y;
                sharedFloatArray[offset + 3] = dx;
                sharedFloatArray[offset + 4] = dy;
            }

            // 碰撞检测
            for (let i = startIndex; i < endIndex && i < actualEntityCount; i++) {
                const offset1 = i * 9 + 9;
                const id1 = sharedFloatArray[offset1 + 0];
                if (id1 === 0) continue;

                let x1 = sharedFloatArray[offset1 + 1];
                let y1 = sharedFloatArray[offset1 + 2];
                let dx1 = sharedFloatArray[offset1 + 3];
                let dy1 = sharedFloatArray[offset1 + 4];
                const mass1 = sharedFloatArray[offset1 + 5];
                const bounce1 = sharedFloatArray[offset1 + 6];
                const radius1 = sharedFloatArray[offset1 + 8];

                for (let j = 0; j < actualEntityCount; j++) {
                    if (i === j) continue;

                    const offset2 = j * 9 + 9;
                    const id2 = sharedFloatArray[offset2 + 0];
                    if (id2 === 0) continue;

                    const x2 = sharedFloatArray[offset2 + 1];
                    const y2 = sharedFloatArray[offset2 + 2];
                    const dx2 = sharedFloatArray[offset2 + 3];
                    const dy2 = sharedFloatArray[offset2 + 4];
                    const mass2 = sharedFloatArray[offset2 + 5];
                    const bounce2 = sharedFloatArray[offset2 + 6];
                    const radius2 = sharedFloatArray[offset2 + 8];

                    if (isNaN(x2) || isNaN(y2) || isNaN(radius2) || radius2 <= 0) continue;

                    const deltaX = x2 - x1;
                    const deltaY = y2 - y1;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    const minDistance = radius1 + radius2;

                    if (distance < minDistance && distance > 0) {
                        const nx = deltaX / distance;
                        const ny = deltaY / distance;

                        const overlap = minDistance - distance;
                        const separationX = nx * overlap * 0.5;
                        const separationY = ny * overlap * 0.5;

                        x1 -= separationX;
                        y1 -= separationY;

                        const relativeVelocityX = dx2 - dx1;
                        const relativeVelocityY = dy2 - dy1;
                        const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

                        if (velocityAlongNormal > 0) continue;

                        const restitution = (bounce1 + bounce2) * 0.5;
                        const impulseScalar = -(1 + restitution) * velocityAlongNormal / (1/mass1 + 1/mass2);

                        const impulseX = impulseScalar * nx;
                        const impulseY = impulseScalar * ny;

                        dx1 -= impulseX / mass1;
                        dy1 -= impulseY / mass1;

                        const energyLoss = 0.98;
                        dx1 *= energyLoss;
                        dy1 *= energyLoss;
                    }
                }

                sharedFloatArray[offset1 + 1] = x1;
                sharedFloatArray[offset1 + 2] = y1;
                sharedFloatArray[offset1 + 3] = dx1;
                sharedFloatArray[offset1 + 4] = dy1;
            }
        };
    }
}

@ECSSystem('RenderSystem')
class RenderSystem extends EntitySystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        super(Matcher.empty().all(Position, Renderable));
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    protected override process(entities: Entity[]): void {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const entity of entities) {
            const position = entity.getComponent(Position);
            const renderable = entity.getComponent(Renderable);

            if (!position || !renderable) continue;

            this.ctx.fillStyle = renderable.color;
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, renderable.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

@ECSSystem('LifetimeSystem')
class LifetimeSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(Lifetime));
    }

    protected override process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;

        for (const entity of entities) {
            const lifetime = entity.getComponent(Lifetime);
            if (!lifetime) continue;

            lifetime.currentAge += deltaTime;
            if (lifetime.isDead()) {
                entity.destroy();
            }
        }
    }
}

// ============ Demo类 ============

export class WorkerSystemDemo extends DemoBase {
    private physicsSystem!: PhysicsWorkerSystem;
    private renderSystem!: RenderSystem;
    private lifetimeSystem!: LifetimeSystem;
    private currentFPS = 0;
    private frameCount = 0;
    private fpsUpdateTime = 0;
    private elements: { [key: string]: HTMLElement } = {};

    getInfo(): DemoInfo {
        return {
            id: 'worker-system',
            name: 'Worker System',
            description: '演示 ECS 框架中的多线程物理计算能力',
            category: '核心功能',
            icon: '⚙️'
        };
    }

    setup(): void {
        // 注册浏览器平台适配器
        const browserAdapter = new BrowserAdapter();
        PlatformManager.getInstance().registerAdapter(browserAdapter);

        // 初始化系统
        this.physicsSystem = new PhysicsWorkerSystem(true, this.canvas.width, this.canvas.height);
        this.renderSystem = new RenderSystem(this.canvas);
        this.lifetimeSystem = new LifetimeSystem();

        this.physicsSystem.updateOrder = 1;
        this.lifetimeSystem.updateOrder = 2;
        this.renderSystem.updateOrder = 3;

        this.scene.addSystem(this.physicsSystem);
        this.scene.addSystem(this.lifetimeSystem);
        this.scene.addSystem(this.renderSystem);

        // 创建控制面板
        this.createControls();

        // 初始化UI元素引用
        this.initializeUIElements();
        this.bindEvents();

        // 生成初始实体
        this.spawnInitialEntities(1000);
    }

    createControls(): void {
        this.controlPanel.innerHTML = `
            <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; height: 100%; overflow-y: auto;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc;">实体数量:</label>
                    <input type="range" id="entityCount" min="100" max="10000" value="1000" step="100"
                        style="width: 100%; margin-bottom: 5px;">
                    <span id="entityCountValue" style="color: #fff;">1000</span>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc;">Worker 设置:</label>
                    <button id="toggleWorker" style="width: 100%; padding: 8px; margin-bottom: 5px;
                        background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        禁用 Worker
                    </button>
                </div>

                <div style="margin-bottom: 15px;">
                    <button id="spawnParticles" style="width: 100%; padding: 8px; margin-bottom: 5px;
                        background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        生成粒子爆炸
                    </button>
                    <button id="clearEntities" style="width: 100%; padding: 8px; margin-bottom: 5px;
                        background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        清空所有实体
                    </button>
                    <button id="resetDemo" style="width: 100%; padding: 8px;
                        background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        重置演示
                    </button>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc;">物理参数:</label>
                    <input type="range" id="gravity" min="0" max="500" value="100" step="10"
                        style="width: 100%; margin-bottom: 5px;">
                    <label style="color: #ccc;">重力: <span id="gravityValue">100</span></label>

                    <input type="range" id="friction" min="0" max="100" value="95" step="5"
                        style="width: 100%; margin-top: 10px; margin-bottom: 5px;">
                    <label style="color: #ccc;">摩擦力: <span id="frictionValue">95%</span></label>
                </div>

                <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px;">
                    <h3 style="margin-top: 0; color: #4a9eff;">性能统计</h3>
                    <div style="margin: 5px 0; color: #ccc;">FPS: <span id="fps" style="color: #4eff4a;">0</span></div>
                    <div style="margin: 5px 0; color: #ccc;">实体数量: <span id="entityCountStat" style="color: #fff;">0</span></div>
                    <div style="margin: 5px 0; color: #ccc;">Worker状态: <span id="workerStatus" style="color: #ff4a4a;">未启用</span></div>
                    <div style="margin: 5px 0; color: #ccc;">Worker负载: <span id="workerLoad" style="color: #fff;">N/A</span></div>
                </div>
            </div>
        `;
    }

    protected render(): void {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        this.updateUI();
    }

    private initializeUIElements(): void {
        const elementIds = [
            'entityCount', 'entityCountValue', 'toggleWorker',
            'gravity', 'gravityValue', 'friction', 'frictionValue', 'spawnParticles',
            'clearEntities', 'resetDemo', 'fps', 'entityCountStat', 'workerStatus', 'workerLoad'
        ];

        for (const id of elementIds) {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            }
        }
    }

    private bindEvents(): void {
        if (this.elements.entityCount && this.elements.entityCountValue) {
            const slider = this.elements.entityCount as HTMLInputElement;
            slider.addEventListener('input', () => {
                this.elements.entityCountValue.textContent = slider.value;
            });

            slider.addEventListener('change', () => {
                const count = parseInt(slider.value);
                this.spawnInitialEntities(count);
            });
        }

        if (this.elements.toggleWorker) {
            this.elements.toggleWorker.addEventListener('click', () => {
                const workerEnabled = this.toggleWorker();
                this.elements.toggleWorker.textContent = workerEnabled ? '禁用 Worker' : '启用 Worker';
            });
        }

        if (this.elements.gravity && this.elements.gravityValue) {
            const slider = this.elements.gravity as HTMLInputElement;
            slider.addEventListener('input', () => {
                this.elements.gravityValue.textContent = slider.value;
            });

            slider.addEventListener('change', () => {
                const gravity = parseInt(slider.value);
                this.updateWorkerConfig({ gravity });
            });
        }

        if (this.elements.friction && this.elements.frictionValue) {
            const slider = this.elements.friction as HTMLInputElement;
            slider.addEventListener('input', () => {
                const value = parseInt(slider.value);
                this.elements.frictionValue.textContent = `${value}%`;
            });

            slider.addEventListener('change', () => {
                const friction = parseInt(slider.value) / 100;
                this.updateWorkerConfig({ friction });
            });
        }

        if (this.elements.spawnParticles) {
            this.elements.spawnParticles.addEventListener('click', () => {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                this.spawnParticleExplosion(centerX, centerY, 100);
            });
        }

        if (this.elements.clearEntities) {
            this.elements.clearEntities.addEventListener('click', () => {
                this.clearAllEntities();
            });
        }

        if (this.elements.resetDemo) {
            this.elements.resetDemo.addEventListener('click', () => {
                (this.elements.entityCount as HTMLInputElement).value = '1000';
                this.elements.entityCountValue.textContent = '1000';
                (this.elements.gravity as HTMLInputElement).value = '100';
                this.elements.gravityValue.textContent = '100';
                (this.elements.friction as HTMLInputElement).value = '95';
                this.elements.frictionValue.textContent = '95%';

                this.spawnInitialEntities(1000);
                this.updateWorkerConfig({ gravity: 100, friction: 0.95 });
            });
        }

        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.spawnParticleExplosion(x, y, 30);
        });
    }

    private updateUI(): void {
        const workerInfo = this.physicsSystem.getWorkerInfo();

        if (this.elements.fps) {
            this.elements.fps.textContent = this.currentFPS.toString();
        }

        if (this.elements.entityCountStat) {
            this.elements.entityCountStat.textContent = this.scene.entities.count.toString();
        }

        if (this.elements.workerStatus) {
            if (workerInfo.enabled) {
                this.elements.workerStatus.textContent = `启用 (${workerInfo.workerCount} Workers)`;
                this.elements.workerStatus.style.color = '#4eff4a';
            } else {
                this.elements.workerStatus.textContent = '禁用';
                this.elements.workerStatus.style.color = '#ff4a4a';
            }
        }

        if (this.elements.workerLoad) {
            const entityCount = this.scene.entities.count;
            if (workerInfo.enabled && entityCount > 0) {
                const entitiesPerWorker = Math.ceil(entityCount / workerInfo.workerCount);
                this.elements.workerLoad.textContent = `${entitiesPerWorker}/Worker (共${workerInfo.workerCount}个)`;
            } else {
                this.elements.workerLoad.textContent = 'N/A';
            }
        }
    }

    private spawnInitialEntities(count: number = 1000): void {
        this.clearAllEntities();

        for (let i = 0; i < count; i++) {
            this.createParticle();
        }
    }

    private createParticle(): void {
        const entity = this.scene.createEntity(`Particle_${Date.now()}_${Math.random()}`);

        const x = Math.random() * (this.canvas.width - 20) + 10;
        const y = Math.random() * (this.canvas.height - 20) + 10;
        const dx = (Math.random() - 0.5) * 200;
        const dy = (Math.random() - 0.5) * 200;
        const mass = Math.random() * 3 + 2;
        const bounce = 0.85 + Math.random() * 0.15;
        const friction = 0.998 + Math.random() * 0.002;

        const colors = [
            '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ffffff',
            '#ff8844', '#88ff44', '#4488ff', '#ff4488', '#88ff88', '#8888ff', '#ffaa44'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 6 + 3;

        entity.addComponent(new Position(x, y));
        entity.addComponent(new Velocity(dx, dy));
        entity.addComponent(new Physics(mass, bounce, friction));
        entity.addComponent(new Renderable(color, size, 'circle'));
        entity.addComponent(new Lifetime(5 + Math.random() * 10));
    }

    private spawnParticleExplosion(centerX: number, centerY: number, count: number = 50): void {
        for (let i = 0; i < count; i++) {
            const entity = this.scene.createEntity(`Explosion_${Date.now()}_${i}`);

            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const distance = Math.random() * 30;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            const speed = 100 + Math.random() * 150;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            const mass = 0.5 + Math.random() * 1;
            const bounce = 0.8 + Math.random() * 0.2;

            const colors = ['#ffaa00', '#ff6600', '#ff0066', '#ff3300', '#ffff00'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 4 + 2;

            entity.addComponent(new Position(x, y));
            entity.addComponent(new Velocity(dx, dy));
            entity.addComponent(new Physics(mass, bounce, 0.999));
            entity.addComponent(new Renderable(color, size, 'circle'));
            entity.addComponent(new Lifetime(2 + Math.random() * 3));
        }
    }

    private clearAllEntities(): void {
        const entities = [...this.scene.entities.buffer];
        for (const entity of entities) {
            entity.destroy();
        }
    }

    private toggleWorker(): boolean {
        const workerInfo = this.physicsSystem.getWorkerInfo();
        const newWorkerEnabled = !workerInfo.enabled;

        // 保存当前物理配置
        const currentConfig = this.physicsSystem.getPhysicsConfig();

        this.scene.removeSystem(this.physicsSystem);
        this.physicsSystem = new PhysicsWorkerSystem(newWorkerEnabled, this.canvas.width, this.canvas.height);
        this.physicsSystem.updateOrder = 1;

        // 恢复物理配置
        this.physicsSystem.updatePhysicsConfig(currentConfig);

        this.scene.addSystem(this.physicsSystem);

        return newWorkerEnabled;
    }

    private updateWorkerConfig(config: { gravity?: number; friction?: number }): void {
        if (config.gravity !== undefined || config.friction !== undefined) {
            const physicsConfig = this.physicsSystem.getPhysicsConfig();
            this.physicsSystem.updatePhysicsConfig({
                gravity: config.gravity ?? physicsConfig.gravity,
                groundFriction: config.friction ?? physicsConfig.groundFriction
            });
        }
    }
}
