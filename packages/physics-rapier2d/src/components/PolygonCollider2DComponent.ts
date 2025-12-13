/**
 * PolygonCollider2D Component
 * 2D 多边形碰撞体组件
 */

import { Serialize, Serializable, ECSComponent } from '@esengine/ecs-framework';
import type { IVector2 } from '@esengine/ecs-framework-math';
import { Collider2DBase } from './Collider2DBase';

/**
 * 2D 多边形碰撞体
 *
 * 用于创建任意凸多边形形状的碰撞体。
 * 注意：Rapier 只支持凸多边形，非凸多边形需要分解。
 *
 * @example
 * ```typescript
 * const entity = scene.createEntity('Triangle');
 * const collider = entity.addComponent(PolygonCollider2DComponent);
 * collider.setVertices([
 *     { x: 0, y: 1 },
 *     { x: -1, y: -1 },
 *     { x: 1, y: -1 }
 * ]);
 * ```
 */
@ECSComponent('PolygonCollider2D')
@Serializable({ version: 1, typeId: 'PolygonCollider2D' })
export class PolygonCollider2DComponent extends Collider2DBase {
    /**
     * 多边形顶点（局部坐标，逆时针顺序）
     * 最少3个，最多不超过引擎限制（通常是 8-16 个）
     */
    @Serialize()
    public vertices: IVector2[] = [
        { x: -5, y: -5 },
        { x: 5, y: -5 },
        { x: 5, y: 5 },
        { x: -5, y: 5 }
    ];

    public override getShapeType(): string {
        return 'polygon';
    }

    public override calculateArea(): number {
        // 使用鞋带公式计算多边形面积
        if (this.vertices.length < 3) return 0;

        let area = 0;
        const n = this.vertices.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += this.vertices[i].x * this.vertices[j].y;
            area -= this.vertices[j].x * this.vertices[i].y;
        }

        return Math.abs(area) / 2;
    }

    public override calculateAABB(): { min: IVector2; max: IVector2 } {
        if (this.vertices.length === 0) {
            return {
                min: { x: this.offset.x, y: this.offset.y },
                max: { x: this.offset.x, y: this.offset.y }
            };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const v of this.vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }

        return {
            min: { x: this.offset.x + minX, y: this.offset.y + minY },
            max: { x: this.offset.x + maxX, y: this.offset.y + maxY }
        };
    }

    /**
     * 设置顶点
     * @param vertices 顶点数组（逆时针顺序）
     */
    public setVertices(vertices: IVector2[]): void {
        if (vertices.length < 3) {
            console.warn('PolygonCollider2D: 至少需要3个顶点');
            return;
        }
        this.vertices = vertices.map((v) => ({ x: v.x, y: v.y }));
        this._needsRebuild = true;
    }

    /**
     * 创建正多边形
     * @param sides 边数（至少3）
     * @param radius 外接圆半径
     */
    public setRegularPolygon(sides: number, radius: number): void {
        if (sides < 3) {
            console.warn('PolygonCollider2D: 正多边形至少需要3条边');
            return;
        }

        const vertices: IVector2[] = [];
        const angleStep = (Math.PI * 2) / sides;

        for (let i = 0; i < sides; i++) {
            const angle = angleStep * i - Math.PI / 2; // 从顶部开始
            vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }

        this.setVertices(vertices);
    }

    /**
     * 验证多边形是否为凸多边形
     * @returns 是否为凸多边形
     */
    public isConvex(): boolean {
        if (this.vertices.length < 3) return false;

        const n = this.vertices.length;
        let sign = 0;

        for (let i = 0; i < n; i++) {
            const v0 = this.vertices[i];
            const v1 = this.vertices[(i + 1) % n];
            const v2 = this.vertices[(i + 2) % n];

            const cross = (v1.x - v0.x) * (v2.y - v1.y) - (v1.y - v0.y) * (v2.x - v1.x);

            if (cross !== 0) {
                if (sign === 0) {
                    sign = cross > 0 ? 1 : -1;
                } else if ((cross > 0 ? 1 : -1) !== sign) {
                    return false;
                }
            }
        }

        return true;
    }
}
