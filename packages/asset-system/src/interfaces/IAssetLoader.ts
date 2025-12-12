/**
 * Asset loader interfaces
 * 资产加载器接口
 */

import {
    AssetType,
    AssetGUID,
    IAssetLoadOptions,
    IAssetMetadata
} from '../types/AssetTypes';
import type { IAssetContent, AssetContentType } from './IAssetReader';

/**
 * Parse context provided to loaders.
 * 提供给加载器的解析上下文。
 */
export interface IAssetParseContext {
    /** Asset metadata. | 资产元数据。 */
    metadata: IAssetMetadata;
    /** Load options. | 加载选项。 */
    options?: IAssetLoadOptions;
    /**
     * Load a dependency asset by relative path.
     * 通过相对路径加载依赖资产。
     */
    loadDependency<D = unknown>(relativePath: string): Promise<D>;
}

/**
 * Asset loader interface.
 * 资产加载器接口。
 *
 * Loaders only parse content, file reading is handled by AssetManager.
 * 加载器只负责解析内容，文件读取由 AssetManager 处理。
 */
export interface IAssetLoader<T = unknown> {
    /** Supported asset type. | 支持的资产类型。 */
    readonly supportedType: AssetType;

    /** Supported file extensions. | 支持的文件扩展名。 */
    readonly supportedExtensions: string[];

    /**
     * Required content type for this loader.
     * 此加载器需要的内容类型。
     *
     * - 'text': For JSON, shader, material files
     * - 'binary': For binary formats
     * - 'image': For textures
     * - 'audio': For audio files
     */
    readonly contentType: AssetContentType;

    /**
     * Parse asset from content.
     * 从内容解析资产。
     *
     * @param content - File content. | 文件内容。
     * @param context - Parse context. | 解析上下文。
     * @returns Parsed asset. | 解析后的资产。
     */
    parse(content: IAssetContent, context: IAssetParseContext): Promise<T>;

    /**
     * Dispose loaded asset and free resources.
     * 释放已加载的资产。
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

    /**
     * Get asset type by file extension
     * 根据文件扩展名获取资产类型
     */
    getAssetTypeByExtension(extension: string): AssetType | null;

    /**
     * Get asset type by file path
     * 根据文件路径获取资产类型
     */
    getAssetTypeByPath(path: string): AssetType | null;

    /**
     * Get all supported file extensions from all registered loaders.
     * 获取所有注册加载器支持的文件扩展名。
     *
     * @returns Array of extension patterns (e.g., ['*.png', '*.jpg', '*.particle'])
     */
    getAllSupportedExtensions(): string[];

    /**
     * Get extension to type mapping for all registered loaders.
     * 获取所有注册加载器的扩展名到类型的映射。
     *
     * @returns Map of extension (without dot) to asset type string
     */
    getExtensionTypeMap(): Record<string, string>;
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

// 预制体资产接口从专用文件导出 | Prefab asset interface exported from dedicated file
export type { IPrefabAsset, IPrefabData, IPrefabMetadata, IPrefabService } from './IPrefabAsset';

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
