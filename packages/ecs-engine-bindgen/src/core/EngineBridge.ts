/**
 * Main bridge between TypeScript ECS and Rust Engine.
 * TypeScript ECS与Rust引擎之间的主桥接层。
 */

import type { SpriteRenderData, TextureLoadRequest, EngineStats, CameraConfig } from '../types';
import type { IEngineBridge } from '@esengine/asset-system';
import type { GameEngine } from '../wasm/es_engine';

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

    // Path resolver for converting file paths to URLs
    // 用于将文件路径转换为URL的路径解析器
    private pathResolver: ((path: string) => string) | null = null;

    // Pre-allocated typed arrays for batch submission
    // 预分配的类型数组用于批量提交
    private transformBuffer: Float32Array;
    private textureIdBuffer: Uint32Array;
    private uvBuffer: Float32Array;
    private colorBuffer: Uint32Array;
    private materialIdBuffer: Uint32Array;

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
        this.materialIdBuffer = new Uint32Array(maxSprites);
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

            // Material ID (0 = default) | 材质ID（0 = 默认）
            this.materialIdBuffer[i] = sprite.materialId ?? 0;
        }

        // Submit to engine (single WASM call) | 提交到引擎（单次WASM调用）
        this.getEngine().submitSpriteBatch(
            this.transformBuffer.subarray(0, count * 7),
            this.textureIdBuffer.subarray(0, count),
            this.uvBuffer.subarray(0, count * 4),
            this.colorBuffer.subarray(0, count),
            this.materialIdBuffer.subarray(0, count)
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
     * Render sprites as overlay without clearing the screen.
     * 渲染精灵作为叠加层，不清除屏幕。
     *
     * This is used for UI rendering on top of world content.
     * 用于在世界内容上渲染 UI。
     */
    renderOverlay(): void {
        if (!this.initialized) return;
        this.getEngine().renderOverlay();
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
     * Load texture by path, returning texture ID.
     * 按路径加载纹理，返回纹理ID。
     *
     * @param path - Image path/URL | 图片路径/URL
     * @returns Texture ID | 纹理ID
     */
    loadTextureByPath(path: string): number {
        if (!this.initialized) return 0;
        return this.getEngine().loadTextureByPath(path);
    }

    /**
     * Get texture ID by path.
     * 按路径获取纹理ID。
     *
     * @param path - Image path | 图片路径
     * @returns Texture ID or undefined | 纹理ID或undefined
     */
    getTextureIdByPath(path: string): number | undefined {
        if (!this.initialized) return undefined;
        return this.getEngine().getTextureIdByPath(path);
    }

    /**
     * Set path resolver for converting file paths to URLs.
     * 设置路径解析器用于将文件路径转换为URL。
     *
     * @param resolver - Function to resolve paths | 解析路径的函数
     */
    setPathResolver(resolver: (path: string) => string): void {
        this.pathResolver = resolver;
    }

    /**
     * Get or load texture by path.
     * 按路径获取或加载纹理。
     *
     * @param path - Image path/URL | 图片路径/URL
     * @returns Texture ID | 纹理ID
     */
    getOrLoadTextureByPath(path: string): number {
        if (!this.initialized) return 0;

        // Resolve path if resolver is set
        // 如果设置了解析器，则解析路径
        const resolvedPath = this.pathResolver ? this.pathResolver(path) : path;
        return this.getEngine().getOrLoadTextureByPath(resolvedPath);
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
     * Add a circle outline gizmo (native rendering).
     * 添加圆形边框Gizmo（原生渲染）。
     */
    addGizmoCircle(
        x: number,
        y: number,
        radius: number,
        r: number,
        g: number,
        b: number,
        a: number
    ): void {
        if (!this.initialized) return;
        this.getEngine().addGizmoCircle(x, y, radius, r, g, b, a);
    }

    /**
     * Add a line gizmo (native rendering).
     * 添加线条Gizmo（原生渲染）。
     */
    addGizmoLine(
        points: number[],
        r: number,
        g: number,
        b: number,
        a: number,
        closed: boolean
    ): void {
        if (!this.initialized) return;
        this.getEngine().addGizmoLine(new Float32Array(points), r, g, b, a, closed);
    }

    /**
     * Add a capsule outline gizmo (native rendering).
     * 添加胶囊边框Gizmo（原生渲染）。
     */
    addGizmoCapsule(
        x: number,
        y: number,
        radius: number,
        halfHeight: number,
        rotation: number,
        r: number,
        g: number,
        b: number,
        a: number
    ): void {
        if (!this.initialized) return;
        this.getEngine().addGizmoCapsule(x, y, radius, halfHeight, rotation, r, g, b, a);
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

    // ===== Screen Space Mode API =====
    // ===== 屏幕空间模式 API =====

    // Saved world space camera state
    // 保存的世界空间相机状态
    private savedWorldCamera: CameraConfig | null = null;

    /**
     * Push screen space rendering mode.
     * 进入屏幕空间渲染模式。
     *
     * Saves the current world camera and switches to a fixed orthographic projection
     * centered at (0, 0) with the specified canvas size.
     * 保存当前世界相机并切换到以 (0, 0) 为中心的固定正交投影。
     *
     * @param canvasWidth - UI canvas width (design resolution) | UI 画布宽度（设计分辨率）
     * @param canvasHeight - UI canvas height (design resolution) | UI 画布高度（设计分辨率）
     */
    pushScreenSpaceMode(canvasWidth: number, canvasHeight: number): void {
        if (!this.initialized) return;

        // Save current world camera state
        // 保存当前世界相机状态
        this.savedWorldCamera = this.getCamera();

        // Switch to screen space camera:
        // - Position at origin (0, 0)
        // - Zoom = 1 (1 pixel = 1 world unit)
        // - No rotation
        // 切换到屏幕空间相机：
        // - 位置在原点 (0, 0)
        // - 缩放 = 1（1 像素 = 1 世界单位）
        // - 无旋转
        //
        // For screen space UI, we want the camera to show exactly canvasWidth x canvasHeight pixels
        // centered at (0, 0). This means the visible area is:
        // X: [-canvasWidth/2, canvasWidth/2]
        // Y: [-canvasHeight/2, canvasHeight/2]
        // 对于屏幕空间 UI，我们希望相机精确显示 canvasWidth x canvasHeight 像素
        // 以 (0, 0) 为中心。这意味着可见区域是：
        // X: [-canvasWidth/2, canvasWidth/2]
        // Y: [-canvasHeight/2, canvasHeight/2]

        // Get current viewport size to calculate proper zoom
        // 获取当前视口尺寸以计算正确的缩放
        // Note: This assumes canvas.width/height match actual rendering size
        // 注意：这假设 canvas.width/height 与实际渲染尺寸匹配
        const canvas = document.getElementById(this.config.canvasId) as HTMLCanvasElement;
        if (canvas) {
            // Calculate zoom so that canvasWidth x canvasHeight fits exactly in the viewport
            // 计算缩放使 canvasWidth x canvasHeight 正好适合视口
            // zoom = viewport_size / world_visible_size
            // For UI, we want 1 UI unit = 1 pixel on screen when canvas matches viewport
            // 对于 UI，当画布与视口匹配时，我们希望 1 UI 单位 = 1 屏幕像素
            const viewportWidth = canvas.width;
            const viewportHeight = canvas.height;

            // Calculate zoom based on the design canvas size vs actual viewport
            // 根据设计画布尺寸与实际视口计算缩放
            // This scales UI to fit the viewport while maintaining aspect ratio
            const zoomX = viewportWidth / canvasWidth;
            const zoomY = viewportHeight / canvasHeight;

            // Use minimum to ensure entire canvas is visible (letterbox if needed)
            // 使用最小值确保整个画布可见（如需要则显示黑边）
            const zoom = Math.min(zoomX, zoomY);

            this.setCamera({
                x: 0,
                y: 0,
                zoom: zoom,
                rotation: 0
            });
        } else {
            // Fallback: use zoom = 1
            // 回退：使用 zoom = 1
            this.setCamera({
                x: 0,
                y: 0,
                zoom: 1,
                rotation: 0
            });
        }
    }

    /**
     * Pop screen space rendering mode.
     * 退出屏幕空间渲染模式。
     *
     * Restores the previously saved world camera.
     * 恢复之前保存的世界相机。
     */
    popScreenSpaceMode(): void {
        if (!this.initialized) return;

        // Restore world camera
        // 恢复世界相机
        if (this.savedWorldCamera) {
            this.setCamera(this.savedWorldCamera);
            this.savedWorldCamera = null;
        }
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
