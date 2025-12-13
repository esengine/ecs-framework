/**
 * Collider2D Base Component
 * 2D 碰撞体基类组件
 */

import { Component, Property, Serialize } from '@esengine/ecs-framework';
import type { IVector2 } from '@esengine/ecs-framework-math';
import { CollisionLayer2D } from '../types/Physics2DTypes';

/**
 * 2D 碰撞体基类
 *
 * 定义了所有 2D 碰撞体的共同属性和接口。
 * 具体的碰撞体形状由子类实现。
 */
export abstract class Collider2DBase extends Component {
    // ==================== 物理材质属性 ====================

    /**
     * 摩擦系数 [0, 1]
     * 0 = 完全光滑，1 = 最大摩擦
     */
    @Serialize()
    @Property({ type: 'number', label: 'Friction', min: 0, max: 1, step: 0.01 })
    public friction: number = 0.5;

    /**
     * 弹性系数（恢复系数）[0, 1]
     * 0 = 完全非弹性碰撞，1 = 完全弹性碰撞
     */
    @Serialize()
    @Property({ type: 'number', label: 'Restitution', min: 0, max: 1, step: 0.01 })
    public restitution: number = 0;

    /**
     * 密度 (kg/m²)
     * 用于计算质量（与碰撞体面积相乘）
     */
    @Serialize()
    @Property({ type: 'number', label: 'Density', min: 0.001, step: 0.1 })
    public density: number = 1;

    // ==================== 碰撞过滤 ====================

    /**
     * 是否为触发器
     * 触发器不产生物理碰撞响应，只触发事件
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Is Trigger' })
    public isTrigger: boolean = false;

    /**
     * 碰撞层（该碰撞体所在的层）
     * 使用位掩码，可以属于多个层
     */
    @Serialize()
    @Property({ type: 'collisionLayer', label: 'Collision Layer' })
    public collisionLayer: number = CollisionLayer2D.Default;

    /**
     * 碰撞掩码（该碰撞体可以与哪些层碰撞）
     * 使用位掩码
     */
    @Serialize()
    @Property({ type: 'collisionMask', label: 'Collision Mask' })
    public collisionMask: number = CollisionLayer2D.All;

    // ==================== 偏移 ====================

    /**
     * 相对于实体 Transform 的位置偏移
     */
    @Serialize()
    @Property({ type: 'vector2', label: 'Offset' })
    public offset: IVector2 = { x: 0, y: 0 };

    /**
     * 相对于实体 Transform 的旋转偏移（度）
     */
    @Serialize()
    @Property({ type: 'number', label: 'Rotation Offset', min: -180, max: 180, step: 1 })
    public rotationOffset: number = 0;

    // ==================== 内部状态 ====================

    /**
     * Rapier 碰撞体句柄
     * @internal
     */
    public _colliderHandle: number | null = null;

    /**
     * 关联的刚体实体 ID（如果有）
     * @internal
     */
    public _attachedBodyEntityId: number | null = null;

    /**
     * 是否需要重建碰撞体
     * @internal
     */
    public _needsRebuild: boolean = false;

    // ==================== 抽象方法 ====================

    /**
     * 获取碰撞体形状类型名称
     */
    public abstract getShapeType(): string;

    /**
     * 计算碰撞体的面积（用于质量计算）
     */
    public abstract calculateArea(): number;

    /**
     * 计算碰撞体的 AABB（轴对齐包围盒）
     */
    public abstract calculateAABB(): { min: IVector2; max: IVector2 };

    // ==================== API 方法 ====================

    /**
     * 设置碰撞层
     * @param layer 层标识
     */
    public setLayer(layer: CollisionLayer2D): void {
        this.collisionLayer = layer;
        this._needsRebuild = true;
    }

    /**
     * 添加碰撞层
     * @param layer 层标识
     */
    public addLayer(layer: CollisionLayer2D): void {
        this.collisionLayer |= layer;
        this._needsRebuild = true;
    }

    /**
     * 移除碰撞层
     * @param layer 层标识
     */
    public removeLayer(layer: CollisionLayer2D): void {
        this.collisionLayer &= ~layer;
        this._needsRebuild = true;
    }

    /**
     * 检查是否在指定层
     * @param layer 层标识
     */
    public isInLayer(layer: CollisionLayer2D): boolean {
        return (this.collisionLayer & layer) !== 0;
    }

    /**
     * 设置碰撞掩码
     * @param mask 掩码值
     */
    public setCollisionMask(mask: number): void {
        this.collisionMask = mask;
        this._needsRebuild = true;
    }

    /**
     * 检查是否可以与指定层碰撞
     * @param layer 层标识
     */
    public canCollideWith(layer: CollisionLayer2D): boolean {
        return (this.collisionMask & layer) !== 0;
    }

    /**
     * 标记需要重建
     */
    public markNeedsRebuild(): void {
        this._needsRebuild = true;
    }

    public override onRemovedFromEntity(): void {
        this._colliderHandle = null;
        this._attachedBodyEntityId = null;
    }
}
