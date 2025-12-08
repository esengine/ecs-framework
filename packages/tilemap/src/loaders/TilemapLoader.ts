/**
 * Tilemap asset loader
 * 瓦片地图资产加载器
 */

import {
    IAssetLoader,
    IAssetContent,
    IAssetParseContext,
    AssetContentType
} from '@esengine/asset-system';
import { TilemapAssetType } from '../constants';

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
        /** 材质路径 */
        materialPath?: string;
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
    readonly supportedType = TilemapAssetType;
    readonly supportedExtensions = ['.tilemap.json', '.tilemap'];
    readonly contentType: AssetContentType = 'text';

    /**
     * Parse tilemap asset from text content
     * 从文本内容解析瓦片地图资产
     */
    async parse(content: IAssetContent, _context: IAssetParseContext): Promise<ITilemapAsset> {
        if (!content.text) {
            throw new Error('Tilemap content is empty');
        }

        const jsonData = JSON.parse(content.text) as ITilemapAsset;

        // 验证必要字段
        // Validate required fields
        if (!jsonData.width || !jsonData.height || !jsonData.data) {
            throw new Error('Invalid tilemap format: missing required fields');
        }

        return jsonData;
    }

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(asset: ITilemapAsset): void {
        // 清理瓦片数据 | Clean up tile data
        asset.data.length = 0;
        if (asset.layers) {
            asset.layers.length = 0;
        }
        if (asset.collisionData) {
            asset.collisionData.length = 0;
        }
    }
}
