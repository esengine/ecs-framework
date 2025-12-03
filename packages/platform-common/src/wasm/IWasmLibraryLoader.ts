/**
 * WASM 库平台适配层
 *
 * 提供统一的 WASM 库加载接口，屏蔽不同平台的差异
 *
 * 支持的平台：
 * - Web 浏览器（标准 WebAssembly API）
 * - 微信小游戏（WXWebAssembly）
 * - 字节跳动小游戏
 * - 支付宝小游戏
 * - 百度小游戏
 */

/**
 * 平台类型枚举
 */
export enum PlatformType {
    /** Web 浏览器 */
    Web = 'web',
    /** 微信小游戏 */
    WeChatMiniGame = 'wechat-minigame',
    /** 字节跳动小游戏 */
    ByteDanceMiniGame = 'bytedance-minigame',
    /** 支付宝小游戏 */
    AlipayMiniGame = 'alipay-minigame',
    /** 百度小游戏 */
    BaiduMiniGame = 'baidu-minigame',
    /** Node.js */
    NodeJS = 'nodejs',
    /** 未知平台 */
    Unknown = 'unknown'
}

/**
 * WASM 库加载配置
 *
 * @example
 * ```typescript
 * const config: WasmLibraryConfig = {
 *     name: 'Rapier2D',
 *     web: {
 *         useCompat: true,  // Web 使用 compat 版本
 *     },
 *     minigame: {
 *         wasmPath: 'wasm/rapier2d_bg.wasm',
 *         needsTextDecoderPolyfill: true,
 *     }
 * };
 * ```
 */
export interface WasmLibraryConfig {
    /**
     * 库名称（用于日志和错误提示）
     */
    name: string;

    /**
     * Web 平台配置
     */
    web?: {
        /**
         * 使用 -compat 版本（WASM 以 base64 嵌入 JS）
         *
         * 优点：无需额外配置，开箱即用
         * 缺点：包体积较大，首次加载慢
         */
        useCompat?: boolean;

        /**
         * 模块路径（非 compat 版本时使用）
         */
        modulePath?: string;

        /**
         * WASM 文件路径（非 compat 版本时使用）
         */
        wasmPath?: string;
    };

    /**
     * 小游戏平台配置
     */
    minigame?: {
        /**
         * WASM 文件路径（相对于小游戏根目录）
         */
        wasmPath: string;

        /**
         * JS glue 文件路径（可选）
         */
        gluePath?: string;

        /**
         * 是否需要 TextDecoder polyfill
         *
         * iOS 微信小游戏通常需要此 polyfill
         */
        needsTextDecoderPolyfill?: boolean;

        /**
         * 是否需要 TextEncoder polyfill
         *
         * iOS 微信小游戏通常需要此 polyfill
         */
        needsTextEncoderPolyfill?: boolean;
    };

    /**
     * 自定义初始化函数
     *
     * 用于库特定的初始化逻辑
     *
     * @param wasmInstance - WASM 实例
     * @returns 初始化后的模块
     */
    customInit?: (wasmInstance: any) => Promise<any>;
}

/**
 * 平台信息
 * Platform information
 */
export interface PlatformInfo {
    /** 平台类型 | Platform type */
    type: PlatformType;

    /** 是否支持 WebAssembly | Supports WebAssembly */
    supportsWasm: boolean;

    /** 是否支持 SharedArrayBuffer | Supports SharedArrayBuffer */
    supportsSharedArrayBuffer: boolean;

    /** 需要安装的 polyfills 列表 | Required polyfills */
    needsPolyfills: string[];

    /**
     * 是否在编辑器环境（Tauri 桌面应用）
     * Whether running in editor environment (Tauri desktop app)
     */
    isEditor: boolean;
}

/**
 * WASM 库加载器接口
 *
 * 每个 WASM 库需要实现此接口以支持跨平台加载
 *
 * @typeParam T - WASM 库模块类型
 *
 * @example
 * ```typescript
 * class Rapier2DLoader implements IWasmLibraryLoader<typeof RAPIER> {
 *     async load(): Promise<typeof RAPIER> {
 *         const RAPIER = await import('@dimforge/rapier2d-compat');
 *         await RAPIER.init();
 *         return RAPIER;
 *     }
 *
 *     isSupported(): boolean {
 *         return typeof WebAssembly !== 'undefined';
 *     }
 *
 *     getPlatformInfo(): PlatformInfo {
 *         return {
 *             type: PlatformType.Web,
 *             supportsWasm: true,
 *             supportsSharedArrayBuffer: true,
 *             needsPolyfills: []
 *         };
 *     }
 * }
 * ```
 */
export interface IWasmLibraryLoader<T> {
    /**
     * 加载 WASM 库
     *
     * @returns 加载完成的库模块
     * @throws 如果加载失败或平台不支持
     */
    load(): Promise<T>;

    /**
     * 检查当前平台是否支持此库
     *
     * @returns 是否支持
     */
    isSupported(): boolean;

    /**
     * 获取当前平台信息
     *
     * @returns 平台信息
     */
    getPlatformInfo(): PlatformInfo;

    /**
     * 获取库配置
     *
     * @returns 库配置
     */
    getConfig(): WasmLibraryConfig;
}

/**
 * 平台特定 WASM 加载器接口
 *
 * 提供平台级别的 WASM 加载能力
 */
export interface IPlatformWasmLoader {
    /**
     * 平台类型
     */
    readonly platformType: PlatformType;

    /**
     * 加载 WASM 模块
     *
     * @param wasmPath - WASM 文件路径
     * @param imports - WASM 导入对象
     * @returns WASM 实例
     */
    loadWasmModule(
        wasmPath: string,
        imports?: WebAssembly.Imports
    ): Promise<WebAssembly.Instance>;

    /**
     * 检查是否支持 WASM
     *
     * @returns 是否支持
     */
    isSupported(): boolean;

    /**
     * 安装必要的 polyfills
     */
    installPolyfills(): void;
}
