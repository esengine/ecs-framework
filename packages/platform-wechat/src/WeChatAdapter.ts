/**
 * 微信小游戏平台适配器
 */

import type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig
} from '@esengine/ecs-framework';

import type { SystemInfo } from '@esengine/platform-common';

import { WeChatCanvasSubsystem } from './subsystems/WeChatCanvasSubsystem';
import { WeChatAudioSubsystem } from './subsystems/WeChatAudioSubsystem';
import { WeChatStorageSubsystem } from './subsystems/WeChatStorageSubsystem';
import { WeChatNetworkSubsystem } from './subsystems/WeChatNetworkSubsystem';
import { WeChatInputSubsystem } from './subsystems/WeChatInputSubsystem';
import { WeChatFileSubsystem } from './subsystems/WeChatFileSubsystem';
import { WeChatWASMSubsystem } from './subsystems/WeChatWASMSubsystem';
import { getWx, isWeChatMiniGame } from './utils';

/**
 * 微信小游戏 Worker 包装
 */
class WeChatWorker implements PlatformWorker {
    private _worker: WechatMinigame.Worker;
    private _state: 'running' | 'terminated' = 'running';

    constructor(worker: WechatMinigame.Worker) {
        this._worker = worker;
    }

    get state(): 'running' | 'terminated' {
        return this._state;
    }

    postMessage(message: any, _transfer?: Transferable[]): void {
        this._worker.postMessage(message);
    }

    onMessage(handler: (event: { data: any }) => void): void {
        this._worker.onMessage((res) => {
            handler({ data: res });
        });
    }

    onError(handler: (error: ErrorEvent) => void): void {
        this._worker.onError((error) => {
            handler(error as unknown as ErrorEvent);
        });
    }

    terminate(): void {
        this._worker.terminate();
        this._state = 'terminated';
    }
}

/**
 * 微信小游戏平台适配器
 */
export class WeChatAdapter implements IPlatformAdapter {
    readonly name = 'wechat-minigame';
    readonly version: string;

    // 子系统实例
    private _canvas: WeChatCanvasSubsystem | null = null;
    private _audio: WeChatAudioSubsystem | null = null;
    private _storage: WeChatStorageSubsystem | null = null;
    private _network: WeChatNetworkSubsystem | null = null;
    private _input: WeChatInputSubsystem | null = null;
    private _file: WeChatFileSubsystem | null = null;
    private _wasm: WeChatWASMSubsystem | null = null;

    private _deviceInfo: WechatMinigame.DeviceInfo | null = null;
    private _windowInfo: WechatMinigame.WindowInfo | null = null;
    private _appBaseInfo: WechatMinigame.AppBaseInfo | null = null;

    constructor() {
        if (!isWeChatMiniGame()) {
            throw new Error('当前环境不是微信小游戏环境');
        }

        // 使用新的分离 API 获取系统信息
        const wxApi = getWx();
        this._deviceInfo = wxApi.getDeviceInfo();
        this._windowInfo = wxApi.getWindowInfo();
        this._appBaseInfo = wxApi.getAppBaseInfo();
        this.version = this._appBaseInfo.SDKVersion;
    }

    // ========================================================================
    // IPlatformAdapter 基础实现
    // ========================================================================

    isWorkerSupported(): boolean {
        // 微信小游戏支持 Worker，但有限制
        return typeof getWx().createWorker === 'function';
    }

    isSharedArrayBufferSupported(): boolean {
        // 微信小游戏不支持 SharedArrayBuffer
        return false;
    }

    getHardwareConcurrency(): number {
        // 微信小游戏无法获取真实核心数，返回保守值
        return 2;
    }

    createWorker(script: string, options?: WorkerCreationOptions): PlatformWorker {
        // 微信小游戏 Worker 需要指定文件路径，不支持内联脚本
        // script 参数应该是 worker 文件的路径
        const worker = getWx().createWorker(script, {
            useExperimentalWorker: true
        });

        return new WeChatWorker(worker);
    }

    createSharedArrayBuffer(_length: number): SharedArrayBuffer | null {
        // 微信小游戏不支持 SharedArrayBuffer
        return null;
    }

    getHighResTimestamp(): number {
        return Date.now();
    }

    getPlatformConfig(): PlatformConfig {
        return {
            maxWorkerCount: 1,
            supportsModuleWorker: false,
            supportsTransferableObjects: true,
            maxSharedArrayBufferSize: 0,
            workerScriptPrefix: '',
            limitations: {
                noEval: true,
                requiresWorkerInit: true,
                memoryLimit: this._deviceInfo?.memorySize
                    ? parseInt(String(this._deviceInfo.memorySize)) * 1024 * 1024
                    : 256 * 1024 * 1024,
                workerNotSupported: false,
                workerLimitations: [
                    'Worker 必须使用独立文件，不支持内联脚本',
                    '仅支持 1 个 Worker 实例',
                    '不支持 SharedArrayBuffer',
                    'Worker 文件需要在 game.json 中配置'
                ]
            },
            extensions: {
                platform: 'wechat-minigame',
                sdkVersion: this._appBaseInfo?.SDKVersion
            }
        };
    }

    async getPlatformConfigAsync(): Promise<PlatformConfig> {
        return this.getPlatformConfig();
    }

    // ========================================================================
    // 子系统访问器
    // ========================================================================

    /**
     * 获取 Canvas 子系统
     */
    get canvas(): WeChatCanvasSubsystem {
        if (!this._canvas) {
            this._canvas = new WeChatCanvasSubsystem();
        }
        return this._canvas;
    }

    /**
     * 获取音频子系统
     */
    get audio(): WeChatAudioSubsystem {
        if (!this._audio) {
            this._audio = new WeChatAudioSubsystem();
        }
        return this._audio;
    }

    /**
     * 获取存储子系统
     */
    get storage(): WeChatStorageSubsystem {
        if (!this._storage) {
            this._storage = new WeChatStorageSubsystem();
        }
        return this._storage;
    }

    /**
     * 获取网络子系统
     */
    get network(): WeChatNetworkSubsystem {
        if (!this._network) {
            this._network = new WeChatNetworkSubsystem();
        }
        return this._network;
    }

    /**
     * 获取输入子系统
     */
    get input(): WeChatInputSubsystem {
        if (!this._input) {
            this._input = new WeChatInputSubsystem();
        }
        return this._input;
    }

    /**
     * 获取文件系统子系统
     */
    get file(): WeChatFileSubsystem {
        if (!this._file) {
            this._file = new WeChatFileSubsystem();
        }
        return this._file;
    }

    /**
     * 获取 WASM 子系统
     */
    get wasm(): WeChatWASMSubsystem {
        if (!this._wasm) {
            this._wasm = new WeChatWASMSubsystem();
        }
        return this._wasm;
    }

    // ========================================================================
    // 系统信息
    // ========================================================================

    /**
     * 获取系统信息
     */
    getSystemInfo(): SystemInfo {
        const device = this._deviceInfo!;
        const window = this._windowInfo!;
        const app = this._appBaseInfo!;

        return {
            brand: device.brand,
            model: device.model,
            pixelRatio: window.pixelRatio,
            screenWidth: window.screenWidth,
            screenHeight: window.screenHeight,
            windowWidth: window.windowWidth,
            windowHeight: window.windowHeight,
            statusBarHeight: window.statusBarHeight || 0,
            system: device.system,
            platform: device.platform as SystemInfo['platform'],
            SDKVersion: app.SDKVersion,
            benchmarkLevel: device.benchmarkLevel || 0,
            memorySize: device.memorySize ? parseInt(String(device.memorySize)) : undefined
        };
    }

    /**
     * 比较基础库版本
     */
    compareVersion(v1: string, v2: string): number {
        const a1 = v1.split('.').map(Number);
        const a2 = v2.split('.').map(Number);
        const len = Math.max(a1.length, a2.length);

        for (let i = 0; i < len; i++) {
            const n1 = a1[i] || 0;
            const n2 = a2[i] || 0;
            if (n1 > n2) return 1;
            if (n1 < n2) return -1;
        }
        return 0;
    }

    /**
     * 检查是否支持某个 API
     */
    canIUse(schema: string): boolean {
        return getWx().canIUse(schema);
    }
}
