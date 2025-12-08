/**
 * JSON asset loader
 * JSON资产加载器
 */

import { AssetType } from '../types/AssetTypes';
import { IAssetLoader, IJsonAsset, IAssetParseContext } from '../interfaces/IAssetLoader';
import { IAssetContent, AssetContentType } from '../interfaces/IAssetReader';

/**
 * JSON loader implementation
 * JSON加载器实现
 */
export class JsonLoader implements IAssetLoader<IJsonAsset> {
    readonly supportedType = AssetType.Json;
    readonly supportedExtensions = ['.json', '.jsonc'];
    readonly contentType: AssetContentType = 'text';

    /**
     * Parse JSON from text content.
     * 从文本内容解析JSON。
     */
    async parse(content: IAssetContent, _context: IAssetParseContext): Promise<IJsonAsset> {
        if (!content.text) {
            throw new Error('JSON content is empty');
        }

        return {
            data: JSON.parse(content.text)
        };
    }

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(asset: IJsonAsset): void {
        // 清空 JSON 数据 | Clear JSON data
        asset.data = null;
    }
}
