/**
 * Binary asset loader
 * 二进制资产加载器
 */

import {
    AssetType,
    IAssetLoadOptions,
    IAssetMetadata,
    IAssetLoadResult,
    AssetLoadError
} from '../types/AssetTypes';
import { IAssetLoader, IBinaryAsset } from '../interfaces/IAssetLoader';

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

    /**
     * Load binary asset
     * 加载二进制资产
     */
    async load(
        path: string,
        metadata: IAssetMetadata,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<IBinaryAsset>> {
        const startTime = performance.now();

        try {
            const response = await this.fetchWithTimeout(path, options?.timeout);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 获取MIME类型 / Get MIME type
            const mimeType = response.headers.get('content-type') || undefined;

            // 获取总大小用于进度回调 / Get total size for progress callback
            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            // 读取响应 / Read response
            let data: ArrayBuffer;
            if (options?.onProgress && total > 0) {
                data = await this.readResponseWithProgress(response, total, options.onProgress);
            } else {
                data = await response.arrayBuffer();
            }

            const asset: IBinaryAsset = {
                data,
                mimeType
            };

            return {
                asset,
                handle: 0,
                metadata,
                loadTime: performance.now() - startTime
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new AssetLoadError(
                    `Failed to load binary: ${error.message}`,
                    metadata.guid,
                    AssetType.Binary,
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
     * Read response with progress
     * 带进度读取响应
     */
    private async readResponseWithProgress(
        response: Response,
        total: number,
        onProgress: (progress: number) => void
    ): Promise<ArrayBuffer> {
        const reader = response.body?.getReader();
        if (!reader) {
            return response.arrayBuffer();
        }

        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            // 报告进度 / Report progress
            onProgress(receivedLength / total);
        }

        // 合并chunks到ArrayBuffer / Merge chunks into ArrayBuffer
        const result = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
            result.set(chunk, position);
            position += chunk.length;
        }

        return result.buffer;
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
    dispose(asset: IBinaryAsset): void {
        // ArrayBuffer无法直接释放，但可以清空引用 / Can't directly release ArrayBuffer, but clear reference
        (asset as any).data = null;
    }
}