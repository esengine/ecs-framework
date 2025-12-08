/**
 * Asset Bundle Format Definitions
 * 资产包格式定义
 *
 * Binary format for efficient asset storage and loading.
 * 用于高效资产存储和加载的二进制格式。
 */

import { AssetGUID, AssetType } from '../types/AssetTypes';

/**
 * Bundle file magic number
 * 包文件魔数
 */
export const BUNDLE_MAGIC = 'ESBNDL';

/**
 * Bundle format version
 * 包格式版本
 */
export const BUNDLE_VERSION = 1;

/**
 * Bundle compression types
 * 包压缩类型
 */
export enum BundleCompression {
    None = 0,
    Gzip = 1,
    Brotli = 2
}

/**
 * Bundle flags
 * 包标志
 */
export enum BundleFlags {
    None = 0,
    Compressed = 1 << 0,
    Encrypted = 1 << 1,
    Streaming = 1 << 2
}

/**
 * Asset type codes for binary serialization
 * 用于二进制序列化的资产类型代码
 */
export const AssetTypeCode: Record<string, number> = {
    texture: 1,
    audio: 2,
    json: 3,
    text: 4,
    binary: 5,
    scene: 6,
    prefab: 7,
    font: 8,
    shader: 9,
    material: 10,
    mesh: 11,
    animation: 12,
    tilemap: 20,
    tileset: 21,
    'behavior-tree': 22,
    blueprint: 23
};

/**
 * Bundle header structure (32 bytes)
 * 包头结构 (32 字节)
 */
export interface IBundleHeader {
    /** Magic number "ESBNDL" | 魔数 */
    magic: string;
    /** Format version | 格式版本 */
    version: number;
    /** Bundle flags | 包标志 */
    flags: BundleFlags;
    /** Compression type | 压缩类型 */
    compression: BundleCompression;
    /** Number of assets | 资产数量 */
    assetCount: number;
    /** TOC offset from start | TOC 偏移量 */
    tocOffset: number;
    /** Data offset from start | 数据偏移量 */
    dataOffset: number;
}

/**
 * Table of Contents entry (40 bytes per entry)
 * 目录条目 (每条 40 字节)
 */
export interface IBundleTocEntry {
    /** Asset GUID (16 bytes as UUID binary) | 资产 GUID */
    guid: AssetGUID;
    /** Asset type code | 资产类型代码 */
    typeCode: number;
    /** Offset from data section start | 相对于数据段起始的偏移 */
    offset: number;
    /** Compressed size in bytes | 压缩后大小 */
    compressedSize: number;
    /** Uncompressed size in bytes | 未压缩大小 */
    uncompressedSize: number;
}

/**
 * Bundle manifest (JSON sidecar file)
 * 包清单 (JSON 附属文件)
 */
export interface IBundleManifest {
    /** Bundle name | 包名称 */
    name: string;
    /** Bundle version | 包版本 */
    version: string;
    /** Content hash for integrity | 内容哈希 */
    hash: string;
    /** Compression type | 压缩类型 */
    compression: 'none' | 'gzip' | 'brotli';
    /** Total bundle size | 包总大小 */
    size: number;
    /** Assets in this bundle | 包含的资产 */
    assets: IBundleAssetInfo[];
    /** Dependencies on other bundles | 依赖的其他包 */
    dependencies: string[];
    /** Creation timestamp | 创建时间戳 */
    createdAt: number;
}

/**
 * Asset info in bundle manifest
 * 包清单中的资产信息
 */
export interface IBundleAssetInfo {
    /** Asset GUID | 资产 GUID */
    guid: AssetGUID;
    /** Asset name (for debugging) | 资产名称 (用于调试) */
    name: string;
    /** Asset type | 资产类型 */
    type: AssetType;
    /** Offset in bundle | 包内偏移 */
    offset: number;
    /** Size in bytes | 大小 */
    size: number;
}

/**
 * Runtime catalog format (loaded in browser)
 * 运行时目录格式 (在浏览器中加载)
 */
export interface IRuntimeCatalog {
    /** Catalog version | 目录版本 */
    version: string;
    /** Creation timestamp | 创建时间戳 */
    createdAt: number;
    /** Available bundles | 可用的包 */
    bundles: Record<string, IRuntimeBundleInfo>;
    /** Asset GUID to location mapping | 资产 GUID 到位置的映射 */
    assets: Record<AssetGUID, IRuntimeAssetLocation>;
}

/**
 * Bundle info in runtime catalog
 * 运行时目录中的包信息
 */
export interface IRuntimeBundleInfo {
    /** Bundle URL (relative to catalog) | 包 URL */
    url: string;
    /** Bundle size in bytes | 包大小 */
    size: number;
    /** Content hash | 内容哈希 */
    hash: string;
    /** Whether bundle is preloaded | 是否预加载 */
    preload?: boolean;
}

/**
 * Asset location in runtime catalog
 * 运行时目录中的资产位置
 */
export interface IRuntimeAssetLocation {
    /** Bundle name containing this asset | 包含此资产的包名 */
    bundle: string;
    /** Offset within bundle | 包内偏移 */
    offset: number;
    /** Size in bytes | 大小 */
    size: number;
    /** Asset type | 资产类型 */
    type: AssetType;
    /** Asset name (for debugging) | 资产名称 */
    name?: string;
}

/**
 * Bundle packing options
 * 包打包选项
 */
export interface IBundlePackOptions {
    /** Bundle name | 包名称 */
    name: string;
    /** Compression type | 压缩类型 */
    compression?: BundleCompression;
    /** Maximum bundle size (split if exceeded) | 最大包大小 */
    maxSize?: number;
    /** Group assets by type | 按类型分组资产 */
    groupByType?: boolean;
    /** Include asset names in bundle | 在包中包含资产名称 */
    includeNames?: boolean;
    /**
     * 需要预加载的包名列表 | List of bundle names to preload
     * 如果未指定，默认预加载 'core' 和 'main' 包
     * If not specified, defaults to preloading 'core' and 'main' bundles
     */
    preloadBundles?: string[];
}

/**
 * Asset to pack
 * 要打包的资产
 */
export interface IAssetToPack {
    /** Asset GUID | 资产 GUID */
    guid: AssetGUID;
    /** Asset path (for reading) | 资产路径 */
    path: string;
    /** Asset type | 资产类型 */
    type: AssetType;
    /** Asset name | 资产名称 */
    name: string;
    /** Raw data (or null to read from path) | 原始数据 */
    data?: ArrayBuffer;
}

/**
 * Parse GUID from 16-byte binary
 * 从 16 字节二进制解析 GUID
 */
export function parseGUIDFromBinary(bytes: Uint8Array): AssetGUID {
    const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Serialize GUID to 16-byte binary
 * 将 GUID 序列化为 16 字节二进制
 */
export function serializeGUIDToBinary(guid: AssetGUID): Uint8Array {
    const hex = guid.replace(/-/g, '');
    const bytes = new Uint8Array(16);

    for (let i = 0; i < 16; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    return bytes;
}

/**
 * Get type code from asset type string
 * 从资产类型字符串获取类型代码
 */
export function getAssetTypeCode(type: AssetType): number {
    return AssetTypeCode[type] || 0;
}

/**
 * Get asset type string from type code
 * 从类型代码获取资产类型字符串
 */
export function getAssetTypeFromCode(code: number): AssetType {
    for (const [type, typeCode] of Object.entries(AssetTypeCode)) {
        if (typeCode === code) {
            return type as AssetType;
        }
    }
    return 'binary';
}
