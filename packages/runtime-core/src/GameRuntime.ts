/**
 * Unified Game Runtime
 * 统一游戏运行时
 *
 * 这是编辑器预览和独立运行的统一入口点
 * This is the unified entry point for editor preview and standalone runtime
 */

import { Core, Scene, SceneSerializer, HierarchySystem } from '@esengine/ecs-framework';
import { EngineBridge, EngineRenderSystem, CameraSystem } from '@esengine/ecs-engine-bindgen';
import { TransformComponent, TransformSystem, InputSystem, Input } from '@esengine/engine-core';
import { AssetManager, EngineIntegration } from '@esengine/asset-system';
import {
    runtimePluginManager,
    type SystemContext,
    type IRuntimeModule
} from './PluginManager';
import {
    loadEnabledPlugins,
    type PluginPackageInfo,
    type ProjectPluginConfig
} from './PluginLoader';
import {
    BUILTIN_PLUGIN_PACKAGES,
    mergeProjectConfig,
    type ProjectConfig
} from './ProjectConfig';
import type { IPlatformAdapter, PlatformAdapterConfig } from './IPlatformAdapter';

/**
 * 运行时配置
 * Runtime configuration
 */
export interface GameRuntimeConfig {
    /** 平台适配器 */
    platform: IPlatformAdapter;
    /** 项目配置 */
    projectConfig?: Partial<ProjectConfig>;
    /** Canvas ID */
    canvasId: string;
    /** 初始宽度 */
    width?: number;
    /** 初始高度 */
    height?: number;
    /** 是否自动启动渲染循环 */
    autoStartRenderLoop?: boolean;
    /** UI 画布尺寸 */
    uiCanvasSize?: { width: number; height: number };
    /**
     * 跳过内部插件加载
     * 编辑器模式下，插件由 editor-core 的 PluginManager 管理
     * Skip internal plugin loading - editor mode uses editor-core's PluginManager
     */
    skipPluginLoading?: boolean;
}

/**
 * 运行时状态
 * Runtime state
 */
export interface RuntimeState {
    initialized: boolean;
    running: boolean;
    paused: boolean;
}

/**
 * 统一游戏运行时
 * Unified Game Runtime
 *
 * 提供编辑器预览和独立运行的统一实现
 * Provides unified implementation for editor preview and standalone runtime
 */
export class GameRuntime {
    private _platform: IPlatformAdapter;
    private _bridge: EngineBridge | null = null;
    private _scene: Scene | null = null;
    private _renderSystem: EngineRenderSystem | null = null;
    private _cameraSystem: CameraSystem | null = null;
    private _inputSystem: InputSystem | null = null;
    private _assetManager: AssetManager | null = null;
    private _engineIntegration: EngineIntegration | null = null;
    private _projectConfig: ProjectConfig;
    private _config: GameRuntimeConfig;

    private _state: RuntimeState = {
        initialized: false,
        running: false,
        paused: false
    };

    private _animationFrameId: number | null = null;
    private _lastTime = 0;

    // 系统上下文，供插件使用
    private _systemContext: SystemContext | null = null;

    // 场景快照（用于编辑器预览后恢复）
    private _sceneSnapshot: string | null = null;

    // Gizmo 注册表注入函数
    private _gizmoDataProvider?: (component: any, entity: any, isSelected: boolean) => any;
    private _hasGizmoProvider?: (component: any) => boolean;

    constructor(config: GameRuntimeConfig) {
        this._config = config;
        this._platform = config.platform;
        this._projectConfig = mergeProjectConfig(config.projectConfig || {});
    }

    /**
     * 获取运行时状态
     */
    get state(): RuntimeState {
        return { ...this._state };
    }

    /**
     * 获取场景
     */
    get scene(): Scene | null {
        return this._scene;
    }

    /**
     * 获取引擎桥接
     */
    get bridge(): EngineBridge | null {
        return this._bridge;
    }

    /**
     * 获取渲染系统
     */
    get renderSystem(): EngineRenderSystem | null {
        return this._renderSystem;
    }

    /**
     * 获取资产管理器
     */
    get assetManager(): AssetManager | null {
        return this._assetManager;
    }

    /**
     * 获取引擎集成
     */
    get engineIntegration(): EngineIntegration | null {
        return this._engineIntegration;
    }

    /**
     * 获取系统上下文
     */
    get systemContext(): SystemContext | null {
        return this._systemContext;
    }

    /**
     * 更新系统上下文（用于编辑器模式下同步外部创建的系统引用）
     * Update system context (for syncing externally created system references in editor mode)
     */
    updateSystemContext(updates: Partial<SystemContext>): void {
        if (this._systemContext) {
            Object.assign(this._systemContext, updates);
        }
    }

    /**
     * 获取平台适配器
     */
    get platform(): IPlatformAdapter {
        return this._platform;
    }

    /**
     * 初始化运行时
     * Initialize runtime
     */
    async initialize(): Promise<void> {
        if (this._state.initialized) {
            return;
        }

        try {
            // 1. 初始化平台
            await this._platform.initialize({
                canvasId: this._config.canvasId,
                width: this._config.width,
                height: this._config.height,
                isEditor: this._platform.isEditorMode()
            });

            // 2. 获取 WASM 模块并创建引擎桥接
            const wasmModule = await this._platform.getWasmModule();
            this._bridge = new EngineBridge({
                canvasId: this._config.canvasId,
                width: this._config.width,
                height: this._config.height
            });
            await this._bridge.initializeWithModule(wasmModule);

            // 3. 设置路径解析器
            this._bridge.setPathResolver((path: string) => {
                return this._platform.pathResolver.resolve(path);
            });

            // 4. 初始化 ECS Core
            if (!Core.Instance) {
                Core.create({ debug: false });
            }

            // 5. 创建或获取场景
            if (Core.scene) {
                this._scene = Core.scene as Scene;
            } else {
                this._scene = new Scene({ name: 'GameScene' });
                Core.setScene(this._scene);
            }

            // 编辑器模式下设置 isEditorMode，延迟组件生命周期回调
            // Set isEditorMode in editor mode to defer component lifecycle callbacks
            if (this._platform.isEditorMode()) {
                this._scene.isEditorMode = true;
            }

            // 6. 添加基础系统
            this._scene.addSystem(new HierarchySystem());
            this._scene.addSystem(new TransformSystem());

            // 7. 添加输入系统（最先更新，以便其他系统可以读取输入状态）
            // Add input system (updates first so other systems can read input state)
            this._inputSystem = new InputSystem({
                disableInEditor: true // 编辑器模式下禁用，避免与编辑器输入冲突
            });
            this._scene.addSystem(this._inputSystem);

            // 设置平台输入子系统 | Set platform input subsystem
            const inputSubsystem = this._platform.getInputSubsystem?.();
            if (inputSubsystem) {
                this._inputSystem.setInputSubsystem(inputSubsystem);
            }

            this._cameraSystem = new CameraSystem(this._bridge);
            this._scene.addSystem(this._cameraSystem);

            this._renderSystem = new EngineRenderSystem(this._bridge, TransformComponent);

            // 7. 设置 UI 画布尺寸
            if (this._config.uiCanvasSize) {
                this._renderSystem.setUICanvasSize(
                    this._config.uiCanvasSize.width,
                    this._config.uiCanvasSize.height
                );
            } else {
                this._renderSystem.setUICanvasSize(1920, 1080);
            }

            // 8. 创建资产系统
            this._assetManager = new AssetManager();
            this._engineIntegration = new EngineIntegration(this._assetManager, this._bridge);

            // 9. 加载并初始化插件（编辑器模式下跳过，由 editor-core 的 PluginManager 处理）
            if (!this._config.skipPluginLoading) {
                await this._initializePlugins();
            }

            // 10. 创建系统上下文
            this._systemContext = {
                isEditor: this._platform.isEditorMode(),
                engineBridge: this._bridge,
                engineIntegration: this._engineIntegration,
                renderSystem: this._renderSystem,
                assetManager: this._assetManager,
                inputSystem: this._inputSystem,
                inputManager: Input
            };

            // 11. 让插件创建系统（编辑器模式下跳过，由 EngineService.initializeModuleSystems 处理）
            if (!this._config.skipPluginLoading) {
                runtimePluginManager.createSystemsForScene(this._scene, this._systemContext);
            }

            // 11. 设置 UI 渲染数据提供者（如果有）
            if (this._systemContext.uiRenderProvider) {
                this._renderSystem.setUIRenderDataProvider(this._systemContext.uiRenderProvider);
            }

            // 12. 添加渲染系统（在所有其他系统之后）
            this._scene.addSystem(this._renderSystem);

            // 13. 启动默认 world
            const defaultWorld = Core.worldManager.getWorld('__default__');
            if (defaultWorld && !defaultWorld.isActive) {
                defaultWorld.start();
            }

            // 14. 编辑器模式下的特殊处理
            if (this._platform.isEditorMode()) {
                // 禁用游戏逻辑系统
                this._disableGameLogicSystems();
            }

            this._state.initialized = true;

            // 15. 自动启动渲染循环
            if (this._config.autoStartRenderLoop !== false) {
                this._startRenderLoop();
            }
        } catch (error) {
            console.error('[GameRuntime] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * 加载并初始化插件
     */
    private async _initializePlugins(): Promise<void> {
        // 检查是否已有插件注册（静态导入场景）
        // Check if plugins are already registered (static import scenario)
        const hasPlugins = runtimePluginManager.getPlugins().length > 0;

        if (!hasPlugins) {
            // 没有预注册的插件，尝试动态加载
            // No pre-registered plugins, try dynamic loading
            await loadEnabledPlugins(
                { plugins: this._projectConfig.plugins },
                BUILTIN_PLUGIN_PACKAGES
            );
        }

        // 初始化插件（注册组件和服务）
        await runtimePluginManager.initializeRuntime(Core.services);
    }

    /**
     * 禁用游戏逻辑系统（编辑器模式）
     */
    private _disableGameLogicSystems(): void {
        const ctx = this._systemContext;
        if (!ctx) return;

        // 这些系统由插件创建，通过 context 传递引用
        if (ctx.animatorSystem) {
            ctx.animatorSystem.enabled = false;
        }
        if (ctx.behaviorTreeSystem) {
            ctx.behaviorTreeSystem.enabled = false;
        }
        if (ctx.physicsSystem) {
            ctx.physicsSystem.enabled = false;
        }
    }

    /**
     * 启用游戏逻辑系统（预览/运行模式）
     */
    private _enableGameLogicSystems(): void {
        const ctx = this._systemContext;
        if (!ctx) return;

        if (ctx.animatorSystem) {
            ctx.animatorSystem.enabled = true;
        }
        if (ctx.behaviorTreeSystem) {
            ctx.behaviorTreeSystem.enabled = true;
            ctx.behaviorTreeSystem.startAllAutoStartTrees?.();
        }
        if (ctx.physicsSystem) {
            ctx.physicsSystem.enabled = true;
        }
    }

    /**
     * 启动渲染循环
     */
    private _startRenderLoop(): void {
        if (this._animationFrameId !== null) {
            return;
        }
        this._lastTime = performance.now();
        this._renderLoop();
    }

    /**
     * 渲染循环
     */
    private _renderLoop = (): void => {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this._lastTime) / 1000;
        this._lastTime = currentTime;

        // 更新 ECS
        Core.update(deltaTime);

        this._animationFrameId = requestAnimationFrame(this._renderLoop);
    };

    /**
     * 停止渲染循环
     */
    private _stopRenderLoop(): void {
        if (this._animationFrameId !== null) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }

    /**
     * 开始运行（启用游戏逻辑）
     * Start running (enable game logic)
     */
    start(): void {
        if (!this._state.initialized || this._state.running) {
            return;
        }

        this._state.running = true;
        this._state.paused = false;

        // 启用预览模式
        if (this._renderSystem) {
            this._renderSystem.setPreviewMode(true);
        }

        // 调用场景 begin() 触发延迟的组件生命周期回调
        // Call scene begin() to trigger deferred component lifecycle callbacks
        if (this._scene) {
            this._scene.begin();
        }

        // 启用游戏逻辑系统
        this._enableGameLogicSystems();

        // 绑定 UI 输入
        const ctx = this._systemContext;
        if (ctx?.uiInputSystem && this._config.canvasId) {
            const canvas = document.getElementById(this._config.canvasId) as HTMLCanvasElement;
            if (canvas) {
                ctx.uiInputSystem.bindToCanvas(canvas);
            }
        }

        // 确保渲染循环在运行
        this._startRenderLoop();
    }

    /**
     * 暂停运行
     * Pause running
     */
    pause(): void {
        if (!this._state.running || this._state.paused) {
            return;
        }
        this._state.paused = true;
    }

    /**
     * 恢复运行
     * Resume running
     */
    resume(): void {
        if (!this._state.running || !this._state.paused) {
            return;
        }
        this._state.paused = false;
    }

    /**
     * 停止运行（禁用游戏逻辑）
     * Stop running (disable game logic)
     */
    stop(): void {
        if (!this._state.running) {
            return;
        }

        this._state.running = false;
        this._state.paused = false;

        // 禁用预览模式
        if (this._renderSystem) {
            this._renderSystem.setPreviewMode(false);
        }

        // 解绑 UI 输入
        const ctx = this._systemContext;
        if (ctx?.uiInputSystem) {
            ctx.uiInputSystem.unbind?.();
        }

        // 禁用游戏逻辑系统
        this._disableGameLogicSystems();

        // 重置物理系统
        if (ctx?.physicsSystem) {
            ctx.physicsSystem.reset?.();
        }
    }

    /**
     * 单步执行
     * Step forward one frame
     */
    step(): void {
        if (!this._state.initialized) {
            return;
        }

        // 启用系统执行一帧
        this._enableGameLogicSystems();
        Core.update(1 / 60);
        this._disableGameLogicSystems();
    }

    /**
     * 加载场景数据
     * Load scene data
     */
    async loadScene(sceneData: string | object): Promise<void> {
        if (!this._scene) {
            throw new Error('Scene not initialized');
        }

        const jsonStr = typeof sceneData === 'string'
            ? sceneData
            : JSON.stringify(sceneData);

        SceneSerializer.deserialize(this._scene, jsonStr, {
            strategy: 'replace',
            preserveIds: true
        });
    }

    /**
     * 从 URL 加载场景
     * Load scene from URL
     */
    async loadSceneFromUrl(url: string): Promise<void> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load scene from ${url}: ${response.status}`);
        }
        const sceneJson = await response.text();
        await this.loadScene(sceneJson);
    }

    /**
     * 调整视口大小
     * Resize viewport
     */
    resize(width: number, height: number): void {
        if (this._bridge) {
            this._bridge.resize(width, height);
        }
        this._platform.resize(width, height);
    }

    /**
     * 设置相机
     * Set camera
     */
    setCamera(config: { x: number; y: number; zoom: number; rotation?: number }): void {
        if (this._bridge) {
            this._bridge.setCamera({
                x: config.x,
                y: config.y,
                zoom: config.zoom,
                rotation: config.rotation ?? 0
            });
        }
    }

    /**
     * 获取相机状态
     * Get camera state
     */
    getCamera(): { x: number; y: number; zoom: number; rotation: number } {
        if (this._bridge) {
            return this._bridge.getCamera();
        }
        return { x: 0, y: 0, zoom: 1, rotation: 0 };
    }

    /**
     * 设置网格显示
     * Set grid visibility
     */
    setShowGrid(show: boolean): void {
        if (this._bridge) {
            this._bridge.setShowGrid(show);
        }
    }

    /**
     * 设置 Gizmo 显示
     * Set gizmo visibility
     */
    setShowGizmos(show: boolean): void {
        if (this._renderSystem) {
            this._renderSystem.setShowGizmos(show);
        }
    }

    /**
     * 设置编辑器模式
     * Set editor mode
     *
     * When false (runtime mode), editor-only UI like grid, gizmos,
     * and axis indicator are automatically hidden.
     * 当为 false（运行时模式）时，编辑器专用 UI 会自动隐藏。
     */
    setEditorMode(isEditor: boolean): void {
        if (this._bridge) {
            this._bridge.setEditorMode(isEditor);
        }
    }

    /**
     * 获取编辑器模式
     * Get editor mode
     */
    isEditorMode(): boolean {
        if (this._bridge) {
            return this._bridge.isEditorMode();
        }
        return true;
    }

    /**
     * 设置清除颜色
     * Set clear color
     */
    setClearColor(r: number, g: number, b: number, a: number = 1.0): void {
        if (this._bridge) {
            this._bridge.setClearColor(r, g, b, a);
        }
    }

    /**
     * 获取统计信息
     * Get stats
     */
    getStats(): { fps: number; drawCalls: number; spriteCount: number } {
        if (!this._renderSystem) {
            return { fps: 0, drawCalls: 0, spriteCount: 0 };
        }

        const engineStats = this._renderSystem.getStats();
        return {
            fps: engineStats?.fps ?? 0,
            drawCalls: engineStats?.drawCalls ?? 0,
            spriteCount: this._renderSystem.spriteCount
        };
    }

    // ===== 编辑器特有功能 =====
    // ===== Editor-specific features =====

    /**
     * 设置 Gizmo 注册表（编辑器模式）
     * Set gizmo registry (editor mode)
     */
    setGizmoRegistry(
        gizmoDataProvider: (component: any, entity: any, isSelected: boolean) => any,
        hasGizmoProvider: (component: any) => boolean
    ): void {
        this._gizmoDataProvider = gizmoDataProvider;
        this._hasGizmoProvider = hasGizmoProvider;

        if (this._renderSystem) {
            this._renderSystem.setGizmoRegistry(gizmoDataProvider, hasGizmoProvider);
        }
    }

    /**
     * 设置选中的实体 ID（编辑器模式）
     * Set selected entity IDs (editor mode)
     */
    setSelectedEntityIds(ids: number[]): void {
        if (this._renderSystem) {
            this._renderSystem.setSelectedEntityIds(ids);
        }
    }

    /**
     * 设置变换工具模式（编辑器模式）
     * Set transform tool mode (editor mode)
     */
    setTransformMode(mode: 'select' | 'move' | 'rotate' | 'scale'): void {
        if (this._renderSystem) {
            this._renderSystem.setTransformMode(mode);
        }
    }

    /**
     * 获取变换工具模式
     * Get transform tool mode
     */
    getTransformMode(): 'select' | 'move' | 'rotate' | 'scale' {
        return this._renderSystem?.getTransformMode() ?? 'select';
    }

    /**
     * 设置 UI 画布尺寸
     * Set UI canvas size
     */
    setUICanvasSize(width: number, height: number): void {
        if (this._renderSystem) {
            this._renderSystem.setUICanvasSize(width, height);
        }
    }

    /**
     * 获取 UI 画布尺寸
     * Get UI canvas size
     */
    getUICanvasSize(): { width: number; height: number } {
        return this._renderSystem?.getUICanvasSize() ?? { width: 0, height: 0 };
    }

    /**
     * 设置 UI 画布边界显示
     * Set UI canvas boundary visibility
     */
    setShowUICanvasBoundary(show: boolean): void {
        if (this._renderSystem) {
            this._renderSystem.setShowUICanvasBoundary(show);
        }
    }

    /**
     * 获取 UI 画布边界显示状态
     * Get UI canvas boundary visibility
     */
    getShowUICanvasBoundary(): boolean {
        return this._renderSystem?.getShowUICanvasBoundary() ?? true;
    }

    // ===== 场景快照 API =====
    // ===== Scene Snapshot API =====

    /**
     * 保存场景快照
     * Save scene snapshot
     */
    saveSceneSnapshot(): boolean {
        if (!this._scene) {
            console.warn('[GameRuntime] Cannot save snapshot: no scene');
            return false;
        }

        try {
            this._sceneSnapshot = SceneSerializer.serialize(this._scene, {
                format: 'json',
                pretty: false,
                includeMetadata: false
            }) as string;
            return true;
        } catch (error) {
            console.error('[GameRuntime] Failed to save snapshot:', error);
            return false;
        }
    }

    /**
     * 恢复场景快照
     * Restore scene snapshot
     */
    async restoreSceneSnapshot(): Promise<boolean> {
        if (!this._scene || !this._sceneSnapshot) {
            console.warn('[GameRuntime] Cannot restore: no scene or snapshot');
            return false;
        }

        try {
            // 清除缓存
            const ctx = this._systemContext;
            if (ctx?.tilemapSystem) {
                ctx.tilemapSystem.clearCache?.();
            }

            // 反序列化场景
            SceneSerializer.deserialize(this._scene, this._sceneSnapshot, {
                strategy: 'replace',
                preserveIds: true
            });

            this._sceneSnapshot = null;
            return true;
        } catch (error) {
            console.error('[GameRuntime] Failed to restore snapshot:', error);
            return false;
        }
    }

    /**
     * 检查是否有快照
     * Check if snapshot exists
     */
    hasSnapshot(): boolean {
        return this._sceneSnapshot !== null;
    }

    // ===== 多视口 API =====
    // ===== Multi-viewport API =====

    /**
     * 注册视口
     * Register viewport
     */
    registerViewport(id: string, canvasId: string): void {
        if (this._bridge) {
            this._bridge.registerViewport(id, canvasId);
        }
    }

    /**
     * 注销视口
     * Unregister viewport
     */
    unregisterViewport(id: string): void {
        if (this._bridge) {
            this._bridge.unregisterViewport(id);
        }
    }

    /**
     * 设置活动视口
     * Set active viewport
     */
    setActiveViewport(id: string): boolean {
        if (this._bridge) {
            return this._bridge.setActiveViewport(id);
        }
        return false;
    }

    /**
     * 释放资源
     * Dispose resources
     */
    dispose(): void {
        this.stop();
        this._stopRenderLoop();

        if (this._assetManager) {
            this._assetManager.dispose();
            this._assetManager = null;
        }

        this._engineIntegration = null;
        this._scene = null;

        if (this._bridge) {
            this._bridge.dispose();
            this._bridge = null;
        }

        this._renderSystem = null;
        this._cameraSystem = null;
        this._inputSystem = null;
        this._systemContext = null;
        this._platform.dispose();

        this._state.initialized = false;
    }
}

/**
 * 创建游戏运行时实例
 * Create game runtime instance
 */
export function createGameRuntime(config: GameRuntimeConfig): GameRuntime {
    return new GameRuntime(config);
}
