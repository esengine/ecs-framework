/**
 * Rigidbody2D Component
 * 2D 刚体组件
 */

import { Component, Property, Serialize, Serializable, ECSComponent } from '@esengine/ecs-framework';
import type { IVector2 } from '@esengine/ecs-framework-math';
import { RigidbodyType2D, CollisionDetectionMode2D } from '../types/Physics2DTypes';

/**
 * 刚体约束配置
 */
export interface RigidbodyConstraints2D {
    /** 冻结 X 轴位置 */
    freezePositionX: boolean;
    /** 冻结 Y 轴位置 */
    freezePositionY: boolean;
    /** 冻结旋转 */
    freezeRotation: boolean;
}

/**
 * 2D 刚体组件
 *
 * 用于给实体添加物理模拟能力。必须与 TransformComponent 配合使用。
 *
 * @example
 * ```typescript
 * const entity = scene.createEntity('Player');
 * entity.addComponent(TransformComponent);
 * const rb = entity.addComponent(Rigidbody2DComponent);
 * rb.bodyType = RigidbodyType2D.Dynamic;
 * rb.mass = 1;
 * rb.gravityScale = 1;
 * ```
 */
@ECSComponent('Rigidbody2D')
@Serializable({ version: 1, typeId: 'Rigidbody2D' })
export class Rigidbody2DComponent extends Component {
    // ==================== 基础属性 ====================

    /**
     * 刚体类型
     * - Dynamic: 动态刚体，受力和碰撞影响
     * - Kinematic: 运动学刚体，手动控制
     * - Static: 静态刚体，不移动
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Body Type',
        options: [
            { label: 'Dynamic', value: 0 },
            { label: 'Kinematic', value: 1 },
            { label: 'Static', value: 2 }
        ]
    })
    public bodyType: RigidbodyType2D = RigidbodyType2D.Dynamic;

    /**
     * 质量（kg）
     * 仅对 Dynamic 刚体有效
     */
    @Serialize()
    @Property({ type: 'number', label: 'Mass', min: 0.001, step: 0.1 })
    public mass: number = 1;

    /**
     * 重力缩放
     * 0 = 不受重力影响，1 = 正常重力，-1 = 反重力
     */
    @Serialize()
    @Property({ type: 'number', label: 'Gravity Scale', min: -10, max: 10, step: 0.1 })
    public gravityScale: number = 1;

    // ==================== 阻尼 ====================

    /**
     * 线性阻尼
     * 值越大，移动速度衰减越快
     */
    @Serialize()
    @Property({ type: 'number', label: 'Linear Damping', min: 0, max: 100, step: 0.1 })
    public linearDamping: number = 0;

    /**
     * 角速度阻尼
     * 值越大，旋转速度衰减越快
     */
    @Serialize()
    @Property({ type: 'number', label: 'Angular Damping', min: 0, max: 100, step: 0.01 })
    public angularDamping: number = 0.05;

    // ==================== 约束 ====================

    /**
     * 冻结 X 轴位置
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Freeze Position X' })
    public freezePositionX: boolean = false;

    /**
     * 冻结 Y 轴位置
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Freeze Position Y' })
    public freezePositionY: boolean = false;

    /**
     * 冻结旋转
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Freeze Rotation' })
    public freezeRotation: boolean = false;

    /**
     * 运动约束（兼容旧代码）
     * @deprecated 使用 freezePositionX, freezePositionY, freezeRotation 代替
     */
    public get constraints(): RigidbodyConstraints2D {
        return {
            freezePositionX: this.freezePositionX,
            freezePositionY: this.freezePositionY,
            freezeRotation: this.freezeRotation
        };
    }

    public set constraints(value: RigidbodyConstraints2D) {
        this.freezePositionX = value.freezePositionX;
        this.freezePositionY = value.freezePositionY;
        this.freezeRotation = value.freezeRotation;
    }

    // ==================== 碰撞检测 ====================

    /**
     * 碰撞检测模式
     * - Discrete: 离散检测，性能好
     * - Continuous: 连续检测，防穿透
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Collision Detection',
        options: [
            { label: 'Discrete', value: 0 },
            { label: 'Continuous', value: 1 }
        ]
    })
    public collisionDetection: CollisionDetectionMode2D = CollisionDetectionMode2D.Discrete;

    // ==================== 休眠 ====================

    /**
     * 是否允许休眠
     * 休眠的刚体不参与物理计算，提高性能
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Can Sleep' })
    public canSleep: boolean = true;

    /**
     * 是否处于唤醒状态
     */
    @Property({ type: 'boolean', label: 'Is Awake', readOnly: true })
    public isAwake: boolean = true;

    // ==================== 运行时状态（不序列化）====================

    /**
     * 当前线速度
     */
    public velocity: IVector2 = { x: 0, y: 0 };

    /**
     * 当前角速度（弧度/秒）
     */
    public angularVelocity: number = 0;

    // ==================== 内部状态 ====================

    /**
     * Rapier 刚体句柄
     * @internal
     */
    public _bodyHandle: number | null = null;

    /**
     * 是否需要同步 Transform 到物理世界
     * @internal
     */
    public _needsSync: boolean = true;

    /**
     * 上一帧的位置（用于插值）
     * @internal
     */
    public _previousPosition: IVector2 = { x: 0, y: 0 };

    /**
     * 上一帧的旋转角度
     * @internal
     */
    public _previousRotation: number = 0;

    // ==================== API 方法 ====================

    /**
     * 添加力（在下一个物理步进中应用）
     * 这是一个标记方法，实际力的应用由 Physics2DSystem 处理
     */
    public addForce(force: IVector2): void {
        this._pendingForce.x += force.x;
        this._pendingForce.y += force.y;
    }

    /**
     * 添加冲量（立即改变速度）
     */
    public addImpulse(impulse: IVector2): void {
        this._pendingImpulse.x += impulse.x;
        this._pendingImpulse.y += impulse.y;
    }

    /**
     * 添加扭矩
     */
    public addTorque(torque: number): void {
        this._pendingTorque += torque;
    }

    /**
     * 添加角冲量
     */
    public addAngularImpulse(impulse: number): void {
        this._pendingAngularImpulse += impulse;
    }

    /**
     * 设置线速度
     */
    public setVelocity(velocity: IVector2): void {
        this._targetVelocity = { ...velocity };
        this._hasTargetVelocity = true;
    }

    /**
     * 设置角速度
     */
    public setAngularVelocity(angularVelocity: number): void {
        this._targetAngularVelocity = angularVelocity;
        this._hasTargetAngularVelocity = true;
    }

    /**
     * 唤醒刚体
     */
    public wakeUp(): void {
        this._shouldWakeUp = true;
    }

    /**
     * 使刚体休眠
     */
    public sleep(): void {
        this._shouldSleep = true;
    }

    /**
     * 标记需要重新同步 Transform
     */
    public markNeedsSync(): void {
        this._needsSync = true;
    }

    // ==================== 待处理的力和冲量 ====================

    /** @internal */
    public _pendingForce: IVector2 = { x: 0, y: 0 };
    /** @internal */
    public _pendingImpulse: IVector2 = { x: 0, y: 0 };
    /** @internal */
    public _pendingTorque: number = 0;
    /** @internal */
    public _pendingAngularImpulse: number = 0;
    /** @internal */
    public _targetVelocity: IVector2 = { x: 0, y: 0 };
    /** @internal */
    public _hasTargetVelocity: boolean = false;
    /** @internal */
    public _targetAngularVelocity: number = 0;
    /** @internal */
    public _hasTargetAngularVelocity: boolean = false;
    /** @internal */
    public _shouldWakeUp: boolean = false;
    /** @internal */
    public _shouldSleep: boolean = false;

    /**
     * 清除待处理的力和冲量
     * @internal
     */
    public _clearPendingForces(): void {
        this._pendingForce.x = 0;
        this._pendingForce.y = 0;
        this._pendingImpulse.x = 0;
        this._pendingImpulse.y = 0;
        this._pendingTorque = 0;
        this._pendingAngularImpulse = 0;
        this._hasTargetVelocity = false;
        this._hasTargetAngularVelocity = false;
        this._shouldWakeUp = false;
        this._shouldSleep = false;
    }

    public override onRemovedFromEntity(): void {
        // 清理句柄，实际的物理对象清理由系统处理
        this._bodyHandle = null;
        this._clearPendingForces();
    }
}
