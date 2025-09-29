/// <reference types="minigame-api-typings" />

import type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig,
    WeChatDeviceInfo
} from './IPlatformAdapter';
import { createLogger, type ILogger } from '../Utils/Logger';

/**
 * 微信小游戏平台适配器
 * 适配微信小游戏环境的特殊限制和API
 */
export class WeChatMiniGameAdapter implements IPlatformAdapter {
    public readonly name = 'wechat-minigame';
    public readonly version = this.getWeChatVersion();

    private readonly wx: WechatMinigame.Wx;
    private readonly logger: ILogger;

    constructor() {
        this.logger = createLogger('WeChatMiniGameAdapter');
        this.wx = (globalThis as any).wx;
        if (!this.wx) {
            throw new Error('微信小游戏环境未检测到wx对象');
        }
    }

    /**
     * 检查是否支持Worker
     * 微信小游戏虽然有Worker API，但限制太严格，对于动态ECS系统不实用
     */
    public isWorkerSupported(): boolean {
        // 虽然微信小游戏有Worker API，但由于以下限制，实际上不适用于动态ECS系统：
        // 1. 不能动态创建Worker脚本（必须预配置文件）
        // 2. 禁止eval（不能动态执行用户的处理函数）
        // 3. 需要用户手动配置game.json
        // 因此对于WorkerEntitySystem来说，认为不支持Worker
        return false;
    }

    /**
     * 检查是否支持SharedArrayBuffer
     * 微信小游戏不支持SharedArrayBuffer，因为：
     * 1. 不满足crossOriginIsolated要求
     * 2. 小游戏运行在受限沙箱环境中
     * 3. 出于安全考虑，微信限制了此API
     */
    public isSharedArrayBufferSupported(): boolean {
        // 微信小游戏明确不支持SharedArrayBuffer
        // 即使有API存在，也无法在沙箱环境中正常使用
        return false;
    }

    /**
     * 获取硬件并发数
     * 微信小游戏没有直接的CPU核心数API，返回保守的默认值
     * 用户应该根据自己的业务需求和测试结果来设置Worker数量
     */
    public getHardwareConcurrency(): number {
        // 微信小游戏平台返回保守的默认值
        // 用户可以通过getDevicePerformanceInfo()获取详细信息来自行判断
        return 4;
    }

    /**
     * 获取设备性能信息（供用户参考）
     * 用户可以根据这些信息自行决定Worker配置
     */
    public getDevicePerformanceInfo(): Promise<{
        benchmarkLevel?: number;
        modelLevel?: number;
        memorySize?: string;
        cpuType?: string;
        platform?: string;
        system?: string;
    }> {
        return new Promise((resolve) => {
            const result: any = {};

            // 获取设备基础信息
            if (typeof this.wx.getDeviceInfo === 'function') {
                try {
                    const deviceInfo = this.wx.getDeviceInfo();
                    Object.assign(result, {
                        memorySize: deviceInfo.memorySize,
                        cpuType: deviceInfo.cpuType,
                        platform: deviceInfo.platform,
                        system: deviceInfo.system,
                        benchmarkLevel: deviceInfo.benchmarkLevel
                    });
                } catch (error) {
                    this.logger.warn('获取设备信息失败', error);
                }
            }

            // 获取性能基准信息
            if (typeof this.wx.getDeviceBenchmarkInfo === 'function') {
                this.wx.getDeviceBenchmarkInfo({
                    success: (res) => {
                        result.benchmarkLevel = res.benchmarkLevel;
                        result.modelLevel = res.modelLevel;
                        resolve(result);
                    },
                    fail: () => {
                        resolve(result);
                    }
                });
            } else {
                resolve(result);
            }
        });
    }

    /**
     * 创建Worker
     * 微信小游戏不支持WorkerEntitySystem所需的动态Worker创建
     */
    public createWorker(_script: string, _options: WorkerCreationOptions = {}): PlatformWorker {
        throw new Error(
            '微信小游戏不支持WorkerEntitySystem。' +
            '原因：1) 不能动态创建Worker脚本 2) 禁止eval动态执行代码。' +
            'WorkerEntitySystem将自动降级到同步模式运行。'
        );
    }

    /**
     * 从预配置的文件路径创建Worker（仅供特殊用途）
     * 注意：这不适用于WorkerEntitySystem，仅供其他特殊Worker需求使用
     */
    public createWorkerFromPath(scriptPath: string, options: {
        useExperimentalWorker?: boolean;
        name?: string;
    } = {}): PlatformWorker {
        // 即使支持原生Worker API，也明确说明不适用于ECS
        this.logger.warn('微信小游戏Worker不适用于WorkerEntitySystem，建议使用同步模式');
        return new WeChatWorker(scriptPath, options, this.wx);
    }

    /**
     * 创建SharedArrayBuffer
     * 微信小游戏通常不支持，返回null
     */
    public createSharedArrayBuffer(length: number): SharedArrayBuffer | null {
        if (!this.isSharedArrayBufferSupported()) {
            this.logger.info('微信小游戏环境不支持SharedArrayBuffer，将使用Worker模式');
            return null;
        }

        try {
            return new SharedArrayBuffer(length);
        } catch (error) {
            this.logger.warn('SharedArrayBuffer创建失败', error);
            return null;
        }
    }

    /**
     * 获取高精度时间戳
     */
    public getHighResTimestamp(): number {
        // 微信小游戏支持performance.now()
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }

        // 备选方案：使用Date.now()
        return Date.now();
    }

    /**
     * 获取平台配置（同步版本，不包含异步获取的性能信息）
     */
    public getPlatformConfig(): PlatformConfig {
        return {
            maxWorkerCount: 0, // 不支持WorkerEntitySystem
            supportsModuleWorker: false,
            supportsTransferableObjects: false, // 对WorkerEntitySystem无意义
            maxSharedArrayBufferSize: 0, // 不支持SharedArrayBuffer
            workerScriptPrefix: '',
            limitations: {
                noEval: true, // 微信小游戏禁止eval
                requiresWorkerInit: true,
                // 明确说明Worker限制
                workerNotSupported: true,
                workerLimitations: [
                    '不能动态创建Worker脚本',
                    '禁止eval动态执行代码',
                    '必须预配置Worker文件路径',
                    '不适用于动态ECS系统'
                ]
            },
            extensions: {
                wechatVersion: this.version,
                supportedAPIs: this.getSupportedAPIs(),
                deviceInfo: this.getDeviceInfo()
            }
        };
    }

    /**
     * 异步获取平台配置（包含性能信息）
     */
    public async getPlatformConfigAsync(): Promise<PlatformConfig> {
        const baseConfig = this.getPlatformConfig();

        try {
            // 异步获取性能信息
            const performanceInfo = await this.getDevicePerformanceInfo();

            return {
                ...baseConfig,
                extensions: {
                    ...baseConfig.extensions,
                    performanceInfo
                }
            };
        } catch (error) {
            this.logger.warn('获取性能信息失败，返回基础配置', error);
            return baseConfig;
        }
    }



    /**
     * 获取微信版本信息
     */
    private getWeChatVersion(): string {
        try {
            const systemInfo = this.wx.getSystemInfoSync();
            return `WeChat ${systemInfo.version} (${systemInfo.platform})`;
        } catch {
            return 'WeChat Unknown';
        }
    }



    /**
     * 获取支持的API列表
     */
    private getSupportedAPIs(): string[] {
        const apis: string[] = [];

        // 检查常用的微信小游戏API
        const commonAPIs = [
            'getSystemInfo', 'createCanvas', 'createImage', 'createAudio',
            'createWorker', 'downloadFile', 'request', 'connectSocket',
            'setStorage', 'getStorage', 'showToast', 'showModal'
        ];

        for (const api of commonAPIs) {
            if (typeof (this.wx as any)[api] === 'function') {
                apis.push(api);
            }
        }

        return apis;
    }

    /**
     * 获取设备信息
     */
    public getDeviceInfo(): WeChatDeviceInfo {
        try {
            const deviceInfo: any = {};

            // 优先使用最新的设备信息API
            if (typeof this.wx.getDeviceInfo === 'function') {
                const info = this.wx.getDeviceInfo();
                Object.assign(deviceInfo, {
                    brand: info.brand,
                    model: info.model,
                    platform: info.platform,
                    system: info.system,
                    benchmarkLevel: info.benchmarkLevel,
                    cpuType: info.cpuType,
                    memorySize: info.memorySize,
                    deviceAbi: info.deviceAbi,
                    abi: info.abi
                });
            }

            // 获取设备性能基准信息
            if (typeof this.wx.getDeviceBenchmarkInfo === 'function') {
                this.wx.getDeviceBenchmarkInfo({
                    success: (res) => {
                        deviceInfo.benchmarkLevel = res.benchmarkLevel;
                        deviceInfo.modelLevel = res.modelLevel;
                    }
                });
            }

            // 获取窗口信息
            if (typeof this.wx.getWindowInfo === 'function') {
                const windowInfo = this.wx.getWindowInfo();
                Object.assign(deviceInfo, {
                    screenWidth: windowInfo.screenWidth,
                    screenHeight: windowInfo.screenHeight,
                    screenTop: windowInfo.screenTop,
                    windowWidth: windowInfo.windowWidth,
                    windowHeight: windowInfo.windowHeight,
                    pixelRatio: windowInfo.pixelRatio,
                    statusBarHeight: windowInfo.statusBarHeight,
                    safeArea: windowInfo.safeArea
                });
            }

            // 获取应用基础信息
            if (typeof this.wx.getAppBaseInfo === 'function') {
                try {
                    const appInfo = this.wx.getAppBaseInfo();
                    Object.assign(deviceInfo, {
                        version: appInfo.version,
                        language: appInfo.language,
                        theme: appInfo.theme,
                        SDKVersion: appInfo.SDKVersion,
                        enableDebug: appInfo.enableDebug,
                        fontSizeSetting: appInfo.fontSizeSetting,
                        // host是一个对象，不是hostName
                        host: appInfo.host
                    });
                } catch (error) {
                    this.logger.warn('获取应用基础信息失败', error);
                }
            }

            // 如果新API不完整，才使用废弃API作为兜底
            if (Object.keys(deviceInfo).length === 0 && typeof this.wx.getSystemInfoSync === 'function') {
                this.logger.warn('新API不可用，使用废弃的getSystemInfoSync作为兜底');
                try {
                    const systemInfo = this.wx.getSystemInfoSync();
                    return {
                        brand: systemInfo.brand,
                        model: systemInfo.model,
                        platform: systemInfo.platform,
                        system: systemInfo.system,
                        version: systemInfo.version,
                        benchmarkLevel: systemInfo.benchmarkLevel,
                        screenWidth: systemInfo.screenWidth,
                        screenHeight: systemInfo.screenHeight,
                        pixelRatio: systemInfo.pixelRatio
                    } as WeChatDeviceInfo;
                } catch (error) {
                    this.logger.error('所有获取设备信息的方法都失败了', error);
                    return {} as WeChatDeviceInfo;
                }
            }

            return deviceInfo as WeChatDeviceInfo;
        } catch (error) {
            this.logger.warn('获取设备信息失败', error);
            return {} as WeChatDeviceInfo;
        }
    }

}

/**
 * 微信小游戏Worker封装
 */
class WeChatWorker implements PlatformWorker {
    private _state: 'running' | 'terminated' = 'running';
    private worker!: WechatMinigame.Worker;
    private readonly logger: ILogger;

    constructor(
        private scriptPath: string,
        private options: { useExperimentalWorker?: boolean; name?: string },
        private wx: WechatMinigame.Wx
    ) {
        this.logger = createLogger('WeChatWorker');
        this.createWeChatWorker();
    }

    public get state(): 'running' | 'terminated' {
        return this._state;
    }

    public postMessage(message: any, _transfer?: Transferable[]): void {
        if (this._state === 'terminated') {
            throw new Error('Worker已被终止');
        }

        if (this.worker) {
            this.worker.postMessage(message);
        }
    }

    public onMessage(handler: (event: { data: any }) => void): void {
        if (this.worker) {
            this.worker.onMessage((data: any) => {
                handler({ data });
            });
        }
    }

    public onError(handler: (error: ErrorEvent) => void): void {
        if (this.worker) {
            this.worker.onError((error: any) => {
                // 转换微信错误格式为标准ErrorEvent格式
                const errorEvent = new ErrorEvent('error', {
                    message: error.message || '微信Worker错误',
                    filename: error.filename || '',
                    lineno: error.lineno || 0,
                    colno: error.colno || 0,
                    error: error
                });
                handler(errorEvent);
            });
        }
    }

    public terminate(): void {
        if (this._state === 'running' && this.worker) {
            this.worker.terminate();
            this._state = 'terminated';
        }
    }

    /**
     * 创建微信Worker
     * 使用预配置的Worker脚本文件路径
     */
    private createWeChatWorker(): void {
        try {
            // 使用微信小游戏的createWorker API，传入预配置的脚本路径
            this.worker = this.wx.createWorker(this.scriptPath, {
                useExperimentalWorker: this.options.useExperimentalWorker || false
            });

            // 监听Worker被系统回收事件（实验性Worker特有）
            if (this.options.useExperimentalWorker && this.worker.onProcessKilled) {
                this.worker.onProcessKilled(() => {
                    this.logger.warn(`微信Worker ${this.scriptPath} 被系统回收`);
                    this._state = 'terminated';
                });
            }

        } catch (error) {
            this.logger.error('创建微信Worker失败:', error);
            throw new Error(
                `无法创建微信Worker: ${error}。` +
                `请确保已在game.json中配置workers字段，并且Worker文件 ${this.scriptPath} 存在。`
            );
        }
    }
}