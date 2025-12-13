/**
 * 预制体资产接口定义
 * Prefab asset interface definitions
 *
 * 定义预制体系统的核心类型，包括预制体数据格式、元数据、实例化选项等。
 * Defines core types for the prefab system including data format, metadata, instantiation options, etc.
 */

import type { AssetGUID } from '../types/AssetTypes';
import type { SerializedEntity } from '@esengine/ecs-framework';

/**
 * 预制体序列化实体（扩展自 SerializedEntity）
 * Serialized prefab entity (extends SerializedEntity)
 *
 * 在标准 SerializedEntity 基础上添加预制体特定属性。
 * Adds prefab-specific properties on top of standard SerializedEntity.
 */
export interface SerializedPrefabEntity extends SerializedEntity {
    /**
     * 是否为预制体根节点
     * Whether this is the prefab root entity
     */
    isPrefabRoot?: boolean;

    /**
     * 嵌套预制体的 GUID（如果此实体是另一个预制体的实例）
     * GUID of nested prefab (if this entity is an instance of another prefab)
     */
    nestedPrefabGuid?: AssetGUID;
}

/**
 * 预制体元数据
 * Prefab metadata
 */
export interface IPrefabMetadata {
    /**
     * 预制体名称
     * Prefab name
     */
    name: string;

    /**
     * 资产 GUID（在保存为资产后填充）
     * Asset GUID (populated after saving as asset)
     */
    guid?: AssetGUID;

    /**
     * 创建时间戳
     * Creation timestamp
     */
    createdAt: number;

    /**
     * 最后修改时间戳
     * Last modification timestamp
     */
    modifiedAt: number;

    /**
     * 使用的组件类型列表
     * List of component types used
     */
    componentTypes: string[];

    /**
     * 引用的资产 GUID 列表
     * List of referenced asset GUIDs
     */
    referencedAssets: AssetGUID[];

    /**
     * 预制体描述
     * Prefab description
     */
    description?: string;

    /**
     * 预制体标签（用于分类和搜索）
     * Prefab tags (for categorization and search)
     */
    tags?: string[];

    /**
     * 缩略图数据（Base64 编码）
     * Thumbnail data (Base64 encoded)
     */
    thumbnail?: string;
}

/**
 * 组件类型注册条目
 * Component type registry entry
 */
export interface IPrefabComponentTypeEntry {
    /**
     * 组件类型名称
     * Component type name
     */
    typeName: string;

    /**
     * 组件版本号
     * Component version number
     */
    version: number;
}

/**
 * 预制体文件数据格式
 * Prefab file data format
 *
 * 这是 .prefab 文件的完整结构。
 * This is the complete structure of a .prefab file.
 */
export interface IPrefabData {
    /**
     * 预制体格式版本号
     * Prefab format version number
     */
    version: number;

    /**
     * 预制体元数据
     * Prefab metadata
     */
    metadata: IPrefabMetadata;

    /**
     * 根实体数据（包含完整的实体层级）
     * Root entity data (contains full entity hierarchy)
     */
    root: SerializedPrefabEntity;

    /**
     * 组件类型注册表（用于版本管理和兼容性检查）
     * Component type registry (for versioning and compatibility checks)
     */
    componentTypeRegistry: IPrefabComponentTypeEntry[];
}

/**
 * 预制体资产（加载后的内存表示）
 * Prefab asset (in-memory representation after loading)
 */
export interface IPrefabAsset {
    /**
     * 预制体数据
     * Prefab data
     */
    data: IPrefabData;

    /**
     * 资产 GUID
     * Asset GUID
     */
    guid: AssetGUID;

    /**
     * 资产路径
     * Asset path
     */
    path: string;

    /**
     * 根实体数据（快捷访问）
     * Root entity data (quick access)
     */
    readonly root: SerializedPrefabEntity;

    /**
     * 包含的组件类型列表（快捷访问）
     * List of component types used (quick access)
     */
    readonly componentTypes: string[];

    /**
     * 引用的资产列表（快捷访问）
     * List of referenced assets (quick access)
     */
    readonly referencedAssets: AssetGUID[];
}

/**
 * 预制体实例化选项
 * Prefab instantiation options
 */
export interface IPrefabInstantiateOptions {
    /**
     * 父实体 ID（可选）
     * Parent entity ID (optional)
     */
    parentId?: number;

    /**
     * 位置覆盖
     * Position override
     */
    position?: { x: number; y: number };

    /**
     * 旋转覆盖（角度）
     * Rotation override (in degrees)
     */
    rotation?: number;

    /**
     * 缩放覆盖
     * Scale override
     */
    scale?: { x: number; y: number };

    /**
     * 实体名称覆盖
     * Entity name override
     */
    name?: string;

    /**
     * 是否保留原始实体 ID（默认 false，生成新 ID）
     * Whether to preserve original entity IDs (default false, generate new IDs)
     */
    preserveIds?: boolean;

    /**
     * 是否标记为预制体实例（默认 true）
     * Whether to mark as prefab instance (default true)
     */
    trackInstance?: boolean;

    /**
     * 属性覆盖（组件属性覆盖）
     * Property overrides (component property overrides)
     */
    propertyOverrides?: IPrefabPropertyOverride[];
}

/**
 * 预制体属性覆盖
 * Prefab property override
 *
 * 用于记录预制体实例对原始预制体属性的修改。
 * Used to record modifications to prefab properties in instances.
 */
export interface IPrefabPropertyOverride {
    /**
     * 目标实体路径（从根节点的相对路径，如 "Root/Child/GrandChild"）
     * Target entity path (relative path from root, e.g., "Root/Child/GrandChild")
     */
    entityPath: string;

    /**
     * 组件类型名称
     * Component type name
     */
    componentType: string;

    /**
     * 属性路径（支持嵌套，如 "position.x"）
     * Property path (supports nesting, e.g., "position.x")
     */
    propertyPath: string;

    /**
     * 覆盖值
     * Override value
     */
    value: unknown;
}

/**
 * 预制体创建选项
 * Prefab creation options
 */
export interface IPrefabCreateOptions {
    /**
     * 预制体名称
     * Prefab name
     */
    name: string;

    /**
     * 预制体描述
     * Prefab description
     */
    description?: string;

    /**
     * 预制体标签
     * Prefab tags
     */
    tags?: string[];

    /**
     * 是否包含子实体
     * Whether to include child entities
     */
    includeChildren?: boolean;

    /**
     * 保存路径（可选，用于指定保存位置）
     * Save path (optional, for specifying save location)
     */
    savePath?: string;
}

/**
 * 预制体服务接口
 * Prefab service interface
 *
 * 提供预制体的创建、实例化、管理等功能。
 * Provides prefab creation, instantiation, management, etc.
 */
export interface IPrefabService {
    /**
     * 从实体创建预制体数据
     * Create prefab data from entity
     *
     * @param entity - 源实体 | Source entity
     * @param options - 创建选项 | Creation options
     * @returns 预制体数据 | Prefab data
     */
    createPrefab(entity: unknown, options: IPrefabCreateOptions): IPrefabData;

    /**
     * 实例化预制体
     * Instantiate prefab
     *
     * @param prefab - 预制体资产 | Prefab asset
     * @param scene - 目标场景 | Target scene
     * @param options - 实例化选项 | Instantiation options
     * @returns 创建的根实体 | Created root entity
     */
    instantiate(prefab: IPrefabAsset, scene: unknown, options?: IPrefabInstantiateOptions): unknown;

    /**
     * 通过 GUID 实例化预制体
     * Instantiate prefab by GUID
     *
     * @param guid - 预制体资产 GUID | Prefab asset GUID
     * @param scene - 目标场景 | Target scene
     * @param options - 实例化选项 | Instantiation options
     * @returns 创建的根实体 | Created root entity
     */
    instantiateByGuid(guid: AssetGUID, scene: unknown, options?: IPrefabInstantiateOptions): Promise<unknown>;

    /**
     * 检查实体是否为预制体实例
     * Check if entity is a prefab instance
     *
     * @param entity - 要检查的实体 | Entity to check
     * @returns 是否为预制体实例 | Whether it's a prefab instance
     */
    isPrefabInstance(entity: unknown): boolean;

    /**
     * 获取预制体实例的源预制体 GUID
     * Get source prefab GUID of a prefab instance
     *
     * @param entity - 预制体实例 | Prefab instance
     * @returns 源预制体 GUID，如果不是实例则返回 null | Source prefab GUID, null if not an instance
     */
    getSourcePrefabGuid(entity: unknown): AssetGUID | null;

    /**
     * 将实例的修改应用到源预制体
     * Apply instance modifications to source prefab
     *
     * @param instance - 预制体实例 | Prefab instance
     * @returns 是否成功应用 | Whether application was successful
     */
    applyToPrefab?(instance: unknown): Promise<boolean>;

    /**
     * 将实例还原为源预制体的状态
     * Revert instance to source prefab state
     *
     * @param instance - 预制体实例 | Prefab instance
     * @returns 是否成功还原 | Whether revert was successful
     */
    revertToPrefab?(instance: unknown): Promise<boolean>;

    /**
     * 获取实例相对于源预制体的属性覆盖
     * Get property overrides of instance relative to source prefab
     *
     * @param instance - 预制体实例 | Prefab instance
     * @returns 属性覆盖列表 | List of property overrides
     */
    getPropertyOverrides?(instance: unknown): IPrefabPropertyOverride[];
}

/**
 * 预制体文件格式版本
 * Prefab file format version
 */
export const PREFAB_FORMAT_VERSION = 1;

/**
 * 预制体文件扩展名
 * Prefab file extension
 */
export const PREFAB_FILE_EXTENSION = '.prefab';
