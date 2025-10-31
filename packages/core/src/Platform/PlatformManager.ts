import type { IPlatformAdapter } from './IPlatformAdapter';
import { createLogger, type ILogger } from '../Utils/Logger';

/**
 * 平台管理器
 * 用户需要手动注册平台适配器
 */
export class PlatformManager {
    private static instance: PlatformManager;
    private adapter: IPlatformAdapter | null = null;
    private readonly logger: ILogger;

    private constructor() {
        this.logger = createLogger('PlatformManager');
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
            throw new Error('平台适配器未注册，请调用 registerAdapter() 注册适配器');
        }
        return this.adapter;
    }

    /**
     * 注册平台适配器
     */
    public registerAdapter(adapter: IPlatformAdapter): void {
        this.adapter = adapter;
        this.logger.info(`平台适配器已注册: ${adapter.name}`, {
            name: adapter.name,
            version: adapter.version,
            supportsWorker: adapter.isWorkerSupported(),
            supportsSharedArrayBuffer: adapter.isSharedArrayBufferSupported(),
            hardwareConcurrency: adapter.getHardwareConcurrency()
        });
    }

    /**
     * 检查是否已注册适配器
     */
    public hasAdapter(): boolean {
        return this.adapter !== null;
    }


    /**
     * 获取平台适配器信息（用于调试）
     */
    public getAdapterInfo(): any {
        return this.adapter ? {
            name: this.adapter.name,
            version: this.adapter.version,
            config: this.adapter.getPlatformConfig()
        } : null;
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
            throw new Error('平台适配器未注册');
        }

        // 如果适配器支持异步获取配置，使用异步方法
        if (typeof this.adapter.getPlatformConfigAsync === 'function') {
            return await this.adapter.getPlatformConfigAsync();
        }

        // 否则返回同步配置
        return this.adapter.getPlatformConfig();
    }
}
