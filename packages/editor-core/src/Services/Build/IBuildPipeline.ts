/**
 * Build Pipeline Interface.
 * 构建管线接口。
 *
 * Defines the common process and configuration for platform builds.
 * 定义平台构建的通用流程和配置。
 */

/**
 * Build target platform.
 * 构建目标平台。
 */
export enum BuildPlatform {
    /** Web/H5 browser | Web/H5 浏览器 */
    Web = 'web',
    /** WeChat MiniGame | 微信小游戏 */
    WeChatMiniGame = 'wechat-minigame',
    /** ByteDance MiniGame | 字节跳动小游戏 */
    ByteDanceMiniGame = 'bytedance-minigame',
    /** Alipay MiniGame | 支付宝小游戏 */
    AlipayMiniGame = 'alipay-minigame',
    /** Desktop application (Tauri) | 桌面应用 (Tauri) */
    Desktop = 'desktop',
    /** Android | Android */
    Android = 'android',
    /** iOS | iOS */
    iOS = 'ios'
}

/**
 * Build status.
 * 构建状态。
 */
export enum BuildStatus {
    /** Idle | 空闲 */
    Idle = 'idle',
    /** Preparing | 准备中 */
    Preparing = 'preparing',
    /** Compiling | 编译中 */
    Compiling = 'compiling',
    /** Packaging assets | 打包资源 */
    Packaging = 'packaging',
    /** Copying files | 复制文件 */
    Copying = 'copying',
    /** Post-processing | 后处理 */
    PostProcessing = 'post-processing',
    /** Completed | 完成 */
    Completed = 'completed',
    /** Failed | 失败 */
    Failed = 'failed',
    /** Cancelled | 已取消 */
    Cancelled = 'cancelled'
}

/**
 * Build progress information.
 * 构建进度信息。
 */
export interface BuildProgress {
    /** Current status | 当前状态 */
    status: BuildStatus;
    /** Current step description | 当前步骤描述 */
    message: string;
    /** Overall progress (0-100) | 总体进度 (0-100) */
    progress: number;
    /** Current step index | 当前步骤索引 */
    currentStep: number;
    /** Total step count | 总步骤数 */
    totalSteps: number;
    /** Warning list | 警告列表 */
    warnings: string[];
    /** Error message (if failed) | 错误信息（如果失败） */
    error?: string;
}

/**
 * Build configuration base class.
 * 构建配置基类。
 */
export interface BuildConfig {
    /** Target platform | 目标平台 */
    platform: BuildPlatform;
    /** Output directory | 输出目录 */
    outputPath: string;
    /** Whether release build (compression, optimization) | 是否为发布构建（压缩、优化） */
    isRelease: boolean;
    /** Whether to generate source map | 是否生成 source map */
    sourceMap: boolean;
    /** Scene list to include (empty means all) | 要包含的场景列表（空表示全部） */
    scenes?: string[];
    /** Plugin list to include (empty means all enabled) | 要包含的插件列表（空表示全部启用的） */
    plugins?: string[];
    /**
     * Enabled module IDs (whitelist approach).
     * 启用的模块 ID 列表（白名单方式）。
     * If set, only these modules will be included.
     * 如果设置，只会包含这些模块。
     */
    enabledModules?: string[];
    /**
     * Disabled module IDs (blacklist approach).
     * 禁用的模块 ID 列表（黑名单方式）。
     * If set, all modules EXCEPT these will be included.
     * 如果设置，会包含除了这些之外的所有模块。
     * Takes precedence over enabledModules.
     * 优先于 enabledModules。
     */
    disabledModules?: string[];
}

/**
 * Web build mode.
 * Web 构建模式。
 */
export type WebBuildMode =
    /** Single bundle: All code in one file, best for small games/playable ads
     *  单包模式：所有代码打包到一个文件，适合小游戏/可玩广告 */
    | 'single-bundle'
    /** Split bundles: Core + plugins loaded on demand, best for production games
     *  分包模式：核心包 + 插件按需加载，适合正式游戏 */
    | 'split-bundles';

/**
 * Web platform build configuration.
 * Web 平台构建配置。
 */
export interface WebBuildConfig extends BuildConfig {
    platform: BuildPlatform.Web;

    /**
     * Build mode.
     * 构建模式。
     * - 'single-bundle': All code in one file (~500KB), single request, best for small games
     * - 'split-bundles': Core (~150KB) + plugins on demand, better caching, best for production
     * Default: 'split-bundles'
     */
    buildMode: WebBuildMode;

    /**
     * Whether to minify output.
     * 是否压缩输出。
     * Default: true for release builds
     */
    minify?: boolean;

    /**
     * Whether to generate HTML file.
     * 是否生成 HTML 文件。
     */
    generateHtml: boolean;

    /**
     * HTML template path.
     * HTML 模板路径。
     */
    htmlTemplate?: string;

    /**
     * Asset loading strategy.
     * 资产加载策略。
     * - 'preload': Load all assets before game starts (best for small games)
     * - 'on-demand': Load assets when needed (best for large games)
     * Default: 'on-demand'
     */
    assetLoadingStrategy?: 'preload' | 'on-demand';

    /**
     * Whether to generate asset catalog.
     * 是否生成资产清单。
     * Default: true
     */
    generateAssetCatalog?: boolean;

}

/**
 * WeChat MiniGame build configuration.
 * 微信小游戏构建配置。
 */
export interface WeChatBuildConfig extends BuildConfig {
    platform: BuildPlatform.WeChatMiniGame;
    /** AppID | AppID */
    appId: string;
    /** Whether to use subpackages | 是否分包 */
    useSubpackages: boolean;
    /** Main package size limit (KB) | 主包大小限制 (KB) */
    mainPackageLimit: number;
    /** Whether to enable plugins | 是否启用插件 */
    usePlugins: boolean;
}

/**
 * Build result.
 * 构建结果。
 */
export interface BuildResult {
    /** Whether successful | 是否成功 */
    success: boolean;
    /** Target platform | 目标平台 */
    platform: BuildPlatform;
    /** Output directory | 输出目录 */
    outputPath: string;
    /** Build duration (milliseconds) | 构建耗时（毫秒） */
    duration: number;
    /** Output file list | 输出文件列表 */
    outputFiles: string[];
    /** Warning list | 警告列表 */
    warnings: string[];
    /** Error message (if failed) | 错误信息（如果失败） */
    error?: string;
    /** Build statistics | 构建统计 */
    stats?: {
        /** Total file size (bytes) | 总文件大小 (bytes) */
        totalSize: number;
        /** JS file size | JS 文件大小 */
        jsSize: number;
        /** WASM file size | WASM 文件大小 */
        wasmSize: number;
        /** Asset file size | 资源文件大小 */
        assetsSize: number;
    };
}

/**
 * Build step.
 * 构建步骤。
 */
export interface BuildStep {
    /** Step ID | 步骤 ID */
    id: string;
    /** Step name | 步骤名称 */
    name: string;
    /** Execute function | 执行函数 */
    execute: (context: BuildContext) => Promise<void>;
    /** Whether skippable | 是否可跳过 */
    optional?: boolean;
}

/**
 * Build context.
 * 构建上下文。
 *
 * Shared state during the build process.
 * 在构建过程中共享的状态。
 */
export interface BuildContext {
    /** Build configuration | 构建配置 */
    config: BuildConfig;
    /** Project root directory | 项目根目录 */
    projectRoot: string;
    /** Temporary directory | 临时目录 */
    tempDir: string;
    /** Output directory | 输出目录 */
    outputDir: string;
    /** Progress report callback | 进度报告回调 */
    reportProgress: (message: string, progress?: number) => void;
    /** Add warning | 添加警告 */
    addWarning: (warning: string) => void;
    /** Abort signal | 中止信号 */
    abortSignal: AbortSignal;
    /** Shared data (passed between steps) | 共享数据（步骤间传递） */
    data: Map<string, any>;
}

/**
 * Build pipeline interface.
 * 构建管线接口。
 *
 * Each platform implements its own build pipeline.
 * 每个平台实现自己的构建管线。
 */
export interface IBuildPipeline {
    /** Platform identifier | 平台标识 */
    readonly platform: BuildPlatform;

    /** Platform display name | 平台显示名称 */
    readonly displayName: string;

    /** Platform icon | 平台图标 */
    readonly icon?: string;

    /** Platform description | 平台描述 */
    readonly description?: string;

    /**
     * Get default configuration.
     * 获取默认配置。
     */
    getDefaultConfig(): BuildConfig;

    /**
     * Validate configuration.
     * 验证配置是否有效。
     *
     * @param config - Build configuration | 构建配置
     * @returns Validation error list (empty means valid) | 验证错误列表（空表示有效）
     */
    validateConfig(config: BuildConfig): string[];

    /**
     * Get build steps.
     * 获取构建步骤。
     *
     * @param config - Build configuration | 构建配置
     * @returns Build step list | 构建步骤列表
     */
    getSteps(config: BuildConfig): BuildStep[];

    /**
     * Execute build.
     * 执行构建。
     *
     * @param config - Build configuration | 构建配置
     * @param onProgress - Progress callback | 进度回调
     * @param abortSignal - Abort signal | 中止信号
     * @returns Build result | 构建结果
     */
    build(
        config: BuildConfig,
        onProgress?: (progress: BuildProgress) => void,
        abortSignal?: AbortSignal
    ): Promise<BuildResult>;

    /**
     * Check platform availability.
     * 检查平台是否可用。
     *
     * For example, check if necessary tools are installed.
     * 例如检查必要的工具是否安装。
     */
    checkAvailability(): Promise<{ available: boolean; reason?: string }>;
}

/**
 * Build pipeline registry interface.
 * 构建管线注册表接口。
 */
export interface IBuildPipelineRegistry {
    /**
     * Register build pipeline.
     * 注册构建管线。
     */
    register(pipeline: IBuildPipeline): void;

    /**
     * Get build pipeline.
     * 获取构建管线。
     */
    get(platform: BuildPlatform): IBuildPipeline | undefined;

    /**
     * Get all registered pipelines.
     * 获取所有已注册的管线。
     */
    getAll(): IBuildPipeline[];

    /**
     * Check if platform is registered.
     * 检查平台是否已注册。
     */
    has(platform: BuildPlatform): boolean;
}
