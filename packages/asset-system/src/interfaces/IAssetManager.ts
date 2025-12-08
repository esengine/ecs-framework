/**
 * Asset manager interfaces
 * 资产管理器接口
 */

import {
    AssetGUID,
    AssetHandle,
    AssetType,
    AssetState,
    IAssetLoadOptions,
    IAssetLoadResult,
    IAssetReferenceInfo,
    IAssetPreloadGroup,
    IAssetLoadProgress,
    IAssetCatalog
} from '../types/AssetTypes';
import { IAssetLoader, IAssetLoaderFactory } from './IAssetLoader';
import { IAssetReader } from './IAssetReader';
import type { AssetDatabase } from '../core/AssetDatabase';

/**
 * Asset manager interface
 * 资产管理器接口
 */
export interface IAssetManager {
    /**
     * Load asset by GUID
     * 通过GUID加载资产
     */
    loadAsset<T = unknown>(
        guid: AssetGUID,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<T>>;

    /**
     * Load asset by path
     * 通过路径加载资产
     */
    loadAssetByPath<T = unknown>(
        path: string,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<T>>;

    /**
     * Load multiple assets
     * 批量加载资产
     */
    loadAssets(
        guids: AssetGUID[],
        options?: IAssetLoadOptions
    ): Promise<Map<AssetGUID, IAssetLoadResult>>;

    /**
     * Preload asset group
     * 预加载资产组
     */
    preloadGroup(
        group: IAssetPreloadGroup,
        onProgress?: (progress: IAssetLoadProgress) => void
    ): Promise<void>;

    /**
     * Get loaded asset
     * 获取已加载的资产
     */
    getAsset<T = unknown>(guid: AssetGUID): T | null;

    /**
     * Get asset by handle
     * 通过句柄获取资产
     */
    getAssetByHandle<T = unknown>(handle: AssetHandle): T | null;

    /**
     * Get loaded asset by path (synchronous)
     * 通过路径获取已加载的资产（同步）
     */
    getAssetByPath<T = unknown>(path: string): T | null;

    /**
     * Check if asset is loaded
     * 检查资产是否已加载
     */
    isLoaded(guid: AssetGUID): boolean;

    /**
     * Get asset state
     * 获取资产状态
     */
    getAssetState(guid: AssetGUID): AssetState;

    /**
     * Unload asset
     * 卸载资产
     */
    unloadAsset(guid: AssetGUID): void;

    /**
     * Unload all assets
     * 卸载所有资产
     */
    unloadAllAssets(): void;

    /**
     * Unload unused assets
     * 卸载未使用的资产
     */
    unloadUnusedAssets(): void;

    /**
     * Add reference to asset
     * 增加资产引用
     */
    addReference(guid: AssetGUID): void;

    /**
     * Remove reference from asset
     * 移除资产引用
     */
    removeReference(guid: AssetGUID): void;

    /**
     * Get reference info
     * 获取引用信息
     */
    getReferenceInfo(guid: AssetGUID): IAssetReferenceInfo | null;

    /**
     * Register custom loader
     * 注册自定义加载器
     */
    registerLoader(type: AssetType, loader: IAssetLoader): void;

    /**
     * Get asset statistics
     * 获取资产统计信息
     */
    getStatistics(): {
        loadedCount: number;
        loadQueue: number;
        failedCount: number;
    };

    /**
     * Clear cache
     * 清空缓存
     */
    clearCache(): void;

    /**
     * Dispose manager
     * 释放管理器
     */
    dispose(): void;

    /**
     * Set asset reader
     * 设置资产读取器
     */
    setReader(reader: IAssetReader): void;

    /**
     * Initialize from catalog
     * 从目录初始化
     *
     * Loads asset metadata from a catalog for runtime asset resolution.
     * 从目录加载资产元数据，用于运行时资产解析。
     */
    initializeFromCatalog(catalog: IAssetCatalog): void;

    /**
     * Get the asset database
     * 获取资产数据库
     */
    getDatabase(): AssetDatabase;

    /**
     * Get the loader factory
     * 获取加载器工厂
     */
    getLoaderFactory(): IAssetLoaderFactory;

    /**
     * Set project root path
     * 设置项目根路径
     */
    setProjectRoot(path: string): void;
}

/**
 * Asset cache interface
 * 资产缓存接口
 */
export interface IAssetCache {
    /**
     * Get cached asset
     * 获取缓存的资产
     */
    get<T = unknown>(guid: AssetGUID): T | null;

    /**
     * Set cached asset
     * 设置缓存的资产
     */
    set<T = unknown>(guid: AssetGUID, asset: T, size: number): void;

    /**
     * Check if asset is cached
     * 检查资产是否已缓存
     */
    has(guid: AssetGUID): boolean;

    /**
     * Remove from cache
     * 从缓存中移除
     */
    remove(guid: AssetGUID): void;

    /**
     * Clear all cache
     * 清空所有缓存
     */
    clear(): void;

    /**
     * Get cache size
     * 获取缓存大小
     */
    getSize(): number;

    /**
     * Get cached asset count
     * 获取缓存资产数量
     */
    getCount(): number;

    /**
     * Evict assets based on policy
     * 根据策略驱逐资产
     */
    evict(targetSize: number): void;
}

/**
 * Asset loading queue interface
 * 资产加载队列接口
 */
export interface IAssetLoadQueue {
    /**
     * Add to queue
     * 添加到队列
     */
    enqueue(
        guid: AssetGUID,
        priority: number,
        options?: IAssetLoadOptions
    ): void;

    /**
     * Remove from queue
     * 从队列移除
     */
    dequeue(): {
        guid: AssetGUID;
        options?: IAssetLoadOptions;
    } | null;

    /**
     * Check if queue is empty
     * 检查队列是否为空
     */
    isEmpty(): boolean;

    /**
     * Get queue size
     * 获取队列大小
     */
    getSize(): number;

    /**
     * Clear queue
     * 清空队列
     */
    clear(): void;

    /**
     * Reprioritize item
     * 重新设置优先级
     */
    reprioritize(guid: AssetGUID, newPriority: number): void;
}

/**
 * Asset dependency resolver interface
 * 资产依赖解析器接口
 */
export interface IAssetDependencyResolver {
    /**
     * Resolve dependencies for asset
     * 解析资产的依赖
     */
    resolveDependencies(guid: AssetGUID): Promise<AssetGUID[]>;

    /**
     * Get direct dependencies
     * 获取直接依赖
     */
    getDirectDependencies(guid: AssetGUID): AssetGUID[];

    /**
     * Get all dependencies recursively
     * 递归获取所有依赖
     */
    getAllDependencies(guid: AssetGUID): AssetGUID[];

    /**
     * Check for circular dependencies
     * 检查循环依赖
     */
    hasCircularDependency(guid: AssetGUID): boolean;

    /**
     * Build dependency graph
     * 构建依赖图
     */
    buildDependencyGraph(guids: AssetGUID[]): Map<AssetGUID, AssetGUID[]>;
}

/**
 * Asset streaming interface
 * 资产流式加载接口
 */
export interface IAssetStreaming {
    /**
     * Start streaming assets
     * 开始流式加载资产
     */
    startStreaming(guids: AssetGUID[]): void;

    /**
     * Stop streaming
     * 停止流式加载
     */
    stopStreaming(): void;

    /**
     * Pause streaming
     * 暂停流式加载
     */
    pauseStreaming(): void;

    /**
     * Resume streaming
     * 恢复流式加载
     */
    resumeStreaming(): void;

    /**
     * Set streaming budget per frame
     * 设置每帧流式加载预算
     */
    setFrameBudget(milliseconds: number): void;

    /**
     * Get streaming progress
     * 获取流式加载进度
     */
    getProgress(): IAssetLoadProgress;
}
