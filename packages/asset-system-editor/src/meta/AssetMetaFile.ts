/**
 * Asset Meta File (.meta) Management
 * 资产元数据文件 (.meta) 管理
 *
 * Each asset file has a companion .meta file that stores:
 * - GUID: Persistent unique identifier
 * - Import settings: How to process the asset
 * - Labels: User-defined tags
 *
 * 每个资产文件都有一个配套的 .meta 文件，存储：
 * - GUID：持久化唯一标识符
 * - 导入设置：如何处理资产
 * - 标签：用户定义的标签
 */

import {
    AssetGUID,
    AssetType,
    generateGUID
} from '@esengine/asset-system';

/**
 * Meta file content structure
 * 元数据文件内容结构
 */
export interface IAssetMeta {
    /** Persistent unique identifier | 持久化唯一标识符 */
    guid: AssetGUID;
    /** Asset type | 资产类型 */
    type: AssetType;
    /**
     * Explicit loader type override
     * 显式指定的加载器类型覆盖
     *
     * When set, this type will be used instead of extension-based detection.
     * Useful when file extension doesn't match the actual content type.
     *
     * 设置后，将使用此类型而非基于扩展名的检测。
     * 适用于文件扩展名与实际内容类型不匹配的情况。
     */
    loaderType?: string;
    /** Import settings | 导入设置 */
    importSettings?: IImportSettings;
    /** User-defined labels | 用户定义的标签 */
    labels?: string[];
    /** Meta file version | 元数据文件版本 */
    version: number;
    /** Last modified timestamp | 最后修改时间戳 */
    lastModified?: number;
}

/**
 * Import settings for different asset types
 * 不同资产类型的导入设置
 */
export interface IImportSettings {
    // Texture settings | 纹理设置
    maxSize?: number;
    compression?: 'none' | 'dxt' | 'etc2' | 'astc' | 'webp';
    generateMipmaps?: boolean;
    filterMode?: 'point' | 'bilinear' | 'trilinear';
    wrapMode?: 'clamp' | 'repeat' | 'mirror';
    premultiplyAlpha?: boolean;

    // Audio settings | 音频设置
    audioFormat?: 'mp3' | 'ogg' | 'wav';
    sampleRate?: number;
    channels?: 1 | 2;
    normalize?: boolean;

    // General settings | 通用设置
    [key: string]: unknown;
}


/**
 * Get meta file path for an asset
 * 获取资产的元数据文件路径
 */
export function getMetaFilePath(assetPath: string): string {
    return `${assetPath}.meta`;
}

/**
 * Infer asset type from file extension
 * 根据文件扩展名推断资产类型
 */
export function inferAssetType(path: string): AssetType {
    const ext = path.split('.').pop()?.toLowerCase() || '';

    const typeMap: Record<string, AssetType> = {
        // Textures
        png: 'texture',
        jpg: 'texture',
        jpeg: 'texture',
        gif: 'texture',
        webp: 'texture',
        bmp: 'texture',
        svg: 'texture',

        // Audio
        mp3: 'audio',
        wav: 'audio',
        ogg: 'audio',
        m4a: 'audio',
        flac: 'audio',

        // Data
        json: 'json',
        txt: 'text',
        xml: 'text',
        csv: 'text',

        // Scenes and prefabs
        ecs: 'scene',
        prefab: 'prefab',

        // Fonts
        ttf: 'font',
        otf: 'font',
        woff: 'font',
        woff2: 'font',

        // Shaders
        glsl: 'shader',
        vert: 'shader',
        frag: 'shader',

        // Custom types (plugins)
        tilemap: 'tilemap',
        tileset: 'tileset',
        btree: 'behavior-tree',
        bp: 'blueprint',
        mat: 'material',
        particle: 'particle'
    };

    return typeMap[ext] || 'binary';
}

/**
 * Get default import settings for asset type
 * 获取资产类型的默认导入设置
 */
export function getDefaultImportSettings(type: AssetType): IImportSettings {
    switch (type) {
        case 'texture':
            return {
                maxSize: 2048,
                compression: 'none',
                generateMipmaps: false,
                filterMode: 'bilinear',
                wrapMode: 'clamp',
                premultiplyAlpha: false
            };

        case 'audio':
            return {
                audioFormat: 'mp3',
                sampleRate: 44100,
                channels: 2,
                normalize: false
            };

        default:
            return {};
    }
}

/**
 * Create a new meta file content
 * 创建新的元数据文件内容
 */
export function createAssetMeta(assetPath: string, overrides?: Partial<IAssetMeta>): IAssetMeta {
    const type = overrides?.type || inferAssetType(assetPath);

    return {
        guid: overrides?.guid || generateGUID(),
        type,
        importSettings: overrides?.importSettings || getDefaultImportSettings(type),
        labels: overrides?.labels || [],
        version: 1,
        lastModified: Date.now()
    };
}

/**
 * Serialize meta to JSON string
 * 将元数据序列化为 JSON 字符串
 */
export function serializeAssetMeta(meta: IAssetMeta): string {
    return JSON.stringify(meta, null, 2);
}

/**
 * Parse meta from JSON string
 * 从 JSON 字符串解析元数据
 */
export function parseAssetMeta(json: string): IAssetMeta {
    const meta = JSON.parse(json) as IAssetMeta;

    // Validate required fields
    if (!meta.guid || typeof meta.guid !== 'string') {
        throw new Error('Invalid meta file: missing or invalid guid');
    }
    if (!meta.type || typeof meta.type !== 'string') {
        throw new Error('Invalid meta file: missing or invalid type');
    }

    // Set defaults for optional fields
    meta.version = meta.version || 1;
    meta.labels = meta.labels || [];
    meta.importSettings = meta.importSettings || {};

    return meta;
}


/**
 * Asset Meta File Manager
 * 资产元数据文件管理器
 *
 * Handles reading/writing .meta files through a file system interface.
 */
export class AssetMetaManager {
    private _cache = new Map<string, IAssetMeta>();
    private _guidToPath = new Map<AssetGUID, string>();

    /**
     * File system interface for reading/writing files
     * 用于读写文件的文件系统接口
     */
    private _fs: IMetaFileSystem | null = null;

    /**
     * Set file system interface
     * 设置文件系统接口
     */
    setFileSystem(fs: IMetaFileSystem): void {
        this._fs = fs;
    }

    /**
     * Get or create meta for an asset
     * 获取或创建资产的元数据
     */
    async getOrCreateMeta(assetPath: string): Promise<IAssetMeta> {
        // Check cache first
        const cached = this._cache.get(assetPath);
        if (cached) {
            return cached;
        }

        const metaPath = getMetaFilePath(assetPath);

        // Try to read existing meta file
        if (this._fs) {
            try {
                if (await this._fs.exists(metaPath)) {
                    const content = await this._fs.readText(metaPath);
                    const meta = parseAssetMeta(content);
                    this._cache.set(assetPath, meta);
                    this._guidToPath.set(meta.guid, assetPath);
                    return meta;
                }
            } catch (e) {
                console.warn(`Failed to read meta file: ${metaPath}`, e);
            }
        }

        // Create new meta
        const meta = createAssetMeta(assetPath);
        this._cache.set(assetPath, meta);
        this._guidToPath.set(meta.guid, assetPath);

        // Save to file system
        if (this._fs) {
            try {
                await this._fs.writeText(metaPath, serializeAssetMeta(meta));
            } catch (e) {
                console.warn(`Failed to write meta file: ${metaPath}`, e);
            }
        }

        return meta;
    }

    /**
     * Get meta by GUID
     * 根据 GUID 获取元数据
     */
    getMetaByGUID(guid: AssetGUID): IAssetMeta | undefined {
        const path = this._guidToPath.get(guid);
        return path ? this._cache.get(path) : undefined;
    }

    /**
     * Get asset path by GUID
     * 根据 GUID 获取资产路径
     */
    getPathByGUID(guid: AssetGUID): string | undefined {
        return this._guidToPath.get(guid);
    }

    /**
     * Get GUID by asset path
     * 根据资产路径获取 GUID
     */
    async getGUIDByPath(assetPath: string): Promise<AssetGUID> {
        const meta = await this.getOrCreateMeta(assetPath);
        return meta.guid;
    }

    /**
     * Update meta and save
     * 更新元数据并保存
     */
    async updateMeta(assetPath: string, updates: Partial<IAssetMeta>): Promise<void> {
        const meta = await this.getOrCreateMeta(assetPath);

        // Apply updates
        Object.assign(meta, updates);
        meta.lastModified = Date.now();
        meta.version++;

        // Update cache
        this._cache.set(assetPath, meta);

        // Handle GUID change (rare, but possible)
        if (updates.guid && updates.guid !== meta.guid) {
            this._guidToPath.delete(meta.guid);
            this._guidToPath.set(updates.guid, assetPath);
        }

        // Save to file system
        if (this._fs) {
            const metaPath = getMetaFilePath(assetPath);
            await this._fs.writeText(metaPath, serializeAssetMeta(meta));
        }
    }

    /**
     * Handle asset rename
     * 处理资产重命名
     */
    async handleAssetRename(oldPath: string, newPath: string): Promise<void> {
        const meta = this._cache.get(oldPath);
        if (meta) {
            // Update cache with new path
            this._cache.delete(oldPath);
            this._cache.set(newPath, meta);
            this._guidToPath.set(meta.guid, newPath);

            // Move meta file
            if (this._fs) {
                const oldMetaPath = getMetaFilePath(oldPath);
                const newMetaPath = getMetaFilePath(newPath);

                if (await this._fs.exists(oldMetaPath)) {
                    const content = await this._fs.readText(oldMetaPath);
                    await this._fs.writeText(newMetaPath, content);
                    await this._fs.delete(oldMetaPath);
                }
            }
        }
    }

    /**
     * Handle asset delete
     * 处理资产删除
     */
    async handleAssetDelete(assetPath: string): Promise<void> {
        const meta = this._cache.get(assetPath);
        if (meta) {
            this._cache.delete(assetPath);
            this._guidToPath.delete(meta.guid);

            // Delete meta file
            if (this._fs) {
                const metaPath = getMetaFilePath(assetPath);
                if (await this._fs.exists(metaPath)) {
                    await this._fs.delete(metaPath);
                }
            }
        }
    }

    /**
     * Clear cache
     * 清除缓存
     */
    clear(): void {
        this._cache.clear();
        this._guidToPath.clear();
    }

    /**
     * Get all cached metas
     * 获取所有缓存的元数据
     */
    getAllMetas(): Map<string, IAssetMeta> {
        return new Map(this._cache);
    }
}

/**
 * File system interface for meta file operations
 * 元数据文件操作的文件系统接口
 */
export interface IMetaFileSystem {
    exists(path: string): Promise<boolean>;
    readText(path: string): Promise<string>;
    writeText(path: string, content: string): Promise<void>;
    delete(path: string): Promise<void>;
}
