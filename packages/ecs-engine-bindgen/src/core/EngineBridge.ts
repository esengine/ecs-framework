/**
 * Main bridge between TypeScript ECS and Rust Engine.
 * TypeScript ECS与Rust引擎之间的主桥接层。
 */

import type { SpriteRenderData, TextureLoadRequest, EngineStats, CameraConfig } from '../types';
import type { IEngineBridge } from '@esengine/asset-system';
import type { GameEngine } from '@esengine/engine';

/**
 * Engine bridge configuration.
 * 引擎桥接配置。
 */
export interface EngineBridgeConfig {
    /** Canvas element ID. | Canvas元素ID。 */
    canvasId: string;
    /** Initial canvas width. | 初始画布宽度。 */
    width?: number;
    /** Initial canvas height. | 初始画布高度。 */
    height?: number;
    /** Maximum sprites per batch. | 每批次最大精灵数。 */
    maxSprites?: number;
    /** Enable debug mode. | 启用调试模式。 */
    debug?: boolean;
}

/**
 * Bridge for communication between ECS Framework and Rust Engine.
 * ECS框架与Rust引擎之间的通信桥接。
 *
 * This class manages data transfer between the TypeScript ECS layer
 * and the WebAssembly-based Rust rendering engine.
 * 此类管理TypeScript ECS层与基于WebAssembly的Rust渲染引擎之间的数据传输。
 *
 * @example
 * ```typescript
 * const bridge = new EngineBridge({ canvasId: 'game-canvas' });
 * await bridge.initialize();
 *
 * // In game loop | 在游戏循环中
 * bridge.clear(0, 0, 0, 1);
 * bridge.submitSprites(spriteDataArray);
 * bridge.render();
 * ```
 */
export class EngineBridge implements IEngineBridge {
    private engine: GameEngine | null = null;
    private config: Required<EngineBridgeConfig>;
    private initialized = false;

    // Pre-allocated typed arrays for batch submission
    // 预分配的类型数组用于批量提交
    private transformBuffer: Float32Array;
    private textureIdBuffer: Uint32Array;
    private uvBuffer: Float32Array;
    private colorBuffer: Uint32Array;

    // Statistics | 统计信息
    private stats: EngineStats = {
        fps: 0,
        drawCalls: 0,
        spriteCount: 0,
        frameTime: 0
    };

    private lastFrameTime = 0;
    private frameCount = 0;
    private fpsAccumulator = 0;
    private debugLogged = false;

    /**
     * Create a new engine bridge.
     * 创建新的引擎桥接。
     *
     * @param config - Bridge configuration | 桥接配置
     */
    constructor(config: EngineBridgeConfig) {
        this.config = {
            canvasId: config.canvasId,
            width: config.width ?? 800,
            height: config.height ?? 600,
            maxSprites: config.maxSprites ?? 10000,
            debug: config.debug ?? false
        };

        // Pre-allocate buffers | 预分配缓冲区
        const maxSprites = this.config.maxSprites;
        this.transformBuffer = new Float32Array(maxSprites * 7); // x, y, rot, sx, sy, ox, oy
        this.textureIdBuffer = new Uint32Array(maxSprites);
        this.uvBuffer = new Float32Array(maxSprites * 4); // u0, v0, u1, v1
        this.colorBuffer = new Uint32Array(maxSprites);
    }

    /**
     * Initialize the engine bridge with WASM module.
     * 使用WASM模块初始化引擎桥接。
     *
     * @param wasmModule - Pre-imported WASM module | 预导入的WASM模块
     */
    async initializeWithModule(wasmModule: any): Promise<void> {
        if (this.initialized) {
            console.warn('EngineBridge already initialized | EngineBridge已初始化');
            return;
        }

        try {
            // Initialize WASM | 初始化WASM
            if (wasmModule.default) {
                await wasmModule.default();
            }

            // Create engine instance | 创建引擎实例
            this.engine = new wasmModule.GameEngine(this.config.canvasId);
            this.initialized = true;

            if (this.config.debug) {
                console.log('EngineBridge initialized | EngineBridge初始化完成');
            }
        } catch (error) {
            throw new Error(`Failed to initialize engine: ${error} | 引擎初始化失败: ${error}`);
        }
    }

    /**
     * Initialize the engine bridge.
     * 初始化引擎桥接。
     *
     * Loads the WASM module and creates the engine instance.
     * 加载WASM模块并创建引擎实例。
     *
     * @param wasmPath - Path to WASM package | WASM包路径
     * @deprecated Use initializeWithModule instead | 请使用 initializeWithModule 代替
     */
    async initialize(wasmPath = '@esengine/engine'): Promise<void> {
        if (this.initialized) {
            console.warn('EngineBridge already initialized | EngineBridge已初始化');
            return;
        }

        try {
            // Dynamic import of WASM module | 动态导入WASM模块
            const wasmModule = await import(/* @vite-ignore */ wasmPath);
            await this.initializeWithModule(wasmModule);
        } catch (error) {
            throw new Error(`Failed to initialize engine: ${error} | 引擎初始化失败: ${error}`);
        }
    }

    /**
     * Check if bridge is initialized.
     * 检查桥接是否已初始化。
     */
    get isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get canvas width.
     * 获取画布宽度。
     */
    get width(): number {
        return this.engine?.width ?? 0;
    }

    /**
     * Get canvas height.
     * 获取画布高度。
     */
    get height(): number {
        return this.engine?.height ?? 0;
    }

    /**
     * Get engine instance (throws if not initialized)
     * 获取引擎实例（未初始化时抛出异常）
     */
    private getEngine(): GameEngine {
        if (!this.engine) {
            throw new Error('Engine not initialized. Call initialize() first.');
        }
        return this.engine;
    }

    /**
     * Clear the screen.
     * 清除屏幕。
     *
     * @param r - Red (0-1) | 红色
     * @param g - Green (0-1) | 绿色
     * @param b - Blue (0-1) | 蓝色
     * @param a - Alpha (0-1) | 透明度
     */
    clear(r: number, g: number, b: number, a: number): void {
        if (!this.initialized) return;
        this.getEngine().clear(r, g, b, a);
    }

    /**
     * Submit sprite data for rendering.
     * 提交精灵数据进行渲染。
     *
     * @param sprites - Array of sprite render data | 精灵渲染数据数组
     */
    submitSprites(sprites: SpriteRenderData[]): void {
        if (!this.initialized || sprites.length === 0) return;

        const count = Math.min(sprites.length, this.config.maxSprites);

        // Fill typed arrays | 填充类型数组
        for (let i = 0; i < count; i++) {
            const sprite = sprites[i];
            const tOffset = i * 7;
            const uvOffset = i * 4;

            // Transform data | 变换数据
            this.transformBuffer[tOffset] = sprite.x;
            this.transformBuffer[tOffset + 1] = sprite.y;
            this.transformBuffer[tOffset + 2] = sprite.rotation;
            this.transformBuffer[tOffset + 3] = sprite.scaleX;
            this.transformBuffer[tOffset + 4] = sprite.scaleY;
            this.transformBuffer[tOffset + 5] = sprite.originX;
            this.transformBuffer[tOffset + 6] = sprite.originY;

            // Texture ID | 纹理ID
            this.textureIdBuffer[i] = sprite.textureId;

            // UV coordinates | UV坐标
            this.uvBuffer[uvOffset] = sprite.uv[0];
            this.uvBuffer[uvOffset + 1] = sprite.uv[1];
            this.uvBuffer[uvOffset + 2] = sprite.uv[2];
            this.uvBuffer[uvOffset + 3] = sprite.uv[3];

            // Color | 颜色
            this.colorBuffer[i] = sprite.color;
        }

        // Debug: log texture IDs only once when we have 2+ sprites (for multi-texture test)
        if (!this.debugLogged && count >= 2) {
            const textureIds = Array.from(this.textureIdBuffer.subarray(0, count));
            console.log(`TS submitSprites: ${count} sprites, textureIds: [${textureIds.join(', ')}]`);
            this.debugLogged = true;
        }

        // Submit to engine (single WASM call) | 提交到引擎（单次WASM调用）
        this.getEngine().submitSpriteBatch(
            this.transformBuffer.subarray(0, count * 7),
            this.textureIdBuffer.subarray(0, count),
            this.uvBuffer.subarray(0, count * 4),
            this.colorBuffer.subarray(0, count)
        );

        this.stats.spriteCount = count;
    }

    /**
     * Render the current frame.
     * 渲染当前帧。
     */
    render(): void {
        if (!this.initialized) return;

        const startTime = performance.now();
        this.getEngine().render();
        const endTime = performance.now();

        // Update statistics | 更新统计信息
        this.stats.frameTime = endTime - startTime;
        this.stats.drawCalls = 1; // Currently single batch | 当前单批次

        // Calculate FPS | 计算FPS
        this.frameCount++;
        this.fpsAccumulator += endTime - this.lastFrameTime;
        this.lastFrameTime = endTime;

        if (this.fpsAccumulator >= 1000) {
            this.stats.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsAccumulator = 0;
        }
    }

    /**
     * Load a texture.
     * 加载纹理。
     *
     * @param id - Texture ID | 纹理ID
     * @param url - Image URL | 图片URL
     */
    loadTexture(id: number, url: string): Promise<void> {
        if (!this.initialized) return Promise.resolve();
        this.getEngine().loadTexture(id, url);
        // Currently synchronous, but return Promise for interface compatibility
        // 目前是同步的，但返回Promise以兼容接口
        return Promise.resolve();
    }

    /**
     * Load multiple textures.
     * 加载多个纹理。
     *
     * @param requests - Texture load requests | 纹理加载请求
     */
    async loadTextures(requests: Array<{ id: number; url: string }>): Promise<void> {
        for (const req of requests) {
            await this.loadTexture(req.id, req.url);
        }
    }

    /**
     * Unload texture from GPU.
     * 从GPU卸载纹理。
     *
     * @param id - Texture ID | 纹理ID
     */
    unloadTexture(id: number): void {
        if (!this.initialized) return;
        // TODO: Implement in Rust engine
        // TODO: 在Rust引擎中实现
        console.warn('unloadTexture not yet implemented in engine');
    }

    /**
     * Get texture information.
     * 获取纹理信息。
     *
     * @param id - Texture ID | 纹理ID
     */
    getTextureInfo(id: number): { width: number; height: number } | null {
        if (!this.initialized) return null;
        // TODO: Implement in Rust engine
        // TODO: 在Rust引擎中实现
        // Return default values for now / 暂时返回默认值
        return { width: 64, height: 64 };
    }

    /**
     * Check if a key is pressed.
     * 检查按键是否按下。
     *
     * @param keyCode - Key code | 键码
     */
    isKeyDown(keyCode: string): boolean {
        if (!this.initialized) return false;
        return this.getEngine().isKeyDown(keyCode);
    }

    /**
     * Update input state (call once per frame).
     * 更新输入状态（每帧调用一次）。
     */
    updateInput(): void {
        if (!this.initialized) return;
        this.getEngine().updateInput();
    }

    /**
     * Get engine statistics.
     * 获取引擎统计信息。
     */
    getStats(): EngineStats {
        return { ...this.stats };
    }

    /**
     * Resize the viewport.
     * 调整视口大小。
     *
     * @param width - New width | 新宽度
     * @param height - New height | 新高度
     */
    resize(width: number, height: number): void {
        if (!this.initialized) return;
        const engine = this.getEngine();
        if (engine.resize) {
            engine.resize(width, height);
        }
    }

    /**
     * Set camera position, zoom, and rotation.
     * 设置相机位置、缩放和旋转。
     *
     * @param config - Camera configuration | 相机配置
     */
    setCamera(config: CameraConfig): void {
        if (!this.initialized) return;
        this.getEngine().setCamera(config.x, config.y, config.zoom, config.rotation);
    }

    /**
     * Get camera state.
     * 获取相机状态。
     */
    getCamera(): CameraConfig {
        if (!this.initialized) {
            return { x: 0, y: 0, zoom: 1, rotation: 0 };
        }
        const state = this.getEngine().getCamera();
        return {
            x: state[0],
            y: state[1],
            zoom: state[2],
            rotation: state[3]
        };
    }

    /**
     * Set grid visibility.
     * 设置网格可见性。
     */
    setShowGrid(show: boolean): void {
        if (!this.initialized) return;
        this.getEngine().setShowGrid(show);
    }

    /**
     * Set clear color (background color).
     * 设置清除颜色（背景颜色）。
     *
     * @param r - Red component (0.0-1.0) | 红色分量
     * @param g - Green component (0.0-1.0) | 绿色分量
     * @param b - Blue component (0.0-1.0) | 蓝色分量
     * @param a - Alpha component (0.0-1.0) | 透明度分量
     */
    setClearColor(r: number, g: number, b: number, a: number): void {
        if (!this.initialized) return;
        this.getEngine().setClearColor(r, g, b, a);
    }

    /**
     * Add a rectangle gizmo outline.
     * 添加矩形Gizmo边框。
     *
     * @param x - Center X position | 中心X位置
     * @param y - Center Y position | 中心Y位置
     * @param width - Rectangle width | 矩形宽度
     * @param height - Rectangle height | 矩形高度
     * @param rotation - Rotation in radians | 旋转角度（弧度）
     * @param originX - Origin X (0-1) | 原点X (0-1)
     * @param originY - Origin Y (0-1) | 原点Y (0-1)
     * @param r - Red (0-1) | 红色
     * @param g - Green (0-1) | 绿色
     * @param b - Blue (0-1) | 蓝色
     * @param a - Alpha (0-1) | 透明度
     * @param showHandles - Whether to show transform handles | 是否显示变换手柄
     */
    addGizmoRect(
        x: number,
        y: number,
        width: number,
        height: number,
        rotation: number,
        originX: number,
        originY: number,
        r: number,
        g: number,
        b: number,
        a: number,
        showHandles: boolean = true
    ): void {
        if (!this.initialized) return;
        this.getEngine().addGizmoRect(x, y, width, height, rotation, originX, originY, r, g, b, a, showHandles);
    }

    /**
     * Set transform tool mode.
     * 设置变换工具模式。
     *
     * @param mode - 0=Select, 1=Move, 2=Rotate, 3=Scale
     */
    setTransformMode(mode: number): void {
        if (!this.initialized) return;
        this.getEngine().setTransformMode(mode);
    }

    /**
     * Set gizmo visibility.
     * 设置辅助工具可见性。
     */
    setShowGizmos(show: boolean): void {
        if (!this.initialized) return;
        this.getEngine().setShowGizmos(show);
    }

    // ===== Multi-viewport API =====
    // ===== 多视口 API =====

    /**
     * Register a new viewport.
     * 注册新视口。
     *
     * @param id - Unique viewport identifier | 唯一视口标识符
     * @param canvasId - HTML canvas element ID | HTML canvas元素ID
     */
    registerViewport(id: string, canvasId: string): void {
        if (!this.initialized) return;
        this.getEngine().registerViewport(id, canvasId);
    }

    /**
     * Unregister a viewport.
     * 注销视口。
     */
    unregisterViewport(id: string): void {
        if (!this.initialized) return;
        this.getEngine().unregisterViewport(id);
    }

    /**
     * Set the active viewport.
     * 设置活动视口。
     */
    setActiveViewport(id: string): boolean {
        if (!this.initialized) return false;
        return this.getEngine().setActiveViewport(id);
    }

    /**
     * Set camera for a specific viewport.
     * 为特定视口设置相机。
     */
    setViewportCamera(viewportId: string, config: CameraConfig): void {
        if (!this.initialized) return;
        this.getEngine().setViewportCamera(viewportId, config.x, config.y, config.zoom, config.rotation);
    }

    /**
     * Get camera for a specific viewport.
     * 获取特定视口的相机。
     */
    getViewportCamera(viewportId: string): CameraConfig | null {
        if (!this.initialized) return null;
        const state = this.getEngine().getViewportCamera(viewportId);
        if (!state) return null;
        return {
            x: state[0],
            y: state[1],
            zoom: state[2],
            rotation: state[3]
        };
    }

    /**
     * Set viewport configuration.
     * 设置视口配置。
     */
    setViewportConfig(viewportId: string, showGrid: boolean, showGizmos: boolean): void {
        if (!this.initialized) return;
        this.getEngine().setViewportConfig(viewportId, showGrid, showGizmos);
    }

    /**
     * Resize a specific viewport.
     * 调整特定视口大小。
     */
    resizeViewport(viewportId: string, width: number, height: number): void {
        if (!this.initialized) return;
        this.getEngine().resizeViewport(viewportId, width, height);
    }

    /**
     * Render to a specific viewport.
     * 渲染到特定视口。
     */
    renderToViewport(viewportId: string): void {
        if (!this.initialized) return;
        this.getEngine().renderToViewport(viewportId);
    }

    /**
     * Get all registered viewport IDs.
     * 获取所有已注册的视口ID。
     */
    getViewportIds(): string[] {
        if (!this.initialized) return [];
        return this.getEngine().getViewportIds();
    }

    /**
     * Dispose the bridge and release resources.
     * 销毁桥接并释放资源。
     */
    dispose(): void {
        this.engine = null;
        this.initialized = false;
    }
}
