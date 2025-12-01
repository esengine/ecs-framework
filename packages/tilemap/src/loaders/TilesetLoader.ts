/**
 * Tileset asset loader
 * 瓦片集资产加载器
 */

import {
    IAssetLoadOptions,
    IAssetMetadata,
    IAssetLoadResult,
    AssetLoadError,
    IAssetLoader
} from '@esengine/asset-system';
import { TilesetAssetType } from '../constants';

/**
 * Tileset data interface
 * 瓦片集数据接口
 */
export interface ITilesetAsset {
    /** 名称 */
    name: string;
    /** 版本 */
    version: number;
    /** 纹理图像资源GUID或路径 */
    image: string;
    /** 图像宽度（像素） */
    imageWidth: number;
    /** 图像高度（像素） */
    imageHeight: number;
    /** 瓦片宽度（像素） */
    tileWidth: number;
    /** 瓦片高度（像素） */
    tileHeight: number;
    /** 瓦片总数 */
    tileCount: number;
    /** 列数 */
    columns: number;
    /** 行数 */
    rows: number;
    /** 边距（像素） */
    margin?: number;
    /** 间距（像素） */
    spacing?: number;
    /** 每个瓦片的元数据 */
    tiles?: Array<{
        id: number;
        type?: string;
        properties?: Record<string, unknown>;
    }>;
}

/**
 * Tileset loader implementation
 * 瓦片集加载器实现
 */
export class TilesetLoader implements IAssetLoader<ITilesetAsset> {
    readonly supportedType = TilesetAssetType;
    readonly supportedExtensions = ['.tileset.json', '.tileset'];

    /**
     * Load tileset asset
     * 加载瓦片集资产
     */
    async load(
        path: string,
        metadata: IAssetMetadata,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<ITilesetAsset>> {
        const startTime = performance.now();

        try {
            const response = await this.fetchWithTimeout(path, options?.timeout);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonData = await response.json() as ITilesetAsset;

            // 验证必要字段
            if (!jsonData.tileWidth || !jsonData.tileHeight || !jsonData.image) {
                throw new Error('Invalid tileset format: missing required fields');
            }

            // 计算派生字段（如果未提供）
            if (!jsonData.columns && jsonData.imageWidth) {
                jsonData.columns = Math.floor(jsonData.imageWidth / jsonData.tileWidth);
            }
            if (!jsonData.rows && jsonData.imageHeight) {
                jsonData.rows = Math.floor(jsonData.imageHeight / jsonData.tileHeight);
            }
            if (!jsonData.tileCount && jsonData.columns && jsonData.rows) {
                jsonData.tileCount = jsonData.columns * jsonData.rows;
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
                    `Failed to load tileset: ${error.message}`,
                    metadata.guid,
                    TilesetAssetType,
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
    dispose(asset: ITilesetAsset): void {
        (asset as any).tiles = null;
    }
}
