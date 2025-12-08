import { EntitySystem, Matcher, ECSSystem, Entity } from '@esengine/esengine';
import { TransformComponent } from '@esengine/engine-core';
import { Color } from '@esengine/esengine-math';
import type { IRenderDataProvider } from '@esengine/ecs-engine-bindgen';
import { TilemapComponent, type ITilemapLayerData } from '../TilemapComponent';

/**
 * Tilemap render data for a single tilemap layer
 * 单个瓦片地图图层的渲染数据
 */
export interface TilemapRenderData {
    /** Entity ID | 实体ID */
    entityId: number;
    /** Layer index within the tilemap | 图层在瓦片地图中的索引 */
    layerIndex: number;
    /** Transform data [x, y, rotation, scaleX, scaleY, originX, originY] per tile | 每个瓦片的变换数据 */
    transforms: Float32Array;
    /** Texture IDs per tile | 每个瓦片的纹理ID */
    textureIds: Uint32Array;
    /** UV coordinates [u0, v0, u1, v1] per tile | 每个瓦片的UV坐标 */
    uvs: Float32Array;
    /** Packed colors (ARGB) per tile | 每个瓦片的打包颜色 */
    colors: Uint32Array;
    /** Number of tiles in this layer | 此图层的瓦片数量 */
    tileCount: number;
    /** Sorting order for rendering | 渲染排序顺序 */
    sortingOrder: number;
    /** Texture path for loading | 纹理路径 */
    texturePath?: string;
    /** Material ID for this layer (0 = default) | 此图层的材质ID（0 = 默认） */
    materialId: number;
}

/**
 * 视口边界
 */
export interface ViewportBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

/**
 * Cache key for layer render data
 * 图层渲染数据的缓存键
 */
type LayerCacheKey = `${number}_${number}`;

/**
 * 瓦片地图渲染系统 - 准备瓦片地图渲染数据（按图层）
 * Tilemap rendering system - Prepares tilemap render data (per layer)
 */
@ECSSystem('TilemapRendering', { updateOrder: 40 })
export class TilemapRenderingSystem extends EntitySystem implements IRenderDataProvider {
    /** Cache for layer render data: key = "entityId_layerIndex" | 图层渲染数据缓存 */
    private _layerRenderDataCache: Map<LayerCacheKey, TilemapRenderData> = new Map();
    /** Current frame render data | 当前帧渲染数据 */
    private _currentFrameData: TilemapRenderData[] = [];
    /** Viewport bounds for culling | 视口边界用于剔除 */
    private _viewportBounds: ViewportBounds | null = null;

    constructor() {
        super(Matcher.empty().all(TilemapComponent, TransformComponent));
    }

    /**
     * Set viewport bounds for tile culling
     * 设置视口边界用于瓦片剔除
     */
    setViewportBounds(bounds: ViewportBounds): void {
        this._viewportBounds = bounds;
    }

    /**
     * Get render data for current frame
     * 获取当前帧的渲染数据
     */
    getRenderData(): readonly TilemapRenderData[] {
        return this._currentFrameData;
    }

    protected override onBegin(): void {
        this._currentFrameData = [];
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            if (!entity.enabled) continue;

            const tilemap = entity.getComponent(TilemapComponent) as TilemapComponent | null;
            const transform = entity.getComponent(TransformComponent) as TransformComponent | null;

            if (!tilemap || !transform || !tilemap.visible) continue;

            // Process each layer separately
            // 分别处理每个图层
            const layers = tilemap.layers;
            for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
                const layer = layers[layerIndex];
                if (!layer.visible) continue;

                const cacheKey: LayerCacheKey = `${entity.id}_${layerIndex}`;
                let renderData = this._layerRenderDataCache.get(cacheKey);

                if (!renderData || tilemap.renderDirty) {
                    renderData = this.buildLayerRenderData(entity.id, layerIndex, tilemap, transform, layer);
                    this._layerRenderDataCache.set(cacheKey, renderData);
                } else {
                    this.updateLayerTransforms(renderData, layerIndex, tilemap, transform, layer);
                }

                if (renderData.tileCount > 0) {
                    this._currentFrameData.push(renderData);
                }
            }

            // Clear dirty flag after processing all layers
            // 处理完所有图层后清除脏标志
            tilemap.renderDirty = false;
        }

        // Sort by sorting order (lower values render first)
        // 按排序顺序排序（较小值先渲染）
        this._currentFrameData.sort((a, b) => a.sortingOrder - b.sortingOrder);
    }

    /**
     * Build render data for a single layer
     * 为单个图层构建渲染数据
     */
    private buildLayerRenderData(
        entityId: number,
        layerIndex: number,
        tilemap: TilemapComponent,
        transform: TransformComponent,
        layer: ITilemapLayerData
    ): TilemapRenderData {
        const layerData = tilemap.getLayerData(layerIndex);
        if (!layerData) {
            return this.createEmptyRenderData(entityId, layerIndex, tilemap.sortingOrder, layer.materialId);
        }

        const width = tilemap.width;
        const height = tilemap.height;
        const tileWidth = tilemap.tileWidth;
        const tileHeight = tilemap.tileHeight;

        // Calculate visible tile range
        // 计算可见瓦片范围
        const { startCol, endCol, startRow, endRow } = this.calculateVisibleRange(
            width, height, tileWidth, tileHeight, transform
        );

        // Count non-empty tiles in this layer
        // 计算此图层的非空瓦片数量
        let tileCount = 0;
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                if (layerData[row * width + col] > 0) tileCount++;
            }
        }

        if (tileCount === 0) {
            return this.createEmptyRenderData(entityId, layerIndex, tilemap.sortingOrder, layer.materialId);
        }

        const transforms = new Float32Array(tileCount * 7);
        const textureIds = new Uint32Array(tileCount);
        const uvs = new Float32Array(tileCount * 4);
        const colors = new Uint32Array(tileCount);

        // Calculate color with layer opacity
        // 计算带有图层透明度的颜色
        const effectiveAlpha = tilemap.alpha * layer.opacity;
        const colorValue = Color.packHexAlpha(tilemap.color, effectiveAlpha);

        // Calculate rotation parameters
        // 计算旋转参数
        const cos = Math.cos(transform.rotation.z);
        const sin = Math.sin(transform.rotation.z);

        // Tilemap rotation pivot
        // Tilemap 旋转中心点
        const pivotX = transform.position.x + (width * tileWidth * transform.scale.x) / 2;
        const pivotY = transform.position.y + (height * tileHeight * transform.scale.y) / 2;

        let idx = 0;
        let texturePath: string | undefined;

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const gid = layerData[row * width + col];
                if (gid <= 0) continue;

                // Find corresponding tileset
                // 查找对应的 tileset
                const tilesetInfo = tilemap.getTilesetForGid(gid);
                if (!tilesetInfo) continue;

                const { index: tilesetIndex, localId } = tilesetInfo;

                // Get texture path
                // 获取纹理路径
                if (!texturePath && tilemap.tilesets[tilesetIndex]) {
                    texturePath = tilemap.tilesets[tilesetIndex].source;
                }

                // Calculate tile local position (relative to tilemap center)
                // 计算瓦片的本地位置（相对于 tilemap 中心）
                const localX = transform.position.x + col * tileWidth * transform.scale.x + (tileWidth * transform.scale.x) / 2 - pivotX;
                const localY = transform.position.y + (height - 1 - row) * tileHeight * transform.scale.y + (tileHeight * transform.scale.y) / 2 - pivotY;

                // Apply rotation transform
                // 应用旋转变换
                const rotatedX = localX * cos - localY * sin + pivotX;
                const rotatedY = localX * sin + localY * cos + pivotY;

                // Transform: [x, y, rotation, scaleX, scaleY, originX, originY]
                const tOffset = idx * 7;
                transforms[tOffset] = rotatedX;
                transforms[tOffset + 1] = rotatedY;
                transforms[tOffset + 2] = transform.rotation.z;
                transforms[tOffset + 3] = tileWidth * transform.scale.x;
                transforms[tOffset + 4] = tileHeight * transform.scale.y;
                transforms[tOffset + 5] = 0.5;
                transforms[tOffset + 6] = 0.5;

                // Texture ID
                textureIds[idx] = tilemap.tilesets[tilesetIndex]?.textureId || 0;

                // UV coordinates
                const tileUV = tilemap.getTileUV(tilesetIndex, localId);
                const uvOffset = idx * 4;
                if (tileUV) {
                    uvs[uvOffset] = tileUV[0];
                    uvs[uvOffset + 1] = tileUV[1];
                    uvs[uvOffset + 2] = tileUV[2];
                    uvs[uvOffset + 3] = tileUV[3];
                } else {
                    uvs[uvOffset] = 0;
                    uvs[uvOffset + 1] = 0;
                    uvs[uvOffset + 2] = 1;
                    uvs[uvOffset + 3] = 1;
                }

                colors[idx] = colorValue;
                idx++;
            }
        }

        return {
            entityId,
            layerIndex,
            transforms,
            textureIds,
            uvs,
            colors,
            tileCount,
            sortingOrder: tilemap.sortingOrder + layerIndex * 0.001,
            texturePath,
            materialId: layer.materialId ?? 0
        };
    }

    /**
     * Update transforms for a layer (when only position/rotation/scale changed)
     * 更新图层的变换（当只有位置/旋转/缩放改变时）
     */
    private updateLayerTransforms(
        renderData: TilemapRenderData,
        layerIndex: number,
        tilemap: TilemapComponent,
        transform: TransformComponent,
        layer: ITilemapLayerData
    ): void {
        const layerData = tilemap.getLayerData(layerIndex);
        if (!layerData) return;

        const width = tilemap.width;
        const height = tilemap.height;
        const tileWidth = tilemap.tileWidth;
        const tileHeight = tilemap.tileHeight;

        // Calculate visible tile range
        // 计算可见瓦片范围
        const { startCol, endCol, startRow, endRow } = this.calculateVisibleRange(
            width, height, tileWidth, tileHeight, transform
        );

        // Calculate rotation parameters
        // 计算旋转参数
        const cos = Math.cos(transform.rotation.z);
        const sin = Math.sin(transform.rotation.z);

        // Tilemap rotation pivot
        // Tilemap 旋转中心点
        const pivotX = transform.position.x + (width * tileWidth * transform.scale.x) / 2;
        const pivotY = transform.position.y + (height * tileHeight * transform.scale.y) / 2;

        let idx = 0;
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                if (layerData[row * width + col] <= 0) continue;

                // Calculate tile local position
                // 计算瓦片本地位置
                const localX = transform.position.x + col * tileWidth * transform.scale.x + (tileWidth * transform.scale.x) / 2 - pivotX;
                const localY = transform.position.y + (height - 1 - row) * tileHeight * transform.scale.y + (tileHeight * transform.scale.y) / 2 - pivotY;

                // Apply rotation transform
                // 应用旋转变换
                const rotatedX = localX * cos - localY * sin + pivotX;
                const rotatedY = localX * sin + localY * cos + pivotY;

                const tOffset = idx * 7;
                renderData.transforms[tOffset] = rotatedX;
                renderData.transforms[tOffset + 1] = rotatedY;
                renderData.transforms[tOffset + 2] = transform.rotation.z;
                renderData.transforms[tOffset + 3] = tileWidth * transform.scale.x;
                renderData.transforms[tOffset + 4] = tileHeight * transform.scale.y;

                idx++;
            }
        }

        // Update color (alpha or layer opacity may have changed)
        // 更新颜色（alpha 或图层透明度可能已更改）
        const effectiveAlpha = tilemap.alpha * layer.opacity;
        const colorValue = Color.packHexAlpha(tilemap.color, effectiveAlpha);
        for (let i = 0; i < renderData.colors.length; i++) {
            renderData.colors[i] = colorValue;
        }

        // Update sorting order and material ID
        // 更新排序顺序和材质ID
        renderData.sortingOrder = tilemap.sortingOrder + layerIndex * 0.001;
        renderData.materialId = layer.materialId ?? 0;
    }

    /**
     * Calculate visible tile range based on viewport bounds
     * 根据视口边界计算可见瓦片范围
     */
    private calculateVisibleRange(
        width: number,
        height: number,
        tileWidth: number,
        tileHeight: number,
        transform: TransformComponent
    ): { startCol: number; endCol: number; startRow: number; endRow: number } {
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

        return { startCol, endCol, startRow, endRow };
    }

    /**
     * Create empty render data
     * 创建空的渲染数据
     */
    private createEmptyRenderData(
        entityId: number,
        layerIndex: number,
        sortingOrder: number,
        materialId?: number
    ): TilemapRenderData {
        return {
            entityId,
            layerIndex,
            transforms: new Float32Array(0),
            textureIds: new Uint32Array(0),
            uvs: new Float32Array(0),
            colors: new Uint32Array(0),
            tileCount: 0,
            sortingOrder: sortingOrder + layerIndex * 0.001,
            materialId: materialId ?? 0
        };
    }

    protected override onRemoved(entity: Entity): void {
        // Remove all cached layer data for this entity
        // 移除此实体的所有缓存图层数据
        const keysToDelete: LayerCacheKey[] = [];
        for (const key of this._layerRenderDataCache.keys()) {
            if (key.startsWith(`${entity.id}_`)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this._layerRenderDataCache.delete(key);
        }
    }

    /**
     * Clear all cached render data
     * 清除所有缓存的渲染数据
     */
    clearCache(): void {
        this._layerRenderDataCache.clear();
        this._currentFrameData = [];
    }
}
