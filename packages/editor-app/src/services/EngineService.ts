/**
 * Engine service for managing Rust engine lifecycle.
 * 管理Rust引擎生命周期的服务。
 */

import { EngineBridge, SpriteComponent as EngineSpriteComponent, EngineRenderSystem, CameraConfig } from '@esengine/ecs-engine-bindgen';
import { Core, Scene, Entity } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/ecs-components';
import * as esEngine from '@esengine/engine';

/**
 * Engine service singleton for editor integration.
 * 用于编辑器集成的引擎服务单例。
 */
export class EngineService {
    private static instance: EngineService | null = null;

    private bridge: EngineBridge | null = null;
    private scene: Scene | null = null;
    private renderSystem: EngineRenderSystem | null = null;
    private initialized = false;
    private running = false;
    private animationFrameId: number | null = null;
    private lastTime = 0;

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

            // Add render system to the scene | 将渲染系统添加到场景
            this.renderSystem = new EngineRenderSystem(this.bridge, TransformComponent);
            this.scene!.addSystem(this.renderSystem);

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

        // Update scene directly to ensure systems run
        // 直接更新scene以确保systems运行
        if (this.scene) {
            this.scene.update();
        }

        // Update via Core (handles deltaTime internally) | 通过Core更新
        Core.update(deltaTime);

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
        this.gameLoop();
    }

    /**
     * Stop the game loop.
     * 停止游戏循环。
     */
    stop(): void {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
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
        const sprite = new EngineSpriteComponent();
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
     * 加载纹理。
     */
    loadTexture(id: number, url: string): void {
        if (this.renderSystem) {
            this.renderSystem.loadTexture(id, url);
        }
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
     * Set selected entity IDs for gizmo display.
     * 设置选中的实体ID用于Gizmo显示。
     */
    setSelectedEntityIds(ids: number[]): void {
        if (this.renderSystem) {
            this.renderSystem.setSelectedEntityIds(ids);
        }
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
