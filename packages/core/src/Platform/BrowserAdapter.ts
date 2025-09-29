import type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig,
    BrowserDeviceInfo
} from './IPlatformAdapter';
import { createLogger, type ILogger } from '../Utils/Logger';

/**
 * 浏览器平台适配器
 * 支持标准Web API的浏览器环境
 */
export class BrowserAdapter implements IPlatformAdapter {
    public readonly name = 'browser';
    public readonly version = this.getBrowserVersion();
    private readonly logger: ILogger;

    constructor() {
        this.logger = createLogger('BrowserAdapter');
    }

    /**
     * 检查是否支持Worker
     */
    public isWorkerSupported(): boolean {
        return typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined';
    }

    /**
     * 检查是否支持SharedArrayBuffer
     */
    public isSharedArrayBufferSupported(): boolean {
        return typeof SharedArrayBuffer !== 'undefined' &&
               typeof self !== 'undefined' &&
               self.crossOriginIsolated === true;
    }

    /**
     * 获取硬件并发数
     */
    public getHardwareConcurrency(): number {
        if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
            return navigator.hardwareConcurrency;
        }
        return 4; // 默认值
    }

    /**
     * 创建Worker
     */
    public createWorker(script: string, options: WorkerCreationOptions = {}): PlatformWorker {
        const blob = new Blob([script], { type: 'application/javascript' });
        const scriptURL = URL.createObjectURL(blob);

        const worker = new Worker(scriptURL, {
            type: options.type || 'classic',
            credentials: options.credentials || 'same-origin',
            name: options.name
        });

        return new BrowserWorker(worker, scriptURL);
    }

    /**
     * 创建SharedArrayBuffer
     */
    public createSharedArrayBuffer(length: number): SharedArrayBuffer | null {
        if (!this.isSharedArrayBufferSupported()) {
            return null;
        }

        try {
            return new SharedArrayBuffer(length);
        } catch (error) {
            this.logger.warn('Failed to create SharedArrayBuffer:', error);
            return null;
        }
    }

    /**
     * 获取高精度时间戳
     */
    public getHighResTimestamp(): number {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        return Date.now();
    }

    /**
     * 获取平台配置
     */
    public getPlatformConfig(): PlatformConfig {
        return {
            maxWorkerCount: this.getHardwareConcurrency(),
            supportsModuleWorker: this.supportsModuleWorker(),
            supportsTransferableObjects: this.supportsTransferableObjects(),
            maxSharedArrayBufferSize: this.getMaxSharedArrayBufferSize(),
            workerScriptPrefix: '',
            limitations: {
                noEval: false,
                requiresWorkerInit: false
            },
            extensions: {
                supportsServiceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
                supportsWebAssembly: typeof WebAssembly !== 'undefined'
            }
        };
    }


    /**
     * 获取浏览器设备信息
     */
    public getDeviceInfo(): BrowserDeviceInfo {
        try {
            const deviceInfo: BrowserDeviceInfo = {};

            // 浏览器基础信息
            if (typeof navigator !== 'undefined') {
                deviceInfo.userAgent = navigator.userAgent;
                deviceInfo.vendor = navigator.vendor;
                deviceInfo.language = navigator.language;
                deviceInfo.languages = navigator.languages as string[];
                deviceInfo.cookieEnabled = navigator.cookieEnabled;
                deviceInfo.onLine = navigator.onLine;
                deviceInfo.doNotTrack = navigator.doNotTrack;
                deviceInfo.platform = navigator.platform;
                deviceInfo.appVersion = navigator.appVersion;
                deviceInfo.appName = navigator.appName;

                // 硬件信息
                deviceInfo.hardwareConcurrency = navigator.hardwareConcurrency;
                deviceInfo.maxTouchPoints = navigator.maxTouchPoints;

                // 设备内存（实验性API）
                if ('deviceMemory' in navigator) {
                    deviceInfo.deviceMemory = (navigator as any).deviceMemory;
                }

                // 网络连接信息（实验性API）
                if ('connection' in navigator) {
                    const connection = (navigator as any).connection;
                    deviceInfo.connection = {
                        effectiveType: connection.effectiveType,
                        downlink: connection.downlink,
                        rtt: connection.rtt,
                        saveData: connection.saveData
                    };
                }
            }

            // 屏幕信息
            if (typeof screen !== 'undefined') {
                deviceInfo.screenWidth = screen.width;
                deviceInfo.screenHeight = screen.height;
                deviceInfo.availWidth = screen.availWidth;
                deviceInfo.availHeight = screen.availHeight;
                deviceInfo.colorDepth = screen.colorDepth;
                deviceInfo.pixelDepth = screen.pixelDepth;
            }

            // 窗口信息
            if (typeof window !== 'undefined') {
                deviceInfo.innerWidth = window.innerWidth;
                deviceInfo.innerHeight = window.innerHeight;
                deviceInfo.outerWidth = window.outerWidth;
                deviceInfo.outerHeight = window.outerHeight;
                deviceInfo.devicePixelRatio = window.devicePixelRatio;
            }

            return deviceInfo;
        } catch (error) {
            this.logger.warn('获取浏览器设备信息失败', error);
            return {} as BrowserDeviceInfo;
        }
    }

    /**
     * 获取浏览器版本信息
     */
    private getBrowserVersion(): string {
        if (typeof navigator !== 'undefined') {
            return navigator.userAgent;
        }
        return 'unknown';
    }

    /**
     * 检查是否支持模块Worker
     */
    private supportsModuleWorker(): boolean {
        try {
            // 尝试创建一个简单的模块Worker来测试支持
            const blob = new Blob(['export {};'], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const worker = new Worker(url, { type: 'module' });
            worker.terminate();
            URL.revokeObjectURL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 检查是否支持Transferable Objects
     */
    private supportsTransferableObjects(): boolean {
        try {
            const buffer = new ArrayBuffer(8);
            const blob = new Blob(['self.postMessage(null);'], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const worker = new Worker(url);
            worker.postMessage(buffer, [buffer]);
            worker.terminate();
            URL.revokeObjectURL(url);
            return buffer.byteLength === 0; // Buffer应该被transfer走
        } catch {
            return false;
        }
    }

    /**
     * 获取SharedArrayBuffer最大大小限制
     */
    private getMaxSharedArrayBufferSize(): number {
        // 浏览器环境返回保守的默认值
        // 大多数现代浏览器都支持较大的SharedArrayBuffer
        return 256 * 1024 * 1024; // 256MB，适合大多数ECS应用场景
    }
}

/**
 * 浏览器Worker封装
 */
class BrowserWorker implements PlatformWorker {
    private _state: 'running' | 'terminated' = 'running';

    constructor(
        private worker: Worker,
        private scriptURL: string
    ) {}

    public get state(): 'running' | 'terminated' {
        return this._state;
    }

    public postMessage(message: any, transfer?: Transferable[]): void {
        if (this._state === 'terminated') {
            throw new Error('Worker has been terminated');
        }
        if (transfer && transfer.length > 0) {
            this.worker.postMessage(message, transfer);
        } else {
            this.worker.postMessage(message);
        }
    }

    public onMessage(handler: (event: { data: any }) => void): void {
        this.worker.onmessage = (event: MessageEvent) => {
            handler({ data: event.data });
        };
    }

    public onError(handler: (error: ErrorEvent) => void): void {
        this.worker.onerror = handler;
    }

    public terminate(): void {
        if (this._state === 'running') {
            this.worker.terminate();
            URL.revokeObjectURL(this.scriptURL);
            this._state = 'terminated';
        }
    }
}