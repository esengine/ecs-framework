/**
 * TilemapCollider2D Component
 * Tilemap 碰撞体组件
 *
 * 将 TilemapComponent 的碰撞数据转换为物理碰撞体。
 * 使用优化算法合并相邻碰撞格子，减少碰撞体数量。
 */

import { Component, Property, Serialize, ECSComponent, Serializable } from '@esengine/ecs-framework';

/**
 * 碰撞体生成模式
 */
export enum TilemapColliderMode {
    /** 每个碰撞格子单独创建碰撞体 */
    PerTile = 0,
    /** 合并相邻碰撞格子为更大的矩形 */
    Merged = 1,
    /** 只生成边缘碰撞体（优化性能） */
    EdgeOnly = 2,
}

/**
 * 合并后的碰撞矩形
 */
export interface CollisionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * TilemapCollider2D 组件
 *
 * 自动从同一实体的 TilemapComponent 读取碰撞数据，
 * 并生成对应的物理碰撞体。
 */
@ECSComponent('TilemapCollider2D')
@Serializable({ version: 1, typeId: 'TilemapCollider2D' })
export class TilemapCollider2DComponent extends Component {
    /**
     * 碰撞体生成模式
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Collider Mode',
        options: [
            { label: 'Per Tile', value: TilemapColliderMode.PerTile },
            { label: 'Merged', value: TilemapColliderMode.Merged },
            { label: 'Edge Only', value: TilemapColliderMode.EdgeOnly },
        ],
    })
    public colliderMode: TilemapColliderMode = TilemapColliderMode.Merged;

    /**
     * 碰撞层（该碰撞体所在的层）
     */
    @Serialize()
    @Property({ type: 'collisionLayer', label: 'Collision Layer' })
    public collisionLayer: number = 1; // Default layer

    /**
     * 碰撞掩码（该碰撞体可以与哪些层碰撞）
     */
    @Serialize()
    @Property({ type: 'collisionMask', label: 'Collision Mask' })
    public collisionMask: number = 0xFFFF; // All layers

    /**
     * 摩擦系数
     */
    @Serialize()
    @Property({ type: 'number', label: 'Friction', min: 0, max: 1, step: 0.01 })
    public friction: number = 0.5;

    /**
     * 弹性系数
     */
    @Serialize()
    @Property({ type: 'number', label: 'Restitution', min: 0, max: 1, step: 0.01 })
    public restitution: number = 0;

    /**
     * 是否为触发器
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Is Trigger' })
    public isTrigger: boolean = false;

    /**
     * 生成的碰撞矩形缓存
     * @internal
     */
    public _collisionRects: CollisionRect[] = [];

    /**
     * 碰撞体句柄列表
     * @internal
     */
    public _colliderHandles: number[] = [];

    /**
     * 是否需要重建碰撞体
     * @internal
     */
    public _needsRebuild: boolean = true;

    /**
     * 碰撞数据版本（用于检测变化）
     * @internal
     */
    public _lastCollisionVersion: number = -1;

    /**
     * 从碰撞数据生成碰撞矩形
     * @param collisionData 碰撞数据数组
     * @param width 地图宽度（格子数）
     * @param height 地图高度（格子数）
     * @param tileWidth 格子宽度（像素）
     * @param tileHeight 格子高度（像素）
     */
    public generateCollisionRects(
        collisionData: Uint32Array,
        width: number,
        height: number,
        tileWidth: number,
        tileHeight: number
    ): CollisionRect[] {
        if (collisionData.length === 0) {
            this._collisionRects = [];
            return [];
        }

        switch (this.colliderMode) {
            case TilemapColliderMode.PerTile:
                this._collisionRects = this._generatePerTileRects(
                    collisionData, width, height, tileWidth, tileHeight
                );
                break;
            case TilemapColliderMode.Merged:
                this._collisionRects = this._generateMergedRects(
                    collisionData, width, height, tileWidth, tileHeight
                );
                break;
            case TilemapColliderMode.EdgeOnly:
                // Edge-only 模式暂时使用合并模式
                this._collisionRects = this._generateMergedRects(
                    collisionData, width, height, tileWidth, tileHeight
                );
                break;
        }

        this._needsRebuild = true;
        return this._collisionRects;
    }

    /**
     * 每个格子单独生成矩形
     */
    private _generatePerTileRects(
        collisionData: Uint32Array,
        width: number,
        height: number,
        tileWidth: number,
        tileHeight: number
    ): CollisionRect[] {
        const rects: CollisionRect[] = [];

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (collisionData[row * width + col] > 0) {
                    rects.push({
                        x: col * tileWidth,
                        y: row * tileHeight,
                        width: tileWidth,
                        height: tileHeight,
                    });
                }
            }
        }

        return rects;
    }

    /**
     * 合并相邻格子生成更大的矩形（贪心算法）
     *
     * 使用行优先扫描，合并水平相邻的碰撞格子，
     * 然后尝试垂直合并相同宽度的矩形。
     */
    private _generateMergedRects(
        collisionData: Uint32Array,
        width: number,
        height: number,
        tileWidth: number,
        tileHeight: number
    ): CollisionRect[] {
        // 创建已处理标记数组
        const processed = new Array(width * height).fill(false);
        const rects: CollisionRect[] = [];

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const index = row * width + col;

                // 跳过已处理或无碰撞的格子
                if (processed[index] || collisionData[index] === 0) {
                    continue;
                }

                // 找到水平方向最大范围
                let endCol = col;
                while (
                    endCol < width &&
                    collisionData[row * width + endCol] > 0 &&
                    !processed[row * width + endCol]
                ) {
                    endCol++;
                }
                const rectWidth = endCol - col;

                // 找到垂直方向最大范围（保持相同宽度）
                let endRow = row;
                let canExtend = true;
                while (canExtend && endRow < height) {
                    // 检查这一行是否都有碰撞且未处理
                    for (let c = col; c < endCol; c++) {
                        const idx = endRow * width + c;
                        if (collisionData[idx] === 0 || processed[idx]) {
                            canExtend = false;
                            break;
                        }
                    }
                    if (canExtend) {
                        endRow++;
                    }
                }
                const rectHeight = endRow - row;

                // 标记所有包含的格子为已处理
                for (let r = row; r < endRow; r++) {
                    for (let c = col; c < endCol; c++) {
                        processed[r * width + c] = true;
                    }
                }

                // 添加合并后的矩形
                rects.push({
                    x: col * tileWidth,
                    y: row * tileHeight,
                    width: rectWidth * tileWidth,
                    height: rectHeight * tileHeight,
                });
            }
        }

        return rects;
    }

    /**
     * 获取碰撞矩形数量
     */
    public getCollisionRectCount(): number {
        return this._collisionRects.length;
    }

    /**
     * 标记需要重建
     */
    public markNeedsRebuild(): void {
        this._needsRebuild = true;
    }

    public override onRemovedFromEntity(): void {
        this._collisionRects = [];
        this._colliderHandles = [];
    }
}
