import { WorkerEntitySystem, Matcher, Entity, ECSSystem, SharedArrayBufferProcessFunction } from '@esengine/ecs-framework';
import { Position, Velocity, Physics, Renderable } from '../components';

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
export class PhysicsWorkerSystem extends WorkerEntitySystem<PhysicsEntityData> {
    private physicsConfig: PhysicsConfig = {
        gravity: 100,
        canvasWidth: 800,
        canvasHeight: 600,
        groundFriction: 0.98 // 减少地面摩擦
    };

    constructor(enableWorker: boolean = true) {
        const defaultConfig = {
            gravity: 100,
            canvasWidth: 800,
            canvasHeight: 600,
            groundFriction: 0.98
        };

        super(
            Matcher.empty().all(Position, Velocity, Physics),
            {
                enableWorker,
                workerCount: navigator.hardwareConcurrency || 2, // 恢复多Worker
                systemConfig: defaultConfig,
                useSharedArrayBuffer: true // 使用SharedArrayBuffer进行全局碰撞检测
            }
        );
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

    /**
     * Worker处理函数 - 纯函数，会被序列化到Worker中执行
     * 注意：这个函数内部不能访问外部变量，必须是纯函数
     * 非SharedArrayBuffer模式：每个Worker只能看到分配给它的实体批次
     * 这会导致跨批次的碰撞检测缺失，但单批次内的碰撞是正确的
     */
    protected workerProcess(
        entities: PhysicsEntityData[],
        deltaTime: number,
        systemConfig?: PhysicsConfig
    ): PhysicsEntityData[] {
        const config = systemConfig || {
            gravity: 100,
            canvasWidth: 800,
            canvasHeight: 600,
            groundFriction: 0.98
        };

        // 创建实体副本以避免修改原始数据
        const result = entities.map(e => ({ ...e }));

        // 应用重力和基础物理
        for (let i = 0; i < result.length; i++) {
            const entity = result[i];

            // 应用重力
            entity.dy += config.gravity * deltaTime;

            // 更新位置
            entity.x += entity.dx * deltaTime;
            entity.y += entity.dy * deltaTime;

            // 边界碰撞检测和处理
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

                // 地面摩擦力
                entity.dx *= config.groundFriction;
            }

            // 空气阻力
            entity.dx *= entity.friction;
            entity.dy *= entity.friction;
        }

        // 小球间碰撞检测
        for (let i = 0; i < result.length; i++) {
            for (let j = i + 1; j < result.length; j++) {
                const ball1 = result[i];
                const ball2 = result[j];

                // 计算距离
                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = ball1.radius + ball2.radius;

                // 检测碰撞
                if (distance < minDistance && distance > 0) {
                    // 碰撞法线
                    const nx = dx / distance;
                    const ny = dy / distance;

                    // 分离小球以避免重叠
                    const overlap = minDistance - distance;
                    const separationX = nx * overlap * 0.5;
                    const separationY = ny * overlap * 0.5;

                    ball1.x -= separationX;
                    ball1.y -= separationY;
                    ball2.x += separationX;
                    ball2.y += separationY;

                    // 相对速度
                    const relativeVelocityX = ball2.dx - ball1.dx;
                    const relativeVelocityY = ball2.dy - ball1.dy;

                    // 沿碰撞法线的速度分量
                    const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

                    // 如果速度分量为正，小球正在分离，不需要处理
                    if (velocityAlongNormal > 0) continue;

                    // 计算弹性系数（两球弹性的平均值）
                    const restitution = (ball1.bounce + ball2.bounce) * 0.5;

                    // 计算冲量大小
                    const impulseScalar = -(1 + restitution) * velocityAlongNormal / (1/ball1.mass + 1/ball2.mass);

                    // 应用冲量
                    const impulseX = impulseScalar * nx;
                    const impulseY = impulseScalar * ny;

                    ball1.dx -= impulseX / ball1.mass;
                    ball1.dy -= impulseY / ball1.mass;
                    ball2.dx += impulseX / ball2.mass;
                    ball2.dy += impulseY / ball2.mass;

                    // 轻微的能量损失，保持活力
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

    /**
     * 应用处理结果
     */
    protected applyResult(entity: Entity, result: PhysicsEntityData): void {
        // 检查实体是否仍然存在且有效
        if (!entity || !entity.enabled) {
            return;
        }

        const position = entity.getComponent(Position);
        const velocity = entity.getComponent(Velocity);

        // 检查组件是否仍然存在（实体可能在Worker处理期间被修改）
        if (!position || !velocity) {
            return;
        }

        position.set(result.x, result.y);
        velocity.set(result.dx, result.dy);
    }

    /**
     * 更新物理配置
     */
    public updatePhysicsConfig(newConfig: Partial<PhysicsConfig>): void {
        Object.assign(this.physicsConfig, newConfig);
        this.updateConfig({ systemConfig: this.physicsConfig });
    }

    /**
     * 获取物理配置
     */
    public getPhysicsConfig(): PhysicsConfig {
        return { ...this.physicsConfig };
    }

    private startTime: number = 0;


    /**
     * 性能监控
     */
    protected override onEnd(): void {
        super.onEnd();
        const endTime = performance.now();
        const executionTime = endTime - this.startTime;

        // 发送性能数据到UI
        (window as any).physicsExecutionTime = executionTime;
    }

    /**
     * 获取实体数据大小
     */
    protected getDefaultEntityDataSize(): number {
        return 9; // id, x, y, dx, dy, mass, bounce, friction, radius
    }

    /**
     * 将实体数据写入SharedArrayBuffer
     */
    protected writeEntityToBuffer(entityData: PhysicsEntityData, offset: number): void {
        const sharedArray = (this as any).sharedFloatArray as Float32Array;
        if (!sharedArray) return;

        // 在第一个位置存储当前实体数量，用于Worker函数判断实际有效数据范围
        const currentEntityCount = Math.floor(offset / 9) + 1;
        sharedArray[0] = currentEntityCount; // 元数据：实际实体数量

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

    /**
     * 性能监控开始
     */
    protected override onBegin(): void {
        super.onBegin();
        this.startTime = performance.now();
    }

    /**
     * 从SharedArrayBuffer读取实体数据
     */
    protected readEntityFromBuffer(offset: number): PhysicsEntityData | null {
        const sharedArray = (this as any).sharedFloatArray as Float32Array;
        if (!sharedArray) return null;

        // 数据从索引9开始存储（第一个9个位置用作元数据区域）
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

    /**
     * SharedArrayBuffer处理函数
     */
    protected getSharedArrayBufferProcessFunction(): SharedArrayBufferProcessFunction {
        return function(sharedFloatArray: Float32Array, startIndex: number, endIndex: number, deltaTime: number, systemConfig?: any) {
            const config = systemConfig || {
                gravity: 100,
                canvasWidth: 800,
                canvasHeight: 600,
                groundFriction: 0.98
            };

            // 读取实际实体数量（存储在第一个位置）
            const actualEntityCount = sharedFloatArray[0];

            // 基础物理更新
            for (let i = startIndex; i < endIndex && i < actualEntityCount; i++) {
                const offset = i * 9 + 9; // 数据从索引9开始，加上元数据偏移

                // 读取实体数据
                const id = sharedFloatArray[offset + 0];
                if (id === 0) continue; // 跳过无效实体

                let x = sharedFloatArray[offset + 1];
                let y = sharedFloatArray[offset + 2];
                let dx = sharedFloatArray[offset + 3];
                let dy = sharedFloatArray[offset + 4];
                const mass = sharedFloatArray[offset + 5];
                const bounce = sharedFloatArray[offset + 6];
                const friction = sharedFloatArray[offset + 7];
                const radius = sharedFloatArray[offset + 8];

                // 应用重力
                dy += config.gravity * deltaTime;

                // 更新位置
                x += dx * deltaTime;
                y += dy * deltaTime;

                // 边界碰撞检测和处理
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

                    // 地面摩擦力
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

            // 小球间碰撞检测
            for (let i = startIndex; i < endIndex && i < actualEntityCount; i++) {
                const offset1 = i * 9 + 9; // 数据从索引9开始，加上元数据偏移
                const id1 = sharedFloatArray[offset1 + 0];
                if (id1 === 0) continue;

                let x1 = sharedFloatArray[offset1 + 1];
                let y1 = sharedFloatArray[offset1 + 2];
                let dx1 = sharedFloatArray[offset1 + 3];
                let dy1 = sharedFloatArray[offset1 + 4];
                const mass1 = sharedFloatArray[offset1 + 5];
                const bounce1 = sharedFloatArray[offset1 + 6];
                const radius1 = sharedFloatArray[offset1 + 8];

                // 检测与所有其他小球的碰撞（能看到所有实体，实现完整碰撞检测）
                for (let j = 0; j < actualEntityCount; j++) {
                    if (i === j) continue;

                    const offset2 = j * 9 + 9; // 数据从索引9开始，加上元数据偏移
                    const id2 = sharedFloatArray[offset2 + 0];
                    if (id2 === 0) continue;

                    const x2 = sharedFloatArray[offset2 + 1];
                    const y2 = sharedFloatArray[offset2 + 2];
                    const dx2 = sharedFloatArray[offset2 + 3];
                    const dy2 = sharedFloatArray[offset2 + 4];
                    const mass2 = sharedFloatArray[offset2 + 5];
                    const bounce2 = sharedFloatArray[offset2 + 6];
                    const radius2 = sharedFloatArray[offset2 + 8];

                    // 额外检查：确保位置和半径都是有效值
                    if (isNaN(x2) || isNaN(y2) || isNaN(radius2) || radius2 <= 0) continue;

                    // 计算距离
                    const deltaX = x2 - x1;
                    const deltaY = y2 - y1;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    const minDistance = radius1 + radius2;

                    // 检测碰撞
                    if (distance < minDistance && distance > 0) {
                        // 碰撞法线
                        const nx = deltaX / distance;
                        const ny = deltaY / distance;

                        // 分离小球 - 只调整当前Worker负责的球
                        const overlap = minDistance - distance;
                        const separationX = nx * overlap * 0.5;
                        const separationY = ny * overlap * 0.5;

                        x1 -= separationX;
                        y1 -= separationY;

                        // 相对速度
                        const relativeVelocityX = dx2 - dx1;
                        const relativeVelocityY = dy2 - dy1;

                        // 沿碰撞法线的速度分量
                        const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

                        // 如果速度分量为正，小球正在分离
                        if (velocityAlongNormal > 0) continue;

                        // 弹性系数
                        const restitution = (bounce1 + bounce2) * 0.5;

                        // 冲量计算
                        const impulseScalar = -(1 + restitution) * velocityAlongNormal / (1/mass1 + 1/mass2);

                        // 应用冲量到当前小球（只更新当前Worker负责的球）
                        const impulseX = impulseScalar * nx;
                        const impulseY = impulseScalar * ny;

                        dx1 -= impulseX / mass1;
                        dy1 -= impulseY / mass1;

                        // 能量损失
                        const energyLoss = 0.98;
                        dx1 *= energyLoss;
                        dy1 *= energyLoss;
                    }
                }

                // 只更新当前Worker负责的实体
                sharedFloatArray[offset1 + 1] = x1;
                sharedFloatArray[offset1 + 2] = y1;
                sharedFloatArray[offset1 + 3] = dx1;
                sharedFloatArray[offset1 + 4] = dy1;
            }
        };
    }
}