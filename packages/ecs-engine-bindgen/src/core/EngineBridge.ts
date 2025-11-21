/**
 * Main bridge between TypeScript ECS and Rust Engine.
 * TypeScript ECS与Rust引擎之间的主桥接层。
 */

import type { SpriteRenderData, TextureLoadRequest, EngineStats, CameraConfig } from '../types';

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
export class EngineBridge {
    private engine: any; // GameEngine from WASM
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
        this.engine.clear(r, g, b, a);
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
        this.engine.submitSpriteBatch(
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
        this.engine.render();
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
    loadTexture(id: number, url: string): void {
        if (!this.initialized) return;
        this.engine.loadTexture(id, url);
    }

    /**
     * Load multiple textures.
     * 加载多个纹理。
     *
     * @param requests - Texture load requests | 纹理加载请求
     */
    loadTextures(requests: TextureLoadRequest[]): void {
        for (const req of requests) {
            this.loadTexture(req.id, req.url);
        }
    }

    /**
     * Check if a key is pressed.
     * 检查按键是否按下。
     *
     * @param keyCode - Key code | 键码
     */
    isKeyDown(keyCode: string): boolean {
        if (!this.initialized) return false;
        return this.engine.isKeyDown(keyCode);
    }

    /**
     * Update input state (call once per frame).
     * 更新输入状态（每帧调用一次）。
     */
    updateInput(): void {
        if (!this.initialized) return;
        this.engine.updateInput();
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
        if (this.engine.resize) {
            this.engine.resize(width, height);
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
        this.engine.setCamera(config.x, config.y, config.zoom, config.rotation);
    }

    /**
     * Get camera state.
     * 获取相机状态。
     */
    getCamera(): CameraConfig {
        if (!this.initialized) {
            return { x: 0, y: 0, zoom: 1, rotation: 0 };
        }
        const state = this.engine.getCamera();
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
        this.engine.setShowGrid(show);
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
        a: number
    ): void {
        if (!this.initialized) return;
        this.engine.addGizmoRect(x, y, width, height, rotation, originX, originY, r, g, b, a);
    }

    /**
     * Set transform tool mode.
     * 设置变换工具模式。
     *
     * @param mode - 0=Select, 1=Move, 2=Rotate, 3=Scale
     */
    setTransformMode(mode: number): void {
        if (!this.initialized) return;
        this.engine.set_transform_mode(mode);
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
