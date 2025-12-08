/**
 * Binary asset loader
 * 二进制资产加载器
 */

import { AssetType } from '../types/AssetTypes';
import { IAssetLoader, IBinaryAsset, IAssetParseContext } from '../interfaces/IAssetLoader';
import { IAssetContent, AssetContentType } from '../interfaces/IAssetReader';

/**
 * Binary loader implementation
 * 二进制加载器实现
 */
export class BinaryLoader implements IAssetLoader<IBinaryAsset> {
    readonly supportedType = AssetType.Binary;
    readonly supportedExtensions = [
        '.bin', '.dat', '.raw', '.bytes',
        '.wasm', '.so', '.dll', '.dylib'
    ];
    readonly contentType: AssetContentType = 'binary';

    /**
     * Parse binary from content.
     * 从内容解析二进制。
     */
    async parse(content: IAssetContent, _context: IAssetParseContext): Promise<IBinaryAsset> {
        if (!content.binary) {
            throw new Error('Binary content is empty');
        }

        return {
            data: content.binary
        };
    }

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(asset: IBinaryAsset): void {
        // 释放二进制数据引用以允许垃圾回收
        // Release binary data reference to allow garbage collection
        (asset as { data: ArrayBuffer | null }).data = null;
    }
}
