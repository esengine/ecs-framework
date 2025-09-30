import type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig
} from '@esengine/ecs-framework';

/**
 * 浏览器平台适配器
 */
export class BrowserAdapter implements IPlatformAdapter {
    public readonly name = 'browser';
    public readonly version: string;

    constructor() {
        this.version = this.getBrowserInfo();
    }

    /**
     * 检查是否支持Worker
     */
    public isWorkerSupported(): boolean {
        return typeof Worker !== 'undefined';
    }

    /**
     * 检查是否支持SharedArrayBuffer
     */
    public isSharedArrayBufferSupported(): boolean {
        return typeof SharedArrayBuffer !== 'undefined' && this.checkSharedArrayBufferEnabled();
    }

    /**
     * 获取硬件并发数（CPU核心数）
     */
    public getHardwareConcurrency(): number {
        return navigator.hardwareConcurrency || 4;
    }

    /**
     * 创建Worker
     */
    public createWorker(script: string, options: WorkerCreationOptions = {}): PlatformWorker {
        if (!this.isWorkerSupported()) {
            throw new Error('浏览器不支持Worker');
        }

        try {
            return new BrowserWorker(script, options);
        } catch (error) {
            throw new Error(`创建浏览器Worker失败: ${(error as Error).message}`);
        }
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
            console.warn('SharedArrayBuffer创建失败:', error);
            return null;
        }
    }

    /**
     * 获取高精度时间戳
     */
    public getHighResTimestamp(): number {
        return performance.now();
    }

    /**
     * 获取平台配置
     */
    public getPlatformConfig(): PlatformConfig {
        return {
            maxWorkerCount: this.getHardwareConcurrency(),
            supportsModuleWorker: false,
            supportsTransferableObjects: true,
            maxSharedArrayBufferSize: 1024 * 1024 * 1024, // 1GB
            workerScriptPrefix: '',
            limitations: {
                noEval: false,
                requiresWorkerInit: false
            }
        };
    }

    /**
     * 获取浏览器信息
     */
    private getBrowserInfo(): string {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) {
            const match = userAgent.match(/Chrome\/([0-9.]+)/);
            return match ? `Chrome ${match[1]}` : 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            const match = userAgent.match(/Firefox\/([0-9.]+)/);
            return match ? `Firefox ${match[1]}` : 'Firefox';
        } else if (userAgent.includes('Safari')) {
            const match = userAgent.match(/Version\/([0-9.]+)/);
            return match ? `Safari ${match[1]}` : 'Safari';
        }
        return 'Unknown Browser';
    }

    /**
     * 检查SharedArrayBuffer是否真正可用
     */
    private checkSharedArrayBufferEnabled(): boolean {
        try {
            new SharedArrayBuffer(8);
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * 浏览器Worker封装
 */
class BrowserWorker implements PlatformWorker {
    private _state: 'running' | 'terminated' = 'running';
    private worker: Worker;

    constructor(script: string, options: WorkerCreationOptions = {}) {
        this.worker = this.createBrowserWorker(script, options);
    }

    public get state(): 'running' | 'terminated' {
        return this._state;
    }

    public postMessage(message: any, transfer?: Transferable[]): void {
        if (this._state === 'terminated') {
            throw new Error('Worker已被终止');
        }

        try {
            if (transfer && transfer.length > 0) {
                this.worker.postMessage(message, transfer);
            } else {
                this.worker.postMessage(message);
            }
        } catch (error) {
            throw new Error(`发送消息到Worker失败: ${(error as Error).message}`);
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
            try {
                this.worker.terminate();
                this._state = 'terminated';
            } catch (error) {
                console.error('终止Worker失败:', error);
            }
        }
    }

    /**
     * 创建浏览器Worker
     */
    private createBrowserWorker(script: string, options: WorkerCreationOptions): Worker {
        try {
            // 创建Blob URL
            const blob = new Blob([script], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);

            // 创建Worker
            const worker = new Worker(url, {
                type: options.type || 'classic',
                credentials: options.credentials,
                name: options.name
            });

            // 清理Blob URL（延迟清理，确保Worker已加载）
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            return worker;
        } catch (error) {
            throw new Error(`无法创建浏览器Worker: ${(error as Error).message}`);
        }
    }
}