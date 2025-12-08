/**
 * Texture asset loader
 * 纹理资产加载器
 */

import { AssetType } from '../types/AssetTypes';
import { IAssetLoader, ITextureAsset, IAssetParseContext } from '../interfaces/IAssetLoader';
import { IAssetContent, AssetContentType } from '../interfaces/IAssetReader';

/**
 * 全局引擎桥接接口（运行时挂载到 window）
 * Global engine bridge interface (mounted to window at runtime)
 */
interface IEngineBridgeGlobal {
    loadTexture?(textureId: number, path: string): Promise<void>;
    unloadTexture?(textureId: number): void;
}

/**
 * 获取全局引擎桥接
 * Get global engine bridge
 */
function getEngineBridge(): IEngineBridgeGlobal | undefined {
    if (typeof window !== 'undefined' && 'engineBridge' in window) {
        return (window as Window & { engineBridge?: IEngineBridgeGlobal }).engineBridge;
    }
    return undefined;
}

/**
 * Texture loader implementation
 * 纹理加载器实现
 */
export class TextureLoader implements IAssetLoader<ITextureAsset> {
    readonly supportedType = AssetType.Texture;
    readonly supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
    readonly contentType: AssetContentType = 'image';

    private static _nextTextureId = 1;

    /**
     * Parse texture from image content.
     * 从图片内容解析纹理。
     */
    async parse(content: IAssetContent, context: IAssetParseContext): Promise<ITextureAsset> {
        if (!content.image) {
            throw new Error('Texture content is empty');
        }

        const image = content.image;

        const textureAsset: ITextureAsset = {
            textureId: TextureLoader._nextTextureId++,
            width: image.width,
            height: image.height,
            format: 'rgba',
            hasMipmaps: false,
            data: image
        };

        // Upload to GPU if bridge exists.
        const bridge = getEngineBridge();
        if (bridge?.loadTexture) {
            await bridge.loadTexture(textureAsset.textureId, context.metadata.path);
        }

        return textureAsset;
    }

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(asset: ITextureAsset): void {
        // Release GPU resources.
        const bridge = getEngineBridge();
        if (bridge?.unloadTexture) {
            bridge.unloadTexture(asset.textureId);
        }

        // Clean up image data.
        if (asset.data instanceof HTMLImageElement) {
            asset.data.src = '';
        }
    }
}
