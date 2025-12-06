import { EntitySystem, Matcher, ECSSystem } from '@esengine/ecs-framework';
import type { Entity } from '@esengine/ecs-framework';
import { ChunkComponent } from '../components/ChunkComponent';
import { EChunkState } from '../types';

/**
 * 区块裁剪系统
 *
 * Handles visibility culling for chunk entities.
 *
 * 处理区块实体的可见性裁剪。
 */
@ECSSystem('ChunkCulling', { updateOrder: -40 })
export class ChunkCullingSystem extends EntitySystem {
    private _viewMinX: number = 0;
    private _viewMinY: number = 0;
    private _viewMaxX: number = 1920;
    private _viewMaxY: number = 1080;
    private _padding: number = 100;

    constructor() {
        super(Matcher.all(ChunkComponent));
    }

    /**
     * 设置视口边界
     *
     * Set viewport bounds for culling.
     */
    setViewBounds(minX: number, minY: number, maxX: number, maxY: number): void {
        this._viewMinX = minX;
        this._viewMinY = minY;
        this._viewMaxX = maxX;
        this._viewMaxY = maxY;
    }

    /**
     * 设置裁剪边距
     *
     * Set padding for culling bounds.
     */
    setPadding(padding: number): void {
        this._padding = padding;
    }

    protected process(entities: readonly Entity[]): void {
        const cullMinX = this._viewMinX - this._padding;
        const cullMinY = this._viewMinY - this._padding;
        const cullMaxX = this._viewMaxX + this._padding;
        const cullMaxY = this._viewMaxY + this._padding;

        for (const entity of entities) {
            const chunk = entity.getComponent(ChunkComponent);
            if (!chunk) continue;

            if (chunk.state !== EChunkState.Loaded) continue;

            const bounds = chunk.bounds;
            const isVisible = this.boundsIntersect(
                bounds.minX,
                bounds.minY,
                bounds.maxX,
                bounds.maxY,
                cullMinX,
                cullMinY,
                cullMaxX,
                cullMaxY
            );

            entity.enabled = isVisible;
        }
    }

    /**
     * 检查边界是否相交
     *
     * Check if two axis-aligned bounds intersect.
     */
    private boundsIntersect(
        aMinX: number,
        aMinY: number,
        aMaxX: number,
        aMaxY: number,
        bMinX: number,
        bMinY: number,
        bMaxX: number,
        bMaxY: number
    ): boolean {
        return aMinX < bMaxX && aMaxX > bMinX && aMinY < bMaxY && aMaxY > bMinY;
    }

    /**
     * 更新视口（从相机）
     *
     * Update viewport from camera position and size.
     */
    updateFromCamera(cameraX: number, cameraY: number, viewWidth: number, viewHeight: number): void {
        const halfWidth = viewWidth * 0.5;
        const halfHeight = viewHeight * 0.5;

        this.setViewBounds(
            cameraX - halfWidth,
            cameraY - halfHeight,
            cameraX + halfWidth,
            cameraY + halfHeight
        );
    }
}
