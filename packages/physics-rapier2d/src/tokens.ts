/**
 * 物理模块服务令牌
 * Physics module service tokens
 *
 * 定义 physics-rapier2d 模块导出的服务令牌和接口。
 * 谁定义接口，谁导出 Token。
 *
 * Defines service tokens and interfaces exported by physics-rapier2d module.
 * Who defines the interface, who exports the Token.
 *
 * @example
 * ```typescript
 * // 消费方导入 Token | Consumer imports Token
 * import { Physics2DQueryToken, type IPhysics2DQuery } from '@esengine/physics-rapier2d';
 *
 * // 获取服务 | Get service
 * const physicsQuery = context.services.get(Physics2DQueryToken);
 * if (physicsQuery) {
 *     physicsQuery.raycast(...);
 * }
 * ```
 */

import { createServiceToken } from '@esengine/ecs-framework';
import type { Physics2DSystem } from './systems/Physics2DSystem';

// ============================================================================
// 共享物理接口 | Shared Physics Interfaces
// ============================================================================

/**
 * 2D 物理查询接口
 * 2D Physics query interface
 *
 * 跨模块共享的物理查询契约。
 * 由 Physics2DWorld 实现，粒子等模块可选依赖。
 *
 * Cross-module shared physics query contract.
 * Implemented by Physics2DWorld, optionally depended by particle and other modules.
 */
export interface IPhysics2DQuery {
    /**
     * 圆形区域检测
     * Circle overlap detection
     *
     * @param center 圆心 | Circle center
     * @param radius 半径 | Radius
     * @param collisionMask 碰撞掩码 | Collision mask
     * @returns 检测结果 | Detection result
     */
    overlapCircle(
        center: { x: number; y: number },
        radius: number,
        collisionMask?: number
    ): { entityIds: number[]; colliderHandles: number[] };

    /**
     * 射线检测
     * Raycast detection
     *
     * @param origin 起点 | Origin point
     * @param direction 方向（归一化）| Direction (normalized)
     * @param maxDistance 最大距离 | Max distance
     * @param collisionMask 碰撞掩码 | Collision mask
     * @returns 命中结果或 null | Hit result or null
     */
    raycast(
        origin: { x: number; y: number },
        direction: { x: number; y: number },
        maxDistance: number,
        collisionMask?: number
    ): {
        entityId: number;
        point: { x: number; y: number };
        normal: { x: number; y: number };
        distance: number;
        colliderHandle: number;
    } | null;
}

/**
 * 2D 物理世界接口
 * 2D Physics world interface
 *
 * 跨模块共享的物理世界契约。
 * 由 Physics2DWorld 实现，tilemap 等模块可选依赖。
 *
 * Cross-module shared physics world contract.
 * Implemented by Physics2DWorld, optionally depended by tilemap and other modules.
 */
export interface IPhysics2DWorld {
    /**
     * 创建静态碰撞体
     * Create static collider
     *
     * @param entityId 实体 ID | Entity ID
     * @param position 碰撞体中心位置 | Collider center position
     * @param halfExtents 半宽高 | Half extents
     * @param collisionLayer 碰撞层 | Collision layer
     * @param collisionMask 碰撞掩码 | Collision mask
     * @param friction 摩擦系数 | Friction coefficient
     * @param restitution 弹性系数 | Restitution coefficient
     * @param isTrigger 是否为触发器 | Whether is trigger
     * @returns 碰撞体句柄或 null | Collider handle or null
     */
    createStaticCollider(
        entityId: number,
        position: { x: number; y: number },
        halfExtents: { x: number; y: number },
        collisionLayer: number,
        collisionMask: number,
        friction: number,
        restitution: number,
        isTrigger: boolean
    ): number | null;

    /**
     * 移除碰撞体
     * Remove collider
     *
     * @param handle 碰撞体句柄 | Collider handle
     */
    removeCollider(handle: number): void;
}

// ============================================================================
// 物理模块特有的接口 | Physics module specific interfaces
// ============================================================================

/**
 * 物理配置
 * Physics configuration
 */
export interface PhysicsConfig {
    gravity?: { x: number; y: number };
    timestep?: number;
}

/**
 * 碰撞层配置接口
 * Collision layer config interface
 *
 * 跨模块共享的碰撞层配置契约。
 * Cross-module shared collision layer config contract.
 */
export interface ICollisionLayerConfig {
    /**
     * 获取所有层定义
     * Get all layer definitions
     */
    getLayers(): ReadonlyArray<{ name: string }>;

    /**
     * 添加监听器
     * Add listener
     */
    addListener(callback: () => void): void;

    /**
     * 移除监听器
     * Remove listener
     */
    removeListener(callback: () => void): void;
}

// ============================================================================
// 服务令牌 | Service Tokens
// ============================================================================

/**
 * 2D 物理查询服务令牌
 * 2D Physics query service token
 *
 * 用于获取物理查询能力（射线检测、区域检测等）。
 * For getting physics query capabilities (raycast, overlap detection, etc.).
 */
export const Physics2DQueryToken = createServiceToken<IPhysics2DQuery>('physics2DQuery');

/**
 * 2D 物理世界服务令牌
 * 2D Physics world service token
 *
 * 用于获取物理世界实例（需要底层访问时使用）。
 * For getting physics world instance (when low-level access is needed).
 */
export const Physics2DWorldToken = createServiceToken<IPhysics2DWorld>('physics2DWorld');

/**
 * 物理系统令牌
 * Physics system token
 *
 * 用于获取完整的物理系统实例。
 * For getting the full physics system instance.
 */
export const Physics2DSystemToken = createServiceToken<Physics2DSystem>('physics2DSystem');

/**
 * 物理配置令牌
 * Physics config token
 *
 * 用于传入物理配置（如重力、时间步）。
 * For passing physics configuration (gravity, timestep, etc.).
 */
export const PhysicsConfigToken = createServiceToken<PhysicsConfig>('physicsConfig');

/**
 * 碰撞层配置令牌
 * Collision layer config token
 *
 * 用于获取碰撞层配置服务。
 * For getting collision layer config service.
 */
export const CollisionLayerConfigToken = createServiceToken<ICollisionLayerConfig>('collisionLayerConfig');
