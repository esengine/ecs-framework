/**
 * CircleCollider2D Component
 * 2D 圆形碰撞体组件
 */

import { Property, Serialize, Serializable, ECSComponent } from '@esengine/ecs-framework';
import type { IVector2 } from '@esengine/ecs-framework-math';
import { Collider2DBase } from './Collider2DBase';

/**
 * 2D 圆形碰撞体
 *
 * 用于创建圆形形状的碰撞体。
 *
 * @example
 * ```typescript
 * const entity = scene.createEntity('Ball');
 * const collider = entity.addComponent(CircleCollider2DComponent);
 * collider.radius = 0.5;
 * ```
 */
@ECSComponent('CircleCollider2D')
@Serializable({ version: 1, typeId: 'CircleCollider2D' })
export class CircleCollider2DComponent extends Collider2DBase {
    private _radius: number = 5;

    /**
     * 圆的半径
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

    public override getShapeType(): string {
        return 'circle';
    }

    public override calculateArea(): number {
        return Math.PI * this.radius * this.radius;
    }

    public override calculateAABB(): { min: IVector2; max: IVector2 } {
        return {
            min: { x: this.offset.x - this.radius, y: this.offset.y - this.radius },
            max: { x: this.offset.x + this.radius, y: this.offset.y + this.radius }
        };
    }

    /**
     * 设置半径
     * @param radius 半径
     */
    public setRadius(radius: number): void {
        this.radius = radius;
    }
}
