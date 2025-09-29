/**
 * 平台适配器接口
 * 用于适配不同的运行环境（浏览器、微信小游戏、字节跳动小游戏等）
 */
export interface IPlatformAdapter {
    /**
     * 平台名称
     */
    readonly name: string;

    /**
     * 平台版本信息
     */
    readonly version?: string;

    /**
     * 检查是否支持Worker
     */
    isWorkerSupported(): boolean;

    /**
     * 检查是否支持SharedArrayBuffer
     */
    isSharedArrayBufferSupported(): boolean;

    /**
     * 获取硬件并发数（CPU核心数）
     */
    getHardwareConcurrency(): number;

    /**
     * 创建Worker
     * @param script Worker脚本内容
     * @param options Worker选项
     */
    createWorker(script: string, options?: WorkerCreationOptions): PlatformWorker;

    /**
     * 创建SharedArrayBuffer
     * @param length 缓冲区大小（字节）
     */
    createSharedArrayBuffer(length: number): SharedArrayBuffer | null;

    /**
     * 获取高精度时间戳
     */
    getHighResTimestamp(): number;

    /**
     * 获取平台特定的配置
     */
    getPlatformConfig(): PlatformConfig;

    /**
     * 异步获取平台配置（包含需要异步获取的信息）
     */
    getPlatformConfigAsync?(): Promise<PlatformConfig>;
}

/**
 * Worker创建选项
 */
export interface WorkerCreationOptions {
    /**
     * Worker类型
     */
    type?: 'classic' | 'module';

    /**
     * 凭据模式
     */
    credentials?: 'omit' | 'same-origin' | 'include';

    /**
     * Worker名称（用于调试）
     */
    name?: string;
}

/**
 * 平台Worker接口
 */
export interface PlatformWorker {
    /**
     * 发送消息到Worker
     */
    postMessage(message: any, transfer?: Transferable[]): void;

    /**
     * 监听Worker消息
     */
    onMessage(handler: (event: { data: any }) => void): void;

    /**
     * 监听Worker错误
     */
    onError(handler: (error: ErrorEvent) => void): void;

    /**
     * 终止Worker
     */
    terminate(): void;

    /**
     * Worker状态
     */
    readonly state: 'running' | 'terminated';
}

/**
 * 平台配置
 */
export interface PlatformConfig {
    /**
     * 最大Worker数量限制
     */
    maxWorkerCount: number;

    /**
     * 是否支持模块Worker
     */
    supportsModuleWorker: boolean;

    /**
     * 是否支持Transferable Objects
     */
    supportsTransferableObjects: boolean;

    /**
     * SharedArrayBuffer的最大大小限制（字节）
     */
    maxSharedArrayBufferSize?: number;

    /**
     * 平台特定的Worker脚本前缀（如果需要）
     */
    workerScriptPrefix?: string;

    /**
     * 平台特定的限制和特性
     */
    limitations?: {
        /**
         * 是否禁用eval（影响动态脚本创建）
         */
        noEval?: boolean;

        /**
         * 是否需要特殊的Worker初始化
         */
        requiresWorkerInit?: boolean;

        /**
         * 内存限制（字节）
         */
        memoryLimit?: number;

        /**
         * Worker是否不受支持（用于明确标记不支持Worker的平台）
         */
        workerNotSupported?: boolean;

        /**
         * Worker限制说明列表
         */
        workerLimitations?: string[];
    };

    /**
     * 平台特定的扩展属性
     */
    extensions?: Record<string, any>;
}

/**
 * 平台检测结果
 */
export interface PlatformDetectionResult {
    /**
     * 平台类型
     */
    platform: 'browser' | 'wechat-minigame' | 'bytedance-minigame' | 'alipay-minigame' | 'baidu-minigame' | 'unknown';

    /**
     * 是否确定检测结果
     */
    confident: boolean;

    /**
     * 检测到的特征
     */
    features: string[];

    /**
     * 建议使用的适配器类名
     */
    adapterClass?: string;
}

/**
 * 微信小游戏设备信息接口
 */
export interface WeChatDeviceInfo {
    // 设备基础信息
    brand?: string;
    model?: string;
    platform?: string;
    system?: string;
    benchmarkLevel?: number;
    cpuType?: string;
    memorySize?: string;
    deviceAbi?: string;
    abi?: string;

    // 窗口信息
    screenWidth?: number;
    screenHeight?: number;
    screenTop?: number;
    windowWidth?: number;
    windowHeight?: number;
    pixelRatio?: number;
    statusBarHeight?: number;
    safeArea?: {
        top: number;
        bottom: number;
        left: number;
        right: number;
        width: number;
        height: number;
    };

    // 应用信息
    version?: string;
    language?: string;
    theme?: string;
    SDKVersion?: string;
    enableDebug?: boolean;
    fontSizeSetting?: number;
    host?: {
        appId: string;
    };
}

/**
 * 浏览器设备信息接口
 */
export interface BrowserDeviceInfo {
    // 浏览器信息
    userAgent?: string;
    vendor?: string;
    language?: string;
    languages?: string[];
    cookieEnabled?: boolean;
    onLine?: boolean;
    doNotTrack?: string | null;

    // 硬件信息
    hardwareConcurrency?: number;
    deviceMemory?: number;
    maxTouchPoints?: number;

    // 屏幕信息
    screenWidth?: number;
    screenHeight?: number;
    availWidth?: number;
    availHeight?: number;
    colorDepth?: number;
    pixelDepth?: number;

    // 窗口信息
    innerWidth?: number;
    innerHeight?: number;
    outerWidth?: number;
    outerHeight?: number;
    devicePixelRatio?: number;

    // 连接信息（如果支持）
    connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
    };

    // 平台信息
    platform?: string;
    appVersion?: string;
    appName?: string;
}