/**
 * Physics2DWorld
 * 2D 物理世界封装
 *
 * 封装 Rapier2D 物理世界，提供确定性物理模拟
 */

import type RAPIER from '@dimforge/rapier2d-compat';
import type {
    Physics2DConfig,
    Vector2,
    RaycastHit2D,
    OverlapResult2D
} from '../types/Physics2DTypes';
import { DEFAULT_PHYSICS_CONFIG, RigidbodyType2D, CollisionDetectionMode2D } from '../types/Physics2DTypes';
import type { CollisionEvent2D, TriggerEvent2D } from '../types/Physics2DEvents';
import type { Rigidbody2DComponent } from '../components/Rigidbody2DComponent';
import type { Collider2DBase } from '../components/Collider2DBase';
import type { BoxCollider2DComponent } from '../components/BoxCollider2DComponent';
import type { CircleCollider2DComponent } from '../components/CircleCollider2DComponent';
import type { CapsuleCollider2DComponent } from '../components/CapsuleCollider2DComponent';
import { CapsuleDirection2D } from '../components/CapsuleCollider2DComponent';
import type { PolygonCollider2DComponent } from '../components/PolygonCollider2DComponent';

/**
 * 物理世界状态
 */
export interface Physics2DWorldState {
    /** 是否已初始化 */
    initialized: boolean;
    /** 累积时间（用于固定时间步长） */
    accumulator: number;
    /** 当前插值因子 */
    alpha: number;
}

/**
 * 碰撞体到实体的映射信息
 */
interface ColliderMapping {
    entityId: number;
    colliderComponent: Collider2DBase;
}

/**
 * 刚体到实体的映射信息
 */
interface BodyMapping {
    entityId: number;
    rigidbodyComponent: Rigidbody2DComponent;
}

/**
 * 2D 物理世界
 *
 * 封装 Rapier2D 物理引擎，提供：
 * - 确定性物理模拟
 * - 刚体和碰撞体管理
 * - 碰撞检测和事件
 * - 射线检测和形状查询
 */
export class Physics2DWorld {
    private _rapier: typeof RAPIER | null = null;
    private _world: RAPIER.World | null = null;
    private _eventQueue: RAPIER.EventQueue | null = null;
    private _config: Physics2DConfig;
    private _state: Physics2DWorldState;

    // 句柄映射
    private _colliderMap: Map<number, ColliderMapping> = new Map();
    private _bodyMap: Map<number, BodyMapping> = new Map();

    // 事件回调
    private _collisionCallbacks: ((event: CollisionEvent2D) => void)[] = [];
    private _triggerCallbacks: ((event: TriggerEvent2D) => void)[] = [];

    // 碰撞状态追踪
    private _activeCollisions: Set<string> = new Set();
    private _activeTriggers: Set<string> = new Set();

    constructor(config: Partial<Physics2DConfig> = {}) {
        this._config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
        this._state = {
            initialized: false,
            accumulator: 0,
            alpha: 0
        };
    }

    /**
     * 初始化物理世界
     * @param rapier Rapier2D 模块
     */
    public async initialize(rapier: typeof RAPIER): Promise<void> {
        if (this._state.initialized) {
            return;
        }

        this._rapier = rapier;

        // 创建物理世界
        const gravity = new rapier.Vector2(this._config.gravity.x, this._config.gravity.y);
        this._world = new rapier.World(gravity);

        // 创建事件队列
        this._eventQueue = new rapier.EventQueue(true);

        this._state.initialized = true;
    }

    /**
     * 销毁物理世界
     */
    public destroy(): void {
        if (this._eventQueue) {
            this._eventQueue.free();
            this._eventQueue = null;
        }

        if (this._world) {
            this._world.free();
            this._world = null;
        }

        this._colliderMap.clear();
        this._bodyMap.clear();
        this._activeCollisions.clear();
        this._activeTriggers.clear();
        this._state.initialized = false;
    }

    /**
     * 重置物理世界状态（保持初始化状态，但清除所有物理对象）
     * 用于场景重载/预览重置
     */
    public reset(): void {
        if (!this._world || !this._rapier) return;

        // 移除所有刚体（这会同时移除附加的碰撞体）
        for (const [handle, mapping] of this._bodyMap) {
            const body = this._world.getRigidBody(handle);
            if (body) {
                this._world.removeRigidBody(body);
            }
            // 清除组件中的句柄引用
            mapping.rigidbodyComponent._bodyHandle = null;
        }

        // 移除所有独立碰撞体（没有附加到刚体的）
        for (const [handle, mapping] of this._colliderMap) {
            const collider = this._world.getCollider(handle);
            if (collider) {
                this._world.removeCollider(collider, true);
            }
            // 清除组件中的句柄引用
            mapping.colliderComponent._colliderHandle = null;
        }

        // 清除映射表
        this._colliderMap.clear();
        this._bodyMap.clear();
        this._activeCollisions.clear();
        this._activeTriggers.clear();

        // 重置累积器
        this._state.accumulator = 0;
        this._state.alpha = 0;
    }

    /**
     * 固定时间步长更新
     * @param deltaTime 帧间隔时间
     */
    public step(deltaTime: number): void {
        if (!this._world || !this._eventQueue) return;

        this._state.accumulator += deltaTime;

        let steps = 0;
        while (this._state.accumulator >= this._config.timestep && steps < this._config.maxSubsteps) {
            this._world.step(this._eventQueue);
            this._state.accumulator -= this._config.timestep;
            steps++;
        }

        // 计算插值因子
        this._state.alpha = this._state.accumulator / this._config.timestep;

        // 处理碰撞事件
        this._processCollisionEvents();
    }

    // ==================== 刚体管理 ====================

    /**
     * 创建刚体
     * @param entityId 实体 ID
     * @param rigidbody 刚体组件
     * @param position 初始位置
     * @param rotation 初始旋转
     */
    public createBody(
        entityId: number,
        rigidbody: Rigidbody2DComponent,
        position: Vector2,
        rotation: number
    ): number | null {
        if (!this._world || !this._rapier) return null;

        // 创建刚体描述
        let bodyDesc: RAPIER.RigidBodyDesc;
        switch (rigidbody.bodyType) {
            case RigidbodyType2D.Dynamic:
                bodyDesc = this._rapier.RigidBodyDesc.dynamic();
                break;
            case RigidbodyType2D.Kinematic:
                bodyDesc = this._rapier.RigidBodyDesc.kinematicPositionBased();
                break;
            case RigidbodyType2D.Static:
            default:
                bodyDesc = this._rapier.RigidBodyDesc.fixed();
                break;
        }

        // 设置刚体属性
        bodyDesc
            .setTranslation(position.x, position.y)
            .setRotation(rotation)
            .setLinearDamping(rigidbody.linearDamping)
            .setAngularDamping(rigidbody.angularDamping)
            .setGravityScale(rigidbody.gravityScale)
            .setCanSleep(rigidbody.canSleep);

        // CCD 设置
        if (rigidbody.collisionDetection === CollisionDetectionMode2D.Continuous) {
            bodyDesc.setCcdEnabled(true);
        }

        // 创建刚体
        const body = this._world.createRigidBody(bodyDesc);
        const handle = body.handle;

        // 设置约束
        if (rigidbody.constraints.freezePositionX || rigidbody.constraints.freezePositionY) {
            body.lockTranslations(
                rigidbody.constraints.freezePositionX && rigidbody.constraints.freezePositionY,
                true
            );
        }
        if (rigidbody.constraints.freezeRotation) {
            body.lockRotations(true, true);
        }

        // 记录映射
        this._bodyMap.set(handle, { entityId, rigidbodyComponent: rigidbody });
        rigidbody._bodyHandle = handle;

        return handle;
    }

    /**
     * 移除刚体
     * @param handle 刚体句柄
     */
    public removeBody(handle: number): void {
        if (!this._world) return;

        const body = this._world.getRigidBody(handle);
        if (body) {
            this._world.removeRigidBody(body);
        }

        const mapping = this._bodyMap.get(handle);
        if (mapping) {
            mapping.rigidbodyComponent._bodyHandle = null;
        }
        this._bodyMap.delete(handle);
    }

    /**
     * 更新刚体属性
     * @param handle 刚体句柄
     * @param rigidbody 刚体组件
     */
    public updateBodyProperties(handle: number, rigidbody: Rigidbody2DComponent): void {
        if (!this._world) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.setLinearDamping(rigidbody.linearDamping);
        body.setAngularDamping(rigidbody.angularDamping);
        body.setGravityScale(rigidbody.gravityScale, true);
    }

    /**
     * 设置刚体位置
     * @param handle 刚体句柄
     * @param position 位置
     * @param rotation 旋转
     */
    public setBodyTransform(handle: number, position: Vector2, rotation: number): void {
        if (!this._world || !this._rapier) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.setTranslation(new this._rapier.Vector2(position.x, position.y), true);
        body.setRotation(rotation, true);
    }

    /**
     * 获取刚体位置
     * @param handle 刚体句柄
     */
    public getBodyPosition(handle: number): Vector2 | null {
        if (!this._world) return null;

        const body = this._world.getRigidBody(handle);
        if (!body) return null;

        const translation = body.translation();
        return { x: translation.x, y: translation.y };
    }

    /**
     * 获取刚体旋转
     * @param handle 刚体句柄
     */
    public getBodyRotation(handle: number): number | null {
        if (!this._world) return null;

        const body = this._world.getRigidBody(handle);
        if (!body) return null;

        return body.rotation();
    }

    /**
     * 获取刚体速度
     * @param handle 刚体句柄
     */
    public getBodyVelocity(handle: number): Vector2 | null {
        if (!this._world) return null;

        const body = this._world.getRigidBody(handle);
        if (!body) return null;

        const vel = body.linvel();
        return { x: vel.x, y: vel.y };
    }

    /**
     * 获取刚体角速度
     * @param handle 刚体句柄
     */
    public getBodyAngularVelocity(handle: number): number | null {
        if (!this._world) return null;

        const body = this._world.getRigidBody(handle);
        if (!body) return null;

        return body.angvel();
    }

    /**
     * 应用力
     * @param handle 刚体句柄
     * @param force 力向量
     */
    public applyForce(handle: number, force: Vector2): void {
        if (!this._world || !this._rapier) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.addForce(new this._rapier.Vector2(force.x, force.y), true);
    }

    /**
     * 应用冲量
     * @param handle 刚体句柄
     * @param impulse 冲量向量
     */
    public applyImpulse(handle: number, impulse: Vector2): void {
        if (!this._world || !this._rapier) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.applyImpulse(new this._rapier.Vector2(impulse.x, impulse.y), true);
    }

    /**
     * 应用扭矩
     * @param handle 刚体句柄
     * @param torque 扭矩值
     */
    public applyTorque(handle: number, torque: number): void {
        if (!this._world) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.addTorque(torque, true);
    }

    /**
     * 应用角冲量
     * @param handle 刚体句柄
     * @param impulse 角冲量值
     */
    public applyAngularImpulse(handle: number, impulse: number): void {
        if (!this._world) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.applyTorqueImpulse(impulse, true);
    }

    /**
     * 设置速度
     * @param handle 刚体句柄
     * @param velocity 速度向量
     */
    public setVelocity(handle: number, velocity: Vector2): void {
        if (!this._world || !this._rapier) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.setLinvel(new this._rapier.Vector2(velocity.x, velocity.y), true);
    }

    /**
     * 设置角速度
     * @param handle 刚体句柄
     * @param angularVelocity 角速度值
     */
    public setAngularVelocity(handle: number, angularVelocity: number): void {
        if (!this._world) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.setAngvel(angularVelocity, true);
    }

    /**
     * 唤醒刚体
     * @param handle 刚体句柄
     */
    public wakeUp(handle: number): void {
        if (!this._world) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.wakeUp();
    }

    /**
     * 使刚体休眠
     * @param handle 刚体句柄
     */
    public sleep(handle: number): void {
        if (!this._world) return;

        const body = this._world.getRigidBody(handle);
        if (!body) return;

        body.sleep();
    }

    // ==================== 碰撞体管理 ====================

    /**
     * 创建碰撞体
     * @param entityId 实体 ID
     * @param collider 碰撞体组件
     * @param bodyHandle 关联的刚体句柄（可选）
     * @param scale Transform 的缩放值（可选）
     */
    public createCollider(entityId: number, collider: Collider2DBase, bodyHandle?: number, scale?: Vector2): number | null {
        if (!this._world || !this._rapier) return null;

        // 创建碰撞体描述
        const colliderDesc = this._createColliderDesc(collider, scale);
        if (!colliderDesc) return null;

        // 创建碰撞体
        let rapierCollider: RAPIER.Collider;
        if (bodyHandle !== undefined) {
            const body = this._world.getRigidBody(bodyHandle);
            if (!body) return null;
            rapierCollider = this._world.createCollider(colliderDesc, body);
            collider._attachedBodyEntityId = this._bodyMap.get(bodyHandle)?.entityId ?? null;
        } else {
            rapierCollider = this._world.createCollider(colliderDesc);
        }

        const handle = rapierCollider.handle;

        // 记录映射
        this._colliderMap.set(handle, { entityId, colliderComponent: collider });
        collider._colliderHandle = handle;

        return handle;
    }

    /**
     * 创建静态碰撞体（不需要刚体）
     * 用于 Tilemap 等静态碰撞场景
     *
     * @param entityId 实体 ID
     * @param position 碰撞体中心位置
     * @param halfExtents 半宽高
     * @param collisionLayer 碰撞层
     * @param collisionMask 碰撞掩码
     * @param friction 摩擦系数
     * @param restitution 弹性系数
     * @param isTrigger 是否为触发器
     */
    public createStaticCollider(
        entityId: number,
        position: Vector2,
        halfExtents: Vector2,
        collisionLayer: number,
        collisionMask: number,
        friction: number,
        restitution: number,
        isTrigger: boolean
    ): number | null {
        if (!this._world || !this._rapier) return null;

        // 创建固定刚体（用于静态碰撞体）
        const bodyDesc = this._rapier.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y);
        const body = this._world.createRigidBody(bodyDesc);

        // 创建碰撞体描述
        const colliderDesc = this._rapier.ColliderDesc.cuboid(halfExtents.x, halfExtents.y)
            .setFriction(friction)
            .setRestitution(restitution)
            .setSensor(isTrigger)
            .setCollisionGroups(this._createCollisionGroups(collisionLayer, collisionMask))
            .setActiveEvents(this._rapier.ActiveEvents.COLLISION_EVENTS);

        // 创建碰撞体
        const collider = this._world.createCollider(colliderDesc, body);
        const handle = collider.handle;

        // 创建虚拟的碰撞体映射（用于事件处理）
        // 注意：这里我们没有实际的 Collider2DBase 组件
        const dummyCollider = {
            _colliderHandle: handle,
            _attachedBodyEntityId: null,
            _needsRebuild: false,
            isTrigger,
            collisionLayer,
            collisionMask,
            friction,
            restitution,
            density: 1,
            offset: { x: 0, y: 0 },
            rotationOffset: 0,
            getShapeType: () => 'box',
            calculateArea: () => halfExtents.x * halfExtents.y * 4,
            calculateAABB: () => ({
                min: { x: position.x - halfExtents.x, y: position.y - halfExtents.y },
                max: { x: position.x + halfExtents.x, y: position.y + halfExtents.y }
            }),
            setLayer: () => {},
            addLayer: () => {},
            removeLayer: () => {},
            isInLayer: () => false,
            setCollisionMask: () => {},
            canCollideWith: () => true,
            markNeedsRebuild: () => {},
            onRemovedFromEntity: () => {},
        } as unknown as Collider2DBase;

        this._colliderMap.set(handle, { entityId, colliderComponent: dummyCollider });

        return handle;
    }

    /**
     * 移除碰撞体
     * @param handle 碰撞体句柄
     */
    public removeCollider(handle: number): void {
        if (!this._world) return;

        const collider = this._world.getCollider(handle);
        if (collider) {
            this._world.removeCollider(collider, true);
        }

        const mapping = this._colliderMap.get(handle);
        if (mapping) {
            mapping.colliderComponent._colliderHandle = null;
        }
        this._colliderMap.delete(handle);
    }

    /**
     * 更新碰撞体属性
     * @param handle 碰撞体句柄
     * @param colliderComponent 碰撞体组件
     */
    public updateColliderProperties(handle: number, colliderComponent: Collider2DBase): void {
        if (!this._world) return;

        const collider = this._world.getCollider(handle);
        if (!collider) return;

        collider.setFriction(colliderComponent.friction);
        collider.setRestitution(colliderComponent.restitution);
        collider.setDensity(colliderComponent.density);
        collider.setSensor(colliderComponent.isTrigger);
        collider.setCollisionGroups(
            this._createCollisionGroups(colliderComponent.collisionLayer, colliderComponent.collisionMask)
        );
    }

    // ==================== 射线检测 ====================

    /**
     * 射线检测
     * @param origin 起点
     * @param direction 方向（归一化）
     * @param maxDistance 最大距离
     * @param collisionMask 碰撞掩码
     */
    public raycast(
        origin: Vector2,
        direction: Vector2,
        maxDistance: number,
        collisionMask: number = 0xffff
    ): RaycastHit2D | null {
        if (!this._world || !this._rapier) return null;

        const ray = new this._rapier.Ray(
            new this._rapier.Vector2(origin.x, origin.y),
            new this._rapier.Vector2(direction.x, direction.y)
        );

        const hit = this._world.castRay(
            ray,
            maxDistance,
            true,
            undefined,
            collisionMask,
            undefined,
            undefined,
            (collider) => {
                const mapping = this._colliderMap.get(collider.handle);
                return mapping !== undefined;
            }
        );

        if (!hit) return null;

        const collider = hit.collider;
        const mapping = this._colliderMap.get(collider.handle);
        if (!mapping) return null;

        const point = ray.pointAt(hit.timeOfImpact);
        const normal = collider.castRayAndGetNormal(ray, maxDistance, true)?.normal;

        return {
            entityId: mapping.entityId,
            point: { x: point.x, y: point.y },
            normal: normal ? { x: normal.x, y: normal.y } : { x: 0, y: 0 },
            distance: hit.timeOfImpact,
            colliderHandle: collider.handle
        };
    }

    /**
     * 射线检测所有命中
     * @param origin 起点
     * @param direction 方向（归一化）
     * @param maxDistance 最大距离
     * @param collisionMask 碰撞掩码
     */
    public raycastAll(
        origin: Vector2,
        direction: Vector2,
        maxDistance: number,
        collisionMask: number = 0xffff
    ): RaycastHit2D[] {
        if (!this._world || !this._rapier) return [];

        const ray = new this._rapier.Ray(
            new this._rapier.Vector2(origin.x, origin.y),
            new this._rapier.Vector2(direction.x, direction.y)
        );

        const results: RaycastHit2D[] = [];

        this._world.intersectionsWithRay(ray, maxDistance, true, (intersection) => {
            const collider = intersection.collider;
            const mapping = this._colliderMap.get(collider.handle);

            if (mapping && (collider.collisionGroups() & collisionMask) !== 0) {
                const point = ray.pointAt(intersection.timeOfImpact);
                const normal = intersection.normal;

                results.push({
                    entityId: mapping.entityId,
                    point: { x: point.x, y: point.y },
                    normal: { x: normal.x, y: normal.y },
                    distance: intersection.timeOfImpact,
                    colliderHandle: collider.handle
                });
            }

            return true; // 继续查找
        });

        return results;
    }

    // ==================== 重叠检测 ====================

    /**
     * 点重叠检测
     * @param point 检测点
     * @param collisionMask 碰撞掩码
     */
    public overlapPoint(point: Vector2, collisionMask: number = 0xffff): OverlapResult2D {
        if (!this._world || !this._rapier) {
            return { entityIds: [], colliderHandles: [] };
        }

        const entityIds: number[] = [];
        const colliderHandles: number[] = [];

        this._world.intersectionsWithPoint(new this._rapier.Vector2(point.x, point.y), (collider) => {
            const mapping = this._colliderMap.get(collider.handle);
            if (mapping && (collider.collisionGroups() & collisionMask) !== 0) {
                entityIds.push(mapping.entityId);
                colliderHandles.push(collider.handle);
            }
            return true;
        });

        return { entityIds, colliderHandles };
    }

    /**
     * 圆形重叠检测
     * @param center 圆心
     * @param radius 半径
     * @param collisionMask 碰撞掩码
     */
    public overlapCircle(center: Vector2, radius: number, collisionMask: number = 0xffff): OverlapResult2D {
        if (!this._world || !this._rapier) {
            return { entityIds: [], colliderHandles: [] };
        }

        const entityIds: number[] = [];
        const colliderHandles: number[] = [];

        const shape = new this._rapier.Ball(radius);
        const shapePos = new this._rapier.Vector2(center.x, center.y);

        this._world.intersectionsWithShape(shapePos, 0, shape, (collider) => {
            const mapping = this._colliderMap.get(collider.handle);
            if (mapping && (collider.collisionGroups() & collisionMask) !== 0) {
                entityIds.push(mapping.entityId);
                colliderHandles.push(collider.handle);
            }
            return true;
        });

        return { entityIds, colliderHandles };
    }

    /**
     * 矩形重叠检测
     * @param center 中心
     * @param halfExtents 半宽高
     * @param rotation 旋转角度
     * @param collisionMask 碰撞掩码
     */
    public overlapBox(
        center: Vector2,
        halfExtents: Vector2,
        rotation: number = 0,
        collisionMask: number = 0xffff
    ): OverlapResult2D {
        if (!this._world || !this._rapier) {
            return { entityIds: [], colliderHandles: [] };
        }

        const entityIds: number[] = [];
        const colliderHandles: number[] = [];

        const shape = new this._rapier.Cuboid(halfExtents.x, halfExtents.y);
        const shapePos = new this._rapier.Vector2(center.x, center.y);

        this._world.intersectionsWithShape(shapePos, rotation, shape, (collider) => {
            const mapping = this._colliderMap.get(collider.handle);
            if (mapping && (collider.collisionGroups() & collisionMask) !== 0) {
                entityIds.push(mapping.entityId);
                colliderHandles.push(collider.handle);
            }
            return true;
        });

        return { entityIds, colliderHandles };
    }

    // ==================== 事件处理 ====================

    /**
     * 注册碰撞事件回调
     * @param callback 回调函数
     */
    public onCollision(callback: (event: CollisionEvent2D) => void): void {
        this._collisionCallbacks.push(callback);
    }

    /**
     * 注册触发器事件回调
     * @param callback 回调函数
     */
    public onTrigger(callback: (event: TriggerEvent2D) => void): void {
        this._triggerCallbacks.push(callback);
    }

    /**
     * 移除所有事件回调
     */
    public clearEventCallbacks(): void {
        this._collisionCallbacks = [];
        this._triggerCallbacks = [];
    }

    // ==================== 配置 ====================

    /**
     * 设置重力
     * @param gravity 重力向量
     */
    public setGravity(gravity: Vector2): void {
        if (!this._world || !this._rapier) return;

        this._config.gravity = gravity;
        this._world.gravity = new this._rapier.Vector2(gravity.x, gravity.y);
    }

    /**
     * 获取重力
     */
    public getGravity(): Vector2 {
        return { ...this._config.gravity };
    }

    /**
     * 获取配置
     */
    public getConfig(): Readonly<Physics2DConfig> {
        return this._config;
    }

    /**
     * 更新物理配置
     */
    public updateConfig(config: Partial<Physics2DConfig>): void {
        if (config.gravity !== undefined) {
            this.setGravity(config.gravity);
        }
        if (config.timestep !== undefined) {
            this._config.timestep = config.timestep;
        }
        if (config.maxSubsteps !== undefined) {
            this._config.maxSubsteps = config.maxSubsteps;
        }
        if (config.velocityIterations !== undefined) {
            this._config.velocityIterations = config.velocityIterations;
        }
        if (config.positionIterations !== undefined) {
            this._config.positionIterations = config.positionIterations;
        }
        if (config.allowSleep !== undefined) {
            this._config.allowSleep = config.allowSleep;
        }
    }

    /**
     * 获取状态
     */
    public getState(): Readonly<Physics2DWorldState> {
        return this._state;
    }

    /**
     * 获取插值因子
     */
    public getAlpha(): number {
        return this._state.alpha;
    }

    /**
     * 获取实体映射
     * @param colliderHandle 碰撞体句柄
     */
    public getEntityByCollider(colliderHandle: number): number | null {
        const mapping = this._colliderMap.get(colliderHandle);
        return mapping?.entityId ?? null;
    }

    /**
     * 获取实体映射
     * @param bodyHandle 刚体句柄
     */
    public getEntityByBody(bodyHandle: number): number | null {
        const mapping = this._bodyMap.get(bodyHandle);
        return mapping?.entityId ?? null;
    }

    // ==================== 私有方法 ====================

    /**
     * 创建碰撞形状
     */
    private _createShape(collider: Collider2DBase): RAPIER.Shape | null {
        if (!this._rapier) return null;

        const shapeType = collider.getShapeType();

        switch (shapeType) {
            case 'box': {
                const box = collider as BoxCollider2DComponent;
                return new this._rapier.Cuboid(box.halfWidth, box.halfHeight);
            }
            case 'circle': {
                const circle = collider as CircleCollider2DComponent;
                return new this._rapier.Ball(circle.radius);
            }
            case 'capsule': {
                const capsule = collider as CapsuleCollider2DComponent;
                if (capsule.direction === CapsuleDirection2D.Vertical) {
                    return new this._rapier.Capsule(capsule.halfHeight, capsule.radius);
                } else {
                    // 水平胶囊需要旋转处理，这里简化为使用相同的形状
                    return new this._rapier.Capsule(capsule.halfHeight, capsule.radius);
                }
            }
            case 'polygon': {
                const polygon = collider as PolygonCollider2DComponent;
                const vertices = new Float32Array(polygon.vertices.length * 2);
                for (let i = 0; i < polygon.vertices.length; i++) {
                    vertices[i * 2] = polygon.vertices[i].x;
                    vertices[i * 2 + 1] = polygon.vertices[i].y;
                }
                // 第二个参数 false 表示让 Rapier 计算凸包
                return new this._rapier.ConvexPolygon(vertices, false);
            }
            default:
                console.warn(`Unknown collider shape type: ${shapeType}`);
                return null;
        }
    }

    /**
     * 创建碰撞体描述
     */
    private _createColliderDesc(collider: Collider2DBase, scale?: Vector2): RAPIER.ColliderDesc | null {
        if (!this._rapier) return null;

        const sx = scale?.x ?? 1;
        const sy = scale?.y ?? 1;
        const shapeType = collider.getShapeType();
        let colliderDesc: RAPIER.ColliderDesc | null = null;

        switch (shapeType) {
            case 'box': {
                const box = collider as BoxCollider2DComponent;
                colliderDesc = this._rapier.ColliderDesc.cuboid(box.halfWidth * sx, box.halfHeight * sy);
                break;
            }
            case 'circle': {
                const circle = collider as CircleCollider2DComponent;
                const uniformScale = Math.max(Math.abs(sx), Math.abs(sy));
                colliderDesc = this._rapier.ColliderDesc.ball(circle.radius * uniformScale);
                break;
            }
            case 'capsule': {
                const capsule = collider as CapsuleCollider2DComponent;
                colliderDesc = this._rapier.ColliderDesc.capsule(capsule.halfHeight * sy, capsule.radius * sx);
                break;
            }
            case 'polygon': {
                const polygon = collider as PolygonCollider2DComponent;
                const vertices = new Float32Array(polygon.vertices.length * 2);
                for (let i = 0; i < polygon.vertices.length; i++) {
                    vertices[i * 2] = polygon.vertices[i].x * sx;
                    vertices[i * 2 + 1] = polygon.vertices[i].y * sy;
                }
                colliderDesc = this._rapier.ColliderDesc.convexHull(vertices);
                break;
            }
            default:
                console.warn(`Unknown collider shape type: ${shapeType}`);
                return null;
        }

        if (!colliderDesc) return null;

        // 配置碰撞体属性
        colliderDesc
            .setTranslation(collider.offset.x * sx, collider.offset.y * sy)
            .setRotation(collider.rotationOffset)
            .setFriction(collider.friction)
            .setRestitution(collider.restitution)
            .setDensity(collider.density)
            .setSensor(collider.isTrigger)
            .setCollisionGroups(this._createCollisionGroups(collider.collisionLayer, collider.collisionMask))
            .setActiveEvents(this._rapier.ActiveEvents.COLLISION_EVENTS);

        return colliderDesc;
    }

    /**
     * 创建碰撞组
     */
    private _createCollisionGroups(layer: number, mask: number): number {
        // Rapier 使用 32 位整数，高 16 位是 membership，低 16 位是 filter
        return ((layer & 0xffff) << 16) | (mask & 0xffff);
    }

    /**
     * 处理碰撞事件
     */
    private _processCollisionEvents(): void {
        if (!this._eventQueue || !this._world) return;

        const newCollisions = new Set<string>();
        const newTriggers = new Set<string>();

        // 处理碰撞事件
        this._eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            const mapping1 = this._colliderMap.get(handle1);
            const mapping2 = this._colliderMap.get(handle2);

            if (!mapping1 || !mapping2) return;

            const pairKey = handle1 < handle2 ? `${handle1}-${handle2}` : `${handle2}-${handle1}`;
            const isTrigger = mapping1.colliderComponent.isTrigger || mapping2.colliderComponent.isTrigger;

            if (isTrigger) {
                // 触发器事件
                if (started) {
                    newTriggers.add(pairKey);

                    if (!this._activeTriggers.has(pairKey)) {
                        // Enter
                        this._emitTriggerEvent('enter', mapping1, mapping2, handle1, handle2);
                    }
                }
            } else {
                // 碰撞事件
                if (started) {
                    newCollisions.add(pairKey);

                    if (!this._activeCollisions.has(pairKey)) {
                        // Enter
                        this._emitCollisionEvent('enter', mapping1, mapping2, handle1, handle2);
                    }
                }
            }
        });

        // 处理 Stay 和 Exit 事件
        this._processStayAndExitEvents(newCollisions, this._activeCollisions, false);
        this._processStayAndExitEvents(newTriggers, this._activeTriggers, true);

        // 更新活跃碰撞
        this._activeCollisions = newCollisions;
        this._activeTriggers = newTriggers;
    }

    /**
     * 处理持续和退出事件
     */
    private _processStayAndExitEvents(newSet: Set<string>, activeSet: Set<string>, isTrigger: boolean): void {
        for (const pairKey of activeSet) {
            if (newSet.has(pairKey)) {
                // Stay
                const [h1, h2] = pairKey.split('-').map(Number);
                const mapping1 = this._colliderMap.get(h1);
                const mapping2 = this._colliderMap.get(h2);

                if (mapping1 && mapping2) {
                    if (isTrigger) {
                        this._emitTriggerEvent('stay', mapping1, mapping2, h1, h2);
                    } else {
                        this._emitCollisionEvent('stay', mapping1, mapping2, h1, h2);
                    }
                }
            } else {
                // Exit
                const [h1, h2] = pairKey.split('-').map(Number);
                const mapping1 = this._colliderMap.get(h1);
                const mapping2 = this._colliderMap.get(h2);

                if (mapping1 && mapping2) {
                    if (isTrigger) {
                        this._emitTriggerEvent('exit', mapping1, mapping2, h1, h2);
                    } else {
                        this._emitCollisionEvent('exit', mapping1, mapping2, h1, h2);
                    }
                }
            }
        }
    }

    /**
     * 发送碰撞事件
     */
    private _emitCollisionEvent(
        type: 'enter' | 'stay' | 'exit',
        mapping1: ColliderMapping,
        mapping2: ColliderMapping,
        handle1: number,
        handle2: number
    ): void {
        const event: CollisionEvent2D = {
            type,
            entityA: mapping1.entityId,
            entityB: mapping2.entityId,
            colliderHandleA: handle1,
            colliderHandleB: handle2,
            contacts: [], // TODO: 提取接触点信息
            relativeVelocity: { x: 0, y: 0 }, // TODO: 计算相对速度
            totalImpulse: 0 // TODO: 计算总冲量
        };

        for (const callback of this._collisionCallbacks) {
            callback(event);
        }
    }

    /**
     * 发送触发器事件
     */
    private _emitTriggerEvent(
        type: 'enter' | 'stay' | 'exit',
        mapping1: ColliderMapping,
        mapping2: ColliderMapping,
        handle1: number,
        handle2: number
    ): void {
        // 确定哪个是触发器
        const trigger = mapping1.colliderComponent.isTrigger ? mapping1 : mapping2;
        const other = mapping1.colliderComponent.isTrigger ? mapping2 : mapping1;
        const triggerHandle = trigger === mapping1 ? handle1 : handle2;
        const otherHandle = trigger === mapping1 ? handle2 : handle1;

        const event: TriggerEvent2D = {
            type,
            triggerEntityId: trigger.entityId,
            otherEntityId: other.entityId,
            triggerColliderHandle: triggerHandle,
            otherColliderHandle: otherHandle
        };

        for (const callback of this._triggerCallbacks) {
            callback(event);
        }
    }
}
