/**
 * 物理 Worker 系统
 * Physics Worker System
 *
 * 这个系统会被 worker-generator CLI 扫描，
 * 自动提取 workerProcess 方法生成 Worker 文件
 */
import {
    WorkerEntitySystem,
    Matcher,
    Entity,
    ECSSystem
} from '@esengine/ecs-framework';
import { Position, Velocity, Physics, Renderable } from '../components';

/**
 * 物理实体数据
 * Physics entity data
 */
export interface PhysicsEntityData {
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

/**
 * 物理系统配置
 * Physics system config
 */
export interface PhysicsConfig {
    gravity: number;
    canvasWidth: number;
    canvasHeight: number;
    groundFriction: number;
}

@ECSSystem('PhysicsWorkerSystem')
export class PhysicsWorkerSystem extends WorkerEntitySystem<PhysicsEntityData> {
    constructor(canvasWidth: number = 375, canvasHeight: number = 667) {
        super(
            Matcher.empty().all(Position, Velocity, Physics),
            {
                enableWorker: true,
                workerCount: 1,
                // 重要：这个路径会被 CLI 工具读取，生成 Worker 文件到此位置
                // Important: CLI tool reads this path to generate Worker file
                workerScriptPath: 'workers/physics-worker.js',
                systemConfig: {
                    gravity: 200,
                    canvasWidth,
                    canvasHeight,
                    groundFriction: 0.98
                } as PhysicsConfig
            }
        );
    }

    /**
     * 提取实体数据
     * Extract entity data
     */
    protected extractEntityData(entity: Entity): PhysicsEntityData {
        const position = entity.getComponent(Position)!;
        const velocity = entity.getComponent(Velocity)!;
        const physics = entity.getComponent(Physics)!;
        const renderable = entity.getComponent(Renderable);

        return {
            id: entity.id,
            x: position.x,
            y: position.y,
            dx: velocity.dx,
            dy: velocity.dy,
            mass: physics.mass,
            bounce: physics.bounce,
            friction: physics.friction,
            radius: renderable?.size || 5
        };
    }

    /**
     * Worker 处理函数 - 会被 CLI 工具提取
     * Worker process function - will be extracted by CLI tool
     *
     * 注意：这个函数必须是纯函数，不能使用 this 或外部变量
     * Note: This function must be pure, cannot use this or external variables
     */
    protected workerProcess(
        entities: PhysicsEntityData[],
        deltaTime: number,
        config: PhysicsConfig
    ): PhysicsEntityData[] {
        const gravity = config.gravity;
        const canvasWidth = config.canvasWidth;
        const canvasHeight = config.canvasHeight;
        const groundFriction = config.groundFriction;

        // 复制实体数组避免修改原数据
        // Copy entity array to avoid modifying original data
        const result = entities.map(e => ({ ...e }));

        // 物理更新
        // Physics update
        for (let i = 0; i < result.length; i++) {
            const entity = result[i];

            // 应用重力
            // Apply gravity
            entity.dy += gravity * deltaTime;

            // 更新位置
            // Update position
            entity.x += entity.dx * deltaTime;
            entity.y += entity.dy * deltaTime;

            // 边界碰撞
            // Boundary collision
            if (entity.x <= entity.radius) {
                entity.x = entity.radius;
                entity.dx = -entity.dx * entity.bounce;
            } else if (entity.x >= canvasWidth - entity.radius) {
                entity.x = canvasWidth - entity.radius;
                entity.dx = -entity.dx * entity.bounce;
            }

            if (entity.y <= entity.radius) {
                entity.y = entity.radius;
                entity.dy = -entity.dy * entity.bounce;
            } else if (entity.y >= canvasHeight - entity.radius) {
                entity.y = canvasHeight - entity.radius;
                entity.dy = -entity.dy * entity.bounce;
                entity.dx *= groundFriction;
            }

            // 空气阻力
            // Air friction
            entity.dx *= entity.friction;
            entity.dy *= entity.friction;
        }

        // 简单碰撞检测
        // Simple collision detection
        for (let i = 0; i < result.length; i++) {
            for (let j = i + 1; j < result.length; j++) {
                const ball1 = result[i];
                const ball2 = result[j];

                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = ball1.radius + ball2.radius;

                if (distance < minDistance && distance > 0) {
                    // 分离两个球
                    // Separate two balls
                    const nx = dx / distance;
                    const ny = dy / distance;
                    const overlap = minDistance - distance;

                    ball1.x -= nx * overlap * 0.5;
                    ball1.y -= ny * overlap * 0.5;
                    ball2.x += nx * overlap * 0.5;
                    ball2.y += ny * overlap * 0.5;

                    // 弹性碰撞
                    // Elastic collision
                    const relVx = ball2.dx - ball1.dx;
                    const relVy = ball2.dy - ball1.dy;
                    const velAlongNormal = relVx * nx + relVy * ny;

                    if (velAlongNormal > 0) continue;

                    const restitution = (ball1.bounce + ball2.bounce) * 0.5;
                    const impulse = -(1 + restitution) * velAlongNormal / (1/ball1.mass + 1/ball2.mass);

                    ball1.dx -= impulse * nx / ball1.mass;
                    ball1.dy -= impulse * ny / ball1.mass;
                    ball2.dx += impulse * nx / ball2.mass;
                    ball2.dy += impulse * ny / ball2.mass;
                }
            }
        }

        return result;
    }

    /**
     * 应用处理结果
     * Apply processing result
     */
    protected applyResult(entity: Entity, result: PhysicsEntityData): void {
        if (!entity?.enabled) return;

        const position = entity.getComponent(Position);
        const velocity = entity.getComponent(Velocity);

        if (position && velocity) {
            position.set(result.x, result.y);
            velocity.set(result.dx, result.dy);
        }
    }

    protected getDefaultEntityDataSize(): number {
        return 9;
    }
}
