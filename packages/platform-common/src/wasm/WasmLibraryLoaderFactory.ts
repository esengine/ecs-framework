/**
 * WASM 库加载器工厂
 *
 * 提供自动平台检测和加载器创建功能
 *
 * @example
 * ```typescript
 * // 注册加载器
 * WasmLibraryLoaderFactory.registerLoader(
 *     'rapier2d',
 *     PlatformType.Web,
 *     () => new WebRapier2DLoader(config)
 * );
 *
 * // 创建加载器（自动选择平台）
 * const loader = WasmLibraryLoaderFactory.createLoader<typeof RAPIER>('rapier2d');
 * const rapier = await loader.load();
 * ```
 */

import { PlatformType, IWasmLibraryLoader } from './IWasmLibraryLoader';

/**
 * 加载器创建函数类型
 */
type LoaderFactory<T> = () => IWasmLibraryLoader<T>;

/**
 * 已注册的加载器映射
 *
 * 结构：libraryName -> platformType -> loaderFactory
 */
const registeredLoaders = new Map<string, Map<PlatformType, LoaderFactory<any>>>();

/**
 * 缓存的平台检测结果
 */
let detectedPlatform: PlatformType | null = null;

/**
 * WASM 库加载器工厂
 */
export class WasmLibraryLoaderFactory {
    /**
     * 注册 WASM 库加载器
     *
     * @param libraryName - 库名称（如 'rapier2d'）
     * @param platform - 目标平台
     * @param factory - 加载器工厂函数
     *
     * @example
     * ```typescript
     * WasmLibraryLoaderFactory.registerLoader(
     *     'rapier2d',
     *     PlatformType.Web,
     *     () => new WebRapier2DLoader(config)
     * );
     * ```
     */
    static registerLoader<T>(
        libraryName: string,
        platform: PlatformType,
        factory: LoaderFactory<T>
    ): void {
        if (!registeredLoaders.has(libraryName)) {
            registeredLoaders.set(libraryName, new Map());
        }
        registeredLoaders.get(libraryName)!.set(platform, factory);
    }

    /**
     * 检测当前运行平台
     *
     * 检测顺序：
     * 1. 微信小游戏（wx 全局对象）
     * 2. 字节跳动小游戏（tt 全局对象）
     * 3. 支付宝小游戏（my 全局对象）
     * 4. 百度小游戏（swan 全局对象）
     * 5. Node.js（process 对象）
     * 6. Web 浏览器（window + document）
     *
     * @returns 检测到的平台类型
     */
    static detectPlatform(): PlatformType {
        if (detectedPlatform !== null) {
            return detectedPlatform;
        }

        // 微信小游戏
        if (typeof (globalThis as any).wx !== 'undefined') {
            const wx = (globalThis as any).wx;
            if (wx.getSystemInfo && wx.createCanvas) {
                detectedPlatform = PlatformType.WeChatMiniGame;
                return detectedPlatform;
            }
        }

        // 字节跳动小游戏
        if (typeof (globalThis as any).tt !== 'undefined') {
            const tt = (globalThis as any).tt;
            if (tt.getSystemInfo) {
                detectedPlatform = PlatformType.ByteDanceMiniGame;
                return detectedPlatform;
            }
        }

        // 支付宝小游戏
        if (typeof (globalThis as any).my !== 'undefined') {
            const my = (globalThis as any).my;
            if (my.getSystemInfo) {
                detectedPlatform = PlatformType.AlipayMiniGame;
                return detectedPlatform;
            }
        }

        // 百度小游戏
        if (typeof (globalThis as any).swan !== 'undefined') {
            const swan = (globalThis as any).swan;
            if (swan.getSystemInfo) {
                detectedPlatform = PlatformType.BaiduMiniGame;
                return detectedPlatform;
            }
        }

        // Node.js
        if (typeof process !== 'undefined' && process.versions?.node) {
            detectedPlatform = PlatformType.NodeJS;
            return detectedPlatform;
        }

        // Web 浏览器
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            detectedPlatform = PlatformType.Web;
            return detectedPlatform;
        }

        detectedPlatform = PlatformType.Unknown;
        return detectedPlatform;
    }

    /**
     * 创建 WASM 库加载器
     *
     * 自动检测平台并选择对应的加载器
     *
     * @param libraryName - 库名称
     * @returns 对应平台的加载器实例
     * @throws 如果库未注册或平台不支持
     *
     * @example
     * ```typescript
     * const loader = WasmLibraryLoaderFactory.createLoader<typeof RAPIER>('rapier2d');
     * const rapier = await loader.load();
     * ```
     */
    static createLoader<T>(libraryName: string): IWasmLibraryLoader<T> {
        const platform = this.detectPlatform();
        const libraryLoaders = registeredLoaders.get(libraryName);

        if (!libraryLoaders) {
            throw new Error(`[WasmLibraryLoaderFactory] 未注册的库: ${libraryName}`);
        }

        const factory = libraryLoaders.get(platform);

        if (!factory) {
            // 尝试使用 Web 加载器作为降级方案
            const webFactory = libraryLoaders.get(PlatformType.Web);
            if (webFactory && platform !== PlatformType.Unknown) {
                console.warn(
                    `[WasmLibraryLoaderFactory] 平台 ${platform} 没有专用加载器，使用 Web 加载器作为降级方案`
                );
                return webFactory() as IWasmLibraryLoader<T>;
            }

            throw new Error(
                `[WasmLibraryLoaderFactory] 库 "${libraryName}" 不支持平台: ${platform}`
            );
        }

        return factory() as IWasmLibraryLoader<T>;
    }

    /**
     * 检查指定库是否支持当前平台
     *
     * @param libraryName - 库名称
     * @returns 是否支持
     */
    static isLibrarySupported(libraryName: string): boolean {
        const platform = this.detectPlatform();
        const libraryLoaders = registeredLoaders.get(libraryName);

        if (!libraryLoaders) {
            return false;
        }

        return libraryLoaders.has(platform) || libraryLoaders.has(PlatformType.Web);
    }

    /**
     * 获取库支持的所有平台
     *
     * @param libraryName - 库名称
     * @returns 支持的平台列表
     */
    static getSupportedPlatforms(libraryName: string): PlatformType[] {
        const libraryLoaders = registeredLoaders.get(libraryName);
        if (!libraryLoaders) {
            return [];
        }
        return Array.from(libraryLoaders.keys());
    }

    /**
     * 获取所有已注册的库名称
     *
     * @returns 库名称列表
     */
    static getRegisteredLibraries(): string[] {
        return Array.from(registeredLoaders.keys());
    }

    /**
     * 清除平台检测缓存
     *
     * 主要用于测试
     */
    static clearPlatformCache(): void {
        detectedPlatform = null;
    }

    /**
     * 清除所有已注册的加载器
     *
     * 主要用于测试
     */
    static clearAllLoaders(): void {
        registeredLoaders.clear();
    }
}
