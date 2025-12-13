/**
 * Browser File System Service
 * 浏览器文件系统服务
 *
 * 在浏览器运行时环境中，通过 HTTP fetch 加载资产文件。
 * 使用资产目录(asset-catalog.json)来解析 GUID 到实际 URL。
 *
 * In browser runtime environment, loads asset files via HTTP fetch.
 * Uses asset catalog to resolve GUIDs to actual URLs.
 */

import type {
    IAssetCatalog,
    IAssetCatalogEntry,
    IAssetBundleInfo,
    AssetLoadStrategy
} from '@esengine/asset-system';

/**
 * Browser file system service options
 * 浏览器文件系统服务配置
 */
export interface BrowserFileSystemOptions {
    /** Base URL for assets (e.g., '/assets' or 'https://cdn.example.com/assets') */
    baseUrl?: string;
    /** Asset catalog URL */
    catalogUrl?: string;
    /** Enable caching */
    enableCache?: boolean;
}

/**
 * Browser File System Service
 * 浏览器文件系统服务
 *
 * Provides file system-like API for browser environments
 * by fetching files over HTTP. Supports both file-based and bundle-based loading.
 * 为浏览器环境提供类文件系统 API，通过 HTTP fetch 加载文件。
 * 支持基于文件和基于包的两种加载模式。
 */
export class BrowserFileSystemService {
    private _baseUrl: string;
    private _catalogUrl: string;
    private _catalog: IAssetCatalog | null = null;
    private _cache = new Map<string, string>();
    private _bundleCache = new Map<string, ArrayBuffer>();
    private _enableCache: boolean;
    private _initialized = false;

    constructor(options: BrowserFileSystemOptions = {}) {
        this._baseUrl = options.baseUrl ?? '/assets';
        this._catalogUrl = options.catalogUrl ?? '/asset-catalog.json';
        this._enableCache = options.enableCache ?? true;
    }

    /**
     * Initialize service and load catalog
     * 初始化服务并加载目录
     */
    async initialize(): Promise<void> {
        if (this._initialized) return;

        try {
            await this._loadCatalog();
            this._initialized = true;

            const strategy = this._catalog?.loadStrategy ?? 'file';
            const assetCount = Object.keys(this._catalog?.entries ?? {}).length;
            console.log(`[BrowserFileSystem] Initialized: ${assetCount} assets, strategy=${strategy}`);
        } catch (error) {
            console.warn('[BrowserFileSystem] Failed to load catalog:', error);
            // Continue without catalog - will use path-based loading
            // 无目录时继续，使用基于路径的加载
            this._initialized = true;
        }
    }

    /**
     * Load asset catalog
     * 加载资产目录
     */
    private async _loadCatalog(): Promise<void> {
        const response = await fetch(this._catalogUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch catalog: ${response.status}`);
        }

        const rawCatalog = await response.json();

        // Normalize catalog format (handle legacy format without loadStrategy)
        // 规范化目录格式（处理没有 loadStrategy 的旧格式）
        this._catalog = this._normalizeCatalog(rawCatalog);
    }

    /**
     * Normalize catalog to ensure it has all required fields
     * 规范化目录，确保包含所有必需字段
     *
     * Supports both 'entries' (IAssetCatalog) and 'assets' (IRuntimeCatalog) field names.
     * 同时支持 'entries' (IAssetCatalog) 和 'assets' (IRuntimeCatalog) 字段名。
     */
    private _normalizeCatalog(raw: Record<string, unknown>): IAssetCatalog {
        // Determine load strategy
        // 确定加载策略
        let loadStrategy: AssetLoadStrategy = 'file';
        // Only use bundle strategy if explicitly set or bundles is non-empty
        // 仅当明确设置或 bundles 非空时才使用 bundle 策略
        const hasBundles = raw.bundles && typeof raw.bundles === 'object' && Object.keys(raw.bundles as object).length > 0;
        if (raw.loadStrategy === 'bundle' || hasBundles) {
            loadStrategy = 'bundle';
        }

        // Support both 'entries' and 'assets' field names for compatibility
        // 同时支持 'entries' 和 'assets' 字段名以保持兼容性
        const entries = (raw.entries ?? raw.assets) as Record<string, IAssetCatalogEntry> ?? {};

        return {
            version: (raw.version as string) ?? '1.0.0',
            createdAt: (raw.createdAt as number) ?? Date.now(),
            loadStrategy,
            entries,
            bundles: (raw.bundles as Record<string, IAssetBundleInfo>) ?? undefined
        };
    }

    /**
     * Get current load strategy
     * 获取当前加载策略
     */
    get loadStrategy(): AssetLoadStrategy {
        return this._catalog?.loadStrategy ?? 'file';
    }

    /**
     * Read file content as string
     * @param path - Can be GUID, relative path, or absolute path
     */
    async readFile(path: string): Promise<string> {
        const url = this._resolveUrl(path);

        // Check cache
        if (this._enableCache && this._cache.has(url)) {
            return this._cache.get(url)!;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${url} (${response.status})`);
        }

        const content = await response.text();

        // Cache result
        if (this._enableCache) {
            this._cache.set(url, content);
        }

        return content;
    }

    /**
     * Read file as binary (ArrayBuffer)
     */
    async readBinary(path: string): Promise<ArrayBuffer> {
        const url = this._resolveUrl(path);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch binary: ${url} (${response.status})`);
        }

        return response.arrayBuffer();
    }

    /**
     * Read file as Blob
     */
    async readBlob(path: string): Promise<Blob> {
        const url = this._resolveUrl(path);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${url} (${response.status})`);
        }

        return response.blob();
    }

    /**
     * Check if file exists (via HEAD request)
     */
    async exists(path: string): Promise<boolean> {
        const url = this._resolveUrl(path);

        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Resolve path to URL
     * Handles GUID, relative path, and absolute path
     */
    private _resolveUrl(path: string): string {
        // Check if it's a GUID and we have a catalog
        if (this._catalog && this._isGuid(path)) {
            const entry = this._catalog.entries[path];
            if (entry) {
                return this._pathToUrl(entry.path);
            }
        }

        // Check if it's an absolute Windows path (e.g., F:\...)
        if (/^[A-Za-z]:[\\/]/.test(path)) {
            // Try to extract relative path from absolute path
            const relativePath = this._extractRelativePath(path);
            if (relativePath) {
                return this._pathToUrl(relativePath);
            }
            // Fallback: use just the filename
            const filename = path.split(/[\\/]/).pop();
            return `${this._baseUrl}/${filename}`;
        }

        // Check if it's already a URL
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
            return path;
        }

        // Treat as relative path
        return this._pathToUrl(path);
    }

    /**
     * Convert relative path to URL
     */
    private _pathToUrl(relativePath: string): string {
        // Normalize path separators
        const normalized = relativePath.replace(/\\/g, '/');

        // Remove leading 'assets/' if baseUrl already includes it
        let cleanPath = normalized;
        if (cleanPath.startsWith('assets/') && this._baseUrl.endsWith('/assets')) {
            cleanPath = cleanPath.substring(7);
        }

        // Ensure no double slashes
        const base = this._baseUrl.endsWith('/') ? this._baseUrl.slice(0, -1) : this._baseUrl;
        const path = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;

        return `${base}/${path}`;
    }

    /**
     * Extract relative path from absolute path
     */
    private _extractRelativePath(absolutePath: string): string | null {
        const normalized = absolutePath.replace(/\\/g, '/');

        // Look for 'assets/' in the path
        const assetsIndex = normalized.toLowerCase().indexOf('/assets/');
        if (assetsIndex >= 0) {
            return normalized.substring(assetsIndex + 1); // Include 'assets/'
        }

        return null;
    }

    /**
     * Check if string looks like a GUID
     */
    private _isGuid(str: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    }

    /**
     * Get asset metadata from catalog
     * 从目录获取资产元数据
     */
    getAssetMetadata(guidOrPath: string): IAssetCatalogEntry | null {
        if (!this._catalog) return null;

        // Try as GUID
        if (this._catalog.entries[guidOrPath]) {
            return this._catalog.entries[guidOrPath];
        }

        // Try as path
        for (const entry of Object.values(this._catalog.entries)) {
            if (entry.path === guidOrPath) {
                return entry;
            }
        }

        return null;
    }

    /**
     * Get all assets of a specific type
     * 获取指定类型的所有资产
     */
    getAssetsByType(type: string): IAssetCatalogEntry[] {
        if (!this._catalog) return [];

        return Object.values(this._catalog.entries)
            .filter(entry => entry.type === type);
    }

    /**
     * Clear cache
     * 清除缓存
     */
    clearCache(): void {
        this._cache.clear();
    }

    /**
     * Get catalog
     * 获取目录
     */
    get catalog(): IAssetCatalog | null {
        return this._catalog;
    }

    /**
     * Check if initialized
     */
    get isInitialized(): boolean {
        return this._initialized;
    }

    /**
     * Dispose service and clear resources
     * Required by IService interface
     */
    dispose(): void {
        this._cache.clear();
        this._catalog = null;
        this._initialized = false;
    }
}

/**
 * Create and register browser file system service
 */
export function createBrowserFileSystem(options?: BrowserFileSystemOptions): BrowserFileSystemService {
    return new BrowserFileSystemService(options);
}
