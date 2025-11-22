/**
 * Engine service for managing Rust engine lifecycle.
 * 管理Rust引擎生命周期的服务。
 */

import { EngineBridge, EngineRenderSystem, CameraConfig } from '@esengine/ecs-engine-bindgen';
import { Core, Scene, Entity, SceneSerializer } from '@esengine/ecs-framework';
import { TransformComponent, SpriteComponent, SpriteAnimatorSystem, SpriteAnimatorComponent } from '@esengine/ecs-components';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import * as esEngine from '@esengine/engine';
import { AssetManager, EngineIntegration, AssetPathResolver, AssetPlatform } from '@esengine/asset-system';
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
    private animatorSystem: SpriteAnimatorSystem | null = null;
    private initialized = false;
    private running = false;
    private animationFrameId: number | null = null;
    private lastTime = 0;
    private sceneSnapshot: string | null = null;
    private assetManager: AssetManager | null = null;
    private engineIntegration: EngineIntegration | null = null;
    private assetPathResolver: AssetPathResolver | null = null;
    private assetSystemInitialized = false;
    private initializationError: Error | null = null;

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
     * Initialize the engine with canvas.
     * 使用canvas初始化引擎。
     */
    async initialize(canvasId: string): Promise<void> {
        if (this.initialized) {
            return;
        }

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

            // Use existing Core scene or create new one | 使用现有Core场景或创建新的
            if (Core.scene) {
                this.scene = Core.scene as Scene;
            } else {
                this.scene = new Scene({ name: 'EditorScene' });
                Core.setScene(this.scene);
            }

            // Add sprite animator system (disabled by default in editor mode)
            // 添加精灵动画系统（编辑器模式下默认禁用）
            this.animatorSystem = new SpriteAnimatorSystem();
            this.animatorSystem.enabled = false;
            this.scene!.addSystem(this.animatorSystem);

            // Add render system to the scene | 将渲染系统添加到场景
            this.renderSystem = new EngineRenderSystem(this.bridge, TransformComponent);
            this.scene!.addSystem(this.renderSystem);

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

        // Enable animator system and start auto-play animations
        // 启用动画系统并启动自动播放的动画
        if (this.animatorSystem) {
            this.animatorSystem.enabled = true;
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

        // Disable animator system and stop all animations
        // 禁用动画系统并停止所有动画
        if (this.animatorSystem) {
            this.animatorSystem.enabled = false;
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
            this.assetPathResolver = new AssetPathResolver({
                platform: AssetPlatform.Editor,
                pathTransformer: (path: string) => {
                    // 编辑器平台使用Tauri的convertFileSrc
                    // Use Tauri's convertFileSrc for editor platform
                    if (!path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('data:')) {
                        return convertFileSrc(path);
                    }
                    return path;
                }
            });

            // 创建引擎集成 / Create engine integration
            if (this.bridge) {
                this.engineIntegration = new EngineIntegration(this.assetManager, this.bridge);
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
    restoreSceneSnapshot(): boolean {
        if (!this.scene || !this.sceneSnapshot) {
            console.warn('Cannot restore snapshot: no scene or snapshot available');
            return false;
        }

        try {
            // Use SceneSerializer from core library
            SceneSerializer.deserialize(this.scene, this.sceneSnapshot, {
                strategy: 'replace',
                preserveIds: true
            });

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
