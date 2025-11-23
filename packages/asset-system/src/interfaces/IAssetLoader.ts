/**
 * Asset loader interfaces
 * 资产加载器接口
 */

import {
    AssetType,
    AssetGUID,
    IAssetLoadOptions,
    IAssetMetadata,
    IAssetLoadResult
} from '../types/AssetTypes';

/**
 * Base asset loader interface
 * 基础资产加载器接口
 */
export interface IAssetLoader<T = unknown> {
    /** 支持的资产类型 / Supported asset type */
    readonly supportedType: AssetType;

    /** 支持的文件扩展名 / Supported file extensions */
    readonly supportedExtensions: string[];

    /**
     * Load an asset from the given path
     * 从指定路径加载资产
     */
    load(
        path: string,
        metadata: IAssetMetadata,
        options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<T>>;

    /**
     * Validate if the loader can handle this asset
     * 验证加载器是否可以处理此资产
     */
    canLoad(path: string, metadata: IAssetMetadata): boolean;

    /**
     * Dispose loaded asset and free resources
     * 释放已加载的资产并释放资源
     */
    dispose(asset: T): void;
}

/**
 * Asset loader factory interface
 * 资产加载器工厂接口
 */
export interface IAssetLoaderFactory {
    /**
     * Create loader for specific asset type
     * 为特定资产类型创建加载器
     */
    createLoader(type: AssetType): IAssetLoader | null;

    /**
     * Register custom loader
     * 注册自定义加载器
     */
    registerLoader(type: AssetType, loader: IAssetLoader): void;

    /**
     * Unregister loader
     * 注销加载器
     */
    unregisterLoader(type: AssetType): void;

    /**
     * Check if loader exists for type
     * 检查类型是否有加载器
     */
    hasLoader(type: AssetType): boolean;
}

/**
 * Texture asset interface
 * 纹理资产接口
 */
export interface ITextureAsset {
    /** WebGL纹理ID / WebGL texture ID */
    textureId: number;
    /** 宽度 / Width */
    width: number;
    /** 高度 / Height */
    height: number;
    /** 格式 / Format */
    format: 'rgba' | 'rgb' | 'alpha';
    /** 是否有Mipmap / Has mipmaps */
    hasMipmaps: boolean;
    /** 原始数据（如果可用） / Raw image data if available */
    data?: ImageData | HTMLImageElement;
}

/**
 * Mesh asset interface
 * 网格资产接口
 */
export interface IMeshAsset {
    /** 顶点数据 / Vertex data */
    vertices: Float32Array;
    /** 索引数据 / Index data */
    indices: Uint16Array | Uint32Array;
    /** 法线数据 / Normal data */
    normals?: Float32Array;
    /** UV坐标 / UV coordinates */
    uvs?: Float32Array;
    /** 切线数据 / Tangent data */
    tangents?: Float32Array;
    /** 边界盒 / Axis-aligned bounding box */
    bounds: {
        min: [number, number, number];
        max: [number, number, number];
    };
}

/**
 * Audio asset interface
 * 音频资产接口
 */
export interface IAudioAsset {
    /** 音频缓冲区 / Audio buffer */
    buffer: AudioBuffer;
    /** 时长（秒） / Duration in seconds */
    duration: number;
    /** 采样率 / Sample rate */
    sampleRate: number;
    /** 声道数 / Number of channels */
    channels: number;
}

/**
 * Material asset interface
 * 材质资产接口
 */
export interface IMaterialAsset {
    /** 着色器名称 / Shader name */
    shader: string;
    /** 材质属性 / Material properties */
    properties: Map<string, unknown>;
    /** 纹理映射 / Texture slot mappings */
    textures: Map<string, AssetGUID>;
    /** 渲染状态 / Render states */
    renderStates: {
        cullMode?: 'none' | 'front' | 'back';
        blendMode?: 'none' | 'alpha' | 'additive' | 'multiply';
        depthTest?: boolean;
        depthWrite?: boolean;
    };
}

/**
 * Prefab asset interface
 * 预制体资产接口
 */
export interface IPrefabAsset {
    /** 根实体数据 / Serialized entity hierarchy */
    root: unknown;
    /** 包含的组件类型 / Component types used in prefab */
    componentTypes: string[];
    /** 引用的资产 / All referenced assets */
    referencedAssets: AssetGUID[];
}

/**
 * Scene asset interface
 * 场景资产接口
 */
export interface ISceneAsset {
    /** 场景名称 / Scene name */
    name: string;
    /** 实体列表 / Serialized entity list */
    entities: unknown[];
    /** 场景设置 / Scene settings */
    settings: {
        /** 环境光 / Ambient light */
        ambientLight?: [number, number, number];
        /** 雾效 / Fog settings */
        fog?: {
            enabled: boolean;
            color: [number, number, number];
            density: number;
        };
        /** 天空盒 / Skybox asset */
        skybox?: AssetGUID;
    };
    /** 引用的资产 / All referenced assets */
    referencedAssets: AssetGUID[];
}

/**
 * JSON asset interface
 * JSON资产接口
 */
export interface IJsonAsset {
    /** JSON数据 / JSON data */
    data: unknown;
}

/**
 * Text asset interface
 * 文本资产接口
 */
export interface ITextAsset {
    /** 文本内容 / Text content */
    content: string;
    /** 编码格式 / Encoding */
    encoding: 'utf8' | 'utf16' | 'ascii';
}

/**
 * Binary asset interface
 * 二进制资产接口
 */
export interface IBinaryAsset {
    /** 二进制数据 / Binary data */
    data: ArrayBuffer;
    /** MIME类型 / MIME type */
    mimeType?: string;
}
