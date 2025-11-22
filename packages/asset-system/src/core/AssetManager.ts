/**
 * Asset manager implementation
 * 资产管理器实现
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
    IAssetMetadata,
    AssetLoadError,
    IAssetCatalog
} from '../types/AssetTypes';
import {
    IAssetManager,
    IAssetLoadQueue
} from '../interfaces/IAssetManager';
import { IAssetLoader, IAssetLoaderFactory } from '../interfaces/IAssetLoader';
import { AssetCache } from './AssetCache';
import { AssetLoadQueue } from './AssetLoadQueue';
import { AssetLoaderFactory } from '../loaders/AssetLoaderFactory';
import { AssetDatabase } from './AssetDatabase';

/**
 * Asset entry in the manager
 * 管理器中的资产条目
 */
interface AssetEntry {
    guid: AssetGUID;
    handle: AssetHandle;
    asset: unknown;
    metadata: IAssetMetadata;
    state: AssetState;
    referenceCount: number;
    lastAccessTime: number;
    loadPromise?: Promise<IAssetLoadResult>;
}

/**
 * Asset manager implementation
 * 资产管理器实现
 */
export class AssetManager implements IAssetManager {
    private readonly _assets = new Map<AssetGUID, AssetEntry>();
    private readonly _handleToGuid = new Map<AssetHandle, AssetGUID>();
    private readonly _pathToGuid = new Map<string, AssetGUID>();
    private readonly _cache: AssetCache;
    private readonly _loadQueue: IAssetLoadQueue;
    private readonly _loaderFactory: IAssetLoaderFactory;
    private readonly _database: AssetDatabase;

    private _nextHandle: AssetHandle = 1;

    private _statistics = {
        loadedCount: 0,
        failedCount: 0
    };

    private _isDisposed = false;
    private _loadingCount = 0;

    constructor(catalog?: IAssetCatalog) {
        this._cache = new AssetCache();
        this._loadQueue = new AssetLoadQueue();
        this._loaderFactory = new AssetLoaderFactory();
        this._database = new AssetDatabase();

        // 如果提供了目录，初始化数据库 / Initialize database if catalog provided
        if (catalog) {
            this.initializeFromCatalog(catalog);
        }
    }

    /**
     * Initialize from catalog
     * 从目录初始化
     */
    private initializeFromCatalog(catalog: IAssetCatalog): void {
        catalog.entries.forEach((entry, guid) => {
            const metadata: IAssetMetadata = {
                guid,
                path: entry.path,
                type: entry.type,
                name: entry.path.split('/').pop() || '',
                size: entry.size,
                hash: entry.hash,
                dependencies: [],
                labels: [],
                tags: new Map(),
                lastModified: Date.now(),
                version: 1
            };

            this._database.addAsset(metadata);
            this._pathToGuid.set(entry.path, guid);
        });
    }

    /**
     * Load asset by GUID
     * 通过GUID加载资产
     */
    async loadAsset<T = unknown>(
        guid: AssetGUID,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<T>> {
        // 检查是否已加载 / Check if already loaded
        const entry = this._assets.get(guid);
        if (entry) {
            if (entry.state === AssetState.Loaded && !options?.forceReload) {
                entry.lastAccessTime = Date.now();
                return {
                    asset: entry.asset as T,
                    handle: entry.handle,
                    metadata: entry.metadata,
                    loadTime: 0
                };
            }

            if (entry.state === AssetState.Loading && entry.loadPromise) {
                return entry.loadPromise as Promise<IAssetLoadResult<T>>;
            }
        }

        // 获取元数据 / Get metadata
        const metadata = this._database.getMetadata(guid);
        if (!metadata) {
            throw AssetLoadError.fileNotFound(guid, 'Unknown');
        }

        // 创建加载器 / Create loader
        const loader = this._loaderFactory.createLoader(metadata.type);
        if (!loader) {
            throw AssetLoadError.unsupportedType(guid, metadata.type);
        }

        // 开始加载 / Start loading
        const loadStartTime = performance.now();
        const newEntry: AssetEntry = {
            guid,
            handle: this._nextHandle++,
            asset: null,
            metadata,
            state: AssetState.Loading,
            referenceCount: 0,
            lastAccessTime: Date.now()
        };

        this._assets.set(guid, newEntry);
        this._handleToGuid.set(newEntry.handle, guid);
        this._loadingCount++;

        // 创建加载Promise / Create loading promise
        const loadPromise = this.performLoad<T>(loader, metadata, options, loadStartTime, newEntry);
        newEntry.loadPromise = loadPromise;

        try {
            const result = await loadPromise;
            return result;
        } catch (error) {
            this._statistics.failedCount++;
            newEntry.state = AssetState.Failed;
            throw error;
        } finally {
            this._loadingCount--;
            delete newEntry.loadPromise;
        }
    }

    /**
     * Perform asset loading
     * 执行资产加载
     */
    private async performLoad<T>(
        loader: IAssetLoader,
        metadata: IAssetMetadata,
        options: IAssetLoadOptions | undefined,
        startTime: number,
        entry: AssetEntry
    ): Promise<IAssetLoadResult<T>> {
        // 加载依赖 / Load dependencies
        if (metadata.dependencies.length > 0) {
            await this.loadDependencies(metadata.dependencies, options);
        }

        // 执行加载 / Execute loading
        const result = await loader.load(metadata.path, metadata, options);

        // 更新条目 / Update entry
        entry.asset = result.asset;
        entry.state = AssetState.Loaded;

        // 缓存资产 / Cache asset
        this._cache.set(metadata.guid, result.asset);

        // 更新统计 / Update statistics
        this._statistics.loadedCount++;

        const loadResult: IAssetLoadResult<T> = {
            asset: result.asset as T,
            handle: entry.handle,
            metadata,
            loadTime: performance.now() - startTime
        };

        return loadResult;
    }

    /**
     * Load dependencies
     * 加载依赖
     */
    private async loadDependencies(
        dependencies: AssetGUID[],
        options?: IAssetLoadOptions
    ): Promise<void> {
        const promises = dependencies.map(dep => this.loadAsset(dep, options));
        await Promise.all(promises);
    }

    /**
     * Load asset by path
     * 通过路径加载资产
     */
    async loadAssetByPath<T = unknown>(
        path: string,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<T>> {
        const guid = this._pathToGuid.get(path);
        if (!guid) {
            // 尝试从数据库查找 / Try to find from database
            let metadata = this._database.getMetadataByPath(path);
            if (!metadata) {
                // 动态创建元数据 / Create metadata dynamically
                const fileExt = path.substring(path.lastIndexOf('.')).toLowerCase();
                let assetType = AssetType.Custom;

                // 根据文件扩展名确定资产类型 / Determine asset type by file extension
                if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(fileExt)) {
                    assetType = AssetType.Texture;
                } else if (['.json'].includes(fileExt)) {
                    assetType = AssetType.Json;
                } else if (['.txt', '.md', '.xml', '.yaml'].includes(fileExt)) {
                    assetType = AssetType.Text;
                }

                // 生成唯一GUID / Generate unique GUID
                const dynamicGuid = `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                metadata = {
                    guid: dynamicGuid,
                    path: path,
                    type: assetType,
                    name: path.split('/').pop() || path.split('\\').pop() || 'unnamed',
                    size: 0, // 动态加载时未知大小 / Unknown size for dynamic loading
                    hash: '',
                    dependencies: [],
                    labels: [],
                    tags: new Map(),
                    lastModified: Date.now(),
                    version: 1
                };

                // 注册到数据库 / Register to database
                this._database.addAsset(metadata);
                this._pathToGuid.set(path, metadata.guid);
            } else {
                this._pathToGuid.set(path, metadata.guid);
            }

            return this.loadAsset<T>(metadata.guid, options);
        }

        return this.loadAsset<T>(guid, options);
    }

    /**
     * Load multiple assets
     * 批量加载资产
     */
    async loadAssets(
        guids: AssetGUID[],
        options?: IAssetLoadOptions
    ): Promise<Map<AssetGUID, IAssetLoadResult>> {
        const results = new Map<AssetGUID, IAssetLoadResult>();

        // 并行加载所有资产 / Load all assets in parallel
        const promises = guids.map(async guid => {
            try {
                const result = await this.loadAsset(guid, options);
                results.set(guid, result);
            } catch (error) {
                console.error(`Failed to load asset ${guid}:`, error);
            }
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * Preload asset group
     * 预加载资产组
     */
    async preloadGroup(
        group: IAssetPreloadGroup,
        onProgress?: (progress: IAssetLoadProgress) => void
    ): Promise<void> {
        const totalCount = group.assets.length;
        let loadedCount = 0;
        let loadedBytes = 0;
        let totalBytes = 0;

        // 计算总大小 / Calculate total size
        for (const guid of group.assets) {
            const metadata = this._database.getMetadata(guid);
            if (metadata) {
                totalBytes += metadata.size;
            }
        }

        // 加载每个资产 / Load each asset
        for (const guid of group.assets) {
            const metadata = this._database.getMetadata(guid);
            if (!metadata) continue;

            if (onProgress) {
                onProgress({
                    currentAsset: metadata.name,
                    loadedCount,
                    totalCount,
                    loadedBytes,
                    totalBytes,
                    progress: loadedCount / totalCount
                });
            }

            await this.loadAsset(guid, { priority: group.priority });

            loadedCount++;
            loadedBytes += metadata.size;
        }

        // 最终进度 / Final progress
        if (onProgress) {
            onProgress({
                currentAsset: '',
                loadedCount: totalCount,
                totalCount,
                loadedBytes: totalBytes,
                totalBytes,
                progress: 1
            });
        }
    }

    /**
     * Get loaded asset
     * 获取已加载的资产
     */
    getAsset<T = unknown>(guid: AssetGUID): T | null {
        const entry = this._assets.get(guid);
        if (entry && entry.state === AssetState.Loaded) {
            entry.lastAccessTime = Date.now();
            return entry.asset as T;
        }
        return null;
    }

    /**
     * Get asset by handle
     * 通过句柄获取资产
     */
    getAssetByHandle<T = unknown>(handle: AssetHandle): T | null {
        const guid = this._handleToGuid.get(handle);
        if (!guid) return null;
        return this.getAsset<T>(guid);
    }

    /**
     * Check if asset is loaded
     * 检查资产是否已加载
     */
    isLoaded(guid: AssetGUID): boolean {
        const entry = this._assets.get(guid);
        return entry?.state === AssetState.Loaded;
    }

    /**
     * Get asset state
     * 获取资产状态
     */
    getAssetState(guid: AssetGUID): AssetState {
        const entry = this._assets.get(guid);
        return entry?.state || AssetState.Unloaded;
    }

    /**
     * Unload asset
     * 卸载资产
     */
    unloadAsset(guid: AssetGUID): void {
        const entry = this._assets.get(guid);
        if (!entry) return;

        // 检查引用计数 / Check reference count
        if (entry.referenceCount > 0) {
            return;
        }

        // 获取加载器以释放资源 / Get loader to dispose resources
        const loader = this._loaderFactory.createLoader(entry.metadata.type);
        if (loader) {
            loader.dispose(entry.asset);
        }

        // 清理条目 / Clean up entry
        this._handleToGuid.delete(entry.handle);
        this._assets.delete(guid);
        this._cache.remove(guid);

        // 更新统计 / Update statistics
        this._statistics.loadedCount--;

        entry.state = AssetState.Unloaded;
    }

    /**
     * Unload all assets
     * 卸载所有资产
     */
    unloadAllAssets(): void {
        const guids = Array.from(this._assets.keys());
        guids.forEach(guid => this.unloadAsset(guid));
    }

    /**
     * Unload unused assets
     * 卸载未使用的资产
     */
    unloadUnusedAssets(): void {
        const guids = Array.from(this._assets.keys());
        guids.forEach(guid => {
            const entry = this._assets.get(guid);
            if (entry && entry.referenceCount === 0) {
                this.unloadAsset(guid);
            }
        });
    }

    /**
     * Add reference to asset
     * 增加资产引用
     */
    addReference(guid: AssetGUID): void {
        const entry = this._assets.get(guid);
        if (entry) {
            entry.referenceCount++;
        }
    }

    /**
     * Remove reference from asset
     * 移除资产引用
     */
    removeReference(guid: AssetGUID): void {
        const entry = this._assets.get(guid);
        if (entry && entry.referenceCount > 0) {
            entry.referenceCount--;
        }
    }

    /**
     * Get reference info
     * 获取引用信息
     */
    getReferenceInfo(guid: AssetGUID): IAssetReferenceInfo | null {
        const entry = this._assets.get(guid);
        if (!entry) return null;

        return {
            guid,
            handle: entry.handle,
            referenceCount: entry.referenceCount,
            lastAccessTime: entry.lastAccessTime,
            state: entry.state
        };
    }


    /**
     * Register custom loader
     * 注册自定义加载器
     */
    registerLoader(type: AssetType, loader: IAssetLoader): void {
        this._loaderFactory.registerLoader(type, loader);
    }

    /**
     * Get asset statistics
     * 获取资产统计信息
     */
    getStatistics(): { loadedCount: number; loadQueue: number; failedCount: number } {
        return {
            loadedCount: this._statistics.loadedCount,
            loadQueue: this._loadQueue.getSize(),
            failedCount: this._statistics.failedCount
        };
    }

    /**
     * Clear cache
     * 清空缓存
     */
    clearCache(): void {
        this._cache.clear();
    }

    /**
     * Dispose manager
     * 释放管理器
     */
    dispose(): void {
        if (this._isDisposed) return;

        this.unloadAllAssets();
        this._cache.clear();
        this._loadQueue.clear();
        this._assets.clear();
        this._handleToGuid.clear();
        this._pathToGuid.clear();

        this._isDisposed = true;
    }
}