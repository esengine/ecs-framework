/**
 * Browser Runtime Entry Point
 * 浏览器运行时入口
 *
 * 使用统一的 GameRuntime 架构，静态导入所有插件
 * Uses the unified GameRuntime architecture with static plugin imports
 */

import { Core } from '@esengine/ecs-framework';
import {
    GameRuntime,
    createGameRuntime,
    BrowserPlatformAdapter,
    runtimePluginManager,
    BrowserFileSystemService
} from '@esengine/runtime-core';

// 静态导入所有运行时插件（与编辑器保持一致）
// Static import all runtime plugins (consistent with editor)
import { EnginePlugin } from '@esengine/engine-core';
import { CameraPlugin } from '@esengine/camera';
import { SpritePlugin } from '@esengine/sprite';
import { AudioPlugin } from '@esengine/audio';
import { UIPlugin } from '@esengine/ui';
import { TilemapPlugin } from '@esengine/tilemap';
import { BehaviorTreePlugin } from '@esengine/behavior-tree';
// 使用 runtime 子路径导入，包含 WASM 依赖
import { PhysicsPlugin } from '@esengine/physics-rapier2d/runtime';

// 预注册所有插件（在 GameRuntime 初始化前）
// Pre-register all plugins (before GameRuntime initialization)
const ALL_PLUGINS = [
    EnginePlugin,
    CameraPlugin,
    SpritePlugin,
    AudioPlugin,
    UIPlugin,
    TilemapPlugin,
    BehaviorTreePlugin,
    PhysicsPlugin,
];

// 注册并启用所有插件（浏览器运行时默认启用所有功能）
for (const plugin of ALL_PLUGINS) {
    if (plugin) {
        runtimePluginManager.register(plugin);
        // 确保所有插件都启用（覆盖 enabledByDefault: false）
        runtimePluginManager.enable(plugin.descriptor.id);
    }
}

export interface RuntimeConfig {
    canvasId: string;
    width?: number;
    height?: number;
    /** 项目配置文件 URL / Project config file URL */
    projectConfigUrl?: string;
    /** 资产目录文件 URL / Asset catalog file URL */
    assetCatalogUrl?: string;
    /** 资产基础 URL / Asset base URL */
    assetBaseUrl?: string;
}

/**
 * 编辑器项目配置文件格式
 * Editor project config file format (ecs-editor.config.json)
 */
interface EditorProjectConfig {
    projectType?: string;
    plugins?: {
        enabledPlugins: string[];
    };
    [key: string]: any;
}

/**
 * Browser Runtime Wrapper
 * 浏览器运行时包装器
 */
class BrowserRuntime {
    private _runtime: GameRuntime | null = null;
    private _canvasId: string;
    private _configUrl?: string;
    private _assetCatalogUrl?: string;
    private _assetBaseUrl?: string;
    private _fileSystem: BrowserFileSystemService | null = null;

    constructor(config: RuntimeConfig) {
        this._canvasId = config.canvasId;
        this._configUrl = config.projectConfigUrl;
        this._assetCatalogUrl = config.assetCatalogUrl ?? '/asset-catalog.json';
        this._assetBaseUrl = config.assetBaseUrl ?? '/assets';
    }

    /**
     * 从配置文件 URL 加载插件配置
     */
    private async _loadConfigFromUrl(): Promise<void> {
        if (!this._configUrl) return;

        try {
            const response = await fetch(this._configUrl);
            if (!response.ok) {
                console.warn(`[BrowserRuntime] Failed to load config from ${this._configUrl}: ${response.status}`);
                return;
            }

            const editorConfig: EditorProjectConfig = await response.json();

            // 如果有插件配置，应用到 runtimePluginManager
            if (editorConfig.plugins?.enabledPlugins) {
                runtimePluginManager.loadConfig({ enabledPlugins: editorConfig.plugins.enabledPlugins });
                console.log('[BrowserRuntime] Loaded plugin config:', editorConfig.plugins.enabledPlugins);
            }
        } catch (error) {
            console.warn('[BrowserRuntime] Error loading config file:', error);
        }
    }

    async initialize(wasmModule: any): Promise<void> {
        // 从配置文件加载插件配置（如果指定了 URL）
        await this._loadConfigFromUrl();

        // 初始化浏览器文件系统服务（用于资产加载）
        // Initialize browser file system service (for asset loading)
        this._fileSystem = new BrowserFileSystemService({
            baseUrl: this._assetBaseUrl,
            catalogUrl: this._assetCatalogUrl,
            enableCache: true
        });
        await this._fileSystem.initialize();

        // 创建浏览器平台适配器
        const platform = new BrowserPlatformAdapter({
            wasmModule: wasmModule
        });

        // 创建统一运行时
        // 插件已经预注册了，GameRuntime 会检测到并跳过动态加载
        this._runtime = createGameRuntime({
            platform,
            canvasId: this._canvasId,
            width: window.innerWidth,
            height: window.innerHeight,
            autoStartRenderLoop: false
        });

        await this._runtime.initialize();

        // 注册文件系统服务到 Core.services（必须在 GameRuntime.initialize 之后，因为 Core 在那时才创建）
        // Register file system service to Core.services (must be after GameRuntime.initialize as Core is created there)
        const IFileSystemServiceKey = Symbol.for('IFileSystemService');
        if (!Core.services.isRegistered(IFileSystemServiceKey)) {
            Core.services.registerInstance(IFileSystemServiceKey, this._fileSystem);
        }

        // 设置浏览器特定配置
        this._runtime.setShowGrid(false);
        this._runtime.setShowGizmos(false);
    }

    async loadScene(sceneUrl: string): Promise<void> {
        if (!this._runtime) {
            throw new Error('Runtime not initialized');
        }
        await this._runtime.loadSceneFromUrl(sceneUrl);
    }

    start(): void {
        if (!this._runtime) return;
        this._runtime.start();
    }

    stop(): void {
        if (!this._runtime) return;
        this._runtime.stop();
    }

    handleResize(width: number, height: number): void {
        if (!this._runtime) return;
        this._runtime.resize(width, height);
    }

    get assetManager() {
        return this._runtime?.assetManager ?? null;
    }

    get engineIntegration() {
        return this._runtime?.engineIntegration ?? null;
    }

    get gameRuntime(): GameRuntime | null {
        return this._runtime;
    }
}

export default {
    create: (config: RuntimeConfig) => new BrowserRuntime(config),
    BrowserRuntime,
    Core,
    GameRuntime,
    createGameRuntime,
    BrowserPlatformAdapter
};
