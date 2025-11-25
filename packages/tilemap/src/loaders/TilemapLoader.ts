/**
 * Tilemap asset loader
 * 瓦片地图资产加载器
 */

import {
    AssetType,
    IAssetLoadOptions,
    IAssetMetadata,
    IAssetLoadResult,
    AssetLoadError,
    IAssetLoader
} from '@esengine/asset-system';

/**
 * Tilemap data interface
 * 瓦片地图数据接口
 */
export interface ITilemapAsset {
    /** 名称 */
    name: string;
    /** 版本 */
    version: number;
    /** 宽度（瓦片数） */
    width: number;
    /** 高度（瓦片数） */
    height: number;
    /** 瓦片宽度（像素） */
    tileWidth: number;
    /** 瓦片高度（像素） */
    tileHeight: number;
    /** 瓦片集资源GUID */
    tileset: string;
    /** 瓦片数据（行主序，0表示空） */
    data: number[];
    /** 图层（可选） */
    layers?: Array<{
        name: string;
        visible: boolean;
        opacity: number;
        data?: number[];
    }>;
    /** 碰撞数据（可选） */
    collisionData?: number[];
    /** 自定义属性 */
    properties?: Record<string, unknown>;
}

/**
 * Tilemap loader implementation
 * 瓦片地图加载器实现
 */
export class TilemapLoader implements IAssetLoader<ITilemapAsset> {
    readonly supportedType = AssetType.Tilemap;
    readonly supportedExtensions = ['.tilemap.json', '.tilemap'];

    /**
     * Load tilemap asset
     * 加载瓦片地图资产
     */
    async load(
        path: string,
        metadata: IAssetMetadata,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<ITilemapAsset>> {
        const startTime = performance.now();

        try {
            const response = await this.fetchWithTimeout(path, options?.timeout);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonData = await response.json() as ITilemapAsset;

            // 验证必要字段
            if (!jsonData.width || !jsonData.height || !jsonData.data) {
                throw new Error('Invalid tilemap format: missing required fields');
            }

            return {
                asset: jsonData,
                handle: 0,
                metadata,
                loadTime: performance.now() - startTime
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new AssetLoadError(
                    `Failed to load tilemap: ${error.message}`,
                    metadata.guid,
                    AssetType.Tilemap,
                    error
                );
            }
            throw AssetLoadError.fileNotFound(metadata.guid, path);
        }
    }

    /**
     * Fetch with timeout
     * 带超时的fetch
     */
    private async fetchWithTimeout(url: string, timeout = 30000): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                mode: 'cors',
                credentials: 'same-origin'
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Validate if the loader can handle this asset
     * 验证加载器是否可以处理此资产
     */
    canLoad(path: string, _metadata: IAssetMetadata): boolean {
        const lowerPath = path.toLowerCase();
        return this.supportedExtensions.some(ext => lowerPath.endsWith(ext));
    }

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(asset: ITilemapAsset): void {
        (asset as any).data = null;
        (asset as any).layers = null;
        (asset as any).collisionData = null;
    }
}
