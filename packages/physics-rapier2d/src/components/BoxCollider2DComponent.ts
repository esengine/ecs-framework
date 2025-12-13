/**
 * BoxCollider2D Component
 * 2D 矩形碰撞体组件
 */

import { Property, Serialize, Serializable, ECSComponent } from '@esengine/ecs-framework';
import type { IVector2 } from '@esengine/ecs-framework-math';
import { Collider2DBase } from './Collider2DBase';

/**
 * 2D 矩形碰撞体
 *
 * 用于创建矩形形状的碰撞体。
 *
 * @example
 * ```typescript
 * const entity = scene.createEntity('Box');
 * const collider = entity.addComponent(BoxCollider2DComponent);
 * collider.width = 2;
 * collider.height = 1;
 * ```
 */
@ECSComponent('BoxCollider2D')
@Serializable({ version: 1, typeId: 'BoxCollider2D' })
export class BoxCollider2DComponent extends Collider2DBase {
    private _width: number = 10;
    private _height: number = 10;

    /**
     * 矩形宽度（半宽度的2倍）
     */
    @Serialize()
    @Property({ type: 'number', label: 'Width', min: 0.01, step: 0.1 })
    public get width(): number {
        return this._width;
    }

    public set width(value: number) {
        if (this._width !== value) {
            this._width = value;
            this._needsRebuild = true;
        }
    }

    /**
     * 矩形高度（半高度的2倍）
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
     * 获取半宽度
     */
    public get halfWidth(): number {
        return this.width / 2;
    }

    /**
     * 获取半高度
     */
    public get halfHeight(): number {
        return this.height / 2;
    }

    public override getShapeType(): string {
        return 'box';
    }

    public override calculateArea(): number {
        return this.width * this.height;
    }

    public override calculateAABB(): { min: IVector2; max: IVector2 } {
        const hw = this.halfWidth;
        const hh = this.halfHeight;

        // 简化版本，不考虑旋转偏移
        return {
            min: { x: this.offset.x - hw, y: this.offset.y - hh },
            max: { x: this.offset.x + hw, y: this.offset.y + hh }
        };
    }

    /**
     * 设置尺寸
     * @param width 宽度
     * @param height 高度
     */
    public setSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }
}
