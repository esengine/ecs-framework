/**
 * 预制体序列化器
 * Prefab serializer
 *
 * 提供预制体的创建和实例化功能。
 * Provides prefab creation and instantiation functionality.
 */

import { Entity } from '../Entity';
import { IScene } from '../IScene';
import { ComponentType } from '../Core/ComponentStorage';
import { EntitySerializer, SerializedEntity } from './EntitySerializer';
import { HierarchySystem } from '../Systems/HierarchySystem';
import { PrefabInstanceComponent } from '../Components/PrefabInstanceComponent';

/**
 * 序列化的预制体实体（扩展自 SerializedEntity）
 * Serialized prefab entity (extends SerializedEntity)
 */
export interface SerializedPrefabEntity extends SerializedEntity {
    /**
     * 是否为预制体根节点
     * Whether this is the prefab root entity
     */
    isPrefabRoot?: boolean;

    /**
     * 嵌套预制体的 GUID
     * GUID of nested prefab
     */
    nestedPrefabGuid?: string;
}

/**
 * 预制体元数据
 * Prefab metadata
 */
export interface PrefabMetadata {
    /** 预制体名称 | Prefab name */
    name: string;
    /** 资产 GUID | Asset GUID */
    guid?: string;
    /** 创建时间戳 | Creation timestamp */
    createdAt: number;
    /** 最后修改时间戳 | Last modification timestamp */
    modifiedAt: number;
    /** 使用的组件类型列表 | List of component types used */
    componentTypes: string[];
    /** 引用的资产 GUID 列表 | List of referenced asset GUIDs */
    referencedAssets: string[];
    /** 预制体描述 | Prefab description */
    description?: string;
    /** 预制体标签 | Prefab tags */
    tags?: string[];
}

/**
 * 组件类型注册条目
 * Component type registry entry
 */
export interface PrefabComponentTypeEntry {
    /** 组件类型名称 | Component type name */
    typeName: string;
    /** 组件版本号 | Component version number */
    version: number;
}

/**
 * 预制体数据格式
 * Prefab data format
 */
export interface PrefabData {
    /** 预制体格式版本号 | Prefab format version number */
    version: number;
    /** 预制体元数据 | Prefab metadata */
    metadata: PrefabMetadata;
    /** 根实体数据 | Root entity data */
    root: SerializedPrefabEntity;
    /** 组件类型注册表 | Component type registry */
    componentTypeRegistry: PrefabComponentTypeEntry[];
}

/**
 * 预制体创建选项
 * Prefab creation options
 */
export interface PrefabCreateOptions {
    /** 预制体名称 | Prefab name */
    name: string;
    /** 预制体描述 | Prefab description */
    description?: string;
    /** 预制体标签 | Prefab tags */
    tags?: string[];
    /** 是否包含子实体 | Whether to include child entities */
    includeChildren?: boolean;
}

/**
 * 预制体实例化选项
 * Prefab instantiation options
 */
export interface PrefabInstantiateOptions {
    /** 父实体 ID | Parent entity ID */
    parentId?: number;
    /** 位置覆盖 | Position override */
    position?: { x: number; y: number };
    /** 旋转覆盖（角度） | Rotation override (in degrees) */
    rotation?: number;
    /** 缩放覆盖 | Scale override */
    scale?: { x: number; y: number };
    /** 实体名称覆盖 | Entity name override */
    name?: string;
    /** 是否保留原始实体 ID | Whether to preserve original entity IDs */
    preserveIds?: boolean;
    /** 是否标记为预制体实例 | Whether to mark as prefab instance */
    trackInstance?: boolean;
}

/**
 * 预制体格式版本
 * Prefab format version
 */
export const PREFAB_FORMAT_VERSION = 1;

/**
 * 预制体序列化器类
 * Prefab serializer class
 *
 * 提供预制体的创建、序列化和实例化功能。
 * Provides prefab creation, serialization, and instantiation functionality.
 */
export class PrefabSerializer {
    /**
     * 从实体创建预制体数据
     * Create prefab data from entity
     *
     * @param entity - 源实体 | Source entity
     * @param options - 创建选项 | Creation options
     * @param hierarchySystem - 层级系统 | Hierarchy system
     * @returns 预制体数据 | Prefab data
     */
    public static createPrefab(
        entity: Entity,
        options: PrefabCreateOptions,
        hierarchySystem?: HierarchySystem
    ): PrefabData {
        const includeChildren = options.includeChildren ?? true;

        // 序列化实体 | Serialize entity
        const serializedEntity = EntitySerializer.serialize(
            entity,
            includeChildren,
            hierarchySystem
        );

        // 转换为预制体实体格式 | Convert to prefab entity format
        const prefabEntity = this.toPrefabEntity(serializedEntity, true);

        // 收集组件类型信息 | Collect component type information
        const { componentTypes, componentTypeRegistry } = this.collectComponentTypes(prefabEntity);

        // 收集引用的资产（TODO: 实现资产引用扫描）
        // Collect referenced assets (TODO: implement asset reference scanning)
        const referencedAssets: string[] = [];

        const now = Date.now();
        const metadata: PrefabMetadata = {
            name: options.name,
            createdAt: now,
            modifiedAt: now,
            componentTypes,
            referencedAssets
        };

        // 只在有值时添加可选属性 | Only add optional properties when they have values
        if (options.description) {
            metadata.description = options.description;
        }
        if (options.tags) {
            metadata.tags = options.tags;
        }

        return {
            version: PREFAB_FORMAT_VERSION,
            metadata,
            root: prefabEntity,
            componentTypeRegistry
        };
    }

    /**
     * 从预制体数据实例化实体
     * Instantiate entity from prefab data
     *
     * @param prefabData - 预制体数据 | Prefab data
     * @param scene - 目标场景 | Target scene
     * @param componentRegistry - 组件类型注册表 | Component type registry
     * @param options - 实例化选项 | Instantiation options
     * @returns 创建的根实体 | Created root entity
     */
    public static instantiate(
        prefabData: PrefabData,
        scene: IScene,
        componentRegistry: Map<string, ComponentType>,
        options: PrefabInstantiateOptions = {}
    ): Entity {
        const {
            parentId,
            name,
            preserveIds = false,
            trackInstance = true
        } = options;

        // 获取层级系统 | Get hierarchy system
        const hierarchySystem = scene.getSystem(HierarchySystem) ?? null;

        // ID 生成器 | ID generator
        let nextId = 1;
        const idGenerator = (): number => {
            while (scene.findEntityById(nextId)) {
                nextId++;
            }
            return nextId++;
        };

        // 反序列化实体 | Deserialize entity
        const { rootEntities, allEntities } = EntitySerializer.deserializeEntities(
            [prefabData.root],
            componentRegistry,
            idGenerator,
            preserveIds,
            scene,
            hierarchySystem
        );

        const rootEntity = rootEntities[0];
        if (!rootEntity) {
            throw new Error('Failed to instantiate prefab: no root entity created');
        }

        // 覆盖名称 | Override name
        if (name) {
            rootEntity.name = name;
        }

        // 将所有实体添加到场景 | Add all entities to scene
        for (const entity of allEntities.values()) {
            scene.entities.add(entity);
        }

        // 设置父级 | Set parent
        if (parentId !== undefined && hierarchySystem) {
            const parent = scene.findEntityById(parentId);
            if (parent) {
                hierarchySystem.setParent(rootEntity, parent);
            }
        }

        // 添加预制体实例组件 | Add prefab instance component
        if (trackInstance) {
            const prefabGuid = prefabData.metadata.guid || '';
            this.addPrefabInstanceComponents(
                rootEntity,
                allEntities,
                prefabGuid,
                '',
                hierarchySystem
            );
        }

        // TODO: 应用位置、旋转、缩放覆盖（需要 TransformComponent）
        // TODO: Apply position, rotation, scale overrides (requires TransformComponent)

        return rootEntity;
    }

    /**
     * 将序列化实体转换为预制体实体格式
     * Convert serialized entity to prefab entity format
     */
    private static toPrefabEntity(
        entity: SerializedEntity,
        isRoot: boolean
    ): SerializedPrefabEntity {
        const prefabEntity: SerializedPrefabEntity = {
            ...entity,
            isPrefabRoot: isRoot,
            children: entity.children.map(child => this.toPrefabEntity(child, false))
        };
        return prefabEntity;
    }

    /**
     * 收集预制体中使用的组件类型
     * Collect component types used in prefab
     */
    private static collectComponentTypes(
        entity: SerializedPrefabEntity
    ): {
        componentTypes: string[];
        componentTypeRegistry: PrefabComponentTypeEntry[];
    } {
        const typeMap = new Map<string, number>();

        const collectFromEntity = (e: SerializedPrefabEntity): void => {
            for (const comp of e.components) {
                if (!typeMap.has(comp.type)) {
                    typeMap.set(comp.type, comp.version);
                }
            }
            for (const child of e.children as SerializedPrefabEntity[]) {
                collectFromEntity(child);
            }
        };

        collectFromEntity(entity);

        const componentTypes = Array.from(typeMap.keys());
        const componentTypeRegistry: PrefabComponentTypeEntry[] = Array.from(
            typeMap.entries()
        ).map(([typeName, version]) => ({ typeName, version }));

        return { componentTypes, componentTypeRegistry };
    }

    /**
     * 为实例化的实体添加预制体实例组件
     * Add prefab instance components to instantiated entities
     */
    private static addPrefabInstanceComponents(
        rootEntity: Entity,
        allEntities: Map<number, Entity>,
        prefabGuid: string,
        prefabPath: string,
        _hierarchySystem: HierarchySystem | null
    ): void {
        const rootId = rootEntity.id;

        // 为根实体添加组件 | Add component to root entity
        const rootComp = new PrefabInstanceComponent(prefabGuid, prefabPath, true);
        rootComp.rootInstanceEntityId = rootId;
        rootEntity.addComponent(rootComp);

        // 为所有子实体添加组件 | Add component to all child entities
        for (const entity of allEntities.values()) {
            if (entity.id === rootId) continue;

            const childComp = new PrefabInstanceComponent(prefabGuid, prefabPath, false);
            childComp.rootInstanceEntityId = rootId;
            entity.addComponent(childComp);
        }
    }

    /**
     * 检查实体是否为预制体实例
     * Check if entity is a prefab instance
     */
    public static isPrefabInstance(entity: Entity): boolean {
        return entity.hasComponent(PrefabInstanceComponent);
    }

    /**
     * 获取预制体实例的源预制体 GUID
     * Get source prefab GUID of a prefab instance
     */
    public static getSourcePrefabGuid(entity: Entity): string | null {
        const comp = entity.getComponent(PrefabInstanceComponent);
        return comp?.sourcePrefabGuid || null;
    }

    /**
     * 获取预制体实例的根实体
     * Get root entity of a prefab instance
     */
    public static getPrefabInstanceRoot(entity: Entity): Entity | null {
        const comp = entity.getComponent(PrefabInstanceComponent);
        if (!comp || !comp.rootInstanceEntityId) return null;

        const scene = entity.scene;
        if (!scene) return null;

        return scene.findEntityById(comp.rootInstanceEntityId) || null;
    }

    /**
     * 将预制体数据序列化为 JSON 字符串
     * Serialize prefab data to JSON string
     */
    public static serialize(prefabData: PrefabData, pretty: boolean = true): string {
        return JSON.stringify(prefabData, null, pretty ? 2 : undefined);
    }

    /**
     * 从 JSON 字符串解析预制体数据
     * Parse prefab data from JSON string
     */
    public static deserialize(json: string): PrefabData {
        const data = JSON.parse(json) as PrefabData;
        // 基本验证 | Basic validation
        if (!data.version || !data.metadata || !data.root) {
            throw new Error('Invalid prefab data format');
        }
        return data;
    }

    /**
     * 验证预制体数据格式
     * Validate prefab data format
     */
    public static validate(prefabData: PrefabData): { valid: boolean; errors?: string[] } {
        const errors: string[] = [];

        if (typeof prefabData.version !== 'number') {
            errors.push('Invalid or missing version');
        }

        if (!prefabData.metadata) {
            errors.push('Missing metadata');
        } else {
            if (!prefabData.metadata.name) {
                errors.push('Missing metadata.name');
            }
            if (!Array.isArray(prefabData.metadata.componentTypes)) {
                errors.push('Invalid metadata.componentTypes');
            }
        }

        if (!prefabData.root) {
            errors.push('Missing root entity');
        } else {
            this.validateEntity(prefabData.root, errors, 'root');
        }

        if (!Array.isArray(prefabData.componentTypeRegistry)) {
            errors.push('Invalid componentTypeRegistry');
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }
        return { valid: true };
    }

    /**
     * 验证实体数据
     * Validate entity data
     */
    private static validateEntity(
        entity: SerializedPrefabEntity,
        errors: string[],
        path: string
    ): void {
        if (typeof entity.id !== 'number') {
            errors.push(`${path}: Invalid or missing id`);
        }
        if (typeof entity.name !== 'string') {
            errors.push(`${path}: Invalid or missing name`);
        }
        if (!Array.isArray(entity.components)) {
            errors.push(`${path}: Invalid or missing components`);
        }
        if (!Array.isArray(entity.children)) {
            errors.push(`${path}: Invalid or missing children`);
        } else {
            entity.children.forEach((child, index) => {
                this.validateEntity(child as SerializedPrefabEntity, errors, `${path}.children[${index}]`);
            });
        }
    }
}
