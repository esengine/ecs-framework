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

import { Core } from '@esengine/ecs-framework';
import {
    GameRuntime,
    createGameRuntime,
    BrowserPlatformAdapter,
    runtimePluginManager,
    BrowserFileSystemService,
    type IPlugin
} from '@esengine/runtime-core';
import type { IAssetManager } from '@esengine/asset-system';
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

        // Set asset reader for AssetManager
        if (this._runtime.assetManager && this._assetReader) {
            this._runtime.assetManager.setReader(this._assetReader);
        }

        // Browser-specific settings (no editor UI)
        this._runtime.setShowGrid(false);
        this._runtime.setShowGizmos(false);

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
