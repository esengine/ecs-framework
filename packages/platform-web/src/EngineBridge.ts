/**
 * Rust 引擎桥接层
 * 负责在 Web 环境中初始化和管理 Rust WASM 引擎
 */

import type { IPlatformCanvas, CanvasContextAttributes } from '@esengine/platform-common';
import { WebCanvasSubsystem } from './subsystems/WebCanvasSubsystem';

/**
 * 引擎配置
 */
export interface EngineBridgeConfig {
    wasmPath: string;
    canvasId?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    contextAttributes?: CanvasContextAttributes;
}

/**
 * GameEngine WASM 模块导出接口
 */
interface GameEngineExports {
    memory: WebAssembly.Memory;
    new: (canvasIdPtr: number, canvasIdLen: number) => number;
    fromExternal: (glContext: any, width: number, height: number) => any;
    clear: (engine: any, r: number, g: number, b: number, a: number) => void;
    render: (engine: any) => void;
    width: (engine: any) => number;
    height: (engine: any) => number;
    submitSpriteBatch: (
        engine: any,
        transforms: any,
        textureIds: any,
        uvs: any,
        colors: any
    ) => void;
    loadTexture: (engine: any, id: number, urlPtr: number, urlLen: number) => void;
    isKeyDown: (engine: any, keyCodePtr: number, keyCodeLen: number) => boolean;
    updateInput: (engine: any) => void;
}

/**
 * 引擎桥接层
 * 将 Web 平台能力桥接到 Rust WASM 引擎
 */
export class EngineBridge {
    private _canvasSubsystem: WebCanvasSubsystem;
    private _canvas: IPlatformCanvas;
    private _gl: WebGL2RenderingContext | null = null;
    private _wasmModule: WebAssembly.Module | null = null;
    private _wasmInstance: WebAssembly.Instance | null = null;
    private _gameEngine: any = null;
    private _config: EngineBridgeConfig;

    constructor(config: EngineBridgeConfig) {
        this._config = config;
        this._canvasSubsystem = new WebCanvasSubsystem();

        const width = config.canvasWidth ?? window.innerWidth;
        const height = config.canvasHeight ?? window.innerHeight;

        if (config.canvasId) {
            const existingCanvas = document.getElementById(config.canvasId) as HTMLCanvasElement;
            if (existingCanvas) {
                existingCanvas.width = width;
                existingCanvas.height = height;
                this._canvas = this._wrapExistingCanvas(existingCanvas);
            } else {
                this._canvas = this._canvasSubsystem.createCanvas(width, height);
            }
        } else {
            this._canvas = this._canvasSubsystem.createCanvas(width, height);
        }
    }

    private _wrapExistingCanvas(canvas: HTMLCanvasElement): IPlatformCanvas {
        return {
            width: canvas.width,
            height: canvas.height,
            getContext: (type: string, attrs: any) => canvas.getContext(type, attrs as WebGLContextAttributes),
            toDataURL: () => canvas.toDataURL(),
            toTempFilePath: () => {
                throw new Error('Not supported');
            }
        } as IPlatformCanvas;
    }

    /**
     * 初始化引擎
     */
    async initialize(): Promise<void> {
        this._gl = this._getWebGLContext();
        if (!this._gl) {
            throw new Error('无法获取 WebGL2 上下文');
        }

        const imports = this._createWASMImports();
        const response = await fetch(this._config.wasmPath);
        const buffer = await response.arrayBuffer();

        const result = await WebAssembly.instantiate(buffer, imports);
        this._wasmModule = result.module;
        this._wasmInstance = result.instance;

        const exports = this._wasmInstance.exports as unknown as GameEngineExports;

        if (typeof exports.fromExternal === 'function') {
            this._gameEngine = exports.fromExternal(
                this._gl,
                this._canvas.width,
                this._canvas.height
            );
        }
    }

    /**
     * 获取 WebGL2 上下文
     */
    private _getWebGLContext(): WebGL2RenderingContext | null {
        const attrs = this._config.contextAttributes ?? {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false
        };

        return this._canvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null;
    }

    /**
     * 创建 WASM 导入对象
     */
    private _createWASMImports(): WebAssembly.Imports {
        return {
            env: {
                memory: new WebAssembly.Memory({ initial: 256, maximum: 16384 }),

                platform_log: (ptr: number, len: number) => {
                    const message = this._readString(ptr, len);
                    console.log('[Engine]', message);
                },

                platform_error: (ptr: number, len: number) => {
                    const message = this._readString(ptr, len);
                    console.error('[Engine]', message);
                },

                platform_now: () => {
                    return performance.now();
                }
            },
            wbg: {}
        };
    }

    /**
     * 从 WASM 内存读取字符串
     */
    private _readString(ptr: number, len: number): string {
        if (!this._wasmInstance) return '';

        const memory = this._wasmInstance.exports.memory as WebAssembly.Memory;
        const bytes = new Uint8Array(memory.buffer, ptr, len);
        return new TextDecoder().decode(bytes);
    }

    /**
     * 获取 Canvas
     */
    get canvas(): IPlatformCanvas {
        return this._canvas;
    }

    /**
     * 获取 WebGL 上下文
     */
    get gl(): WebGL2RenderingContext | null {
        return this._gl;
    }

    /**
     * 获取 WASM 实例
     */
    get wasmInstance(): WebAssembly.Instance | null {
        return this._wasmInstance;
    }

    /**
     * 获取 GameEngine 实例
     */
    get gameEngine(): any {
        return this._gameEngine;
    }

    /**
     * 清屏
     */
    clear(r: number, g: number, b: number, a: number): void {
        if (this._gl) {
            this._gl.clearColor(r, g, b, a);
            this._gl.clear(this._gl.COLOR_BUFFER_BIT);
        }
    }

    /**
     * 渲染一帧
     */
    render(): void {
        if (this._wasmInstance && this._gameEngine) {
            const exports = this._wasmInstance.exports as unknown as GameEngineExports;
            if (exports.render) {
                exports.render(this._gameEngine);
            }
        }
    }

    /**
     * 获取画布宽度
     */
    get width(): number {
        return this._canvas.width;
    }

    /**
     * 获取画布高度
     */
    get height(): number {
        return this._canvas.height;
    }

    /**
     * 调整画布大小
     */
    resize(width: number, height: number): void {
        this._canvas.width = width;
        this._canvas.height = height;
        if (this._gl) {
            this._gl.viewport(0, 0, width, height);
        }
    }

    /**
     * 销毁引擎
     */
    dispose(): void {
        this._gameEngine = null;
        this._wasmInstance = null;
        this._wasmModule = null;
        this._gl = null;
    }
}
