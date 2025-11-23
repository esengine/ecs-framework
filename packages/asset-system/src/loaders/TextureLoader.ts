/**
 * Texture asset loader
 * 纹理资产加载器
 */

import {
    AssetType,
    IAssetLoadOptions,
    IAssetMetadata,
    IAssetLoadResult,
    AssetLoadError
} from '../types/AssetTypes';
import { IAssetLoader, ITextureAsset } from '../interfaces/IAssetLoader';

/**
 * Texture loader implementation
 * 纹理加载器实现
 */
export class TextureLoader implements IAssetLoader<ITextureAsset> {
    readonly supportedType = AssetType.Texture;
    readonly supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

    private static _nextTextureId = 1;
    private readonly _loadedTextures = new Map<string, ITextureAsset>();

    /**
     * Load texture asset
     * 加载纹理资产
     */
    async load(
        path: string,
        metadata: IAssetMetadata,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<ITextureAsset>> {
        const startTime = performance.now();

        // 检查缓存 / Check cache
        if (!options?.forceReload && this._loadedTextures.has(path)) {
            const cached = this._loadedTextures.get(path)!;
            return {
                asset: cached,
                handle: cached.textureId,
                metadata,
                loadTime: 0
            };
        }

        try {
            // 创建图像元素 / Create image element
            const image = await this.loadImage(path, options);

            // 创建纹理资产 / Create texture asset
            const textureAsset: ITextureAsset = {
                textureId: TextureLoader._nextTextureId++,
                width: image.width,
                height: image.height,
                format: 'rgba', // 默认格式 / Default format
                hasMipmaps: false,
                data: image
            };

            // 缓存纹理 / Cache texture
            this._loadedTextures.set(path, textureAsset);

            // 触发引擎纹理加载（如果有引擎桥接） / Trigger engine texture loading if bridge exists
            if (typeof window !== 'undefined' && (window as any).engineBridge) {
                await this.uploadToGPU(textureAsset, path);
            }

            return {
                asset: textureAsset,
                handle: textureAsset.textureId,
                metadata,
                loadTime: performance.now() - startTime
            };
        } catch (error) {
            throw AssetLoadError.fileNotFound(metadata.guid, path);
        }
    }

    /**
     * Load image from URL
     * 从URL加载图像
     */
    private async loadImage(url: string, options?: IAssetLoadOptions): Promise<HTMLImageElement> {
        // For Tauri asset URLs, use fetch to load the image
        // 对于Tauri资产URL，使用fetch加载图像
        if (url.startsWith('http://asset.localhost/') || url.startsWith('asset://')) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                return new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        // Clean up blob URL after loading
                        // 加载后清理blob URL
                        URL.revokeObjectURL(blobUrl);
                        resolve(image);
                    };
                    image.onerror = () => {
                        URL.revokeObjectURL(blobUrl);
                        reject(new Error(`Failed to load image from blob: ${url}`));
                    };
                    image.src = blobUrl;
                });
            } catch (error) {
                throw new Error(`Failed to load Tauri asset: ${url} - ${error}`);
            }
        }

        // For regular URLs, use standard Image loading
        // 对于常规URL，使用标准Image加载
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';

            // 超时处理 / Timeout handling
            const timeout = options?.timeout || 30000;
            const timeoutId = setTimeout(() => {
                reject(new Error(`Image load timeout: ${url}`));
            }, timeout);

            // 进度回调 / Progress callback
            if (options?.onProgress) {
                // 图像加载没有真正的进度事件，模拟进度 / Images don't have real progress events, simulate
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress = Math.min(progress + 0.1, 0.9);
                    options.onProgress!(progress);
                }, 100);

                image.onload = () => {
                    clearInterval(progressInterval);
                    clearTimeout(timeoutId);
                    options.onProgress!(1);
                    resolve(image);
                };

                image.onerror = () => {
                    clearInterval(progressInterval);
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load image: ${url}`));
                };
            } else {
                image.onload = () => {
                    clearTimeout(timeoutId);
                    resolve(image);
                };

                image.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load image: ${url}`));
                };
            }

            image.src = url;
        });
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
     * Validate if the loader can handle this asset
     * 验证加载器是否可以处理此资产
     */
    canLoad(path: string, _metadata: IAssetMetadata): boolean {
        const ext = path.toLowerCase().substring(path.lastIndexOf('.'));
        return this.supportedExtensions.includes(ext);
    }

    /**
     * Estimate memory usage for the asset
     * 估算资产的内存使用量
     */

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(asset: ITextureAsset): void {
        // 从缓存中移除 / Remove from cache
        for (const [path, cached] of this._loadedTextures.entries()) {
            if (cached === asset) {
                this._loadedTextures.delete(path);
                break;
            }
        }

        // 释放GPU资源 / Release GPU resources
        if (typeof window !== 'undefined' && (window as any).engineBridge) {
            const bridge = (window as any).engineBridge;
            if (bridge.unloadTexture) {
                bridge.unloadTexture(asset.textureId);
            }
        }

        // 清理图像数据 / Clean up image data
        if (asset.data instanceof HTMLImageElement) {
            asset.data.src = '';
        }
    }
}
