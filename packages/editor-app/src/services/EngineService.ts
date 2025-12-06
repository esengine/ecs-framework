/**
 * Engine service for managing Rust engine lifecycle.
 * 管理Rust引擎生命周期的服务。
 *
 * 使用统一的 GameRuntime 架构
 * Uses the unified GameRuntime architecture
 */

import { GizmoRegistry, EntityStoreService, MessageHub, SceneManagerService, ProjectService, PluginManager, IPluginManager, AssetRegistryService, type SystemContext } from '@esengine/editor-core';
import { Core, Scene, Entity, SceneSerializer, ProfilerSDK } from '@esengine/ecs-framework';
import { CameraConfig } from '@esengine/ecs-engine-bindgen';
import { TransformComponent } from '@esengine/engine-core';
import { SpriteComponent, SpriteAnimatorComponent } from '@esengine/sprite';
import { invalidateUIRenderCaches } from '@esengine/ui';
import * as esEngine from '@esengine/engine';
import {
    AssetManager,
    EngineIntegration,
    AssetPathResolver,
    AssetPlatform,
    globalPathResolver,
    SceneResourceManager
} from '@esengine/asset-system';
import {
    GameRuntime,
    createGameRuntime,
    EditorPlatformAdapter,
    type GameRuntimeConfig
} from '@esengine/runtime-core';
import { getMaterialManager } from '@esengine/material-system';
import { resetEngineState } from '../hooks/useEngine';
import { convertFileSrc } from '@tauri-apps/api/core';
import { IdGenerator } from '../utils/idGenerator';
import { TauriAssetReader } from './TauriAssetReader';

/**
 * Engine service singleton for editor integration.
 * 用于编辑器集成的引擎服务单例。
 *
 * 内部使用 GameRuntime，对外保持原有 API 兼容
 * Internally uses GameRuntime, maintains original API compatibility externally
 */
export class EngineService {
    private static instance: EngineService | null = null;

    private _runtime: GameRuntime | null = null;
    private _initialized = false;
    private _modulesInitialized = false;
    private _running = false;
    private _canvasId: string | null = null;

    // 资产系统相关
    private _assetManager: AssetManager | null = null;
    private _engineIntegration: EngineIntegration | null = null;
    private _sceneResourceManager: SceneResourceManager | null = null;
    private _assetPathResolver: AssetPathResolver | null = null;
    private _assetSystemInitialized = false;
    private _initializationError: Error | null = null;

    // 编辑器相机状态（用于恢复）
    private _editorCameraState = { x: 0, y: 0, zoom: 1 };

    private constructor() {}

    /**
     * Get singleton instance.
     * 获取单例实例。
     */
    static getInstance(): EngineService {
        if (!EngineService.instance) {
            EngineService.instance = new EngineService();
        }
        return EngineService.instance;
    }

    /**
     * 等待引擎初始化完成
     */
    async waitForInitialization(timeout = 10000): Promise<boolean> {
        if (this._initialized) {
            return true;
        }

        const startTime = Date.now();
        while (!this._initialized && Date.now() - startTime < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return this._initialized;
    }

    /**
     * Initialize the engine with canvas.
     * 使用canvas初始化引擎。
     */
    async initialize(canvasId: string): Promise<void> {
        if (this._initialized) {
            return;
        }

        this._canvasId = canvasId;

        try {
            // 创建路径转换函数
            const pathTransformer = (path: string) => {
                if (path.startsWith('http://') ||
                    path.startsWith('https://') ||
                    path.startsWith('data:') ||
                    path.startsWith('asset://')) {
                    return path;
                }
                return convertFileSrc(path);
            };

            // 创建编辑器平台适配器
            const platform = new EditorPlatformAdapter({
                wasmModule: esEngine,
                pathTransformer,
                gizmoDataProvider: (component, entity, isSelected) =>
                    GizmoRegistry.getGizmoData(component, entity, isSelected),
                hasGizmoProvider: (component) =>
                    GizmoRegistry.hasProvider(component.constructor as any)
            });

            // 创建统一运行时
            // 编辑器模式下跳过内部插件加载，由 editor-core 的 PluginManager 管理
            this._runtime = createGameRuntime({
                platform,
                canvasId,
                autoStartRenderLoop: true,
                uiCanvasSize: { width: 1920, height: 1080 },
                skipPluginLoading: true  // 编辑器自己管理插件
            });

            await this._runtime.initialize();

            // 启用性能分析器（编辑器模式默认启用）
            ProfilerSDK.setEnabled(true);

            // 设置 Gizmo 注册表
            this._runtime.setGizmoRegistry(
                (component, entity, isSelected) =>
                    GizmoRegistry.getGizmoData(component, entity, isSelected),
                (component) =>
                    GizmoRegistry.hasProvider(component.constructor as any)
            );

            // 初始化资产系统
            await this._initializeAssetSystem();

            // 设置资产路径解析器（用于 GUID 到路径的转换）
            // Set asset path resolver (for GUID to path conversion)
            this._setupAssetPathResolver();

            // 同步视口尺寸
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
            if (canvas && canvas.parentElement) {
                const rect = canvas.parentElement.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                canvas.width = Math.floor(rect.width * dpr);
                canvas.height = Math.floor(rect.height * dpr);
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;

                this._runtime.resize(canvas.width, canvas.height);
            }

            this._initialized = true;
        } catch (error) {
            console.error('Failed to initialize engine:', error);
            throw error;
        }
    }

    /**
     * 初始化模块系统
     */
    async initializeModuleSystems(): Promise<void> {
        if (!this._initialized || !this._runtime) {
            console.error('Engine not initialized. Call initialize() first.');
            return;
        }

        if (this._modulesInitialized) {
            this.clearModuleSystems();
        }

        // 获取 PluginManager
        const pluginManager = Core.services.tryResolve<PluginManager>(IPluginManager);
        if (!pluginManager) {
            console.error('PluginManager not available.');
            return;
        }

        // 初始化所有插件的运行时模块
        await pluginManager.initializeRuntime(Core.services);

        // 创建系统上下文
        const context: SystemContext = {
            services: Core.services,
            engineBridge: this._runtime.bridge,
            renderSystem: this._runtime.renderSystem,
            assetManager: this._assetManager,
            isEditor: true
        };

        // 让插件为场景创建系统
        pluginManager.createSystemsForScene(this._runtime.scene!, context);

        // 同步系统引用到 GameRuntime 的 systemContext（用于 start/stop 时启用/禁用系统）
        this._runtime.updateSystemContext({
            animatorSystem: context.animatorSystem,
            behaviorTreeSystem: context.behaviorTreeSystem,
            physicsSystem: context.physicsSystem,
            uiInputSystem: context.uiInputSystem,
            uiRenderProvider: context.uiRenderProvider
        });

        // 设置 UI 渲染数据提供者
        if (context.uiRenderProvider && this._runtime.renderSystem) {
            this._runtime.renderSystem.setUIRenderDataProvider(context.uiRenderProvider);
        }

        // 在编辑器模式下，禁用游戏逻辑系统
        if (context.animatorSystem) {
            context.animatorSystem.enabled = false;
        }
        if (context.behaviorTreeSystem) {
            context.behaviorTreeSystem.enabled = false;
        }
        if (context.physicsSystem) {
            context.physicsSystem.enabled = false;
        }

        this._modulesInitialized = true;
    }

    /**
     * 清理模块系统
     */
    clearModuleSystems(): void {
        const pluginManager = Core.services.tryResolve<PluginManager>(IPluginManager);
        if (pluginManager) {
            pluginManager.clearSceneSystems();
        }

        const ctx = this._runtime?.systemContext;
        if (ctx?.uiInputSystem) {
            ctx.uiInputSystem.unbind?.();
        }

        // 清理 viewport | Clear viewport
        this.unregisterViewport('editor-viewport');

        // 重置 useEngine 的模块级状态 | Reset useEngine module-level state
        resetEngineState();

        this._modulesInitialized = false;
        this._initialized = false;
    }

    /**
     * 检查模块系统是否已初始化
     */
    isModulesInitialized(): boolean {
        return this._modulesInitialized;
    }

    /**
     * Check if engine is initialized.
     */
    isInitialized(): boolean {
        return this._initialized;
    }

    /**
     * Check if engine is running.
     */
    isRunning(): boolean {
        return this._running;
    }

    /**
     * Start the game loop (preview mode).
     */
    start(): void {
        if (!this._initialized || !this._runtime || this._running) {
            return;
        }

        this._running = true;
        this._runtime.start();

        // 启动自动播放动画
        this._startAutoPlayAnimations();
    }

    /**
     * Stop the game loop.
     */
    stop(): void {
        if (!this._runtime) return;

        this._running = false;
        this._runtime.stop();

        // 停止所有动画
        this._stopAllAnimations();
    }

    /**
     * Start all auto-play animations.
     */
    private _startAutoPlayAnimations(): void {
        const scene = this._runtime?.scene;
        if (!scene) return;

        const entities = scene.entities.findEntitiesWithComponent(SpriteAnimatorComponent);
        for (const entity of entities) {
            const animator = entity.getComponent(SpriteAnimatorComponent);
            if (animator && animator.autoPlay && animator.defaultAnimation) {
                animator.play();
            }
        }
    }

    /**
     * Stop all animations.
     */
    private _stopAllAnimations(): void {
        const scene = this._runtime?.scene;
        if (!scene) return;

        const entities = scene.entities.findEntitiesWithComponent(SpriteAnimatorComponent);
        for (const entity of entities) {
            const animator = entity.getComponent(SpriteAnimatorComponent);
            if (animator) {
                animator.stop();

                const sprite = entity.getComponent(SpriteComponent);
                if (sprite && animator.clips && animator.clips.length > 0) {
                    const firstClip = animator.clips[0];
                    if (firstClip && firstClip.frames && firstClip.frames.length > 0) {
                        const firstFrame = firstClip.frames[0];
                        if (firstFrame && firstFrame.texture) {
                            sprite.textureGuid = firstFrame.texture;
                        }
                    }
                }
            }
        }
    }

    /**
     * Initialize asset system
     */
    private async _initializeAssetSystem(): Promise<void> {
        try {
            this._assetManager = new AssetManager();

            // Set up asset reader for Tauri environment.
            // 为 Tauri 环境设置资产读取器。
            const assetReader = new TauriAssetReader();
            this._assetManager.setReader(assetReader);

            // Set project root when project is open.
            // 当项目打开时设置项目根路径。
            const projectService = Core.services.tryResolve<ProjectService>(ProjectService);
            if (projectService && projectService.isProjectOpen()) {
                const projectInfo = projectService.getCurrentProject();
                if (projectInfo) {
                    this._assetManager.setProjectRoot(projectInfo.path);
                }
            }

            const pathTransformerFn = (path: string) => {
                if (!path.startsWith('http://') && !path.startsWith('https://') &&
                    !path.startsWith('data:') && !path.startsWith('asset://')) {
                    if (!path.startsWith('/') && !path.match(/^[a-zA-Z]:/)) {
                        if (projectService && projectService.isProjectOpen()) {
                            const projectInfo = projectService.getCurrentProject();
                            if (projectInfo) {
                                const projectPath = projectInfo.path;
                                const separator = projectPath.includes('\\') ? '\\' : '/';
                                path = `${projectPath}${separator}${path.replace(/\//g, separator)}`;
                            }
                        }
                    }
                    return convertFileSrc(path);
                }
                return path;
            };

            this._assetPathResolver = new AssetPathResolver({
                platform: AssetPlatform.Editor,
                pathTransformer: pathTransformerFn
            });

            globalPathResolver.updateConfig({
                platform: AssetPlatform.Editor,
                pathTransformer: pathTransformerFn
            });

            if (this._runtime?.bridge) {
                this._engineIntegration = new EngineIntegration(this._assetManager, this._runtime.bridge);

                this._sceneResourceManager = new SceneResourceManager();
                this._sceneResourceManager.setResourceLoader(this._engineIntegration);

                const sceneManagerService = Core.services.tryResolve<SceneManagerService>(SceneManagerService);
                if (sceneManagerService) {
                    sceneManagerService.setSceneResourceManager(this._sceneResourceManager);
                }
            }

            // Set asset manager for MaterialManager.
            // 为 MaterialManager 设置 asset manager。
            const materialManager = getMaterialManager();
            if (materialManager) {
                materialManager.setAssetManager(this._assetManager);
            }

            this._assetSystemInitialized = true;
            this._initializationError = null;
        } catch (error) {
            this._assetSystemInitialized = false;
            this._initializationError = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to initialize asset system:', error);
            throw this._initializationError;
        }
    }

    /**
     * Setup asset path resolver for EngineRenderSystem.
     * 为 EngineRenderSystem 设置资产路径解析器。
     *
     * This enables GUID-based asset references. When a component stores a GUID,
     * the resolver converts it to an actual file path for loading.
     * 这启用了基于 GUID 的资产引用。当组件存储 GUID 时，
     * 解析器将其转换为实际文件路径以进行加载。
     */
    private _setupAssetPathResolver(): void {
        const renderSystem = this._runtime?.renderSystem;
        if (!renderSystem) return;

        // UUID v4 regex for GUID detection
        // UUID v4 正则表达式用于 GUID 检测
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        renderSystem.setAssetPathResolver((guidOrPath: string): string => {
            // Skip if already a valid URL
            // 如果已经是有效的 URL 则跳过
            if (!guidOrPath || guidOrPath.startsWith('http') || guidOrPath.startsWith('asset://') || guidOrPath.startsWith('data:')) {
                return guidOrPath;
            }

            // Check if this is a GUID
            // 检查是否为 GUID
            if (uuidRegex.test(guidOrPath)) {
                const assetRegistry = Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
                if (assetRegistry) {
                    const relativePath = assetRegistry.getPathByGuid(guidOrPath);
                    if (relativePath) {
                        // Convert relative path to absolute
                        // 将相对路径转换为绝对路径
                        const absolutePath = assetRegistry.relativeToAbsolute(relativePath);
                        if (absolutePath) {
                            // Convert to Tauri asset URL for WebView loading
                            // 转换为 Tauri 资产 URL 以便 WebView 加载
                            return convertFileSrc(absolutePath);
                        }
                        return relativePath;
                    }
                }
                // GUID not found, return original value
                // 未找到 GUID，返回原值
                return guidOrPath;
            }

            // Not a GUID, treat as file path and convert
            // 不是 GUID，当作文件路径处理并转换
            return convertFileSrc(guidOrPath);
        });
    }

    /**
     * Create entity with sprite and transform.
     */
    createSpriteEntity(name: string, options?: {
        x?: number;
        y?: number;
        textureId?: number;
        width?: number;
        height?: number;
    }): Entity | null {
        const scene = this._runtime?.scene;
        if (!scene) return null;

        const entity = scene.createEntity(name);

        const transform = new TransformComponent();
        if (options) {
            transform.position.x = options.x ?? 0;
            transform.position.y = options.y ?? 0;
        }
        entity.addComponent(transform);

        const sprite = new SpriteComponent();
        if (options) {
            sprite.textureId = options.textureId ?? 0;
            sprite.width = options.width ?? 64;
            sprite.height = options.height ?? 64;
        }
        entity.addComponent(sprite);

        return entity;
    }

    /**
     * Load texture.
     */
    loadTexture(id: number, url: string): void {
        this._runtime?.renderSystem?.loadTexture(id, url);
    }

    /**
     * Load texture through asset system
     */
    async loadTextureAsset(path: string): Promise<number> {
        if (!this._assetSystemInitialized || this._initializationError) {
            console.warn('Asset system not initialized, using fallback texture loading');
            const textureId = IdGenerator.nextId('texture-fallback');
            this.loadTexture(textureId, path);
            return textureId;
        }

        if (!this._engineIntegration) {
            const textureId = IdGenerator.nextId('texture');
            this.loadTexture(textureId, path);
            return textureId;
        }

        try {
            return await this._engineIntegration.loadTextureForComponent(path);
        } catch (error) {
            console.error('Failed to load texture asset:', error);
            const fallbackId = IdGenerator.nextId('texture-fallback');
            return fallbackId;
        }
    }

    /**
     * Get asset manager
     */
    getAssetManager(): AssetManager | null {
        return this._assetManager;
    }

    /**
     * Get engine integration
     */
    getEngineIntegration(): EngineIntegration | null {
        return this._engineIntegration;
    }

    /**
     * Get asset path resolver
     */
    getAssetPathResolver(): AssetPathResolver | null {
        return this._assetPathResolver;
    }

    /**
     * Get engine statistics.
     */
    getStats(): { fps: number; drawCalls: number; spriteCount: number } {
        return this._runtime?.getStats() ?? { fps: 0, drawCalls: 0, spriteCount: 0 };
    }

    /**
     * Get the ECS scene.
     */
    getScene(): Scene | null {
        return this._runtime?.scene ?? null;
    }

    /**
     * Enable animation preview in editor mode.
     */
    enableAnimationPreview(): void {
        const ctx = this._runtime?.systemContext;
        if (ctx?.animatorSystem && !this._running) {
            ctx.animatorSystem.clearEntityCache?.();
            ctx.animatorSystem.enabled = true;
        }
    }

    /**
     * Disable animation preview in editor mode.
     */
    disableAnimationPreview(): void {
        const ctx = this._runtime?.systemContext;
        if (ctx?.animatorSystem && !this._running) {
            ctx.animatorSystem.enabled = false;
        }
    }

    /**
     * Check if animation preview is enabled.
     */
    isAnimationPreviewEnabled(): boolean {
        return this._runtime?.systemContext?.animatorSystem?.enabled ?? false;
    }

    /**
     * Get the engine bridge.
     */
    getBridge() {
        return this._runtime?.bridge ?? null;
    }

    /**
     * Resize the engine viewport.
     */
    resize(width: number, height: number): void {
        this._runtime?.resize(width, height);
    }

    /**
     * Set camera position, zoom, and rotation.
     */
    setCamera(config: CameraConfig): void {
        this._runtime?.setCamera(config);
    }

    /**
     * Get camera state.
     */
    getCamera(): CameraConfig {
        return this._runtime?.getCamera() ?? { x: 0, y: 0, zoom: 1, rotation: 0 };
    }

    /**
     * Set grid visibility.
     */
    setShowGrid(show: boolean): void {
        this._runtime?.setShowGrid(show);
    }

    /**
     * Set clear color (background color).
     */
    setClearColor(r: number, g: number, b: number, a: number = 1.0): void {
        this._runtime?.setClearColor(r, g, b, a);
    }

    /**
     * Set gizmo visibility.
     */
    setShowGizmos(show: boolean): void {
        this._runtime?.setShowGizmos(show);
    }

    /**
     * Get gizmo visibility.
     */
    getShowGizmos(): boolean {
        return this._runtime?.renderSystem?.getShowGizmos() ?? true;
    }

    /**
     * Set editor mode.
     * 设置编辑器模式。
     *
     * When false (runtime mode), editor-only UI like grid, gizmos,
     * and axis indicator are automatically hidden.
     * 当为 false（运行时模式）时，编辑器专用 UI 会自动隐藏。
     */
    setEditorMode(isEditor: boolean): void {
        this._runtime?.setEditorMode(isEditor);
    }

    /**
     * Get editor mode.
     * 获取编辑器模式。
     */
    isEditorMode(): boolean {
        return this._runtime?.isEditorMode() ?? true;
    }

    /**
     * Set UI canvas size for boundary display.
     */
    setUICanvasSize(width: number, height: number): void {
        this._runtime?.setUICanvasSize(width, height);
    }

    /**
     * Get UI canvas size.
     */
    getUICanvasSize(): { width: number; height: number } {
        return this._runtime?.getUICanvasSize() ?? { width: 0, height: 0 };
    }

    /**
     * Set UI canvas boundary visibility.
     */
    setShowUICanvasBoundary(show: boolean): void {
        this._runtime?.setShowUICanvasBoundary(show);
    }

    /**
     * Get UI canvas boundary visibility.
     */
    getShowUICanvasBoundary(): boolean {
        return this._runtime?.getShowUICanvasBoundary() ?? true;
    }

    // ===== Scene Snapshot API =====

    /**
     * Save a snapshot of the current scene state.
     */
    saveSceneSnapshot(): boolean {
        return this._runtime?.saveSceneSnapshot() ?? false;
    }

    /**
     * Restore scene state from saved snapshot.
     */
    async restoreSceneSnapshot(): Promise<boolean> {
        if (!this._runtime) return false;

        const success = await this._runtime.restoreSceneSnapshot();

        if (success) {
            // 清除 UI 渲染缓存
            invalidateUIRenderCaches();

            // 加载场景资源
            if (this._sceneResourceManager && this._runtime.scene) {
                await this._sceneResourceManager.loadSceneResources(this._runtime.scene);
            }

            // 同步 EntityStore
            const entityStore = Core.services.tryResolve(EntityStoreService);
            const messageHub = Core.services.tryResolve(MessageHub);
            if (entityStore && messageHub) {
                const selectedEntity = entityStore.getSelectedEntity();
                const selectedId = selectedEntity?.id;

                entityStore.syncFromScene();

                if (selectedId !== undefined) {
                    const newEntity = entityStore.getEntity(selectedId);
                    if (newEntity) {
                        entityStore.selectEntity(newEntity);
                    }
                }

                messageHub.publish('scene:restored', {});
            }
        }

        return success;
    }

    /**
     * Check if a snapshot exists.
     */
    hasSnapshot(): boolean {
        return this._runtime?.hasSnapshot() ?? false;
    }

    /**
     * Set selected entity IDs for gizmo display.
     */
    setSelectedEntityIds(ids: number[]): void {
        this._runtime?.setSelectedEntityIds(ids);
    }

    /**
     * Set transform tool mode.
     */
    setTransformMode(mode: 'select' | 'move' | 'rotate' | 'scale'): void {
        this._runtime?.setTransformMode(mode);
    }

    /**
     * Get transform tool mode.
     */
    getTransformMode(): 'select' | 'move' | 'rotate' | 'scale' {
        return this._runtime?.getTransformMode() ?? 'select';
    }

    // ===== Multi-viewport API =====

    /**
     * Register a new viewport.
     */
    registerViewport(id: string, canvasId: string): void {
        this._runtime?.registerViewport(id, canvasId);
    }

    /**
     * Unregister a viewport.
     */
    unregisterViewport(id: string): void {
        this._runtime?.unregisterViewport(id);
    }

    /**
     * Set the active viewport.
     */
    setActiveViewport(id: string): boolean {
        return this._runtime?.setActiveViewport(id) ?? false;
    }

    /**
     * Set camera for a specific viewport.
     */
    setViewportCamera(viewportId: string, config: CameraConfig): void {
        this._runtime?.bridge?.setViewportCamera(viewportId, config);
    }

    /**
     * Get camera for a specific viewport.
     */
    getViewportCamera(viewportId: string): CameraConfig | null {
        return this._runtime?.bridge?.getViewportCamera(viewportId) ?? null;
    }

    /**
     * Set viewport configuration.
     */
    setViewportConfig(viewportId: string, showGrid: boolean, showGizmos: boolean): void {
        this._runtime?.bridge?.setViewportConfig(viewportId, showGrid, showGizmos);
    }

    /**
     * Resize a specific viewport.
     */
    resizeViewport(viewportId: string, width: number, height: number): void {
        this._runtime?.bridge?.resizeViewport(viewportId, width, height);
    }

    /**
     * Render to a specific viewport.
     */
    renderToViewport(viewportId: string): void {
        this._runtime?.bridge?.renderToViewport(viewportId);
    }

    /**
     * Get all registered viewport IDs.
     */
    getViewportIds(): string[] {
        return this._runtime?.bridge?.getViewportIds() ?? [];
    }

    /**
     * Get the underlying GameRuntime instance.
     * 获取底层 GameRuntime 实例。
     */
    getRuntime(): GameRuntime | null {
        return this._runtime;
    }

    /**
     * Dispose engine resources.
     */
    dispose(): void {
        this.stop();

        if (this._assetManager) {
            this._assetManager.dispose();
            this._assetManager = null;
        }

        this._engineIntegration = null;

        if (this._runtime) {
            this._runtime.dispose();
            this._runtime = null;
        }

        this._initialized = false;
    }
}

export default EngineService;
