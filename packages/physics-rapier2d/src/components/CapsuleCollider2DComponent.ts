/**
 * CapsuleCollider2D Component
 * 2D 胶囊碰撞体组件
 */

import { Property, Serialize, Serializable, ECSComponent } from '@esengine/ecs-framework';
import type { IVector2 } from '@esengine/ecs-framework-math';
import { Collider2DBase } from './Collider2DBase';

/**
 * 胶囊方向
 */
export enum CapsuleDirection2D {
    /** 垂直方向（默认） */
    Vertical = 0,
    /** 水平方向 */
    Horizontal = 1
}

/**
 * 2D 胶囊碰撞体
 *
 * 胶囊由两个半圆和一个矩形组成。
 * 常用于角色碰撞体。
 *
 * @example
 * ```typescript
 * const entity = scene.createEntity('Character');
 * const collider = entity.addComponent(CapsuleCollider2DComponent);
 * collider.radius = 0.25;
 * collider.height = 1;
 * collider.direction = CapsuleDirection2D.Vertical;
 * ```
 */
@ECSComponent('CapsuleCollider2D')
@Serializable({ version: 1, typeId: 'CapsuleCollider2D' })
export class CapsuleCollider2DComponent extends Collider2DBase {
    private _radius: number = 3;
    private _height: number = 10;
    private _direction: CapsuleDirection2D = CapsuleDirection2D.Vertical;

    /**
     * 胶囊半径
     */
    @Serialize()
    @Property({ type: 'number', label: 'Radius', min: 0.01, step: 0.1 })
    public get radius(): number {
        return this._radius;
    }

    public set radius(value: number) {
        if (this._radius !== value) {
            this._radius = value;
            this._needsRebuild = true;
        }
    }

    /**
     * 胶囊总高度（包括两端的半圆）
     */
    @Serialize()
    @Property({ type: 'number', label: 'Height', min: 0.01, step: 0.1 })
    public get height(): number {
        return this._height;
    }

    public set height(value: number) {
        if (this._height !== value) {
            this._height = value;
            this._needsRebuild = true;
        }
    }

    /**
     * 胶囊方向
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Direction',
        options: [
            { label: 'Vertical', value: 0 },
            { label: 'Horizontal', value: 1 }
        ]
    })
    public get direction(): CapsuleDirection2D {
        return this._direction;
    }

    public set direction(value: CapsuleDirection2D) {
        if (this._direction !== value) {
            this._direction = value;
            this._needsRebuild = true;
        }
    }

    /**
     * 获取半高度（中间矩形部分的一半）
     */
    public get halfHeight(): number {
        return Math.max(0, (this.height - this.radius * 2) / 2);
    }

    public override getShapeType(): string {
        return 'capsule';
    }

    public override calculateArea(): number {
        // 胶囊面积 = 矩形面积 + 圆面积
        const rectArea = this.radius * 2 * this.halfHeight * 2;
        const circleArea = Math.PI * this.radius * this.radius;
        return rectArea + circleArea;
    }

    public override calculateAABB(): { min: IVector2; max: IVector2 } {
        if (this.direction === CapsuleDirection2D.Vertical) {
            return {
                min: { x: this.offset.x - this.radius, y: this.offset.y - this.height / 2 },
                max: { x: this.offset.x + this.radius, y: this.offset.y + this.height / 2 }
            };
        } else {
            return {
                min: { x: this.offset.x - this.height / 2, y: this.offset.y - this.radius },
                max: { x: this.offset.x + this.height / 2, y: this.offset.y + this.radius }
            };
        }
    }

    /**
     * 设置胶囊尺寸
     * @param radius 半径
     * @param height 总高度
     */
    public setSize(radius: number, height: number): void {
        this.radius = radius;
        this.height = height;
    }

    /**
     * 设置方向
     * @param direction 方向
     */
    public setDirection(direction: CapsuleDirection2D): void {
        this.direction = direction;
    }
}
