/**
 * Physics 2D Types
 * 2D 物理引擎类型定义
 */

/**
 * 刚体类型
 */
export enum RigidbodyType2D {
    /** 动态刚体，受力和碰撞影响 */
    Dynamic = 0,
    /** 运动学刚体，手动控制位置，不受力影响 */
    Kinematic = 1,
    /** 静态刚体，不移动，用于地形等 */
    Static = 2
}

/**
 * 碰撞检测模式
 */
export enum CollisionDetectionMode2D {
    /** 离散检测，性能好但可能穿透 */
    Discrete = 0,
    /** 连续检测，防止高速物体穿透 */
    Continuous = 1
}

// 使用 IVector2 接口 | Use IVector2 interface
import type { IVector2 } from '@esengine/ecs-framework-math';

/**
 * 物理配置
 */
export interface Physics2DConfig {
    /** 重力向量 */
    gravity: IVector2;
    /** 固定时间步长（秒） */
    timestep: number;
    /** 每帧最大子步数 */
    maxSubsteps: number;
    /** 速度求解器迭代次数 */
    velocityIterations: number;
    /** 位置求解器迭代次数 */
    positionIterations: number;
    /** 是否启用休眠 */
    allowSleep: boolean;
}

/**
 * 默认物理配置
 */
export const DEFAULT_PHYSICS_CONFIG: Physics2DConfig = {
    gravity: { x: 0, y: -9.81 },
    timestep: 1 / 60,
    maxSubsteps: 8,
    velocityIterations: 4,
    positionIterations: 1,
    allowSleep: true
};

/**
 * 碰撞层定义
 */
export enum CollisionLayer2D {
    Default = 1 << 0,
    Player = 1 << 1,
    Enemy = 1 << 2,
    Projectile = 1 << 3,
    Ground = 1 << 4,
    Platform = 1 << 5,
    Trigger = 1 << 6,
    All = 0xFFFF
}

/**
 * 力的模式
 */
export enum ForceMode2D {
    /** 持续力（考虑质量） */
    Force = 0,
    /** 瞬时冲量（考虑质量） */
    Impulse = 1,
    /** 直接设置速度变化（不考虑质量） */
    VelocityChange = 2,
    /** 持续加速度（不考虑质量） */
    Acceleration = 3
}

/**
 * 射线检测结果
 */
export interface RaycastHit2D {
    /** 命中的实体 ID */
    entityId: number;
    /** 命中点 */
    point: IVector2;
    /** 命中面的法线 */
    normal: IVector2;
    /** 射线起点到命中点的距离 */
    distance: number;
    /** 命中的碰撞体句柄 */
    colliderHandle: number;
}

/**
 * 形状投射结果
 */
export interface ShapeCastHit2D extends RaycastHit2D {
    /** 投射开始时与命中物体的穿透深度 */
    penetration: number;
}

/**
 * 重叠检测结果
 */
export interface OverlapResult2D {
    /** 重叠的实体 ID 列表 */
    entityIds: number[];
    /** 重叠的碰撞体句柄列表 */
    colliderHandles: number[];
}

/**
 * 物理材质预设
 */
export enum PhysicsMaterial2DPreset {
    /** 默认材质 */
    Default = 0,
    /** 弹性材质 */
    Bouncy = 1,
    /** 光滑材质（低摩擦） */
    Slippery = 2,
    /** 粘性材质（高摩擦） */
    Sticky = 3,
    /** 金属材质 */
    Metal = 4,
    /** 橡胶材质 */
    Rubber = 5
}

/**
 * 获取预设材质参数
 */
export function getPhysicsMaterialPreset(preset: PhysicsMaterial2DPreset): { friction: number; restitution: number } {
    switch (preset) {
        case PhysicsMaterial2DPreset.Bouncy:
            return { friction: 0.2, restitution: 0.9 };
        case PhysicsMaterial2DPreset.Slippery:
            return { friction: 0.05, restitution: 0.1 };
        case PhysicsMaterial2DPreset.Sticky:
            return { friction: 1.0, restitution: 0.0 };
        case PhysicsMaterial2DPreset.Metal:
            return { friction: 0.4, restitution: 0.3 };
        case PhysicsMaterial2DPreset.Rubber:
            return { friction: 0.8, restitution: 0.7 };
        case PhysicsMaterial2DPreset.Default:
        default:
            return { friction: 0.5, restitution: 0.0 };
    }
}

/**
 * 关节类型
 */
export enum JointType2D {
    /** 固定关节 */
    Fixed = 0,
    /** 铰链关节（旋转） */
    Revolute = 1,
    /** 棱柱关节（滑动） */
    Prismatic = 2,
    /** 弹簧关节 */
    Spring = 3,
    /** 绳索关节 */
    Rope = 4,
    /** 距离关节 */
    Distance = 5
}
