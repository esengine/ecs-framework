import { EntitySystem, Matcher, ECSSystem, Entity } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/engine-core';
import type { IRenderDataProvider } from '@esengine/ecs-engine-bindgen';
import { TilemapComponent } from '../TilemapComponent';

/**
 * Tilemap render data for a single tilemap
 */
export interface TilemapRenderData {
    entityId: number;
    transforms: Float32Array;
    textureIds: Uint32Array;
    uvs: Float32Array;
    colors: Uint32Array;
    tileCount: number;
    sortingOrder: number;
    texturePath?: string;
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
 * 瓦片地图渲染系统 - 准备瓦片地图渲染数据
 */
@ECSSystem('TilemapRendering', { updateOrder: 40 })
export class TilemapRenderingSystem extends EntitySystem implements IRenderDataProvider {
    private _renderDataCache: Map<number, TilemapRenderData> = new Map();
    private _currentFrameData: TilemapRenderData[] = [];
    private _viewportBounds: ViewportBounds | null = null;

    constructor() {
        super(Matcher.empty().all(TilemapComponent, TransformComponent));
    }

    setViewportBounds(bounds: ViewportBounds): void {
        this._viewportBounds = bounds;
    }

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

            let renderData = this._renderDataCache.get(entity.id);

            if (!renderData || tilemap.renderDirty) {
                renderData = this.buildRenderData(entity.id, tilemap, transform);
                this._renderDataCache.set(entity.id, renderData);
                tilemap.renderDirty = false;
            } else {
                this.updateTransforms(renderData, tilemap, transform);
            }

            this._currentFrameData.push(renderData);
        }

        this._currentFrameData.sort((a, b) => a.sortingOrder - b.sortingOrder);
    }

    private buildRenderData(
        entityId: number,
        tilemap: TilemapComponent,
        transform: TransformComponent
    ): TilemapRenderData {
        const mergedData = tilemap.getMergedTileData();
        const width = tilemap.width;
        const height = tilemap.height;
        const tileWidth = tilemap.tileWidth;
        const tileHeight = tilemap.tileHeight;

        // 计算可见瓦片范围
        let startCol = 0,
            endCol = width;
        let startRow = 0,
            endRow = height;

        if (this._viewportBounds) {
            const bounds = this._viewportBounds;
            const mapX = transform.position.x;
            const mapY = transform.position.y;

            startCol = Math.max(0, Math.floor((bounds.left - mapX) / tileWidth));
            endCol = Math.min(width, Math.ceil((bounds.right - mapX) / tileWidth));
            startRow = Math.max(0, Math.floor((bounds.bottom - mapY) / tileHeight));
            endRow = Math.min(height, Math.ceil((bounds.top - mapY) / tileHeight));
        }

        // 计算非空瓦片数量
        let tileCount = 0;
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                if (mergedData[row * width + col] > 0) tileCount++;
            }
        }

        const transforms = new Float32Array(tileCount * 7);
        const textureIds = new Uint32Array(tileCount);
        const uvs = new Float32Array(tileCount * 4);
        const colors = new Uint32Array(tileCount);

        const colorValue = this.parseColor(tilemap.color, tilemap.alpha);

        // 计算旋转参数
        // Calculate rotation parameters
        // Note: transform.rotation.z is already in radians (set by Viewport gizmo)
        // 注意：transform.rotation.z 已经是弧度（由 Viewport gizmo 设置）
        const cos = Math.cos(transform.rotation.z);
        const sin = Math.sin(transform.rotation.z);

        // Tilemap 旋转中心点（左下角为原点，中心在 width/2, height/2 处）
        // Tilemap rotation pivot (origin at bottom-left, center at width/2, height/2)
        const pivotX = transform.position.x + (width * tileWidth * transform.scale.x) / 2;
        const pivotY = transform.position.y + (height * tileHeight * transform.scale.y) / 2;

        let idx = 0;
        let texturePath: string | undefined;

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const gid = mergedData[row * width + col];
                if (gid <= 0) continue;

                // 查找对应的 tileset
                const tilesetInfo = tilemap.getTilesetForGid(gid);
                if (!tilesetInfo) {
                    continue;
                }

                const { index: tilesetIndex, localId } = tilesetInfo;

                // 获取纹理路径
                if (!texturePath && tilemap.tilesets[tilesetIndex]) {
                    texturePath = tilemap.tilesets[tilesetIndex].source;
                }

                // 计算瓦片的本地位置（相对于 tilemap 中心）
                // Calculate tile local position (relative to tilemap center)
                const localX = transform.position.x + col * tileWidth * transform.scale.x + (tileWidth * transform.scale.x) / 2 - pivotX;
                const localY = transform.position.y + (height - 1 - row) * tileHeight * transform.scale.y + (tileHeight * transform.scale.y) / 2 - pivotY;

                // 应用旋转变换
                // Apply rotation transform
                const rotatedX = localX * cos - localY * sin + pivotX;
                const rotatedY = localX * sin + localY * cos + pivotY;

                // Transform: [x, y, rotation, scaleX, scaleY, originX, originY]
                // Each tile rotates the same angle as the tilemap, so the whole map rotates as a unit
                // 每个 tile 旋转与 tilemap 相同的角度，这样整个地图作为一个整体旋转
                const tOffset = idx * 7;
                transforms[tOffset] = rotatedX;
                transforms[tOffset + 1] = rotatedY;
                transforms[tOffset + 2] = transform.rotation.z; // Each tile rotates with tilemap
                transforms[tOffset + 3] = tileWidth * transform.scale.x;
                transforms[tOffset + 4] = tileHeight * transform.scale.y;
                transforms[tOffset + 5] = 0.5;
                transforms[tOffset + 6] = 0.5;

                // Texture ID (使用 tileset 的 textureId)
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
            transforms,
            textureIds,
            uvs,
            colors,
            tileCount,
            sortingOrder: tilemap.sortingOrder,
            texturePath
        };
    }

    private updateTransforms(
        renderData: TilemapRenderData,
        tilemap: TilemapComponent,
        transform: TransformComponent
    ): void {
        const mergedData = tilemap.getMergedTileData();
        const width = tilemap.width;
        const height = tilemap.height;
        const tileWidth = tilemap.tileWidth;
        const tileHeight = tilemap.tileHeight;

        // 计算可见瓦片范围（与 buildRenderData 保持一致）
        // Calculate visible tile range (consistent with buildRenderData)
        let startCol = 0,
            endCol = width;
        let startRow = 0,
            endRow = height;

        if (this._viewportBounds) {
            const bounds = this._viewportBounds;
            const mapX = transform.position.x;
            const mapY = transform.position.y;

            startCol = Math.max(0, Math.floor((bounds.left - mapX) / tileWidth));
            endCol = Math.min(width, Math.ceil((bounds.right - mapX) / tileWidth));
            startRow = Math.max(0, Math.floor((bounds.bottom - mapY) / tileHeight));
            endRow = Math.min(height, Math.ceil((bounds.top - mapY) / tileHeight));
        }

        // 计算旋转参数
        // Calculate rotation parameters
        // Note: transform.rotation.z is already in radians (set by Viewport gizmo)
        // 注意：transform.rotation.z 已经是弧度（由 Viewport gizmo 设置）
        const cos = Math.cos(transform.rotation.z);
        const sin = Math.sin(transform.rotation.z);

        // Tilemap 旋转中心点
        // Tilemap rotation pivot
        const pivotX = transform.position.x + (width * tileWidth * transform.scale.x) / 2;
        const pivotY = transform.position.y + (height * tileHeight * transform.scale.y) / 2;

        let idx = 0;
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                if (mergedData[row * width + col] <= 0) continue;

                // 计算瓦片的本地位置（相对于 tilemap 中心）
                // Calculate tile local position (relative to tilemap center)
                const localX = transform.position.x + col * tileWidth * transform.scale.x + (tileWidth * transform.scale.x) / 2 - pivotX;
                const localY = transform.position.y + (height - 1 - row) * tileHeight * transform.scale.y + (tileHeight * transform.scale.y) / 2 - pivotY;

                // 应用旋转变换
                // Apply rotation transform
                const rotatedX = localX * cos - localY * sin + pivotX;
                const rotatedY = localX * sin + localY * cos + pivotY;

                // Each tile rotates the same angle as the tilemap
                // 每个 tile 旋转与 tilemap 相同的角度
                const tOffset = idx * 7;
                renderData.transforms[tOffset] = rotatedX;
                renderData.transforms[tOffset + 1] = rotatedY;
                renderData.transforms[tOffset + 2] = transform.rotation.z;
                renderData.transforms[tOffset + 3] = tileWidth * transform.scale.x;
                renderData.transforms[tOffset + 4] = tileHeight * transform.scale.y;

                idx++;
            }
        }

        // Update color (alpha may have changed)
        // 更新颜色（alpha 可能已更改）
        const colorValue = this.parseColor(tilemap.color, tilemap.alpha);
        for (let i = 0; i < renderData.colors.length; i++) {
            renderData.colors[i] = colorValue;
        }

        renderData.sortingOrder = tilemap.sortingOrder;
    }

    private parseColor(hex: string, alpha: number): number {
        const colorHex = hex.replace('#', '');

        let r = 255,
            g = 255,
            b = 255;

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
        return (a << 24) | (b << 16) | (g << 8) | r;
    }

    protected override onRemoved(entity: Entity): void {
        this._renderDataCache.delete(entity.id);
    }

    clearCache(): void {
        this._renderDataCache.clear();
        this._currentFrameData = [];
    }
}
