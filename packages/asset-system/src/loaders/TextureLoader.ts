/**
 * Texture asset loader
 * 纹理资产加载器
 */

import { AssetType } from '../types/AssetTypes';
import { IAssetLoader, ITextureAsset, IAssetParseContext } from '../interfaces/IAssetLoader';
import { IAssetContent, AssetContentType } from '../interfaces/IAssetReader';

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
        if (typeof window !== 'undefined' && (window as any).engineBridge) {
            await this.uploadToGPU(textureAsset, context.metadata.path);
        }

        return textureAsset;
    }

    /**
     * Upload texture to GPU
     * 上传纹理到GPU
     */
    private async uploadToGPU(textureAsset: ITextureAsset, path: string): Promise<void> {
        const bridge = (window as any).engineBridge;
        if (bridge && bridge.loadTexture) {
            await bridge.loadTexture(textureAsset.textureId, path);
        }
    }

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(asset: ITextureAsset): void {
        // Release GPU resources.
        if (typeof window !== 'undefined' && (window as any).engineBridge) {
            const bridge = (window as any).engineBridge;
            if (bridge.unloadTexture) {
                bridge.unloadTexture(asset.textureId);
            }
        }

        // Clean up image data.
        if (asset.data instanceof HTMLImageElement) {
            asset.data.src = '';
        }
    }
}
