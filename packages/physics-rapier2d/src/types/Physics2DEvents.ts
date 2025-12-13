/**
 * Physics 2D Events
 * 2D 物理事件定义
 */

import type { IVector2 } from '@esengine/ecs-framework-math';

/**
 * 碰撞事件类型
 */
export type CollisionEventType = 'enter' | 'stay' | 'exit';

/**
 * 触发器事件类型
 */
export type TriggerEventType = 'enter' | 'stay' | 'exit';

/**
 * 碰撞接触点信息
 */
export interface ContactPoint2D {
    /** 接触点位置 */
    point: IVector2;
    /** 接触点法线 */
    normal: IVector2;
    /** 穿透深度 */
    penetration: number;
    /** 冲量大小 */
    impulse: number;
}

/**
 * 碰撞事件数据
 */
export interface CollisionEvent2D {
    /** 事件类型 */
    type: CollisionEventType;
    /** 实体 A 的 ID */
    entityA: number;
    /** 实体 B 的 ID */
    entityB: number;
    /** 碰撞体 A 的句柄 */
    colliderHandleA: number;
    /** 碰撞体 B 的句柄 */
    colliderHandleB: number;
    /** 接触点列表（仅在 enter 和 stay 时有效） */
    contacts: ContactPoint2D[];
    /** 相对速度 */
    relativeVelocity: IVector2;
    /** 总冲量大小 */
    totalImpulse: number;
}

/**
 * 触发器事件数据
 */
export interface TriggerEvent2D {
    /** 事件类型 */
    type: TriggerEventType;
    /** 触发器实体 ID */
    triggerEntityId: number;
    /** 进入触发器的实体 ID */
    otherEntityId: number;
    /** 触发器碰撞体句柄 */
    triggerColliderHandle: number;
    /** 其他碰撞体句柄 */
    otherColliderHandle: number;
}

/**
 * 物理事件名称常量
 */
export const PHYSICS_EVENTS = {
    /** 碰撞开始 */
    COLLISION_ENTER: 'physics2d:collision-enter',
    /** 碰撞持续 */
    COLLISION_STAY: 'physics2d:collision-stay',
    /** 碰撞结束 */
    COLLISION_EXIT: 'physics2d:collision-exit',
    /** 触发器进入 */
    TRIGGER_ENTER: 'physics2d:trigger-enter',
    /** 触发器持续 */
    TRIGGER_STAY: 'physics2d:trigger-stay',
    /** 触发器离开 */
    TRIGGER_EXIT: 'physics2d:trigger-exit',
    /** 物理世界步进前 */
    PRE_STEP: 'physics2d:pre-step',
    /** 物理世界步进后 */
    POST_STEP: 'physics2d:post-step'
} as const;

/**
 * 物理事件映射类型
 */
export interface Physics2DEventMap {
    [PHYSICS_EVENTS.COLLISION_ENTER]: CollisionEvent2D;
    [PHYSICS_EVENTS.COLLISION_STAY]: CollisionEvent2D;
    [PHYSICS_EVENTS.COLLISION_EXIT]: CollisionEvent2D;
    [PHYSICS_EVENTS.TRIGGER_ENTER]: TriggerEvent2D;
    [PHYSICS_EVENTS.TRIGGER_STAY]: TriggerEvent2D;
    [PHYSICS_EVENTS.TRIGGER_EXIT]: TriggerEvent2D;
    [PHYSICS_EVENTS.PRE_STEP]: { deltaTime: number };
    [PHYSICS_EVENTS.POST_STEP]: { deltaTime: number };
}
