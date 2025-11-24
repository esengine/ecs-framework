import { EntitySystem, Matcher, ECSSystem, Entity } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/ecs-components';
import { TilemapComponent } from '../TilemapComponent';

/**
 * Tilemap render data for a single tilemap
 * 单个瓦片地图的渲染数据
 */
export interface TilemapRenderData {
    /** Entity ID */
    entityId: number;
    /** Transform data [x, y, rotation, scaleX, scaleY, originX, originY] per tile */
    transforms: Float32Array;
    /** Texture ID for each tile */
    textureIds: Uint32Array;
    /** UV coordinates [u0, v0, u1, v1] per tile */
    uvs: Float32Array;
    /** Packed RGBA colors per tile */
    colors: Uint32Array;
    /** Number of tiles to render */
    tileCount: number;
    /** Sorting order */
    sortingOrder: number;
    /** Texture path for loading */
    texturePath?: string;
}

/**
 * 视口边界
 * Viewport bounds
 */
export interface ViewportBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

/**
 * 瓦片地图渲染系统 - 准备瓦片地图渲染数据
 * Tilemap rendering system - prepares tilemap render data
 */
@ECSSystem('TilemapRendering', { updateOrder: 40 })
export class TilemapRenderingSystem extends EntitySystem {
    /**
     * 渲染数据缓存
     * Render data cache
     */
    private _renderDataCache: Map<number, TilemapRenderData> = new Map();

    /**
     * 当前帧的渲染数据
     * Current frame render data
     */
    private _currentFrameData: TilemapRenderData[] = [];

    /**
     * 当前视口边界（用于裁剪）
     * Current viewport bounds (for culling)
     */
    private _viewportBounds: ViewportBounds | null = null;

    constructor() {
        super(Matcher.empty().all(TilemapComponent, TransformComponent));
    }

    /**
     * 设置视口边界用于裁剪
     * Set viewport bounds for culling
     */
    setViewportBounds(bounds: ViewportBounds): void {
        this._viewportBounds = bounds;
    }

    /**
     * 获取当前帧的所有渲染数据
     * Get all render data for current frame
     */
    getRenderData(): readonly TilemapRenderData[] {
        return this._currentFrameData;
    }

    /**
     * 每帧开始时清空渲染数据
     * Clear render data at frame begin
     */
    protected override onBegin(): void {
        this._currentFrameData = [];
    }

    /**
     * 处理匹配的实体
     * Process matched entities
     */
    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            if (!entity.enabled) continue;

            const tilemap = entity.getComponent(TilemapComponent) as TilemapComponent | null;
            const transform = entity.getComponent(TransformComponent) as TransformComponent | null;

            if (!tilemap || !transform || !tilemap.visible) continue;

            // 检查是否需要更新渲染数据
            let renderData = this._renderDataCache.get(entity.id);

            if (!renderData || tilemap.renderDirty) {
                renderData = this.buildRenderData(entity.id, tilemap, transform);
                this._renderDataCache.set(entity.id, renderData);
                tilemap.renderDirty = false;
            } else {
                // 更新位置（transform 可能变化）
                this.updateTransforms(renderData, tilemap, transform);
            }

            this._currentFrameData.push(renderData);
        }

        // 按排序顺序排列
        this._currentFrameData.sort((a, b) => a.sortingOrder - b.sortingOrder);
    }

    /**
     * 构建渲染数据
     * Build render data
     */
    private buildRenderData(
        entityId: number,
        tilemap: TilemapComponent,
        transform: TransformComponent
    ): TilemapRenderData {
        const tileData = tilemap.tileData;
        const width = tilemap.width;
        const height = tilemap.height;
        const tileWidth = tilemap.tileWidth;
        const tileHeight = tilemap.tileHeight;

        // 计算可见瓦片范围（视口裁剪）
        let startCol = 0, endCol = width;
        let startRow = 0, endRow = height;

        if (this._viewportBounds) {
            const bounds = this._viewportBounds;
            const mapX = transform.position.x;
            const mapY = transform.position.y;

            startCol = Math.max(0, Math.floor((bounds.left - mapX) / tileWidth));
            endCol = Math.min(width, Math.ceil((bounds.right - mapX) / tileWidth));
            startRow = Math.max(0, Math.floor((bounds.bottom - mapY) / tileHeight));
            endRow = Math.min(height, Math.ceil((bounds.top - mapY) / tileHeight));
        }

        // 计算可见范围内的非空瓦片数量
        let tileCount = 0;
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                if (tileData[row * width + col] > 0) tileCount++;
            }
        }

        // 分配数组
        const transforms = new Float32Array(tileCount * 7);
        const textureIds = new Uint32Array(tileCount);
        const uvs = new Float32Array(tileCount * 4);
        const colors = new Uint32Array(tileCount);

        // 解析颜色
        const colorValue = this.parseColor(tilemap.color, tilemap.alpha);

        let idx = 0;
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const tileIndex = tileData[row * width + col];
                if (tileIndex <= 0) continue;

                // 计算世界位置
                const worldX = transform.position.x + col * tileWidth + tileWidth / 2;
                const worldY = transform.position.y + row * tileHeight + tileHeight / 2;

                // Transform: [x, y, rotation, scaleX, scaleY, originX, originY]
                const tOffset = idx * 7;
                transforms[tOffset] = worldX;
                transforms[tOffset + 1] = worldY;
                transforms[tOffset + 2] = transform.rotation.z * Math.PI / 180; // 转为弧度
                transforms[tOffset + 3] = tileWidth * transform.scale.x;
                transforms[tOffset + 4] = tileHeight * transform.scale.y;
                transforms[tOffset + 5] = 0.5; // origin X (center)
                transforms[tOffset + 6] = 0.5; // origin Y (center)

                // Texture ID
                textureIds[idx] = tilemap.textureId;

                // UV coordinates
                const tileUV = tilemap.getTileUV(tileIndex);
                const uvOffset = idx * 4;
                if (tileUV) {
                    uvs[uvOffset] = tileUV[0];
                    uvs[uvOffset + 1] = tileUV[1];
                    uvs[uvOffset + 2] = tileUV[2];
                    uvs[uvOffset + 3] = tileUV[3];
                } else {
                    // 默认 UV
                    uvs[uvOffset] = 0;
                    uvs[uvOffset + 1] = 0;
                    uvs[uvOffset + 2] = 1;
                    uvs[uvOffset + 3] = 1;
                }

                // Color
                colors[idx] = colorValue;

                idx++;
            }
        }

        // Get texture path from tilemap component
        const texturePath = (tilemap as any).tilesetImage || tilemap.tilesetAssetGuid;

        return {
            entityId,
            transforms,
            textureIds,
            uvs,
            colors,
            tileCount,
            sortingOrder: tilemap.sortingOrder,
            texturePath
        };
    }

    /**
     * 更新位置数据（当只有 transform 变化时）
     * Update transform data (when only transform changes)
     */
    private updateTransforms(
        renderData: TilemapRenderData,
        tilemap: TilemapComponent,
        transform: TransformComponent
    ): void {
        const tileData = tilemap.tileData;
        const width = tilemap.width;
        const height = tilemap.height;
        const tileWidth = tilemap.tileWidth;
        const tileHeight = tilemap.tileHeight;

        let idx = 0;
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const tileIndex = tileData[row * width + col];
                if (tileIndex <= 0) continue;

                const worldX = transform.position.x + col * tileWidth + tileWidth / 2;
                const worldY = transform.position.y + row * tileHeight + tileHeight / 2;

                const tOffset = idx * 7;
                renderData.transforms[tOffset] = worldX;
                renderData.transforms[tOffset + 1] = worldY;
                renderData.transforms[tOffset + 2] = transform.rotation.z * Math.PI / 180;
                renderData.transforms[tOffset + 3] = tileWidth * transform.scale.x;
                renderData.transforms[tOffset + 4] = tileHeight * transform.scale.y;

                idx++;
            }
        }

        renderData.sortingOrder = tilemap.sortingOrder;
    }

    /**
     * 解析颜色字符串为打包的 RGBA
     * Parse color string to packed RGBA
     */
    private parseColor(hex: string, alpha: number): number {
        // 移除 # 前缀
        const colorHex = hex.replace('#', '');

        let r = 255, g = 255, b = 255;

        if (colorHex.length === 6) {
            r = parseInt(colorHex.substring(0, 2), 16);
            g = parseInt(colorHex.substring(2, 4), 16);
            b = parseInt(colorHex.substring(4, 6), 16);
        } else if (colorHex.length === 3) {
            r = parseInt(colorHex[0] + colorHex[0], 16);
            g = parseInt(colorHex[1] + colorHex[1], 16);
            b = parseInt(colorHex[2] + colorHex[2], 16);
        }

        const a = Math.round(alpha * 255);

        // Pack as RGBA (little endian: ABGR)
        return (a << 24) | (b << 16) | (g << 8) | r;
    }

    /**
     * 实体移除时清理缓存
     * Clean up cache when entity is removed
     */
    protected override onRemoved(entity: Entity): void {
        this._renderDataCache.delete(entity.id);
    }

    /**
     * 清空所有缓存
     * Clear all cache
     */
    clearCache(): void {
        this._renderDataCache.clear();
        this._currentFrameData = [];
    }
}
