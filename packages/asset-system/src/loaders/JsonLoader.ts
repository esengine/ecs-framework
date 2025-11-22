/**
 * JSON asset loader
 * JSON资产加载器
 */

import {
    AssetType,
    IAssetLoadOptions,
    IAssetMetadata,
    IAssetLoadResult,
    AssetLoadError
} from '../types/AssetTypes';
import { IAssetLoader, IJsonAsset } from '../interfaces/IAssetLoader';

/**
 * JSON loader implementation
 * JSON加载器实现
 */
export class JsonLoader implements IAssetLoader<IJsonAsset> {
    readonly supportedType = AssetType.Json;
    readonly supportedExtensions = ['.json', '.jsonc'];

    /**
     * Load JSON asset
     * 加载JSON资产
     */
    async load(
        path: string,
        metadata: IAssetMetadata,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<IJsonAsset>> {
        const startTime = performance.now();

        try {
            const response = await this.fetchWithTimeout(path, options?.timeout);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 获取总大小用于进度回调 / Get total size for progress callback
            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            // 读取响应 / Read response
            let jsonData: unknown;
            if (options?.onProgress && total > 0) {
                jsonData = await this.readResponseWithProgress(response, total, options.onProgress);
            } else {
                jsonData = await response.json();
            }

            const asset: IJsonAsset = {
                data: jsonData
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
                    `Failed to load JSON: ${error.message}`,
                    metadata.guid,
                    AssetType.Json,
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
    ): Promise<unknown> {
        const reader = response.body?.getReader();
        if (!reader) {
            return response.json();
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

        // 合并chunks / Merge chunks
        const allChunks = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
            allChunks.set(chunk, position);
            position += chunk.length;
        }

        // 解码为字符串并解析JSON / Decode to string and parse JSON
        const decoder = new TextDecoder('utf-8');
        const jsonString = decoder.decode(allChunks);
        return JSON.parse(jsonString);
    }

    /**
     * Validate if the loader can handle this asset
     * 验证加载器是否可以处理此资产
     */
    canLoad(path: string, metadata: IAssetMetadata): boolean {
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
    dispose(asset: IJsonAsset): void {
        // JSON资产通常不需要特殊清理 / JSON assets usually don't need special cleanup
        // 但可以清空引用以帮助GC / But can clear references to help GC
        (asset as any).data = null;
    }
}