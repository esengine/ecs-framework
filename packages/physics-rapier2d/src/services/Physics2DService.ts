/**
 * Physics2DService
 * 2D 物理服务
 *
 * 提供全局物理配置和实用方法
 */

import type { IService } from '@esengine/ecs-framework';
import type { IVector2 } from '@esengine/ecs-framework-math';
import type { Physics2DConfig, RaycastHit2D, OverlapResult2D } from '../types/Physics2DTypes';
import { DEFAULT_PHYSICS_CONFIG, CollisionLayer2D } from '../types/Physics2DTypes';
import type { Physics2DSystem } from '../systems/Physics2DSystem';

/**
 * 2D 物理服务
 *
 * 提供场景级别的物理配置和全局查询方法。
 * 作为服务注册到 ServiceContainer 中。
 *
 * @example
 * ```typescript
 * // 从服务容器获取
 * const physicsService = scene.services.resolve(Physics2DService);
 *
 * // 使用射线检测
 * const hit = physicsService.raycast(origin, direction, 100);
 * if (hit) {
 *     console.log('Hit entity:', hit.entityId);
 * }
 * ```
 */
export class Physics2DService implements IService {
    private _config: Physics2DConfig = { ...DEFAULT_PHYSICS_CONFIG };
    private _physicsSystem: Physics2DSystem | null = null;

    /**
     * 设置物理系统引用
     * @internal
     */
    public setPhysicsSystem(system: Physics2DSystem): void {
        this._physicsSystem = system;
    }

    /**
     * 获取物理系统
     */
    public getPhysicsSystem(): Physics2DSystem | null {
        return this._physicsSystem;
    }

    // ==================== 配置 ====================

    /**
     * 获取物理配置
     */
    public getConfig(): Readonly<Physics2DConfig> {
        return this._config;
    }

    /**
     * 设置重力
     */
    public setGravity(gravity: IVector2): void {
        this._config.gravity = { ...gravity };
        this._physicsSystem?.setGravity(gravity);
    }

    /**
     * 获取重力
     */
    public getGravity(): IVector2 {
        return this._physicsSystem?.getGravity() ?? { ...this._config.gravity };
    }

    /**
     * 设置时间步长
     */
    public setTimestep(timestep: number): void {
        this._config.timestep = timestep;
    }

    /**
     * 获取时间步长
     */
    public getTimestep(): number {
        return this._config.timestep;
    }

    // ==================== 查询 ====================

    /**
     * 射线检测（第一个命中）
     * @param origin 起点
     * @param direction 方向（归一化）
     * @param maxDistance 最大距离
     * @param collisionMask 碰撞掩码（默认所有层）
     */
    public raycast(
        origin: IVector2,
        direction: IVector2,
        maxDistance: number,
        collisionMask: number = CollisionLayer2D.All
    ): RaycastHit2D | null {
        return this._physicsSystem?.raycast(origin, direction, maxDistance, collisionMask) ?? null;
    }

    /**
     * 射线检测（所有命中）
     * @param origin 起点
     * @param direction 方向（归一化）
     * @param maxDistance 最大距离
     * @param collisionMask 碰撞掩码（默认所有层）
     */
    public raycastAll(
        origin: IVector2,
        direction: IVector2,
        maxDistance: number,
        collisionMask: number = CollisionLayer2D.All
    ): RaycastHit2D[] {
        return this._physicsSystem?.raycastAll(origin, direction, maxDistance, collisionMask) ?? [];
    }

    /**
     * 点重叠检测
     * @param point 检测点
     * @param collisionMask 碰撞掩码
     */
    public overlapPoint(point: IVector2, collisionMask: number = CollisionLayer2D.All): OverlapResult2D {
        return this._physicsSystem?.overlapPoint(point, collisionMask) ?? { entityIds: [], colliderHandles: [] };
    }

    /**
     * 圆形重叠检测
     * @param center 圆心
     * @param radius 半径
     * @param collisionMask 碰撞掩码
     */
    public overlapCircle(
        center: IVector2,
        radius: number,
        collisionMask: number = CollisionLayer2D.All
    ): OverlapResult2D {
        return this._physicsSystem?.overlapCircle(center, radius, collisionMask) ?? { entityIds: [], colliderHandles: [] };
    }

    /**
     * 矩形重叠检测
     * @param center 中心点
     * @param halfExtents 半宽高
     * @param rotation 旋转角度
     * @param collisionMask 碰撞掩码
     */
    public overlapBox(
        center: IVector2,
        halfExtents: IVector2,
        rotation: number = 0,
        collisionMask: number = CollisionLayer2D.All
    ): OverlapResult2D {
        return (
            this._physicsSystem?.overlapBox(center, halfExtents, rotation, collisionMask) ?? {
                entityIds: [],
                colliderHandles: []
            }
        );
    }

    // ==================== 工具方法 ====================

    /**
     * 归一化向量
     */
    public normalize(v: IVector2): IVector2 {
        const length = Math.sqrt(v.x * v.x + v.y * v.y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: v.x / length, y: v.y / length };
    }

    /**
     * 计算两点之间的距离
     */
    public distance(a: IVector2, b: IVector2): number {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算向量长度
     */
    public magnitude(v: IVector2): number {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    /**
     * 向量点积
     */
    public dot(a: IVector2, b: IVector2): number {
        return a.x * b.x + a.y * b.y;
    }

    /**
     * 向量叉积（返回标量，2D 特有）
     */
    public cross(a: IVector2, b: IVector2): number {
        return a.x * b.y - a.y * b.x;
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        this._physicsSystem = null;
    }
}
