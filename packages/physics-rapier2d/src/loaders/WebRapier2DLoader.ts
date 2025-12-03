/**
 * Web 平台 Rapier2D 加载器
 *
 * 使用 @esengine/rapier2d 标准版（独立 WASM 文件）
 */

import type {
    IWasmLibraryLoader,
    WasmLibraryConfig,
    PlatformInfo
} from '@esengine/platform-common';
import { PlatformType, isEditorEnvironment } from '@esengine/platform-common';

/**
 * Rapier2D 模块类型
 */
type RapierModule = typeof import('@esengine/rapier2d');

/**
 * Web 平台 Rapier2D 加载器
 *
 * 使用标准版，需要配置 WASM 路径
 *
 * @example
 * ```typescript
 * const loader = new WebRapier2DLoader(config);
 * if (loader.isSupported()) {
 *     const RAPIER = await loader.load();
 *     // 使用 RAPIER...
 * }
 * ```
 */
export class WebRapier2DLoader implements IWasmLibraryLoader<RapierModule> {
    private _config: WasmLibraryConfig;

    /**
     * 创建 Web 平台 Rapier2D 加载器
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
        console.log(`[${this._config.name}] 正在加载 Web 版本...`);

        // 动态导入标准版
        const RAPIER = await import('@esengine/rapier2d');

        // 初始化 WASM - 标准版需要提供 WASM 路径
        // 构建时 WASM 文件会被复制到 wasm/ 目录
        const wasmPath = this._config.web?.wasmPath || 'wasm/rapier_wasm2d_bg.wasm';
        await RAPIER.init(wasmPath);

        console.log(`[${this._config.name}] 加载完成`);
        return RAPIER;
    }

    /**
     * 检查是否支持 WebAssembly
     *
     * @returns 是否支持
     */
    isSupported(): boolean {
        return typeof WebAssembly !== 'undefined';
    }

    /**
     * 获取平台信息
     * Get platform information
     */
    getPlatformInfo(): PlatformInfo {
        return {
            type: PlatformType.Web,
            supportsWasm: typeof WebAssembly !== 'undefined',
            supportsSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
            needsPolyfills: [],
            isEditor: isEditorEnvironment()
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
