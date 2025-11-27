/**
 * Engine service for managing Rust engine lifecycle.
 * 管理Rust引擎生命周期的服务。
 */

import { EngineBridge, EngineRenderSystem, GizmoDataProviderFn, HasGizmoProviderFn, CameraConfig, CameraSystem } from '@esengine/ecs-engine-bindgen';
import { GizmoRegistry, EntityStoreService, MessageHub, SceneManagerService, ProjectService, PluginManager, IPluginManager, type SystemContext } from '@esengine/editor-core';
import { Core, Scene, Entity, SceneSerializer, ComponentRegistry } from '@esengine/ecs-framework';
import { TransformComponent, SpriteComponent, SpriteAnimatorComponent, SpriteAnimatorSystem } from '@esengine/ecs-components';
import { TilemapComponent, TilemapRenderingSystem } from '@esengine/tilemap';
import { BehaviorTreeExecutionSystem } from '@esengine/behavior-tree';
import { UIRenderDataProvider, invalidateUIRenderCaches } from '@esengine/ui';
import * as esEngine from '@esengine/engine';
import {
    AssetManager,
    EngineIntegration,
    AssetPathResolver,
    AssetPlatform,
    globalPathResolver,
    SceneResourceManager
} from '@esengine/asset-system';
import { convertFileSrc } from '@tauri-apps/api/core';
import { IdGenerator } from '../utils/idGenerator';

/**
 * Engine service singleton for editor integration.
 * 用于编辑器集成的引擎服务单例。
 */
export class EngineService {
    private static instance: EngineService | null = null;

    private bridge: EngineBridge | null = null;
    private scene: Scene | null = null;
    private renderSystem: EngineRenderSystem | null = null;
    private cameraSystem: CameraSystem | null = null;
    private animatorSystem: SpriteAnimatorSystem | null = null;
    private tilemapSystem: TilemapRenderingSystem | null = null;
    private behaviorTreeSystem: BehaviorTreeExecutionSystem | null = null;
    private uiRenderProvider: UIRenderDataProvider | null = null;
    private initialized = false;
    private modulesInitialized = false;
    private running = false;
    private animationFrameId: number | null = null;
    private lastTime = 0;
    private sceneSnapshot: string | null = null;
    private assetManager: AssetManager | null = null;
    private engineIntegration: EngineIntegration | null = null;
    private sceneResourceManager: SceneResourceManager | null = null;
    private assetPathResolver: AssetPathResolver | null = null;
    private assetSystemInitialized = false;
    private initializationError: Error | null = null;
    private canvasId: string | null = null;

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
     * @param timeout 超时时间（毫秒），默认 10 秒
     */
    async waitForInitialization(timeout = 10000): Promise<boolean> {
        if (this.initialized) {
            return true;
        }

        const startTime = Date.now();
        while (!this.initialized && Date.now() - startTime < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return this.initialized;
    }

    /**
     * Initialize the engine with canvas.
     * 使用canvas初始化引擎。
     *
     * 注意：此方法只初始化引擎基础设施（Core、渲染系统等），
     * 模块的初始化需要在项目打开后调用 initializeModuleSystems()
     */
    async initialize(canvasId: string): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.canvasId = canvasId;

        try {
            // Create engine bridge | 创建引擎桥接
            this.bridge = new EngineBridge({
                canvasId
            });

            // Initialize WASM with pre-imported module | 使用预导入模块初始化WASM
            await this.bridge.initializeWithModule(esEngine);

            // Set path resolver for Tauri asset URLs | 设置Tauri资产URL的路径解析器
            this.bridge.setPathResolver((path: string) => {
                // If already a URL, return as-is
                if (path.startsWith('http://') ||
                    path.startsWith('https://') ||
                    path.startsWith('data:') ||
                    path.startsWith('asset://')) {
                    return path;
                }
                // Convert file path to Tauri asset URL
                return convertFileSrc(path);
            });

            // Initialize Core if not already | 初始化Core（如果尚未初始化）
            if (!Core.scene) {
                Core.create({ debug: false });
            }

            // 使用现有 Core 场景或创建新的
            if (Core.scene) {
                this.scene = Core.scene as Scene;
            } else {
                this.scene = new Scene({ name: 'EditorScene' });
                Core.setScene(this.scene);
            }

            // Add camera system (基础系统，始终需要)
            this.cameraSystem = new CameraSystem(this.bridge);
            this.scene.addSystem(this.cameraSystem);

            // Add render system to the scene (基础系统，始终需要)
            this.renderSystem = new EngineRenderSystem(this.bridge, TransformComponent);
            this.scene.addSystem(this.renderSystem);

            // Inject GizmoRegistry into render system
            this.renderSystem.setGizmoRegistry(
                ((component, entity, isSelected) =>
                    GizmoRegistry.getGizmoData(component, entity, isSelected)) as GizmoDataProviderFn,
                ((component) =>
                    GizmoRegistry.hasProvider(component.constructor as any)) as HasGizmoProviderFn
            );

            // Set initial UI canvas size (will be updated from ProjectService when project opens)
            // 设置初始 UI 画布尺寸（项目打开后会从 ProjectService 更新为项目配置的分辨率）
            this.renderSystem.setUICanvasSize(1920, 1080);

            // Initialize asset system | 初始化资产系统
            await this.initializeAssetSystem();

            // Start the default world to enable system updates
            // 启动默认world以启用系统更新
            const defaultWorld = Core.worldManager.getWorld('__default__');
            if (defaultWorld && !defaultWorld.isActive) {
                defaultWorld.start();
            }

            this.initialized = true;

            // Sync viewport size immediately after initialization
            // 初始化后立即同步视口尺寸
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
            if (canvas && canvas.parentElement) {
                // Get container size in CSS pixels
                // 获取容器尺寸（CSS像素）
                const rect = canvas.parentElement.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                // Canvas internal size uses DPR for sharpness
                // Canvas内部尺寸使用DPR以保持清晰
                canvas.width = Math.floor(rect.width * dpr);
                canvas.height = Math.floor(rect.height * dpr);
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;

                // Camera uses actual canvas pixels for correct rendering
                // 相机使用实际canvas像素以保证正确渲染
                this.bridge.resize(canvas.width, canvas.height);
            }

            // Auto-start render loop for editor preview | 自动启动渲染循环用于编辑器预览
            this.startRenderLoop();
        } catch (error) {
            console.error('Failed to initialize engine | 引擎初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化模块系统
     * Initialize module systems for all enabled plugins
     *
     * 通过 PluginManager 初始化所有插件的运行时模块
     * Initialize all plugin runtime modules via PluginManager
     */
    async initializeModuleSystems(): Promise<void> {
        if (!this.initialized) {
            console.error('Engine not initialized. Call initialize() first.');
            return;
        }

        if (!this.scene || !this.renderSystem || !this.bridge) {
            console.error('Scene or render system not available.');
            return;
        }

        // 如果之前已经初始化过模块，先清理
        if (this.modulesInitialized) {
            this.clearModuleSystems();
        }

        // 获取 PluginManager
        const pluginManager = Core.services.tryResolve<PluginManager>(IPluginManager);
        if (!pluginManager) {
            console.error('PluginManager not available.');
            return;
        }

        // 初始化所有插件的运行时模块（注册组件和服务）
        // Initialize all plugin runtime modules (register components and services)
        await pluginManager.initializeRuntime(Core.services);

        // 创建系统上下文
        // Create system context
        const context: SystemContext = {
            core: Core,
            engineBridge: this.bridge,
            renderSystem: this.renderSystem,
            isEditor: true
        };

        // 让插件为场景创建系统
        // Let plugins create systems for scene
        pluginManager.createSystemsForScene(this.scene, context);

        // 保存插件创建的系统引用
        // Save system references created by plugins
        this.animatorSystem = context.animatorSystem as SpriteAnimatorSystem | undefined ?? null;
        this.tilemapSystem = context.tilemapSystem as TilemapRenderingSystem | undefined ?? null;
        this.behaviorTreeSystem = context.behaviorTreeSystem as BehaviorTreeExecutionSystem | undefined ?? null;
        this.uiRenderProvider = context.uiRenderProvider as UIRenderDataProvider | undefined ?? null;

        // 设置 UI 渲染数据提供者到 EngineRenderSystem
        // Set UI render data provider to EngineRenderSystem
        if (this.uiRenderProvider && this.renderSystem) {
            this.renderSystem.setUIRenderDataProvider(this.uiRenderProvider);
        }

        // 在编辑器模式下，动画和行为树系统默认禁用
        // In editor mode, animation and behavior tree systems are disabled by default
        if (this.animatorSystem) {
            this.animatorSystem.enabled = false;
        }
        if (this.behaviorTreeSystem) {
            this.behaviorTreeSystem.enabled = false;
        }

        this.modulesInitialized = true;
    }

    /**
     * 清理模块系统
     * 用于项目关闭或切换时
     * Clear module systems, used when project closes or switches
     */
    clearModuleSystems(): void {
        // 通过 PluginManager 清理场景系统
        // Clear scene systems via PluginManager
        const pluginManager = Core.services.tryResolve<PluginManager>(IPluginManager);
        if (pluginManager) {
            pluginManager.clearSceneSystems();
        }

        // 清空本地引用（系统的实际清理由场景管理）
        // Clear local references (actual system cleanup is managed by scene)
        this.animatorSystem = null;
        this.tilemapSystem = null;
        this.behaviorTreeSystem = null;
        this.uiRenderProvider = null;
        this.modulesInitialized = false;
    }

    /**
     * 检查模块系统是否已初始化
     */
    isModulesInitialized(): boolean {
        return this.modulesInitialized;
    }

    /**
     * Start render loop (editor preview mode).
     * 启动渲染循环（编辑器预览模式）。
     */
    private startRenderLoop(): void {
        if (this.animationFrameId !== null) {
            return;
        }
        this.lastTime = performance.now();
        this.renderLoop();
    }

    private frameCount = 0;

    /**
     * Render loop for editor preview (always runs).
     * 编辑器预览的渲染循环（始终运行）。
     */
    private renderLoop = (): void => {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.frameCount++;

        // Update via Core (handles deltaTime internally) | 通过Core更新
        Core.update(deltaTime);

        // Note: Rendering is handled by EngineRenderSystem.process()
        // Texture loading is handled automatically via Rust engine's path-based loading
        // 注意：渲染由 EngineRenderSystem.process() 处理
        // 纹理加载由Rust引擎的路径加载自动处理

        this.animationFrameId = requestAnimationFrame(this.renderLoop);
    };

    /**
     * Check if engine is initialized.
     * 检查引擎是否已初始化。
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Check if engine is running.
     * 检查引擎是否正在运行。
     */
    isRunning(): boolean {
        return this.running;
    }

    /**
     * Start the game loop.
     * 启动游戏循环。
     */
    start(): void {
        if (!this.initialized || this.running) {
            return;
        }

        this.running = true;
        this.lastTime = performance.now();

        // Enable preview mode for UI rendering (screen space overlay)
        // 启用预览模式用于 UI 渲染（屏幕空间叠加）
        if (this.renderSystem) {
            this.renderSystem.setPreviewMode(true);
        }

        // Enable animator system and start auto-play animations
        // 启用动画系统并启动自动播放的动画
        if (this.animatorSystem) {
            this.animatorSystem.enabled = true;
        }
        // Enable behavior tree system for preview
        // 启用行为树系统用于预览
        if (this.behaviorTreeSystem) {
            this.behaviorTreeSystem.enabled = true;
        }
        this.startAutoPlayAnimations();

        this.gameLoop();
    }

    /**
     * Start all auto-play animations.
     * 启动所有自动播放的动画。
     */
    private startAutoPlayAnimations(): void {
        if (!this.scene) return;

        const entities = this.scene.entities.findEntitiesWithComponent(SpriteAnimatorComponent);
        for (const entity of entities) {
            const animator = entity.getComponent(SpriteAnimatorComponent);
            if (animator && animator.autoPlay && animator.defaultAnimation) {
                animator.play();
            }
        }
    }

    /**
     * Stop all animations and reset to first frame.
     * 停止所有动画并重置到第一帧。
     */
    private stopAllAnimations(): void {
        if (!this.scene) return;

        const entities = this.scene.entities.findEntitiesWithComponent(SpriteAnimatorComponent);
        for (const entity of entities) {
            const animator = entity.getComponent(SpriteAnimatorComponent);
            if (animator) {
                animator.stop();

                // Reset sprite texture to first frame
                // 重置精灵纹理到第一帧
                const sprite = entity.getComponent(SpriteComponent);
                if (sprite && animator.clips && animator.clips.length > 0) {
                    const firstClip = animator.clips[0];
                    if (firstClip && firstClip.frames && firstClip.frames.length > 0) {
                        const firstFrame = firstClip.frames[0];
                        if (firstFrame && firstFrame.texture) {
                            sprite.texture = firstFrame.texture;
                        }
                    }
                }
            }
        }
    }

    /**
     * Stop the game loop.
     * 停止游戏循环。
     */
    stop(): void {
        this.running = false;

        // Disable preview mode for UI rendering (back to world space)
        // 禁用预览模式用于 UI 渲染（返回世界空间）
        if (this.renderSystem) {
            this.renderSystem.setPreviewMode(false);
        }

        // Disable animator system and stop all animations
        // 禁用动画系统并停止所有动画
        if (this.animatorSystem) {
            this.animatorSystem.enabled = false;
        }
        // Disable behavior tree system
        // 禁用行为树系统
        if (this.behaviorTreeSystem) {
            this.behaviorTreeSystem.enabled = false;
        }
        this.stopAllAnimations();

        // Note: Don't cancel animationFrameId here, as renderLoop should keep running
        // for editor preview. The renderLoop will continue but gameLoop will stop
        // because this.running is false.
        // 注意：这里不要取消 animationFrameId，因为 renderLoop 应该继续运行
        // 用于编辑器预览。renderLoop 会继续运行，但 gameLoop 会停止
        // 因为 this.running 是 false。
    }

    /**
     * Main game loop.
     * 主游戏循环。
     */
    private gameLoop = (): void => {
        if (!this.running) {
            return;
        }

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update via Core | 通过Core更新
        Core.update(deltaTime);

        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    /**
     * Create entity with sprite and transform.
     * 创建带精灵和变换的实体。
     */
    createSpriteEntity(name: string, options?: {
        x?: number;
        y?: number;
        textureId?: number;
        width?: number;
        height?: number;
    }): Entity | null {
        if (!this.scene) {
            return null;
        }

        const entity = this.scene.createEntity(name);

        // Add transform | 添加变换组件
        const transform = new TransformComponent();
        if (options) {
            transform.position.x = options.x ?? 0;
            transform.position.y = options.y ?? 0;
        }
        entity.addComponent(transform);

        // Add sprite | 添加精灵组件
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
     * Initialize asset system
     * 初始化资产系统
     */
    private async initializeAssetSystem(): Promise<void> {
        try {
            // 创建资产管理器 / Create asset manager
            this.assetManager = new AssetManager();

            // 创建路径解析器 / Create path resolver
            const pathTransformerFn = (path: string) => {
                // 编辑器平台使用Tauri的convertFileSrc
                // Use Tauri's convertFileSrc for editor platform
                if (!path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('data:') && !path.startsWith('asset://')) {
                    // 如果是相对路径，需要先转换为绝对路径
                    // If it's a relative path, convert to absolute path first
                    if (!path.startsWith('/') && !path.match(/^[a-zA-Z]:/)) {
                        const projectService = Core.services.tryResolve<ProjectService>(ProjectService);
                        if (projectService && projectService.isProjectOpen()) {
                            const projectInfo = projectService.getCurrentProject();
                            if (projectInfo) {
                                const projectPath = projectInfo.path;
                                // 规范化路径分隔符 / Normalize path separators
                                const separator = projectPath.includes('\\') ? '\\' : '/';
                                path = `${projectPath}${separator}${path.replace(/\//g, separator)}`;
                            }
                        }
                    }
                    return convertFileSrc(path);
                }
                return path;
            };

            this.assetPathResolver = new AssetPathResolver({
                platform: AssetPlatform.Editor,
                pathTransformer: pathTransformerFn
            });

            // 配置全局路径解析器，供组件使用
            // Configure global path resolver for components to use
            globalPathResolver.updateConfig({
                platform: AssetPlatform.Editor,
                pathTransformer: pathTransformerFn
            });

            // 创建引擎集成 / Create engine integration
            if (this.bridge) {
                this.engineIntegration = new EngineIntegration(this.assetManager, this.bridge);

                // 创建场景资源管理器 / Create scene resource manager
                this.sceneResourceManager = new SceneResourceManager();
                this.sceneResourceManager.setResourceLoader(this.engineIntegration);

                // 将 SceneResourceManager 设置到 SceneManagerService
                // Set SceneResourceManager to SceneManagerService
                const sceneManagerService = Core.services.tryResolve<SceneManagerService>(SceneManagerService);
                if (sceneManagerService) {
                    sceneManagerService.setSceneResourceManager(this.sceneResourceManager);
                }
            }

            this.assetSystemInitialized = true;
            this.initializationError = null;
        } catch (error) {
            this.assetSystemInitialized = false;
            this.initializationError = error instanceof Error ? error : new Error(String(error));
            console.error('Failed to initialize asset system:', error);

            // Notify user of failure
            const messageHub = Core.services.tryResolve<MessageHub>(MessageHub);
            if (messageHub) {
                messageHub.publish('notification:error', {
                    title: 'Asset System Error',
                    message: 'Failed to initialize asset system. Some features may not work properly.'
                });
            }

            throw this.initializationError;
        }
    }

    /**
     * Load texture.
     * 加载纹理。
     */
    loadTexture(id: number, url: string): void {
        if (this.renderSystem) {
            this.renderSystem.loadTexture(id, url);
        }
    }

    /**
     * Load texture through asset system
     * 通过资产系统加载纹理
     */
    async loadTextureAsset(path: string): Promise<number> {
        // Check if asset system is properly initialized
        if (!this.assetSystemInitialized || this.initializationError) {
            console.warn('Asset system not initialized, using fallback texture loading');
            const textureId = IdGenerator.nextId('texture-fallback');
            this.loadTexture(textureId, path);
            return textureId;
        }

        if (!this.engineIntegration) {
            // 回退到直接加载 / Fallback to direct loading
            const textureId = IdGenerator.nextId('texture');
            this.loadTexture(textureId, path);
            return textureId;
        }

        try {
            return await this.engineIntegration.loadTextureForComponent(path);
        } catch (error) {
            console.error('Failed to load texture asset:', error);
            // Return a valid fallback ID instead of 0
            const fallbackId = IdGenerator.nextId('texture-fallback');

            // Notify about texture loading failure
            const messageHub = Core.services.tryResolve<MessageHub>(MessageHub);
            if (messageHub) {
                messageHub.publish('notification:warning', {
                    title: 'Texture Loading Failed',
                    message: `Could not load texture: ${path}`
                });
            }

            return fallbackId;
        }
    }

    /**
     * Get asset manager
     * 获取资产管理器
     */
    getAssetManager(): AssetManager | null {
        return this.assetManager;
    }

    /**
     * Get engine integration
     * 获取引擎集成
     */
    getEngineIntegration(): EngineIntegration | null {
        return this.engineIntegration;
    }

    /**
     * Get asset path resolver
     * 获取资产路径解析器
     */
    getAssetPathResolver(): AssetPathResolver | null {
        return this.assetPathResolver;
    }

    /**
     * Get engine statistics.
     * 获取引擎统计信息。
     */
    getStats(): { fps: number; drawCalls: number; spriteCount: number } {
        if (!this.renderSystem) {
            return { fps: 0, drawCalls: 0, spriteCount: 0 };
        }

        const engineStats = this.renderSystem.getStats();
        return {
            fps: engineStats?.fps ?? 0,
            drawCalls: engineStats?.drawCalls ?? 0,
            spriteCount: this.renderSystem.spriteCount
        };
    }

    /**
     * Get the ECS scene.
     * 获取ECS场景。
     */
    getScene(): Scene | null {
        return this.scene;
    }

    /**
     * Enable animation preview in editor mode.
     * 在编辑器模式下启用动画预览。
     */
    enableAnimationPreview(): void {
        if (this.animatorSystem && !this.running) {
            // Clear entity cache to force re-query when enabled
            // 清除实体缓存以便启用时强制重新查询
            this.animatorSystem.clearEntityCache();
            this.animatorSystem.enabled = true;
        }
    }

    /**
     * Disable animation preview in editor mode.
     * 在编辑器模式下禁用动画预览。
     */
    disableAnimationPreview(): void {
        if (this.animatorSystem && !this.running) {
            this.animatorSystem.enabled = false;
        }
    }

    /**
     * Check if animation preview is enabled.
     * 检查动画预览是否启用。
     */
    isAnimationPreviewEnabled(): boolean {
        return this.animatorSystem?.enabled ?? false;
    }

    /**
     * Get the engine bridge.
     * 获取引擎桥接。
     */
    getBridge(): EngineBridge | null {
        return this.bridge;
    }

    /**
     * Resize the engine viewport.
     * 调整引擎视口大小。
     */
    resize(width: number, height: number): void {
        if (this.bridge) {
            this.bridge.resize(width, height);
        }
    }

    /**
     * Set camera position, zoom, and rotation.
     * 设置相机位置、缩放和旋转。
     */
    setCamera(config: CameraConfig): void {
        if (this.bridge) {
            this.bridge.setCamera(config);
        }
    }

    /**
     * Get camera state.
     * 获取相机状态。
     */
    getCamera(): CameraConfig {
        if (this.bridge) {
            return this.bridge.getCamera();
        }
        return { x: 0, y: 0, zoom: 1, rotation: 0 };
    }

    /**
     * Set grid visibility.
     * 设置网格可见性。
     */
    setShowGrid(show: boolean): void {
        if (this.bridge) {
            this.bridge.setShowGrid(show);
        }
    }

    /**
     * Set clear color (background color).
     * 设置清除颜色（背景颜色）。
     */
    setClearColor(r: number, g: number, b: number, a: number = 1.0): void {
        if (this.bridge) {
            this.bridge.setClearColor(r, g, b, a);
        }
    }

    /**
     * Set gizmo visibility.
     * 设置Gizmo可见性。
     */
    setShowGizmos(show: boolean): void {
        if (this.renderSystem) {
            this.renderSystem.setShowGizmos(show);
        }
    }

    /**
     * Get gizmo visibility.
     * 获取Gizmo可见性。
     */
    getShowGizmos(): boolean {
        return this.renderSystem?.getShowGizmos() ?? true;
    }

    /**
     * Set UI canvas size for boundary display.
     * 设置 UI 画布尺寸以显示边界。
     */
    setUICanvasSize(width: number, height: number): void {
        if (this.renderSystem) {
            this.renderSystem.setUICanvasSize(width, height);
        }
    }

    /**
     * Get UI canvas size.
     * 获取 UI 画布尺寸。
     */
    getUICanvasSize(): { width: number; height: number } {
        return this.renderSystem?.getUICanvasSize() ?? { width: 0, height: 0 };
    }

    /**
     * Set UI canvas boundary visibility.
     * 设置 UI 画布边界可见性。
     */
    setShowUICanvasBoundary(show: boolean): void {
        if (this.renderSystem) {
            this.renderSystem.setShowUICanvasBoundary(show);
        }
    }

    /**
     * Get UI canvas boundary visibility.
     * 获取 UI 画布边界可见性。
     */
    getShowUICanvasBoundary(): boolean {
        return this.renderSystem?.getShowUICanvasBoundary() ?? true;
    }

    // ===== Scene Snapshot API =====
    // ===== 场景快照 API =====

    /**
     * Save a snapshot of the current scene state.
     * 保存当前场景状态的快照。
     */
    saveSceneSnapshot(): boolean {
        if (!this.scene) {
            console.warn('Cannot save snapshot: no scene available');
            return false;
        }

        try {
            // Use SceneSerializer from core library
            this.sceneSnapshot = SceneSerializer.serialize(this.scene, {
                format: 'json',
                pretty: false,
                includeMetadata: false
            }) as string;

            return true;
        } catch (error) {
            console.error('Failed to save scene snapshot:', error);
            return false;
        }
    }

    /**
     * Restore scene state from saved snapshot.
     * 从保存的快照恢复场景状态。
     */
    async restoreSceneSnapshot(): Promise<boolean> {
        if (!this.scene || !this.sceneSnapshot) {
            console.warn('Cannot restore snapshot: no scene or snapshot available');
            return false;
        }

        try {
            // Clear tilemap rendering cache before restoring
            // 恢复前清除瓦片地图渲染缓存
            if (this.tilemapSystem) {
                this.tilemapSystem.clearCache();
            }

            // Clear UI render caches before restoring
            // 恢复前清除 UI 渲染缓存
            invalidateUIRenderCaches();

            // Use SceneSerializer from core library
            SceneSerializer.deserialize(this.scene, this.sceneSnapshot, {
                strategy: 'replace',
                preserveIds: true
            });

            // 加载场景资源 / Load scene resources
            if (this.sceneResourceManager) {
                await this.sceneResourceManager.loadSceneResources(this.scene);
            } else {
                console.warn('[EngineService] SceneResourceManager not available, skipping resource loading');
            }

            // Sync EntityStore with restored scene entities
            const entityStore = Core.services.tryResolve(EntityStoreService);
            const messageHub = Core.services.tryResolve(MessageHub);
            if (entityStore && messageHub) {
                // Remember selected entity ID before clearing
                const selectedEntity = entityStore.getSelectedEntity();
                const selectedId = selectedEntity?.id;

                // Clear old entities from store
                entityStore.clear();

                // Add restored entities to store
                for (const entity of this.scene.entities.buffer) {
                    entityStore.addEntity(entity);
                }

                // Re-select the same entity (now with new reference)
                if (selectedId !== undefined) {
                    const newEntity = entityStore.getEntity(selectedId);
                    if (newEntity) {
                        entityStore.selectEntity(newEntity);
                    }
                }

                // Notify UI to refresh
                messageHub.publish('scene:restored', {});
            }

            this.sceneSnapshot = null;
            return true;
        } catch (error) {
            console.error('Failed to restore scene snapshot:', error);
            return false;
        }
    }

    /**
     * Check if a snapshot exists.
     * 检查是否存在快照。
     */
    hasSnapshot(): boolean {
        return this.sceneSnapshot !== null;
    }

    /**
     * Set selected entity IDs for gizmo display.
     * 设置选中的实体ID用于Gizmo显示。
     */
    setSelectedEntityIds(ids: number[]): void {
        if (this.renderSystem) {
            this.renderSystem.setSelectedEntityIds(ids);
        }
    }

    /**
     * Set transform tool mode.
     * 设置变换工具模式。
     */
    setTransformMode(mode: 'select' | 'move' | 'rotate' | 'scale'): void {
        if (this.renderSystem) {
            this.renderSystem.setTransformMode(mode);
        }
    }

    /**
     * Get transform tool mode.
     * 获取变换工具模式。
     */
    getTransformMode(): 'select' | 'move' | 'rotate' | 'scale' {
        return this.renderSystem?.getTransformMode() ?? 'select';
    }

    // ===== Multi-viewport API =====
    // ===== 多视口 API =====

    /**
     * Register a new viewport.
     * 注册新视口。
     */
    registerViewport(id: string, canvasId: string): void {
        if (this.bridge) {
            this.bridge.registerViewport(id, canvasId);
        }
    }

    /**
     * Unregister a viewport.
     * 注销视口。
     */
    unregisterViewport(id: string): void {
        if (this.bridge) {
            this.bridge.unregisterViewport(id);
        }
    }

    /**
     * Set the active viewport.
     * 设置活动视口。
     */
    setActiveViewport(id: string): boolean {
        if (this.bridge) {
            return this.bridge.setActiveViewport(id);
        }
        return false;
    }

    /**
     * Set camera for a specific viewport.
     * 为特定视口设置相机。
     */
    setViewportCamera(viewportId: string, config: CameraConfig): void {
        if (this.bridge) {
            this.bridge.setViewportCamera(viewportId, config);
        }
    }

    /**
     * Get camera for a specific viewport.
     * 获取特定视口的相机。
     */
    getViewportCamera(viewportId: string): CameraConfig | null {
        if (this.bridge) {
            return this.bridge.getViewportCamera(viewportId);
        }
        return null;
    }

    /**
     * Set viewport configuration.
     * 设置视口配置。
     */
    setViewportConfig(viewportId: string, showGrid: boolean, showGizmos: boolean): void {
        if (this.bridge) {
            this.bridge.setViewportConfig(viewportId, showGrid, showGizmos);
        }
    }

    /**
     * Resize a specific viewport.
     * 调整特定视口大小。
     */
    resizeViewport(viewportId: string, width: number, height: number): void {
        if (this.bridge) {
            this.bridge.resizeViewport(viewportId, width, height);
        }
    }

    /**
     * Render to a specific viewport.
     * 渲染到特定视口。
     */
    renderToViewport(viewportId: string): void {
        if (this.bridge) {
            this.bridge.renderToViewport(viewportId);
        }
    }

    /**
     * Get all registered viewport IDs.
     * 获取所有已注册的视口ID。
     */
    getViewportIds(): string[] {
        if (this.bridge) {
            return this.bridge.getViewportIds();
        }
        return [];
    }

    /**
     * Dispose engine resources.
     * 释放引擎资源。
     */
    dispose(): void {
        this.stop();

        // Stop render loop | 停止渲染循环
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Dispose asset system | 释放资产系统
        if (this.assetManager) {
            this.assetManager.dispose();
            this.assetManager = null;
        }
        this.engineIntegration = null;

        // Scene doesn't have a destroy method, just clear reference
        // 场景没有destroy方法，只需清除引用
        this.scene = null;

        if (this.bridge) {
            this.bridge.dispose();
            this.bridge = null;
        }

        this.renderSystem = null;
        this.initialized = false;
    }
}

export default EngineService;
