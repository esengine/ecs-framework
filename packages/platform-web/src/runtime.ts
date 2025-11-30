/**
 * Browser Runtime Entry Point
 * 浏览器运行时入口
 *
 * 通过 esengine.config.json 配置加载插件，无需硬编码导入。
 */

import { Core, Scene, SceneSerializer } from '@esengine/ecs-framework';
import { EngineBridge, EngineRenderSystem, CameraSystem } from '@esengine/ecs-engine-bindgen';
import { TransformComponent } from '@esengine/engine-core';
import { AssetManager, EngineIntegration } from '@esengine/asset-system';
import {
    loadEnabledPlugins,
    initializeRuntime,
    createSystemsForScene,
    BUILTIN_PLUGIN_PACKAGES,
    mergeProjectConfig,
    createProjectConfigFromEnabledList,
    type SystemContext,
    type ProjectConfig
} from '@esengine/runtime-core';

export interface RuntimeConfig {
    canvasId: string;
    width?: number;
    height?: number;
    /** 项目配置（直接传入） / Project config (direct) */
    projectConfig?: Partial<ProjectConfig>;
    /** 项目配置文件 URL / Project config file URL */
    projectConfigUrl?: string;
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

class BrowserRuntime {
    private _bridge: EngineBridge;
    private _animationId: number | null = null;
    private _assetManager: AssetManager;
    private _engineIntegration: EngineIntegration;
    private _canvasId: string;
    private _projectConfig: ProjectConfig;
    private _configUrl?: string;

    constructor(config: RuntimeConfig) {
        this._canvasId = config.canvasId;
        this._projectConfig = mergeProjectConfig(config.projectConfig || {});
        this._configUrl = config.projectConfigUrl;

        if (!Core.Instance) {
            Core.create();
        }

        if (!Core.scene) {
            const runtimeScene = new Scene({ name: 'Runtime Scene' });
            Core.setScene(runtimeScene);
        }

        this._bridge = new EngineBridge({
            canvasId: config.canvasId,
            width: config.width || window.innerWidth,
            height: config.height || window.innerHeight
        });

        this._assetManager = new AssetManager();
        this._engineIntegration = new EngineIntegration(this._assetManager, this._bridge);
    }

    /**
     * 从配置文件 URL 加载插件配置
     * Load plugin config from config file URL
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

            // 如果有插件配置，转换为运行时格式
            // If there's plugin config, convert to runtime format
            if (editorConfig.plugins?.enabledPlugins) {
                this._projectConfig = createProjectConfigFromEnabledList(
                    editorConfig.plugins.enabledPlugins
                );
                console.log('[BrowserRuntime] Loaded plugin config from file:', editorConfig.plugins.enabledPlugins);
            }
        } catch (error) {
            console.warn('[BrowserRuntime] Error loading config file:', error);
        }
    }

    async initialize(wasmModule: any): Promise<void> {
        await this._bridge.initializeWithModule(wasmModule);

        this._bridge.setPathResolver((path: string) => {
            if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/asset?')) {
                return path;
            }
            return `/asset?path=${encodeURIComponent(path)}`;
        });

        this._bridge.setShowGrid(false);
        this._bridge.setShowGizmos(false);

        // 从配置文件加载插件配置（如果指定了 URL）
        // Load plugin config from file (if URL specified)
        await this._loadConfigFromUrl();

        // 根据配置动态加载插件
        await loadEnabledPlugins(
            { plugins: this._projectConfig.plugins },
            BUILTIN_PLUGIN_PACKAGES
        );

        await initializeRuntime();

        const scene = Core.scene!;

        const cameraSystem = new CameraSystem(this._bridge);
        scene.addSystem(cameraSystem);

        const renderSystem = new EngineRenderSystem(this._bridge, TransformComponent);

        const context: SystemContext = {
            isEditor: false,
            engineBridge: this._bridge,
            renderSystem
        };

        createSystemsForScene(scene, context);

        if ((context as any).uiRenderProvider) {
            renderSystem.setUIRenderDataProvider((context as any).uiRenderProvider);
        }
        renderSystem.setPreviewMode(true);
        scene.addSystem(renderSystem);
    }

    async loadScene(sceneUrl: string): Promise<void> {
        const response = await fetch(sceneUrl);
        const sceneJson = await response.text();

        if (!Core.scene) {
            throw new Error('Core.scene not initialized');
        }

        SceneSerializer.deserialize(Core.scene, sceneJson, {
            strategy: 'replace',
            preserveIds: true
        });
    }

    start(): void {
        if (this._animationId !== null) return;

        let lastTime = performance.now();
        const loop = () => {
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            Core.update(deltaTime);

            this._animationId = requestAnimationFrame(loop);
        };

        loop();
    }

    stop(): void {
        if (this._animationId !== null) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
    }

    handleResize(width: number, height: number): void {
        this._bridge.resize(width, height);
    }

    get assetManager(): AssetManager {
        return this._assetManager;
    }

    get engineIntegration(): EngineIntegration {
        return this._engineIntegration;
    }
}

export default {
    create: (config: RuntimeConfig) => new BrowserRuntime(config),
    BrowserRuntime,
    Core
};
