import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

// 从 physics-rapier2d 导入共享接口
// Import shared interface from physics-rapier2d
import type { IPhysics2DQuery } from '@esengine/physics-rapier2d';

// 重新导出以保持向后兼容
// Re-export for backward compatibility
export type { IPhysics2DQuery };

/**
 * 物理碰撞行为
 * Physics collision behavior
 */
export enum Physics2DCollisionBehavior {
    /** 销毁粒子 | Kill particle */
    Kill = 'kill',
    /** 反弹 | Bounce */
    Bounce = 'bounce',
    /** 停止运动 | Stop movement */
    Stop = 'stop'
}

/**
 * 碰撞回调数据
 * Collision callback data
 */
export interface ParticleCollisionInfo {
    /** 粒子引用 | Particle reference */
    particle: Particle;
    /** 碰撞位置 | Collision point */
    point: { x: number; y: number };
    /** 碰撞法线 | Collision normal */
    normal: { x: number; y: number };
    /** 碰撞的实体 ID | Collided entity ID */
    entityId: number;
    /** 碰撞体句柄 | Collider handle */
    colliderHandle: number;
}

/**
 * 2D 物理碰撞模块
 * 2D Physics collision module
 *
 * 使用 Physics2DService 的查询 API 检测粒子与场景碰撞体的碰撞。
 * Uses Physics2DService query API to detect particle collisions with scene colliders.
 *
 * @example
 * ```typescript
 * // 获取物理服务
 * const physicsService = scene.services.resolve(Physics2DService);
 *
 * // 创建模块
 * const collisionModule = new Physics2DCollisionModule();
 * collisionModule.setPhysicsQuery(physicsService);
 * collisionModule.particleRadius = 4;
 * collisionModule.behavior = Physics2DCollisionBehavior.Bounce;
 *
 * // 添加到粒子系统
 * particleSystem.addModule(collisionModule);
 *
 * // 监听碰撞事件
 * collisionModule.onCollision = (info) => {
 *     console.log('Particle hit entity:', info.entityId);
 * };
 * ```
 */
export class Physics2DCollisionModule implements IParticleModule {
    readonly name = 'Physics2DCollision';
    enabled = true;

    // ============= 物理查询 | Physics Query =============

    /** 物理查询接口 | Physics query interface */
    private _physicsQuery: IPhysics2DQuery | null = null;

    // ============= 碰撞设置 | Collision Settings =============

    /**
     * 粒子碰撞半径
     * Particle collision radius
     *
     * 用于圆形重叠检测的半径
     */
    particleRadius: number = 4;

    /**
     * 碰撞行为
     * Collision behavior
     */
    behavior: Physics2DCollisionBehavior = Physics2DCollisionBehavior.Bounce;

    /**
     * 碰撞层掩码
     * Collision layer mask
     *
     * 默认 0xFFFF 表示与所有层碰撞
     * Default 0xFFFF means collide with all layers
     */
    collisionMask: number = 0xFFFF;

    /**
     * 反弹系数 (0-1)
     * Bounce factor (0-1)
     *
     * 1 = 完全弹性，0 = 无弹性
     * 1 = fully elastic, 0 = no bounce
     */
    bounceFactor: number = 0.6;

    /**
     * 反弹时的生命损失 (0-1)
     * Life loss on bounce (0-1)
     */
    lifeLossOnBounce: number = 0;

    /**
     * 最小速度阈值
     * Minimum velocity threshold
     *
     * 低于此速度时销毁粒子（防止无限小弹跳）
     * Kill particle when velocity falls below this (prevents infinite tiny bounces)
     */
    minVelocityThreshold: number = 5;

    /**
     * 使用射线检测代替重叠检测
     * Use raycast instead of overlap detection
     *
     * 射线检测更精确，可防止快速粒子穿透，但性能开销更大
     * Raycast is more accurate and prevents fast particle tunneling, but more expensive
     */
    useRaycast: boolean = false;

    /**
     * 检测频率（每 N 帧检测一次）
     * Detection frequency (detect every N frames)
     *
     * 增大此值可提高性能，但降低精度
     * Increase to improve performance at cost of accuracy
     */
    detectionInterval: number = 1;

    // ============= 内部状态 | Internal State =============

    /** 帧计数器 | Frame counter */
    private _frameCounter: number = 0;

    /** 需要销毁的粒子 | Particles to kill */
    private _particlesToKill: Set<Particle> = new Set();

    // ============= 回调 | Callbacks =============

    /**
     * 碰撞回调
     * Collision callback
     *
     * 每次粒子碰撞时调用
     */
    onCollision: ((info: ParticleCollisionInfo) => void) | null = null;

    // ============= 公开方法 | Public Methods =============

    /**
     * 设置物理查询接口
     * Set physics query interface
     *
     * @param query - 物理查询接口（通常是 Physics2DService）| Physics query (usually Physics2DService)
     */
    setPhysicsQuery(query: IPhysics2DQuery | null): void {
        this._physicsQuery = query;
    }

    /**
     * 获取需要销毁的粒子
     * Get particles to kill
     */
    getParticlesToKill(): Set<Particle> {
        return this._particlesToKill;
    }

    /**
     * 清除死亡标记
     * Clear death flags
     */
    clearDeathFlags(): void {
        this._particlesToKill.clear();
    }

    /**
     * 重置帧计数器
     * Reset frame counter
     */
    resetFrameCounter(): void {
        this._frameCounter = 0;
    }

    // ============= IParticleModule 实现 | IParticleModule Implementation =============

    update(p: Particle, dt: number, _normalizedAge: number): void {
        if (!this._physicsQuery) return;

        // 检测频率控制 | Detection frequency control
        this._frameCounter++;
        if (this._frameCounter % this.detectionInterval !== 0) {
            return;
        }

        if (this.useRaycast) {
            this._updateWithRaycast(p, dt);
        } else {
            this._updateWithOverlap(p);
        }
    }

    // ============= 私有方法 | Private Methods =============

    /**
     * 使用圆形重叠检测
     * Update using circle overlap detection
     */
    private _updateWithOverlap(p: Particle): void {
        if (!this._physicsQuery) return;

        const result = this._physicsQuery.overlapCircle(
            { x: p.x, y: p.y },
            this.particleRadius,
            this.collisionMask
        );

        if (result.entityIds.length > 0) {
            // 发生碰撞 | Collision occurred
            const entityId = result.entityIds[0];
            const colliderHandle = result.colliderHandles[0];

            // 估算法线（从粒子速度反向）| Estimate normal (from particle velocity)
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const normal = speed > 0.001
                ? { x: -p.vx / speed, y: -p.vy / speed }
                : { x: 0, y: 1 };

            this._handleCollision(p, { x: p.x, y: p.y }, normal, entityId, colliderHandle);
        }
    }

    /**
     * 使用射线检测
     * Update using raycast detection
     */
    private _updateWithRaycast(p: Particle, dt: number): void {
        if (!this._physicsQuery) return;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < 0.001) return;

        // 归一化方向 | Normalize direction
        const direction = { x: p.vx / speed, y: p.vy / speed };
        const distance = speed * dt + this.particleRadius;

        const hit = this._physicsQuery.raycast(
            { x: p.x, y: p.y },
            direction,
            distance,
            this.collisionMask
        );

        if (hit) {
            this._handleCollision(p, hit.point, hit.normal, hit.entityId, hit.colliderHandle);
        }
    }

    /**
     * 处理碰撞
     * Handle collision
     */
    private _handleCollision(
        p: Particle,
        point: { x: number; y: number },
        normal: { x: number; y: number },
        entityId: number,
        colliderHandle: number
    ): void {
        // 触发回调 | Trigger callback
        if (this.onCollision) {
            this.onCollision({
                particle: p,
                point,
                normal,
                entityId,
                colliderHandle
            });
        }

        switch (this.behavior) {
            case Physics2DCollisionBehavior.Kill:
                this._particlesToKill.add(p);
                break;

            case Physics2DCollisionBehavior.Bounce:
                this._applyBounce(p, normal);
                break;

            case Physics2DCollisionBehavior.Stop:
                p.vx = 0;
                p.vy = 0;
                break;
        }
    }

    /**
     * 应用反弹
     * Apply bounce effect
     */
    private _applyBounce(p: Particle, normal: { x: number; y: number }): void {
        // 反射公式: v' = v - 2 * (v · n) * n
        // Reflection formula: v' = v - 2 * (v · n) * n
        const dot = p.vx * normal.x + p.vy * normal.y;

        // 只在粒子朝向表面时反弹 | Only bounce if particle is moving towards surface
        if (dot < 0) {
            p.vx = (p.vx - 2 * dot * normal.x) * this.bounceFactor;
            p.vy = (p.vy - 2 * dot * normal.y) * this.bounceFactor;

            // 稍微移开粒子防止重复碰撞 | Move particle slightly away to prevent repeated collision
            p.x += normal.x * this.particleRadius * 0.1;
            p.y += normal.y * this.particleRadius * 0.1;
        }

        // 应用生命损失 | Apply life loss
        if (this.lifeLossOnBounce > 0) {
            p.lifetime *= (1 - this.lifeLossOnBounce);
        }

        // 检查最小速度 | Check minimum velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < this.minVelocityThreshold) {
            this._particlesToKill.add(p);
        }
    }
}
