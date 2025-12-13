/**
 * Physics2DSystem
 * 2D 物理系统
 *
 * 负责更新物理世界并同步 Transform
 */

import { EntitySystem, Matcher, type Entity } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/engine-core';
import { Physics2DWorld } from '../world/Physics2DWorld';
import { Rigidbody2DComponent } from '../components/Rigidbody2DComponent';
import { Collider2DBase } from '../components/Collider2DBase';
import { BoxCollider2DComponent } from '../components/BoxCollider2DComponent';
import { CircleCollider2DComponent } from '../components/CircleCollider2DComponent';
import { CapsuleCollider2DComponent } from '../components/CapsuleCollider2DComponent';
import { PolygonCollider2DComponent } from '../components/PolygonCollider2DComponent';
import type { IVector2 } from '@esengine/ecs-framework-math';
import type { Physics2DConfig } from '../types/Physics2DTypes';
import { PHYSICS_EVENTS, type CollisionEvent2D, type TriggerEvent2D } from '../types/Physics2DEvents';

/**
 * 物理系统配置
 */
export interface Physics2DSystemConfig {
    /** 物理世界配置 */
    physics?: Partial<Physics2DConfig>;
    /** 是否在 lateUpdate 中同步 Transform（用于渲染插值） */
    interpolateInLateUpdate?: boolean;
    /** 更新优先级（默认 -1000，保证在其他系统之前更新） */
    updateOrder?: number;
}

/**
 * 2D 物理系统
 *
 * 管理物理世界的更新和实体的物理属性同步。
 *
 * 职责：
 * - 初始化和管理 Physics2DWorld
 * - 同步 Entity Transform 与物理世界
 * - 应用力和冲量
 * - 发送碰撞/触发器事件
 *
 * @example
 * ```typescript
 * // 注册物理系统
 * scene.addEntityProcessor(Physics2DSystem);
 *
 * // 或使用自定义配置
 * const physicsSystem = new Physics2DSystem({
 *     physics: {
 *         gravity: { x: 0, y: -20 }
 *     }
 * });
 * scene.addEntityProcessor(physicsSystem);
 * ```
 */
export class Physics2DSystem extends EntitySystem {
    private _world: Physics2DWorld;
    private _rapierModule: typeof import('@esengine/rapier2d') | null = null;
    private _rapierInitialized: boolean = false;
    private _config: Physics2DSystemConfig;

    // 实体到物理对象的映射
    private _entityBodies: Map<number, { bodyHandle: number; colliderHandles: number[] }> = new Map();

    // 待处理的新实体队列
    private _pendingEntities: Entity[] = [];

    constructor(config?: Physics2DSystemConfig) {
        // 匹配所有拥有 Rigidbody2DComponent 的实体
        super(Matcher.empty().all(Rigidbody2DComponent));

        this._config = {
            interpolateInLateUpdate: true,
            updateOrder: -1000,
            ...config
        };

        this._world = new Physics2DWorld(this._config.physics);
        this.setUpdateOrder(this._config.updateOrder ?? -1000);
    }

    /**
     * 获取物理世界实例
     */
    public get world(): Physics2DWorld {
        return this._world;
    }

    /**
     * 系统初始化
     */
    protected override onInitialize(): void {
        // Rapier 模块由外部通过 initializeWithRapier 注入
        this.logger.debug('Physics2DSystem initialized, waiting for Rapier module');
    }

    /**
     * 使用 Rapier 模块初始化物理世界
     *
     * 必须在系统开始处理前调用此方法
     *
     * @param rapier Rapier2D 模块
     */
    public async initializeWithRapier(rapier: typeof import('@esengine/rapier2d')): Promise<void> {
        if (this._rapierInitialized) {
            this.logger.warn('Physics2DSystem already initialized');
            return;
        }

        this._rapierModule = rapier;
        await this._world.initialize(rapier);
        this._rapierInitialized = true;

        // 注册碰撞事件回调
        this._world.onCollision((event) => this._handleCollisionEvent(event));
        this._world.onTrigger((event) => this._handleTriggerEvent(event));

        // 处理在初始化前添加的实体
        for (const entity of this._pendingEntities) {
            this._createPhysicsBody(entity);
        }
        this._pendingEntities = [];

        this.logger.info('Physics2DSystem initialized with Rapier2D');
    }

    /**
     * 检查是否可以处理
     */
    protected override onCheckProcessing(): boolean {
        return this._rapierInitialized;
    }

    /**
     * 当实体添加到系统时
     */
    protected override onAdded(entity: Entity): void {
        if (!this._rapierInitialized) {
            // 延迟创建物理体，等待 Rapier 初始化
            this._pendingEntities.push(entity);
            return;
        }

        this._createPhysicsBody(entity);
    }

    /**
     * 当实体从系统移除时
     */
    protected override onRemoved(entity: Entity): void {
        this._removePhysicsBody(entity);

        // 从待处理队列中移除（如果存在）
        const pendingIndex = this._pendingEntities.indexOf(entity);
        if (pendingIndex >= 0) {
            this._pendingEntities.splice(pendingIndex, 1);
        }
    }

    /**
     * 物理更新
     */
    protected override process(entities: readonly Entity[]): void {
        if (!this._rapierInitialized || !this.scene) return;

        const deltaTime = this._getDeltaTime();

        // 发送 pre-step 事件
        this.scene.eventSystem.emitSync(PHYSICS_EVENTS.PRE_STEP, { deltaTime });

        // 同步 Transform 到物理世界
        this._syncTransformsToPhysics(entities);

        // 应用待处理的力和冲量
        this._applyPendingForces(entities);

        // 物理世界步进
        this._world.step(deltaTime);

        // 同步物理世界到 Transform
        this._syncPhysicsToTransforms(entities);

        // 发送 post-step 事件
        this.scene.eventSystem.emitSync(PHYSICS_EVENTS.POST_STEP, { deltaTime });
    }

    /**
     * 后期更新（用于渲染插值）
     */
    protected override lateProcess(_entities: readonly Entity[]): void {
        if (!this._config.interpolateInLateUpdate || !this._rapierInitialized) return;

        // 可在此处实现渲染插值
        // const alpha = this._world.getAlpha();
        // 插值逻辑...
    }

    /**
     * 系统销毁
     */
    protected override onDestroy(): void {
        this._world.destroy();
        this._entityBodies.clear();
        this._pendingEntities = [];
        this._rapierInitialized = false;
        this.logger.info('Physics2DSystem destroyed');
    }

    /**
     * 重置物理系统状态（保持初始化状态，但清除所有物理对象）
     * 用于场景重载/预览重置
     */
    public reset(): void {
        this._world.reset();
        this._entityBodies.clear();
        this._pendingEntities = [];
        // 完全重置实体跟踪，强制下次 update 时重新扫描所有实体并触发 onAdded
        this.resetEntityTracking();
        this.logger.info('Physics2DSystem reset');
    }

    // ==================== 物理 API ====================

    /**
     * 设置重力
     * @param gravity 重力向量
     */
    public setGravity(gravity: IVector2): void {
        this._world.setGravity(gravity);
    }

    /**
     * 获取重力
     */
    public getGravity(): IVector2 {
        return this._world.getGravity();
    }

    /**
     * 射线检测
     */
    public raycast(origin: IVector2, direction: IVector2, maxDistance: number, collisionMask?: number) {
        return this._world.raycast(origin, direction, maxDistance, collisionMask);
    }

    /**
     * 射线检测所有
     */
    public raycastAll(origin: IVector2, direction: IVector2, maxDistance: number, collisionMask?: number) {
        return this._world.raycastAll(origin, direction, maxDistance, collisionMask);
    }

    /**
     * 点重叠检测
     */
    public overlapPoint(point: IVector2, collisionMask?: number) {
        return this._world.overlapPoint(point, collisionMask);
    }

    /**
     * 圆形重叠检测
     */
    public overlapCircle(center: IVector2, radius: number, collisionMask?: number) {
        return this._world.overlapCircle(center, radius, collisionMask);
    }

    /**
     * 矩形重叠检测
     */
    public overlapBox(center: IVector2, halfExtents: IVector2, rotation?: number, collisionMask?: number) {
        return this._world.overlapBox(center, halfExtents, rotation, collisionMask);
    }

    // ==================== 私有方法 ====================

    /**
     * 获取时间增量
     */
    private _getDeltaTime(): number {
        // TODO: 从全局 Time 服务获取
        return 1 / 60;
    }

    /**
     * 创建物理体
     */
    private _createPhysicsBody(entity: Entity): void {
        const rigidbody = entity.getComponent(Rigidbody2DComponent);
        const transform = entity.getComponent(TransformComponent);

        if (!rigidbody || !transform) {
            const missing: string[] = [];
            if (!rigidbody) missing.push('Rigidbody2DComponent');
            if (!transform) missing.push('TransformComponent');
            this.logger.warn(`Entity ${entity.name} missing required components: ${missing.join(', ')}`);
            return;
        }

        // 获取位置和旋转
        const position: IVector2 = {
            x: transform.position.x,
            y: transform.position.y
        };
        const rotation = transform.rotation.z;

        // 创建刚体
        const bodyHandle = this._world.createBody(entity.id, rigidbody, position, rotation);
        if (bodyHandle === null) {
            this.logger.error(`Failed to create physics body for entity ${entity.name}`);
            return;
        }

        // 收集并创建碰撞体
        const colliderHandles: number[] = [];
        const colliders = this._getColliders(entity);
        const scale: IVector2 = { x: transform.scale.x, y: transform.scale.y };

        for (const collider of colliders) {
            const colliderHandle = this._world.createCollider(entity.id, collider, bodyHandle, scale);
            if (colliderHandle !== null) {
                colliderHandles.push(colliderHandle);
            }
        }

        // 记录映射
        this._entityBodies.set(entity.id, { bodyHandle, colliderHandles });

        // 存储初始位置用于插值
        rigidbody._previousPosition = { ...position };
        rigidbody._previousRotation = rotation;
        rigidbody._needsSync = false;

        this.logger.debug(`Created physics body for entity ${entity.name}`);
    }

    /**
     * 移除物理体
     */
    private _removePhysicsBody(entity: Entity): void {
        const mapping = this._entityBodies.get(entity.id);
        if (!mapping) return;

        // 移除碰撞体
        for (const colliderHandle of mapping.colliderHandles) {
            this._world.removeCollider(colliderHandle);
        }

        // 移除刚体
        this._world.removeBody(mapping.bodyHandle);

        // 清除映射
        this._entityBodies.delete(entity.id);

        this.logger.debug(`Removed physics body for entity ${entity.name}`);
    }

    /**
     * 同步 Transform 到物理世界
     */
    private _syncTransformsToPhysics(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const rigidbody = entity.getComponent(Rigidbody2DComponent);
            const transform = entity.getComponent(TransformComponent);
            const mapping = this._entityBodies.get(entity.id);

            if (!rigidbody || !transform || !mapping) continue;

            // 只有当需要同步时才更新物理世界
            if (rigidbody._needsSync) {
                const position: IVector2 = {
                    x: transform.position.x,
                    y: transform.position.y
                };
                const rotation = transform.rotation.z;

                this._world.setBodyTransform(mapping.bodyHandle, position, rotation);
                rigidbody._needsSync = false;
            }

            // 检查碰撞体是否需要重建
            const colliders = this._getColliders(entity);
            const scale: IVector2 = { x: transform.scale.x, y: transform.scale.y };
            for (const collider of colliders) {
                if (collider._needsRebuild) {
                    // 移除旧碰撞体
                    if (collider._colliderHandle !== null) {
                        this._world.removeCollider(collider._colliderHandle);
                        const handleIndex = mapping.colliderHandles.indexOf(collider._colliderHandle);
                        if (handleIndex >= 0) {
                            mapping.colliderHandles.splice(handleIndex, 1);
                        }
                    }

                    // 创建新碰撞体
                    const newHandle = this._world.createCollider(entity.id, collider, mapping.bodyHandle, scale);
                    if (newHandle !== null) {
                        mapping.colliderHandles.push(newHandle);
                    }

                    collider._needsRebuild = false;
                }
            }
        }
    }

    /**
     * 应用待处理的力和冲量
     */
    private _applyPendingForces(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const rigidbody = entity.getComponent(Rigidbody2DComponent);
            const mapping = this._entityBodies.get(entity.id);

            if (!rigidbody || !mapping) continue;

            const bodyHandle = mapping.bodyHandle;

            // 应用力
            if (rigidbody._pendingForce.x !== 0 || rigidbody._pendingForce.y !== 0) {
                this._world.applyForce(bodyHandle, rigidbody._pendingForce);
            }

            // 应用冲量
            if (rigidbody._pendingImpulse.x !== 0 || rigidbody._pendingImpulse.y !== 0) {
                this._world.applyImpulse(bodyHandle, rigidbody._pendingImpulse);
            }

            // 应用扭矩
            if (rigidbody._pendingTorque !== 0) {
                this._world.applyTorque(bodyHandle, rigidbody._pendingTorque);
            }

            // 应用角冲量
            if (rigidbody._pendingAngularImpulse !== 0) {
                this._world.applyAngularImpulse(bodyHandle, rigidbody._pendingAngularImpulse);
            }

            // 设置目标速度
            if (rigidbody._hasTargetVelocity) {
                this._world.setVelocity(bodyHandle, rigidbody._targetVelocity);
            }

            // 设置目标角速度
            if (rigidbody._hasTargetAngularVelocity) {
                this._world.setAngularVelocity(bodyHandle, rigidbody._targetAngularVelocity);
            }

            // 唤醒/休眠
            if (rigidbody._shouldWakeUp) {
                this._world.wakeUp(bodyHandle);
            }
            if (rigidbody._shouldSleep) {
                this._world.sleep(bodyHandle);
            }

            // 清除待处理状态
            rigidbody._clearPendingForces();
        }
    }

    /**
     * 同步物理世界到 Transform
     */
    private _syncPhysicsToTransforms(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const rigidbody = entity.getComponent(Rigidbody2DComponent);
            const transform = entity.getComponent(TransformComponent);
            const mapping = this._entityBodies.get(entity.id);

            if (!rigidbody || !transform || !mapping) continue;

            // 存储上一帧位置用于插值
            rigidbody._previousPosition = {
                x: transform.position.x,
                y: transform.position.y
            };
            rigidbody._previousRotation = transform.rotation.z;

            // 从物理世界获取新位置
            const newPosition = this._world.getBodyPosition(mapping.bodyHandle);
            const newRotation = this._world.getBodyRotation(mapping.bodyHandle);
            const newVelocity = this._world.getBodyVelocity(mapping.bodyHandle);
            const newAngularVelocity = this._world.getBodyAngularVelocity(mapping.bodyHandle);

            if (newPosition) {
                transform.position.x = newPosition.x;
                transform.position.y = newPosition.y;
            }

            if (newRotation !== null) {
                transform.rotation.z = newRotation;
            }

            if (newVelocity) {
                rigidbody.velocity = newVelocity;
            }

            if (newAngularVelocity !== null) {
                rigidbody.angularVelocity = newAngularVelocity;
            }
        }
    }

    /**
     * 处理碰撞事件
     */
    private _handleCollisionEvent(event: CollisionEvent2D): void {
        if (!this.scene) return;

        let eventName: string;
        switch (event.type) {
            case 'enter':
                eventName = PHYSICS_EVENTS.COLLISION_ENTER;
                break;
            case 'stay':
                eventName = PHYSICS_EVENTS.COLLISION_STAY;
                break;
            case 'exit':
                eventName = PHYSICS_EVENTS.COLLISION_EXIT;
                break;
        }

        this.scene.eventSystem.emitSync(eventName, event);
    }

    /**
     * 处理触发器事件
     */
    private _handleTriggerEvent(event: TriggerEvent2D): void {
        if (!this.scene) return;

        let eventName: string;
        switch (event.type) {
            case 'enter':
                eventName = PHYSICS_EVENTS.TRIGGER_ENTER;
                break;
            case 'stay':
                eventName = PHYSICS_EVENTS.TRIGGER_STAY;
                break;
            case 'exit':
                eventName = PHYSICS_EVENTS.TRIGGER_EXIT;
                break;
        }

        this.scene.eventSystem.emitSync(eventName, event);
    }

    /**
     * 获取实体上的所有碰撞体组件
     * @param entity 实体
     */
    private _getColliders(entity: Entity): Collider2DBase[] {
        const colliders: Collider2DBase[] = [];

        // 收集所有类型的碰撞体
        colliders.push(...entity.getComponents(BoxCollider2DComponent));
        colliders.push(...entity.getComponents(CircleCollider2DComponent));
        colliders.push(...entity.getComponents(CapsuleCollider2DComponent));
        colliders.push(...entity.getComponents(PolygonCollider2DComponent));

        return colliders;
    }
}
