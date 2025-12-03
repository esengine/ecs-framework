/**
 * 微信小游戏平台 Rapier2D 加载器
 *
 * 使用 WXWebAssembly 加载独立的 .wasm 文件
 */

import type {
    IWasmLibraryLoader,
    WasmLibraryConfig,
    PlatformInfo
} from '@esengine/platform-common';
import {
    PlatformType,
    installTextDecoderPolyfill,
    installTextEncoderPolyfill
} from '@esengine/platform-common';

/**
 * Rapier2D 模块类型
 */
type RapierModule = typeof import('@esengine/rapier2d');

/**
 * 微信小游戏 WASM API 类型声明
 */
declare const WXWebAssembly: {
    instantiate(
        path: string,
        imports?: WebAssembly.Imports
    ): Promise<WebAssembly.Instance>;
    Memory: typeof WebAssembly.Memory;
    Table: typeof WebAssembly.Table;
};

/**
 * 微信小游戏平台 Rapier2D 加载器
 *
 * 特殊处理：
 * 1. 安装 TextDecoder/TextEncoder polyfill
 * 2. 使用 WXWebAssembly 加载 .wasm 文件
 * 3. 临时替换全局 WebAssembly 对象
 *
 * @example
 * ```typescript
 * const loader = new WeChatRapier2DLoader(config);
 * if (loader.isSupported()) {
 *     const RAPIER = await loader.load();
 *     // 使用 RAPIER...
 * }
 * ```
 */
export class WeChatRapier2DLoader implements IWasmLibraryLoader<RapierModule> {
    private _config: WasmLibraryConfig;

    /**
     * 创建微信小游戏平台 Rapier2D 加载器
     *
     * @param config - 加载器配置
     */
    constructor(config: WasmLibraryConfig) {
        this._config = config;
    }

    /**
     * 加载 Rapier2D 模块
     *
     * @returns 初始化完成的 Rapier2D 模块
     */
    async load(): Promise<RapierModule> {
        console.log(`[${this._config.name}] 正在加载微信小游戏版本...`);

        // 1. 安装必要的 polyfills
        this.installPolyfills();

        // 2. 检查 WXWebAssembly 支持
        if (typeof WXWebAssembly === 'undefined') {
            throw new Error(
                `[${this._config.name}] 当前微信基础库版本不支持 WebAssembly，` +
                '请升级微信或使用更高版本的基础库'
            );
        }

        // 3. 加载 Rapier2D
        const RAPIER = await this.loadRapierWithWXWasm();

        console.log(`[${this._config.name}] 加载完成`);
        return RAPIER;
    }

    /**
     * 安装必要的 polyfills
     */
    private installPolyfills(): void {
        const config = this._config.minigame;

        if (config?.needsTextDecoderPolyfill) {
            installTextDecoderPolyfill();
        }

        if (config?.needsTextEncoderPolyfill) {
            installTextEncoderPolyfill();
        }
    }

    /**
     * 使用 WXWebAssembly 加载 Rapier2D
     *
     * 通过临时替换全局 WebAssembly 对象来使 Rapier2D 使用 WXWebAssembly
     *
     * @returns 初始化完成的 Rapier2D 模块
     */
    private async loadRapierWithWXWasm(): Promise<RapierModule> {
        // 保存原始 WebAssembly 对象
        const originalWebAssembly = (globalThis as any).WebAssembly;

        try {
            // 创建一个包装的 WebAssembly 对象
            // 让 Rapier2D 的初始化代码使用 WXWebAssembly
            (globalThis as any).WebAssembly = this.createWXWebAssemblyWrapper();

            // 导入 Rapier2D 标准版
            const RAPIER = await import('@esengine/rapier2d');

            // 初始化 WASM - 标准版需要提供 WASM 路径
            const wasmPath = this._config.minigame?.wasmPath || 'wasm/rapier_wasm2d_bg.wasm';
            await RAPIER.init(wasmPath);

            return RAPIER;
        } finally {
            // 恢复原始 WebAssembly 对象
            if (originalWebAssembly) {
                (globalThis as any).WebAssembly = originalWebAssembly;
            }
        }
    }

    /**
     * 创建 WXWebAssembly 包装器
     *
     * 将 WXWebAssembly 包装成与标准 WebAssembly API 兼容的形式
     *
     * @returns 包装后的 WebAssembly 对象
     */
    private createWXWebAssemblyWrapper(): typeof WebAssembly {
        const wasmPath = this._config.minigame?.wasmPath || 'wasm/rapier2d_bg.wasm';

        return {
            instantiate: async (
                bufferSource: BufferSource | WebAssembly.Module,
                imports?: WebAssembly.Imports
            ): Promise<WebAssembly.WebAssemblyInstantiatedSource> => {
                // WXWebAssembly.instantiate 直接接受文件路径
                const instance = await WXWebAssembly.instantiate(wasmPath, imports);
                return {
                    instance,
                    module: {} as WebAssembly.Module
                };
            },

            instantiateStreaming: async (
                response: Response | PromiseLike<Response>,
                imports?: WebAssembly.Imports
            ): Promise<WebAssembly.WebAssemblyInstantiatedSource> => {
                // 微信不支持 streaming，直接使用 instantiate
                const instance = await WXWebAssembly.instantiate(wasmPath, imports);
                return {
                    instance,
                    module: {} as WebAssembly.Module
                };
            },

            compile: async (bytes: BufferSource): Promise<WebAssembly.Module> => {
                // 微信小游戏不支持单独编译
                throw new Error('WXWebAssembly 不支持 compile 方法');
            },

            compileStreaming: async (source: Response | PromiseLike<Response>): Promise<WebAssembly.Module> => {
                throw new Error('WXWebAssembly 不支持 compileStreaming 方法');
            },

            validate: (bytes: BufferSource): boolean => {
                // 简单返回 true，实际验证在 instantiate 时进行
                return true;
            },

            Memory: WXWebAssembly.Memory,
            Table: WXWebAssembly.Table,
            Global: (globalThis as any).WebAssembly?.Global,
            Tag: (globalThis as any).WebAssembly?.Tag,
            Exception: (globalThis as any).WebAssembly?.Exception,
            CompileError: (globalThis as any).WebAssembly?.CompileError || Error,
            LinkError: (globalThis as any).WebAssembly?.LinkError || Error,
            RuntimeError: (globalThis as any).WebAssembly?.RuntimeError || Error,
        } as unknown as typeof WebAssembly;
    }

    /**
     * 检查是否支持 WXWebAssembly
     *
     * @returns 是否支持
     */
    isSupported(): boolean {
        return typeof WXWebAssembly !== 'undefined';
    }

    /**
     * 获取平台信息
     * Get platform information
     */
    getPlatformInfo(): PlatformInfo {
        const needsPolyfills: string[] = [];

        if (typeof globalThis.TextDecoder === 'undefined') {
            needsPolyfills.push('TextDecoder');
        }
        if (typeof globalThis.TextEncoder === 'undefined') {
            needsPolyfills.push('TextEncoder');
        }

        return {
            type: PlatformType.WeChatMiniGame,
            supportsWasm: typeof WXWebAssembly !== 'undefined',
            supportsSharedArrayBuffer: false,
            needsPolyfills,
            isEditor: false // 微信小游戏不可能是编辑器环境 | WeChat cannot be editor
        };
    }

    /**
     * 获取加载器配置
     *
     * @returns 配置对象
     */
    getConfig(): WasmLibraryConfig {
        return this._config;
    }
}
