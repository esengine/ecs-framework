/**
 * Text asset loader
 * 文本资产加载器
 */

import {
    AssetType,
    IAssetLoadOptions,
    IAssetMetadata,
    IAssetLoadResult,
    AssetLoadError
} from '../types/AssetTypes';
import { IAssetLoader, ITextAsset } from '../interfaces/IAssetLoader';

/**
 * Text loader implementation
 * 文本加载器实现
 */
export class TextLoader implements IAssetLoader<ITextAsset> {
    readonly supportedType = AssetType.Text;
    readonly supportedExtensions = ['.txt', '.text', '.md', '.csv', '.xml', '.html', '.css', '.js', '.ts'];

    /**
     * Load text asset
     * 加载文本资产
     */
    async load(
        path: string,
        metadata: IAssetMetadata,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<ITextAsset>> {
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
            let content: string;
            if (options?.onProgress && total > 0) {
                content = await this.readResponseWithProgress(response, total, options.onProgress);
            } else {
                content = await response.text();
            }

            // 检测编码 / Detect encoding
            const encoding = this.detectEncoding(content);

            const asset: ITextAsset = {
                content,
                encoding
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
                    `Failed to load text: ${error.message}`,
                    metadata.guid,
                    AssetType.Text,
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
    ): Promise<string> {
        const reader = response.body?.getReader();
        if (!reader) {
            return response.text();
        }

        const decoder = new TextDecoder('utf-8');
        let result = '';
        let receivedLength = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            receivedLength += value.length;
            result += decoder.decode(value, { stream: true });

            // 报告进度 / Report progress
            onProgress(receivedLength / total);
        }

        return result;
    }

    /**
     * Detect text encoding
     * 检测文本编码
     */
    private detectEncoding(content: string): 'utf8' | 'utf16' | 'ascii' {
        // 简单的编码检测 / Simple encoding detection
        // 检查是否包含非ASCII字符 / Check for non-ASCII characters
        for (let i = 0; i < content.length; i++) {
            const charCode = content.charCodeAt(i);
            if (charCode > 127) {
                // 包含非ASCII字符，可能是UTF-8或UTF-16 / Contains non-ASCII, likely UTF-8 or UTF-16
                return charCode > 255 ? 'utf16' : 'utf8';
            }
        }
        return 'ascii';
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
    dispose(asset: ITextAsset): void {
        // 清空内容以帮助GC / Clear content to help GC
        (asset as any).content = '';
    }
}