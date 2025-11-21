/**
 * Engine service for managing Rust engine lifecycle.
 * 管理Rust引擎生命周期的服务。
 */

import { EngineBridge, SpriteComponent, EngineRenderSystem, ITransformComponent } from '@esengine/ecs-engine-bindgen';
import { Core, Scene, Entity, Component, ECSComponent } from '@esengine/ecs-framework';
import * as esEngine from '@esengine/engine';

/**
 * Transform component for editor entities.
 * 编辑器实体的变换组件。
 */
@ECSComponent('Transform')
export class TransformComponent extends Component implements ITransformComponent {
    position = { x: 0, y: 0 };
    rotation = 0;
    scale = { x: 1, y: 1 };
}

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

            // Create ECS scene and set it via Core | 通过Core创建并设置ECS场景
            this.scene = new Scene({ name: 'EditorScene' });

            // Add render system | 添加渲染系统
            this.renderSystem = new EngineRenderSystem(this.bridge, TransformComponent);
            this.scene.addSystem(this.renderSystem);

            // Set scene via Core | 通过Core设置场景
            Core.setScene(this.scene);

            this.initialized = true;
            console.log('EngineService initialized | 引擎服务初始化完成');
        } catch (error) {
            console.error('Failed to initialize engine | 引擎初始化失败:', error);
            throw error;
        }
    }

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
     * Dispose engine resources.
     * 释放引擎资源。
     */
    dispose(): void {
        this.stop();

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
