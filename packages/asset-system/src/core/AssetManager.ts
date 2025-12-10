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
import { IAssetLoader, IAssetLoaderFactory, IAssetParseContext } from '../interfaces/IAssetLoader';
import { IAssetReader, IAssetContent } from '../interfaces/IAssetReader';
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

    /** Asset reader for file operations. | 用于文件操作的资产读取器。 */
    private _reader: IAssetReader | null = null;

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

        if (catalog) {
            this.initializeFromCatalog(catalog);
        }
    }

    /**
     * Set asset reader.
     * 设置资产读取器。
     */
    setReader(reader: IAssetReader): void {
        this._reader = reader;
    }

    /**
     * Set project root path for resolving relative paths.
     * 设置项目根路径用于解析相对路径。
     */
    setProjectRoot(path: string): void {
        this._database.setProjectRoot(path);
    }

    /**
     * Get the asset database.
     * 获取资产数据库。
     */
    getDatabase(): AssetDatabase {
        return this._database;
    }

    /**
     * Get the loader factory.
     * 获取加载器工厂。
     */
    getLoaderFactory(): AssetLoaderFactory {
        return this._loaderFactory as AssetLoaderFactory;
    }

    /**
     * Initialize from catalog
     * 从目录初始化
     *
     * Can be called after construction to load catalog entries.
     * 可在构造后调用以加载目录条目。
     */
    initializeFromCatalog(catalog: IAssetCatalog): void {
        for (const [guid, entry] of Object.entries(catalog.entries)) {
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
        }
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
        let loader = this._loaderFactory.createLoader(metadata.type);

        // 如果没有找到 loader 且类型是 Custom，尝试重新解析类型
        // If no loader found and type is Custom, try to re-resolve the type
        if (!loader && metadata.type === AssetType.Custom) {
            const newType = this.resolveAssetType(metadata.path);
            if (newType !== AssetType.Custom) {
                // 更新 metadata 类型 / Update metadata type
                this._database.updateAsset(guid, { type: newType });
                loader = this._loaderFactory.createLoader(newType);
            }
        }

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
        if (!this._reader) {
            throw new Error('Asset reader not set. Call setReader() first.');
        }

        // Load dependencies first.
        // 先加载依赖。
        if (metadata.dependencies.length > 0) {
            await this.loadDependencies(metadata.dependencies, options);
        }

        // Resolve absolute path.
        // 解析绝对路径。
        const absolutePath = this._database.resolveAbsolutePath(metadata.path);

        // Read content based on loader's content type.
        // 根据加载器的内容类型读取内容。
        const content = await this.readContent(loader.contentType, absolutePath);

        // Create parse context.
        // 创建解析上下文。
        const context: IAssetParseContext = {
            metadata,
            options,
            loadDependency: async <D>(relativePath: string) => {
                const result = await this.loadAssetByPath<D>(relativePath, options);
                return result.asset;
            }
        };

        // Parse asset.
        // 解析资产。
        const asset = await loader.parse(content, context);

        // Update entry.
        // 更新条目。
        entry.asset = asset;
        entry.state = AssetState.Loaded;

        // Cache asset.
        // 缓存资产。
        this._cache.set(metadata.guid, asset);

        // Update statistics.
        // 更新统计。
        this._statistics.loadedCount++;

        return {
            asset: asset as T,
            handle: entry.handle,
            metadata,
            loadTime: performance.now() - startTime
        };
    }

    /**
     * Read content based on content type.
     * 根据内容类型读取内容。
     */
    private async readContent(contentType: string, absolutePath: string): Promise<IAssetContent> {
        if (!this._reader) {
            throw new Error('Asset reader not set');
        }

        switch (contentType) {
            case 'text': {
                const text = await this._reader.readText(absolutePath);
                return { type: 'text', text };
            }
            case 'binary': {
                const binary = await this._reader.readBinary(absolutePath);
                return { type: 'binary', binary };
            }
            case 'image': {
                const image = await this._reader.loadImage(absolutePath);
                return { type: 'image', image };
            }
            case 'audio': {
                const audioBuffer = await this._reader.loadAudio(absolutePath);
                return { type: 'audio', audioBuffer };
            }
            default:
                throw new Error(`Unknown content type: ${contentType}`);
        }
    }

    /**
     * Load dependencies
     * 加载依赖
     */
    private async loadDependencies(
        dependencies: AssetGUID[],
        options?: IAssetLoadOptions
    ): Promise<void> {
        const promises = dependencies.map((dep) => this.loadAsset(dep, options));
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
                const assetType = this.resolveAssetType(path);

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
                // 如果之前缓存的类型是 Custom，检查是否现在有注册的 loader 可以处理
                // If previously cached as Custom, check if a registered loader can now handle it
                if (metadata.type === AssetType.Custom) {
                    const newType = this.resolveAssetType(path);
                    if (newType !== AssetType.Custom) {
                        metadata.type = newType;
                    }
                }
                this._pathToGuid.set(path, metadata.guid);
            }

            return this.loadAsset<T>(metadata.guid, options);
        }

        // 同样检查已缓存的资产，如果类型是 Custom 但现在有 loader 可以处理
        // Also check cached assets, if type is Custom but now a loader can handle it
        const entry = this._assets.get(guid);
        if (entry && entry.metadata.type === AssetType.Custom) {
            const newType = this.resolveAssetType(path);
            if (newType !== AssetType.Custom) {
                entry.metadata.type = newType;
            }
        }

        return this.loadAsset<T>(guid, options);
    }

    /**
     * Resolve asset type from path
     * 从路径解析资产类型
     */
    private resolveAssetType(path: string): AssetType {
        // 首先尝试从已注册的加载器获取资产类型 / First try to get asset type from registered loaders
        const loaderType = (this._loaderFactory as AssetLoaderFactory).getAssetTypeByPath(path);
        if (loaderType !== null) {
            return loaderType;
        }

        // 如果没有找到匹配的加载器，使用默认的扩展名映射 / Fallback to default extension mapping
        const fileExt = path.substring(path.lastIndexOf('.')).toLowerCase();

        // 默认支持的基础类型 / Default supported basic types
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(fileExt)) {
            return AssetType.Texture;
        } else if (['.json'].includes(fileExt)) {
            return AssetType.Json;
        } else if (['.txt', '.md', '.xml', '.yaml'].includes(fileExt)) {
            return AssetType.Text;
        }

        return AssetType.Custom;
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
        const promises = guids.map(async (guid) => {
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
     * Get loaded asset by path (synchronous)
     * 通过路径获取已加载的资产（同步）
     *
     * Returns the asset if it's already loaded, null otherwise.
     * 如果资产已加载则返回资产，否则返回 null。
     */
    getAssetByPath<T = unknown>(path: string): T | null {
        const guid = this._pathToGuid.get(path);
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
        guids.forEach((guid) => this.unloadAsset(guid));
    }

    /**
     * Unload unused assets
     * 卸载未使用的资产
     */
    unloadUnusedAssets(): void {
        const guids = Array.from(this._assets.keys());
        guids.forEach((guid) => {
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
