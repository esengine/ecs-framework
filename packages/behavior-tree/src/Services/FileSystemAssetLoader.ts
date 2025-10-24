import type { IService } from '@esengine/ecs-framework';
import { IAssetLoader } from './IAssetLoader';
import { BehaviorTreeAsset } from '../Serialization/BehaviorTreeAsset';
import { BehaviorTreeAssetSerializer, DeserializationOptions } from '../Serialization/BehaviorTreeAssetSerializer';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('FileSystemAssetLoader');

/**
 * 文件系统资产加载器配置
 */
export interface FileSystemAssetLoaderConfig {
    /** 资产基础路径 */
    basePath: string;

    /** 资产格式 */
    format: 'json' | 'binary';

    /** 文件扩展名（可选，默认根据格式自动设置） */
    extension?: string;

    /** 是否启用缓存 */
    enableCache?: boolean;

    /** 自定义文件读取函数（可选） */
    readFile?: (path: string) => Promise<string | Uint8Array>;
}

/**
 * 文件系统资产加载器
 *
 * 从文件系统加载行为树资产，支持 JSON 和 Binary 格式。
 * 提供资产缓存和预加载功能。
 *
 * @example
 * ```typescript
 * // 创建加载器
 * const loader = new FileSystemAssetLoader({
 *     basePath: 'assets/behavior-trees',
 *     format: 'json',
 *     enableCache: true
 * });
 *
 * // 加载资产
 * const asset = await loader.loadBehaviorTree('patrol');
 * ```
 */
export class FileSystemAssetLoader implements IAssetLoader, IService {
    private config: Required<FileSystemAssetLoaderConfig>;
    private cache: Map<string, BehaviorTreeAsset> = new Map();

    constructor(config: FileSystemAssetLoaderConfig) {
        this.config = {
            basePath: config.basePath,
            format: config.format,
            extension: config.extension || (config.format === 'json' ? '.btree.json' : '.btree.bin'),
            enableCache: config.enableCache ?? true,
            readFile: config.readFile || this.defaultReadFile.bind(this)
        };

        // 规范化路径
        this.config.basePath = this.config.basePath.replace(/\\/g, '/').replace(/\/$/, '');
    }

    /**
     * 加载行为树资产
     */
    async loadBehaviorTree(assetId: string): Promise<BehaviorTreeAsset> {
        // 检查缓存
        if (this.config.enableCache && this.cache.has(assetId)) {
            logger.debug(`从缓存加载资产: ${assetId}`);
            return this.cache.get(assetId)!;
        }

        logger.info(`加载行为树资产: ${assetId}`);

        try {
            // 构建文件路径
            const filePath = this.resolveAssetPath(assetId);

            // 读取文件
            const data = await this.config.readFile(filePath);

            // 反序列化（自动根据 data 类型判断格式）
            const options: DeserializationOptions = {
                validate: true,
                strict: true
            };

            const asset = BehaviorTreeAssetSerializer.deserialize(data, options);

            // 缓存资产
            if (this.config.enableCache) {
                this.cache.set(assetId, asset);
            }

            logger.info(`成功加载资产: ${assetId}`);
            return asset;
        } catch (error) {
            logger.error(`加载资产失败: ${assetId}`, error);
            throw new Error(`Failed to load behavior tree asset '${assetId}': ${error}`);
        }
    }

    /**
     * 检查资产是否存在
     */
    async exists(assetId: string): Promise<boolean> {
        // 如果在缓存中，直接返回 true
        if (this.config.enableCache && this.cache.has(assetId)) {
            return true;
        }

        try {
            const filePath = this.resolveAssetPath(assetId);
            // 尝试读取文件（如果文件不存在会抛出异常）
            await this.config.readFile(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 预加载资产
     */
    async preload(assetIds: string[]): Promise<void> {
        logger.info(`预加载 ${assetIds.length} 个资产...`);

        const promises = assetIds.map(id => this.loadBehaviorTree(id).catch(error => {
            logger.warn(`预加载资产失败: ${id}`, error);
        }));

        await Promise.all(promises);

        logger.info(`预加载完成`);
    }

    /**
     * 卸载资产
     */
    unload(assetId: string): void {
        if (this.cache.has(assetId)) {
            this.cache.delete(assetId);
            logger.debug(`卸载资产: ${assetId}`);
        }
    }

    /**
     * 清空缓存
     */
    clearCache(): void {
        this.cache.clear();
        logger.info('缓存已清空');
    }

    /**
     * 获取缓存的资产数量
     */
    getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * 释放资源
     */
    dispose(): void {
        this.clearCache();
    }

    /**
     * 解析资产路径
     */
    private resolveAssetPath(assetId: string): string {
        // 移除开头的斜杠
        const normalizedId = assetId.replace(/^\/+/, '');

        // 构建完整路径
        return `${this.config.basePath}/${normalizedId}${this.config.extension}`;
    }

    /**
     * 默认文件读取实现
     *
     * 注意：此实现依赖运行环境
     * - 浏览器：需要通过 fetch 或 XMLHttpRequest
     * - Node.js：需要使用 fs
     * - 游戏引擎：需要使用引擎的文件 API
     *
     * 用户应该提供自己的 readFile 实现
     */
    private async defaultReadFile(path: string): Promise<string | Uint8Array> {
        // 检测运行环境
        if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
            // 浏览器环境
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (this.config.format === 'binary') {
                const buffer = await response.arrayBuffer();
                return new Uint8Array(buffer);
            } else {
                return await response.text();
            }
        } else if (typeof require !== 'undefined') {
            // Node.js 环境
            try {
                const fs = require('fs').promises;
                if (this.config.format === 'binary') {
                    const buffer = await fs.readFile(path);
                    return new Uint8Array(buffer);
                } else {
                    return await fs.readFile(path, 'utf-8');
                }
            } catch (error) {
                throw new Error(`Failed to read file '${path}': ${error}`);
            }
        } else {
            throw new Error(
                'No default file reading implementation available. ' +
                'Please provide a custom readFile function in the config.'
            );
        }
    }
}
