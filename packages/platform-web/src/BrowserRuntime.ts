/**
 * Browser Runtime
 * 浏览器运行时
 *
 * Lightweight runtime for web game builds.
 * Uses dynamic plugin loading via import maps.
 *
 * 轻量级 Web 游戏运行时。
 * 通过 import maps 动态加载插件。
 */

import { Core } from '@esengine/esengine';
import {
    GameRuntime,
    createGameRuntime,
    BrowserPlatformAdapter,
    runtimePluginManager,
    BrowserFileSystemService,
    type IPlugin
} from '@esengine/runtime-core';
import { assetManager as globalAssetManager, type IAssetManager, type IAssetCatalog, type IAssetCatalogEntry } from '@esengine/asset-system';
import { BrowserAssetReader } from './BrowserAssetReader';

/**
 * Runtime configuration
 * 运行时配置
 */
export interface RuntimeConfig {
    /** Canvas element ID */
    canvasId: string;
    /** Canvas width (defaults to window.innerWidth) */
    width?: number;
    /** Canvas height (defaults to window.innerHeight) */
    height?: number;
    /** Asset catalog file URL (defaults to '/asset-catalog.json') */
    assetCatalogUrl?: string;
    /** Asset base URL (defaults to '/assets') */
    assetBaseUrl?: string;
}

/**
 * Browser Runtime
 * 浏览器运行时
 *
 * Main entry point for running games in browser.
 * Supports dynamic plugin registration.
 */
export class BrowserRuntime {
    private _runtime: GameRuntime | null = null;
    private _canvasId: string;
    private _width: number;
    private _height: number;
    private _assetCatalogUrl: string;
    private _assetBaseUrl: string;
    private _fileSystem: BrowserFileSystemService | null = null;
    private _assetReader: BrowserAssetReader | null = null;
    private _initialized = false;

    constructor(config: RuntimeConfig) {
        this._canvasId = config.canvasId;
        this._width = config.width ?? window.innerWidth;
        this._height = config.height ?? window.innerHeight;
        this._assetCatalogUrl = config.assetCatalogUrl ?? '/asset-catalog.json';
        this._assetBaseUrl = config.assetBaseUrl ?? '/assets';
    }

    /**
     * Register a plugin dynamically
     * 动态注册插件
     *
     * Call this before initialize() to register plugins.
     */
    registerPlugin(plugin: IPlugin): void {
        if (plugin) {
            runtimePluginManager.register(plugin);
            runtimePluginManager.enable(plugin.manifest.id);
            console.log(`[Runtime] Registered plugin: ${plugin.manifest.id}`);
        }
    }

    /**
     * Register multiple plugins
     * 注册多个插件
     */
    registerPlugins(plugins: IPlugin[]): void {
        for (const plugin of plugins) {
            this.registerPlugin(plugin);
        }
    }

    /**
     * Initialize the runtime
     * 初始化运行时
     *
     * @param wasmModule - Optional WASM module (from es_engine.js)
     */
    async initialize(wasmModule?: unknown): Promise<void> {
        if (this._initialized) {
            console.warn('[Runtime] Already initialized');
            return;
        }

        // Initialize browser file system service
        this._fileSystem = new BrowserFileSystemService({
            baseUrl: this._assetBaseUrl,
            catalogUrl: this._assetCatalogUrl,
            enableCache: true
        });
        await this._fileSystem.initialize();

        // Initialize asset reader
        this._assetReader = new BrowserAssetReader(this._assetBaseUrl);

        // Create browser platform adapter
        const platform = new BrowserPlatformAdapter({
            wasmModule: wasmModule ?? undefined
        });

        // Create game runtime
        this._runtime = createGameRuntime({
            platform,
            canvasId: this._canvasId,
            width: this._width,
            height: this._height,
            autoStartRenderLoop: false
        });

        await this._runtime.initialize();

        // Register file system service
        const IFileSystemServiceKey = Symbol.for('IFileSystemService');
        if (!Core.services.isRegistered(IFileSystemServiceKey)) {
            Core.services.registerInstance(IFileSystemServiceKey, this._fileSystem);
        }

        // Set asset reader for AssetManager (both runtime instance and global singleton)
        // 设置资产读取器（运行时实例和全局单例）
        if (this._assetReader) {
            // Initialize the GLOBAL assetManager singleton (used by particle and other modules)
            // 初始化全局 assetManager 单例（被 particle 等模块使用）
            globalAssetManager.setReader(this._assetReader);

            // Also set for runtime's assetManager if available
            if (this._runtime.assetManager) {
                this._runtime.assetManager.setReader(this._assetReader);
            }

            // Initialize AssetManager with catalog data from BrowserFileSystemService
            // 使用 BrowserFileSystemService 的 catalog 数据初始化 AssetManager
            if (this._fileSystem?.catalog) {
                const browserCatalog = this._fileSystem.catalog;
                const assetCatalog: IAssetCatalog = {
                    version: browserCatalog.version,
                    createdAt: browserCatalog.createdAt,
                    entries: new Map<string, IAssetCatalogEntry>(),
                    bundles: new Map()
                };

                // Convert browser catalog entries to IAssetCatalog format
                // 将浏览器 catalog 条目转换为 IAssetCatalog 格式
                for (const [guid, entry] of Object.entries(browserCatalog.entries)) {
                    assetCatalog.entries.set(guid, {
                        guid: entry.guid,
                        path: entry.path,
                        type: entry.type,
                        size: entry.size,
                        hash: entry.hash
                    });
                }

                // Initialize GLOBAL assetManager singleton (this is what particle module uses)
                // 初始化全局 assetManager 单例（particle 模块使用的就是这个）
                globalAssetManager.initializeFromCatalog(assetCatalog);

                // Also initialize runtime's assetManager if available
                if (this._runtime.assetManager) {
                    this._runtime.assetManager.initializeFromCatalog(assetCatalog);
                }
            }
        }

        // Disable editor mode (hides grid, gizmos, axis indicator)
        // 禁用编辑器模式（隐藏网格、gizmos、坐标轴指示器）
        this._runtime.setEditorMode(false);

        this._initialized = true;
        console.log('[Runtime] Initialized');
    }

    /**
     * Load a scene from URL
     * 从 URL 加载场景
     */
    async loadScene(sceneUrl: string): Promise<void> {
        if (!this._runtime) {
            throw new Error('Runtime not initialized. Call initialize() first.');
        }
        await this._runtime.loadSceneFromUrl(sceneUrl);
    }

    /**
     * Start the game loop
     * 启动游戏循环
     */
    start(): void {
        this._runtime?.start();
    }

    /**
     * Stop the game loop
     * 停止游戏循环
     */
    stop(): void {
        this._runtime?.stop();
    }

    /**
     * Handle window resize
     * 处理窗口大小变化
     */
    handleResize(width: number, height: number): void {
        this._runtime?.resize(width, height);
    }

    /**
     * Get the underlying GameRuntime
     * 获取底层 GameRuntime
     */
    get gameRuntime(): GameRuntime | null {
        return this._runtime;
    }

    /**
     * Get the asset manager
     * 获取资产管理器
     *
     * @returns The asset manager instance, or null if not initialized
     */
    get assetManager(): IAssetManager | null {
        return this._runtime?.assetManager ?? null;
    }

    /**
     * Check if runtime is initialized
     * 检查运行时是否已初始化
     */
    get isInitialized(): boolean {
        return this._initialized;
    }
}

/**
 * Create a browser runtime instance
 * 创建浏览器运行时实例
 */
export function create(config: RuntimeConfig): BrowserRuntime {
    return new BrowserRuntime(config);
}

/**
 * Default export for convenient usage
 * 默认导出，便于使用
 *
 * Usage in game HTML:
 * ```js
 * const ECSRuntime = (await import('@esengine/platform-web')).default;
 * const runtime = ECSRuntime.create({ canvasId: 'game-canvas' });
 * ```
 */
export default {
    create,
    BrowserRuntime,
    BrowserAssetReader,
    // Re-export useful types from dependencies
    Core,
    GameRuntime,
    createGameRuntime,
    BrowserPlatformAdapter,
    runtimePluginManager
};
