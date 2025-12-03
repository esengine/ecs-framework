/**
 * Runtime Catalog for Asset Resolution
 * 资产解析的运行时目录
 *
 * Provides GUID-based asset lookup at runtime.
 * 提供运行时基于 GUID 的资产查找。
 */

import { AssetGUID, AssetType } from '../types/AssetTypes';
import {
    IRuntimeCatalog,
    IRuntimeAssetLocation,
    IRuntimeBundleInfo
} from '../bundle/BundleFormat';

/**
 * Runtime Catalog Manager
 * 运行时目录管理器
 *
 * Loads and manages the asset catalog for runtime GUID resolution.
 */
export class RuntimeCatalog {
    private _catalog: IRuntimeCatalog | null = null;
    private _loadedBundles = new Map<string, ArrayBuffer>();
    private _loadingBundles = new Map<string, Promise<ArrayBuffer>>();
    private _baseUrl: string = './';

    /**
     * Set base URL for loading catalog and bundles
     * 设置加载目录和包的基础 URL
     */
    setBaseUrl(url: string): void {
        this._baseUrl = url.endsWith('/') ? url : `${url}/`;
    }

    /**
     * Load catalog from URL
     * 从 URL 加载目录
     */
    async loadCatalog(catalogUrl?: string): Promise<void> {
        const url = catalogUrl || `${this._baseUrl}asset-catalog.json`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load catalog: ${response.status}`);
            }

            const data = await response.json();
            this._catalog = this._parseCatalog(data);

            console.log(`[RuntimeCatalog] Loaded catalog with ${Object.keys(this._catalog.assets).length} assets`);
        } catch (error) {
            console.error('[RuntimeCatalog] Failed to load catalog:', error);
            throw error;
        }
    }

    /**
     * Initialize with pre-loaded catalog data
     * 使用预加载的目录数据初始化
     */
    initWithData(catalogData: IRuntimeCatalog): void {
        this._catalog = catalogData;
    }

    /**
     * Check if catalog is loaded
     * 检查目录是否已加载
     */
    isLoaded(): boolean {
        return this._catalog !== null;
    }

    /**
     * Get asset location by GUID
     * 根据 GUID 获取资产位置
     */
    getAssetLocation(guid: AssetGUID): IRuntimeAssetLocation | null {
        if (!this._catalog) {
            console.warn('[RuntimeCatalog] Catalog not loaded');
            return null;
        }

        return this._catalog.assets[guid] || null;
    }

    /**
     * Check if asset exists in catalog
     * 检查资产是否存在于目录中
     */
    hasAsset(guid: AssetGUID): boolean {
        return this._catalog?.assets[guid] !== undefined;
    }

    /**
     * Get all assets of a specific type
     * 获取特定类型的所有资产
     */
    getAssetsByType(type: AssetType): AssetGUID[] {
        if (!this._catalog) return [];

        return Object.entries(this._catalog.assets)
            .filter(([_, loc]) => loc.type === type)
            .map(([guid]) => guid);
    }

    /**
     * Get bundle info
     * 获取包信息
     */
    getBundleInfo(bundleName: string): IRuntimeBundleInfo | null {
        return this._catalog?.bundles[bundleName] || null;
    }

    /**
     * Load a bundle
     * 加载包
     */
    async loadBundle(bundleName: string): Promise<ArrayBuffer> {
        // Return cached bundle
        const cached = this._loadedBundles.get(bundleName);
        if (cached) {
            return cached;
        }

        // Return pending load
        const pending = this._loadingBundles.get(bundleName);
        if (pending) {
            return pending;
        }

        // Start new load
        const bundleInfo = this.getBundleInfo(bundleName);
        if (!bundleInfo) {
            throw new Error(`Bundle not found in catalog: ${bundleName}`);
        }

        const loadPromise = this._fetchBundle(bundleInfo);
        this._loadingBundles.set(bundleName, loadPromise);

        try {
            const data = await loadPromise;
            this._loadedBundles.set(bundleName, data);
            return data;
        } finally {
            this._loadingBundles.delete(bundleName);
        }
    }

    /**
     * Load asset data by GUID
     * 根据 GUID 加载资产数据
     */
    async loadAssetData(guid: AssetGUID): Promise<ArrayBuffer> {
        const location = this.getAssetLocation(guid);
        if (!location) {
            throw new Error(`Asset not found in catalog: ${guid}`);
        }

        // Load the bundle containing this asset
        const bundleData = await this.loadBundle(location.bundle);

        // Extract asset data from bundle
        return bundleData.slice(location.offset, location.offset + location.size);
    }

    /**
     * Preload bundles marked for preloading
     * 预加载标记为预加载的包
     */
    async preloadBundles(): Promise<void> {
        if (!this._catalog) return;

        const preloadPromises: Promise<void>[] = [];

        for (const [name, info] of Object.entries(this._catalog.bundles)) {
            if (info.preload) {
                preloadPromises.push(
                    this.loadBundle(name).then(() => {
                        console.log(`[RuntimeCatalog] Preloaded bundle: ${name}`);
                    })
                );
            }
        }

        await Promise.all(preloadPromises);
    }

    /**
     * Unload a bundle from memory
     * 从内存卸载包
     */
    unloadBundle(bundleName: string): void {
        this._loadedBundles.delete(bundleName);
    }

    /**
     * Clear all loaded bundles
     * 清除所有已加载的包
     */
    clearBundles(): void {
        this._loadedBundles.clear();
    }

    /**
     * Get catalog statistics
     * 获取目录统计信息
     */
    getStatistics(): {
        totalAssets: number;
        totalBundles: number;
        loadedBundles: number;
        assetsByType: Record<string, number>;
    } {
        if (!this._catalog) {
            return {
                totalAssets: 0,
                totalBundles: 0,
                loadedBundles: 0,
                assetsByType: {}
            };
        }

        const assetsByType: Record<string, number> = {};
        for (const loc of Object.values(this._catalog.assets)) {
            assetsByType[loc.type] = (assetsByType[loc.type] || 0) + 1;
        }

        return {
            totalAssets: Object.keys(this._catalog.assets).length,
            totalBundles: Object.keys(this._catalog.bundles).length,
            loadedBundles: this._loadedBundles.size,
            assetsByType
        };
    }

    /**
     * Parse catalog JSON to typed structure
     * 将目录 JSON 解析为类型化结构
     */
    private _parseCatalog(data: unknown): IRuntimeCatalog {
        const raw = data as Record<string, unknown>;

        return {
            version: (raw.version as string) || '1.0',
            createdAt: (raw.createdAt as number) || Date.now(),
            bundles: (raw.bundles as Record<string, IRuntimeBundleInfo>) || {},
            assets: (raw.assets as Record<AssetGUID, IRuntimeAssetLocation>) || {}
        };
    }

    /**
     * Fetch bundle data
     * 获取包数据
     */
    private async _fetchBundle(info: IRuntimeBundleInfo): Promise<ArrayBuffer> {
        const url = info.url.startsWith('http')
            ? info.url
            : `${this._baseUrl}${info.url}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load bundle: ${url} (${response.status})`);
        }

        return response.arrayBuffer();
    }
}

/**
 * Global runtime catalog instance
 * 全局运行时目录实例
 */
export const runtimeCatalog = new RuntimeCatalog();
