/**
 * Core asset system types and enums
 * 核心资产系统类型和枚举
 */

/**
 * Unique identifier for assets across the project
 * 项目中资产的唯一标识符
 */
export type AssetGUID = string;

/**
 * Runtime asset handle for efficient access
 * 运行时资产句柄，用于高效访问
 */
export type AssetHandle = number;

/**
 * Asset loading state
 * 资产加载状态
 */
export enum AssetState {
    /** 未加载 */
    Unloaded = 'unloaded',
    /** 加载中 */
    Loading = 'loading',
    /** 已加载 */
    Loaded = 'loaded',
    /** 加载失败 */
    Failed = 'failed',
    /** 释放中 */
    Disposing = 'disposing'
}

/**
 * Asset types supported by the system
 * 系统支持的资产类型
 */
export enum AssetType {
    /** 纹理 */
    Texture = 'texture',
    /** 网格 */
    Mesh = 'mesh',
    /** 材质 */
    Material = 'material',
    /** 着色器 */
    Shader = 'shader',
    /** 音频 */
    Audio = 'audio',
    /** 字体 */
    Font = 'font',
    /** 预制体 */
    Prefab = 'prefab',
    /** 场景 */
    Scene = 'scene',
    /** 脚本 */
    Script = 'script',
    /** 动画片段 */
    AnimationClip = 'animation',
    /** 行为树 */
    BehaviorTree = 'behaviortree',
    /** 瓦片地图 */
    Tilemap = 'tilemap',
    /** 瓦片集 */
    Tileset = 'tileset',
    /** JSON数据 */
    Json = 'json',
    /** 文本 */
    Text = 'text',
    /** 二进制 */
    Binary = 'binary',
    /** 自定义 */
    Custom = 'custom'
}

/**
 * Platform variants for assets
 * 资产的平台变体
 */
export enum AssetPlatform {
    /** H5平台（浏览器） */
    H5 = 'h5',
    /** 微信小游戏 */
    WeChat = 'wechat',
    /** 试玩广告（Playable Ads） */
    Playable = 'playable',
    /** Android平台 */
    Android = 'android',
    /** iOS平台 */
    iOS = 'ios',
    /** 编辑器（Tauri桌面） */
    Editor = 'editor'
}

/**
 * Quality levels for asset variants
 * 资产变体的质量级别
 */
export enum AssetQuality {
    /** 低质量 */
    Low = 'low',
    /** 中等质量 */
    Medium = 'medium',
    /** 高质量 */
    High = 'high',
    /** 超高质量 */
    Ultra = 'ultra'
}

/**
 * Asset metadata stored in the database
 * 存储在数据库中的资产元数据
 */
export interface IAssetMetadata {
    /** 全局唯一标识符 */
    guid: AssetGUID;
    /** 资产路径 */
    path: string;
    /** 资产类型 */
    type: AssetType;
    /** 资产名称 */
    name: string;
    /** 文件大小（字节） / File size in bytes */
    size: number;
    /** 内容哈希值 / Content hash for versioning */
    hash: string;
    /** 依赖的其他资产 / Dependencies on other assets */
    dependencies: AssetGUID[];
    /** 资产标签 / User-defined labels for categorization */
    labels: string[];
    /** 自定义标签 / Custom metadata tags */
    tags: Map<string, string>;
    /** 导入设置 / Import-time settings */
    importSettings?: Record<string, unknown>;
    /** 最后修改时间 / Unix timestamp of last modification */
    lastModified: number;
    /** 版本号 / Asset version number */
    version: number;
}

/**
 * Asset variant descriptor
 * 资产变体描述符
 */
export interface IAssetVariant {
    /** 目标平台 */
    platform: AssetPlatform;
    /** 质量级别 */
    quality: AssetQuality;
    /** 本地化语言 / Language code for localized assets */
    locale?: string;
    /** 主题变体 / Theme identifier (e.g., 'dark', 'light') */
    theme?: string;
}

/**
 * Asset load options
 * 资产加载选项
 */
export interface IAssetLoadOptions {
    /** 加载优先级（0-100，越高越优先） / Priority level 0-100, higher loads first */
    priority?: number;
    /** 是否异步加载 / Use async loading */
    async?: boolean;
    /** 指定加载的变体 / Specific variant to load */
    variant?: IAssetVariant;
    /** 强制重新加载 / Force reload even if cached */
    forceReload?: boolean;
    /** 超时时间（毫秒） / Timeout in milliseconds */
    timeout?: number;
    /** 进度回调 / Progress callback (0-1) */
    onProgress?: (progress: number) => void;
}

/**
 * Asset bundle manifest
 * 资产包清单
 */
export interface IAssetBundleManifest {
    /** 包名称 */
    name: string;
    /** 版本号 */
    version: string;
    /** 内容哈希 / Content hash for integrity check */
    hash: string;
    /** 压缩类型 */
    compression?: 'none' | 'gzip' | 'brotli';
    /** 包含的资产列表 / Assets contained in this bundle */
    assets: AssetGUID[];
    /** 依赖的其他包 / Other bundles this depends on */
    dependencies: string[];
    /** 包大小（字节） / Bundle size in bytes */
    size: number;
    /** 创建时间戳 / Creation timestamp */
    createdAt: number;
}

/**
 * Asset loading result
 * 资产加载结果
 */
export interface IAssetLoadResult<T = unknown> {
    /** 加载的资产实例 */
    asset: T;
    /** 资产句柄 */
    handle: AssetHandle;
    /** 资产元数据 */
    metadata: IAssetMetadata;
    /** 加载耗时（毫秒） / Load time in milliseconds */
    loadTime: number;
}

/**
 * Asset loading error
 * 资产加载错误
 */
export class AssetLoadError extends Error {
    constructor(
        message: string,
        public readonly guid: AssetGUID,
        public readonly type: AssetType,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'AssetLoadError';
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Factory method for file not found error
     * 文件未找到错误的工厂方法
     */
    static fileNotFound(guid: AssetGUID, path: string): AssetLoadError {
        return new AssetLoadError(`Asset file not found: ${path}`, guid, AssetType.Custom);
    }

    /**
     * Factory method for unsupported type error
     * 不支持的类型错误的工厂方法
     */
    static unsupportedType(guid: AssetGUID, type: AssetType): AssetLoadError {
        return new AssetLoadError(`Unsupported asset type: ${type}`, guid, type);
    }

    /**
     * Factory method for load timeout error
     * 加载超时错误的工厂方法
     */
    static loadTimeout(guid: AssetGUID, type: AssetType, timeout: number): AssetLoadError {
        return new AssetLoadError(`Asset load timeout after ${timeout}ms`, guid, type);
    }

    /**
     * Factory method for dependency failed error
     * 依赖加载失败错误的工厂方法
     */
    static dependencyFailed(guid: AssetGUID, type: AssetType, depGuid: AssetGUID): AssetLoadError {
        return new AssetLoadError(`Dependency failed to load: ${depGuid}`, guid, type);
    }
}

/**
 * Asset reference counting info
 * 资产引用计数信息
 */
export interface IAssetReferenceInfo {
    /** 资产GUID */
    guid: AssetGUID;
    /** 资产句柄 */
    handle: AssetHandle;
    /** 引用计数 */
    referenceCount: number;
    /** 最后访问时间 / Unix timestamp of last access */
    lastAccessTime: number;
    /** 当前状态 */
    state: AssetState;
}

/**
 * Asset import options
 * 资产导入选项
 */
export interface IAssetImportOptions {
    /** 资产类型 */
    type: AssetType;
    /** 生成Mipmap / Generate mipmaps for textures */
    generateMipmaps?: boolean;
    /** 纹理压缩格式 / Texture compression format */
    compression?: 'none' | 'dxt' | 'etc2' | 'astc';
    /** 最大纹理尺寸 / Maximum texture dimension */
    maxTextureSize?: number;
    /** 生成LOD / Generate LODs for meshes */
    generateLODs?: boolean;
    /** 优化网格 / Optimize mesh geometry */
    optimizeMesh?: boolean;
    /** 音频格式 / Audio encoding format */
    audioFormat?: 'mp3' | 'ogg' | 'wav';
    /** 自定义处理器 / Custom processor plugin name */
    customProcessor?: string;
}

/**
 * Asset usage statistics
 * 资产使用统计
 */
export interface IAssetUsageStats {
    /** 资产GUID */
    guid: AssetGUID;
    /** 加载次数 */
    loadCount: number;
    /** 总加载时间（毫秒） / Total time spent loading in ms */
    totalLoadTime: number;
    /** 平均加载时间（毫秒） / Average load time in ms */
    averageLoadTime: number;
    /** 最后使用时间 / Unix timestamp of last use */
    lastUsedTime: number;
    /** 被引用的资产列表 / Assets that reference this one */
    referencedBy: AssetGUID[];
}

/**
 * Asset preload group
 * 资产预加载组
 */
export interface IAssetPreloadGroup {
    /** 组名称 */
    name: string;
    /** 包含的资产 */
    assets: AssetGUID[];
    /** 加载优先级 / Load priority 0-100 */
    priority: number;
    /** 是否必需 / Must be loaded before scene start */
    required: boolean;
}

/**
 * Asset loading progress info
 * 资产加载进度信息
 */
export interface IAssetLoadProgress {
    /** 当前加载的资产 */
    currentAsset: string;
    /** 已加载数量 */
    loadedCount: number;
    /** 总数量 */
    totalCount: number;
    /** 已加载字节数 */
    loadedBytes: number;
    /** 总字节数 */
    totalBytes: number;
    /** 进度百分比（0-1） / Progress value 0-1 */
    progress: number;
}

/**
 * Asset catalog entry for runtime lookups
 * 运行时查找的资产目录条目
 */
export interface IAssetCatalogEntry {
    /** 资产GUID */
    guid: AssetGUID;
    /** 资产路径 */
    path: string;
    /** 资产类型 */
    type: AssetType;
    /** 所在包名称 / Bundle containing this asset */
    bundleName?: string;
    /** 可用变体 / Available variants */
    variants?: IAssetVariant[];
    /** 大小（字节） / Size in bytes */
    size: number;
    /** 内容哈希 / Content hash */
    hash: string;
}

/**
 * Runtime asset catalog
 * 运行时资产目录
 */
export interface IAssetCatalog {
    /** 版本号 */
    version: string;
    /** 创建时间戳 / Creation timestamp */
    createdAt: number;
    /** 所有目录条目 / All catalog entries */
    entries: Map<AssetGUID, IAssetCatalogEntry>;
    /** 此目录中的包 / Bundles in this catalog */
    bundles: Map<string, IAssetBundleManifest>;
}

/**
 * Asset hot-reload event
 * 资产热重载事件
 */
export interface IAssetHotReloadEvent {
    /** 资产GUID */
    guid: AssetGUID;
    /** 资产路径 */
    path: string;
    /** 资产类型 */
    type: AssetType;
    /** 旧版本哈希 / Previous version hash */
    oldHash: string;
    /** 新版本哈希 / New version hash */
    newHash: string;
    /** 时间戳 */
    timestamp: number;
}
