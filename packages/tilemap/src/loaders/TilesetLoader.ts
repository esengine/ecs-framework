/**
 * Tileset asset loader
 * 瓦片集资产加载器
 */

import {
    IAssetLoader,
    IAssetContent,
    IAssetParseContext,
    AssetContentType
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
    readonly contentType: AssetContentType = 'text';

    /**
     * Parse tileset asset from text content
     * 从文本内容解析瓦片集资产
     */
    async parse(content: IAssetContent, _context: IAssetParseContext): Promise<ITilesetAsset> {
        if (!content.text) {
            throw new Error('Tileset content is empty');
        }

        const jsonData = JSON.parse(content.text) as ITilesetAsset;

        // 验证必要字段
        // Validate required fields
        if (!jsonData.tileWidth || !jsonData.tileHeight || !jsonData.image) {
            throw new Error('Invalid tileset format: missing required fields');
        }

        // 计算派生字段（如果未提供）
        // Calculate derived fields if not provided
        if (!jsonData.columns && jsonData.imageWidth) {
            jsonData.columns = Math.floor(jsonData.imageWidth / jsonData.tileWidth);
        }
        if (!jsonData.rows && jsonData.imageHeight) {
            jsonData.rows = Math.floor(jsonData.imageHeight / jsonData.tileHeight);
        }
        if (!jsonData.tileCount && jsonData.columns && jsonData.rows) {
            jsonData.tileCount = jsonData.columns * jsonData.rows;
        }

        return jsonData;
    }

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(asset: ITilesetAsset): void {
        // 清理瓦片元数据 | Clean up tile metadata
        if (asset.tiles) {
            asset.tiles.length = 0;
        }
    }
}
