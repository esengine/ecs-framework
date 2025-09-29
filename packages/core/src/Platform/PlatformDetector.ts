import type { PlatformDetectionResult } from './IPlatformAdapter';

/**
 * 平台检测器
 * 自动检测当前运行环境并返回对应的平台信息
 */
export class PlatformDetector {
    /**
     * 检测当前平台
     */
    public static detect(): PlatformDetectionResult {
        const features: string[] = [];
        let platform: PlatformDetectionResult['platform'] = 'unknown';
        let confident = false;
        let adapterClass: string | undefined;

        // 检查全局对象和API
        if (typeof globalThis !== 'undefined') {
            features.push('globalThis');
        }

        if (typeof window !== 'undefined') {
            features.push('window');
        }

        if (typeof self !== 'undefined') {
            features.push('self');
        }

        // 检测微信小游戏环境
        if (this.isWeChatMiniGame()) {
            platform = 'wechat-minigame';
            confident = true;
            adapterClass = 'WeChatMiniGameAdapter';
            features.push('wx', 'wechat-minigame');
        }
        // 检测字节跳动小游戏环境
        else if (this.isByteDanceMiniGame()) {
            platform = 'bytedance-minigame';
            confident = true;
            adapterClass = 'ByteDanceMiniGameAdapter';
            features.push('tt', 'bytedance-minigame');
        }
        // 检测支付宝小游戏环境
        else if (this.isAlipayMiniGame()) {
            platform = 'alipay-minigame';
            confident = true;
            adapterClass = 'AlipayMiniGameAdapter';
            features.push('my', 'alipay-minigame');
        }
        // 检测百度小游戏环境
        else if (this.isBaiduMiniGame()) {
            platform = 'baidu-minigame';
            confident = true;
            adapterClass = 'BaiduMiniGameAdapter';
            features.push('swan', 'baidu-minigame');
        }
        // 检测浏览器环境
        else if (this.isBrowser()) {
            platform = 'browser';
            confident = true;
            adapterClass = 'BrowserAdapter';
            features.push('browser');
        }

        // 添加功能检测特征
        if (typeof Worker !== 'undefined') {
            features.push('Worker');
        }

        if (typeof SharedArrayBuffer !== 'undefined') {
            features.push('SharedArrayBuffer');
        }

        if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
            features.push('hardwareConcurrency');
        }

        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            features.push('performance.now');
        }

        if (typeof Blob !== 'undefined') {
            features.push('Blob');
        }

        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            features.push('URL.createObjectURL');
        }

        return {
            platform,
            confident,
            features,
            adapterClass
        };
    }

    /**
     * 检测是否为微信小游戏环境
     */
    private static isWeChatMiniGame(): boolean {
        // 检查wx全局对象
        if (typeof (globalThis as any).wx !== 'undefined') {
            const wx = (globalThis as any).wx;
            // 检查微信小游戏特有的API
            return !!(wx.getSystemInfo && wx.createCanvas && wx.createImage);
        }
        return false;
    }

    /**
     * 检测是否为字节跳动小游戏环境
     */
    private static isByteDanceMiniGame(): boolean {
        // 检查tt全局对象
        if (typeof (globalThis as any).tt !== 'undefined') {
            const tt = (globalThis as any).tt;
            // 检查字节跳动小游戏特有的API
            return !!(tt.getSystemInfo && tt.createCanvas && tt.createImage);
        }
        return false;
    }

    /**
     * 检测是否为支付宝小游戏环境
     */
    private static isAlipayMiniGame(): boolean {
        // 检查my全局对象
        if (typeof (globalThis as any).my !== 'undefined') {
            const my = (globalThis as any).my;
            // 检查支付宝小游戏特有的API
            return !!(my.getSystemInfo && my.createCanvas);
        }
        return false;
    }

    /**
     * 检测是否为百度小游戏环境
     */
    private static isBaiduMiniGame(): boolean {
        // 检查swan全局对象
        if (typeof (globalThis as any).swan !== 'undefined') {
            const swan = (globalThis as any).swan;
            // 检查百度小游戏特有的API
            return !!(swan.getSystemInfo && swan.createCanvas);
        }
        return false;
    }

    /**
     * 检测是否为浏览器环境
     */
    private static isBrowser(): boolean {
        // 检查浏览器特有的对象和API
        return typeof window !== 'undefined' &&
               typeof document !== 'undefined' &&
               typeof navigator !== 'undefined' &&
               window.location !== undefined;
    }

    /**
     * 获取详细的环境信息（用于调试）
     */
    public static getDetailedInfo(): Record<string, any> {
        const info: Record<string, any> = {};

        // 基础检测
        info.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
        info.platform = typeof navigator !== 'undefined' ? navigator.platform : 'unknown';

        // 全局对象检测
        info.globalObjects = {
            window: typeof window !== 'undefined',
            document: typeof document !== 'undefined',
            navigator: typeof navigator !== 'undefined',
            wx: typeof (globalThis as any).wx !== 'undefined',
            tt: typeof (globalThis as any).tt !== 'undefined',
            my: typeof (globalThis as any).my !== 'undefined',
            swan: typeof (globalThis as any).swan !== 'undefined'
        };

        // Worker相关检测
        info.workerSupport = {
            Worker: typeof Worker !== 'undefined',
            SharedWorker: typeof SharedWorker !== 'undefined',
            ServiceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
            SharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
            crossOriginIsolated: typeof self !== 'undefined' ? self.crossOriginIsolated : false
        };

        // 性能相关检测
        info.performance = {
            performanceNow: typeof performance !== 'undefined' && typeof performance.now === 'function',
            hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined
        };

        // 其他API检测
        info.apiSupport = {
            Blob: typeof Blob !== 'undefined',
            URL: typeof URL !== 'undefined',
            createObjectURL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
            ArrayBuffer: typeof ArrayBuffer !== 'undefined',
            TypedArrays: typeof Float32Array !== 'undefined'
        };

        return info;
    }
}