import type { IPlatformAdapter } from './IPlatformAdapter';
import { PlatformDetector } from './PlatformDetector';
import { BrowserAdapter } from './BrowserAdapter';
import { WeChatMiniGameAdapter } from './WeChatMiniGameAdapter';
import { createLogger, type ILogger } from '../Utils/Logger';

/**
 * 平台管理器
 * 负责自动检测平台并提供对应的适配器
 */
export class PlatformManager {
    private static instance: PlatformManager;
    private adapter: IPlatformAdapter | null = null;
    private detectionResult: any = null;
    private readonly logger: ILogger;

    private constructor() {
        this.logger = createLogger('PlatformManager');
        this.detectAndInitialize();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): PlatformManager {
        if (!PlatformManager.instance) {
            PlatformManager.instance = new PlatformManager();
        }
        return PlatformManager.instance;
    }

    /**
     * 获取当前平台适配器
     */
    public getAdapter(): IPlatformAdapter {
        if (!this.adapter) {
            throw new Error('平台适配器未初始化，请检查平台环境');
        }
        return this.adapter;
    }

    /**
     * 获取平台检测结果
     */
    public getDetectionResult() {
        return this.detectionResult;
    }

    /**
     * 手动设置适配器（用于测试或特殊情况）
     */
    public setAdapter(adapter: IPlatformAdapter): void {
        this.adapter = adapter;
    }

    /**
     * 检测平台并初始化对应的适配器
     */
    private detectAndInitialize(): void {
        this.detectionResult = PlatformDetector.detect();

        try {
            switch (this.detectionResult.platform) {
                case 'wechat-minigame':
                    this.adapter = new WeChatMiniGameAdapter();
                    break;

                case 'bytedance-minigame':
                    // TODO: 实现字节跳动小游戏适配器
                    this.logger.warn('字节跳动小游戏适配器尚未实现，降级到浏览器适配器');
                    this.adapter = new BrowserAdapter();
                    break;

                case 'alipay-minigame':
                    // TODO: 实现支付宝小游戏适配器
                    this.logger.warn('支付宝小游戏适配器尚未实现，降级到浏览器适配器');
                    this.adapter = new BrowserAdapter();
                    break;

                case 'baidu-minigame':
                    // TODO: 实现百度小游戏适配器
                    this.logger.warn('百度小游戏适配器尚未实现，降级到浏览器适配器');
                    this.adapter = new BrowserAdapter();
                    break;

                case 'browser':
                default:
                    this.adapter = new BrowserAdapter();
                    break;
            }

            // 输出初始化信息
            this.logInitializationInfo();

        } catch (error) {
            this.logger.error('平台适配器初始化失败:', error);
            // 降级到浏览器适配器
            this.adapter = new BrowserAdapter();
        }
    }

    /**
     * 输出初始化信息
     */
    private logInitializationInfo(): void {
        if (!this.adapter) return;

        const config = this.adapter.getPlatformConfig();

        this.logger.info(`平台适配器初始化完成:`, {
            platform: this.detectionResult.platform,
            adapterName: this.adapter.name,
            version: this.adapter.version,
            features: this.detectionResult.features,
            config: {
                maxWorkerCount: config.maxWorkerCount,
                supportsSharedArrayBuffer: this.adapter.isSharedArrayBufferSupported(),
                supportsWorker: this.adapter.isWorkerSupported(),
                hardwareConcurrency: this.adapter.getHardwareConcurrency()
            }
        });
    }

    /**
     * 获取详细的平台信息（用于调试）
     */
    public getDetailedInfo(): any {
        return {
            detectionResult: this.detectionResult,
            detailedInfo: PlatformDetector.getDetailedInfo(),
            adapterInfo: this.adapter ? {
                name: this.adapter.name,
                version: this.adapter.version,
                config: this.adapter.getPlatformConfig()
            } : null
        };
    }

    /**
     * 检查当前平台是否支持特定功能
     */
    public supportsFeature(feature: 'worker' | 'shared-array-buffer' | 'transferable-objects' | 'module-worker'): boolean {
        if (!this.adapter) return false;

        const config = this.adapter.getPlatformConfig();

        switch (feature) {
            case 'worker':
                return this.adapter.isWorkerSupported();
            case 'shared-array-buffer':
                return this.adapter.isSharedArrayBufferSupported();
            case 'transferable-objects':
                return config.supportsTransferableObjects;
            case 'module-worker':
                return config.supportsModuleWorker;
            default:
                return false;
        }
    }

    /**
     * 获取基础的Worker配置信息（不做自动决策）
     * 用户应该根据自己的业务需求来配置Worker参数
     */
    public getBasicWorkerConfig(): {
        platformSupportsWorker: boolean;
        platformSupportsSharedArrayBuffer: boolean;
        platformMaxWorkerCount: number;
        platformLimitations: any;
    } {
        if (!this.adapter) {
            return {
                platformSupportsWorker: false,
                platformSupportsSharedArrayBuffer: false,
                platformMaxWorkerCount: 1,
                platformLimitations: {}
            };
        }

        const config = this.adapter.getPlatformConfig();

        return {
            platformSupportsWorker: this.adapter.isWorkerSupported(),
            platformSupportsSharedArrayBuffer: this.adapter.isSharedArrayBufferSupported(),
            platformMaxWorkerCount: config.maxWorkerCount,
            platformLimitations: config.limitations || {}
        };
    }

    /**
     * 异步获取完整的平台配置信息（包含性能信息）
     */
    public async getFullPlatformConfig(): Promise<any> {
        if (!this.adapter) {
            return null;
        }

        // 如果适配器支持异步获取配置，使用异步方法
        if (typeof this.adapter.getPlatformConfigAsync === 'function') {
            return await this.adapter.getPlatformConfigAsync();
        }

        // 否则返回同步配置
        return this.adapter.getPlatformConfig();
    }
}