/**
 * Rust 引擎桥接层
 * 负责在微信小游戏环境中初始化和管理 Rust WASM 引擎
 */

import type { IPlatformCanvas } from '@esengine/platform-common';
import { WeChatAdapter } from './WeChatAdapter';

/**
 * 引擎配置
 */
export interface EngineBridgeConfig {
    wasmPath: string;
    canvasWidth?: number;
    canvasHeight?: number;
    enableWebGL2?: boolean;
}

/**
 * 引擎桥接层
 * 将微信平台能力桥接到 Rust WASM 引擎
 */
export class EngineBridge {
    private _adapter: WeChatAdapter;
    private _canvas: IPlatformCanvas;
    private _gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    private _wasmInstance: any = null;
    private _config: EngineBridgeConfig;

    constructor(adapter: WeChatAdapter, config: EngineBridgeConfig) {
        this._adapter = adapter;
        this._config = config;

        // 创建主 Canvas
        const windowInfo = adapter.getSystemInfo();
        const width = config.canvasWidth ?? windowInfo.windowWidth;
        const height = config.canvasHeight ?? windowInfo.windowHeight;

        this._canvas = adapter.canvas.createCanvas(width, height);
    }

    /**
     * 初始化引擎
     */
    async initialize(): Promise<void> {
        // 获取 WebGL 上下文
        this._gl = this._getWebGLContext();
        if (!this._gl) {
            throw new Error('无法获取 WebGL 上下文');
        }

        // 加载 WASM 模块
        const imports = this._createWASMImports();
        this._wasmInstance = await this._adapter.wasm.instantiate(
            this._config.wasmPath,
            imports
        );

        // 初始化引擎
        if (this._wasmInstance.exports.init) {
            this._wasmInstance.exports.init();
        }
    }

    /**
     * 获取 WebGL 上下文
     */
    private _getWebGLContext(): WebGLRenderingContext | WebGL2RenderingContext | null {
        const contextType = this._config.enableWebGL2 ? 'webgl2' : 'webgl';
        const gl = this._canvas.getContext(contextType, {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false
        });

        return gl as WebGLRenderingContext | WebGL2RenderingContext | null;
    }

    /**
     * 创建 WASM 导入对象
     */
    private _createWASMImports(): Record<string, Record<string, any>> {
        return {
            env: {
                // 内存
                memory: this._adapter.wasm.createMemory(256, 16384),

                // 平台桥接函数
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
                },

                // WebGL 桥接
                gl_bindBuffer: (target: number, buffer: number) => {
                    this._gl?.bindBuffer(target, this._getGLObject(buffer));
                },

                gl_bufferData: (target: number, dataPtr: number, dataLen: number, usage: number) => {
                    const data = this._readBuffer(dataPtr, dataLen);
                    this._gl?.bufferData(target, data, usage);
                },

                gl_clear: (mask: number) => {
                    this._gl?.clear(mask);
                },

                gl_clearColor: (r: number, g: number, b: number, a: number) => {
                    this._gl?.clearColor(r, g, b, a);
                },

                gl_drawArrays: (mode: number, first: number, count: number) => {
                    this._gl?.drawArrays(mode, first, count);
                },

                gl_drawElements: (mode: number, count: number, type: number, offset: number) => {
                    this._gl?.drawElements(mode, count, type, offset);
                },

                gl_enable: (cap: number) => {
                    this._gl?.enable(cap);
                },

                gl_disable: (cap: number) => {
                    this._gl?.disable(cap);
                },

                gl_viewport: (x: number, y: number, width: number, height: number) => {
                    this._gl?.viewport(x, y, width, height);
                }
            }
        };
    }

    /**
     * 从 WASM 内存读取字符串
     */
    private _readString(ptr: number, len: number): string {
        const memory = this._wasmInstance?.exports.memory as WebAssembly.Memory;
        if (!memory) return '';

        const bytes = new Uint8Array(memory.buffer, ptr, len);
        return new TextDecoder().decode(bytes);
    }

    /**
     * 从 WASM 内存读取缓冲区
     */
    private _readBuffer(ptr: number, len: number): ArrayBuffer {
        const memory = this._wasmInstance?.exports.memory as WebAssembly.Memory;
        if (!memory) return new ArrayBuffer(0);

        return memory.buffer.slice(ptr, ptr + len);
    }

    /**
     * 获取 WebGL 对象（暂时简化实现）
     */
    private _getGLObject(_id: number): WebGLBuffer | null {
        // TODO: 实现 WebGL 对象管理
        return null;
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
    get gl(): WebGLRenderingContext | WebGL2RenderingContext | null {
        return this._gl;
    }

    /**
     * 获取 WASM 实例
     */
    get wasmInstance(): any {
        return this._wasmInstance;
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
        if (this._wasmInstance?.exports.render) {
            this._wasmInstance.exports.render();
        }
    }

    /**
     * 更新逻辑
     */
    update(deltaTime: number): void {
        if (this._wasmInstance?.exports.update) {
            this._wasmInstance.exports.update(deltaTime);
        }
    }

    /**
     * 销毁引擎
     */
    dispose(): void {
        if (this._wasmInstance?.exports.dispose) {
            this._wasmInstance.exports.dispose();
        }
        this._wasmInstance = null;
        this._gl = null;
    }
}
