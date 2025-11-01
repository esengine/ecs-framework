/**
 * 增量序列化器
 *
 * 提供高性能的增量序列化支持，只序列化变更的数据
 * 适用于网络同步、大场景存档、时间回溯等场景
 */

import type { IScene } from '../IScene';
import { Entity } from '../Entity';
import { ComponentSerializer, SerializedComponent } from './ComponentSerializer';
import { SerializedEntity } from './EntitySerializer';
import { ComponentType } from '../Core/ComponentStorage';
import { BinarySerializer } from '../../Utils/BinarySerializer';

/**
 * 变更操作类型
 */
export enum ChangeOperation {
    /** 添加新实体 */
    EntityAdded = 'entity_added',
    /** 删除实体 */
    EntityRemoved = 'entity_removed',
    /** 实体属性更新 */
    EntityUpdated = 'entity_updated',
    /** 添加组件 */
    ComponentAdded = 'component_added',
    /** 删除组件 */
    ComponentRemoved = 'component_removed',
    /** 组件数据更新 */
    ComponentUpdated = 'component_updated',
    /** 场景数据更新 */
    SceneDataUpdated = 'scene_data_updated'
}

/**
 * 实体变更记录
 */
export interface EntityChange {
    /** 操作类型 */
    operation: ChangeOperation;
    /** 实体ID */
    entityId: number;
    /** 实体名称（用于Added操作） */
    entityName?: string;
    /** 实体数据（用于Added/Updated操作） */
    entityData?: Partial<SerializedEntity>;
}

/**
 * 组件变更记录
 */
export interface ComponentChange {
    /** 操作类型 */
    operation: ChangeOperation;
    /** 实体ID */
    entityId: number;
    /** 组件类型名称 */
    componentType: string;
    /** 组件数据（用于Added/Updated操作） */
    componentData?: SerializedComponent;
}

/**
 * 场景数据变更记录
 */
export interface SceneDataChange {
    /** 操作类型 */
    operation: ChangeOperation;
    /** 变更的键 */
    key: string;
    /** 新值 */
    value: any;
    /** 是否删除 */
    deleted?: boolean;
}

/**
 * 增量序列化数据
 */
export interface IncrementalSnapshot {
    /** 快照版本号 */
    version: number;
    /** 时间戳 */
    timestamp: number;
    /** 场景名称 */
    sceneName: string;
    /** 基础版本号（相对于哪个快照的增量） */
    baseVersion: number;
    /** 实体变更列表 */
    entityChanges: EntityChange[];
    /** 组件变更列表 */
    componentChanges: ComponentChange[];
    /** 场景数据变更列表 */
    sceneDataChanges: SceneDataChange[];
}

/**
 * 场景快照（用于对比）
 */
interface SceneSnapshot {
    /** 快照版本号 */
    version: number;
    /** 实体ID集合 */
    entityIds: Set<number>;
    /** 实体数据映射 */
    entities: Map<number, {
        name: string;
        tag: number;
        active: boolean;
        enabled: boolean;
        updateOrder: number;
        parentId?: number;
    }>;
    /** 组件数据映射 (entityId -> componentType -> serializedData) */
    components: Map<number, Map<string, string>>;  // 使用JSON字符串存储组件数据
    /** 场景自定义数据 */
    sceneData: Map<string, string>;  // 使用JSON字符串存储场景数据
}

/**
 * 增量序列化格式
 */
export type IncrementalSerializationFormat = 'json' | 'binary';

/**
 * 增量序列化选项
 */
export interface IncrementalSerializationOptions {
    /**
     * 是否包含组件数据的深度对比
     * 默认true，设为false可提升性能但可能漏掉组件内部字段变更
     */
    deepComponentComparison?: boolean;

    /**
     * 是否跟踪场景数据变更
     * 默认true
     */
    trackSceneData?: boolean;

    /**
     * 是否压缩快照（使用JSON序列化）
     * 默认false，设为true可减少内存占用但增加CPU开销
     */
    compressSnapshot?: boolean;

    /**
     * 序列化格式
     * - 'json': JSON格式
     * - 'binary': 二进制格式
     * 默认 'json'
     */
    format?: IncrementalSerializationFormat;

    /**
     * 是否美化JSON输出（仅在format='json'时有效）
     * 默认false
     */
    pretty?: boolean;
}

/**
 * 增量序列化器类
 */
export class IncrementalSerializer {
    /** 当前快照版本号 */
    private static snapshotVersion = 0;

    /**
     * 创建场景快照
     *
     * @param scene 要快照的场景
     * @param options 序列化选项
     * @returns 场景快照对象
     */
    public static createSnapshot(
        scene: IScene,
        options?: IncrementalSerializationOptions
    ): SceneSnapshot {
        const opts = {
            deepComponentComparison: true,
            trackSceneData: true,
            compressSnapshot: false,
            ...options
        };

        const snapshot: SceneSnapshot = {
            version: ++this.snapshotVersion,
            entityIds: new Set(),
            entities: new Map(),
            components: new Map(),
            sceneData: new Map()
        };

        // 快照所有实体
        for (const entity of scene.entities.buffer) {
            snapshot.entityIds.add(entity.id);

            // 存储实体基本信息
            snapshot.entities.set(entity.id, {
                name: entity.name,
                tag: entity.tag,
                active: entity.active,
                enabled: entity.enabled,
                updateOrder: entity.updateOrder,
                ...(entity.parent && { parentId: entity.parent.id })
            });

            // 快照组件
            if (opts.deepComponentComparison) {
                const componentMap = new Map<string, string>();

                for (const component of entity.components) {
                    const serialized = ComponentSerializer.serialize(component);
                    if (serialized) {
                        // 使用JSON字符串存储，便于后续对比
                        componentMap.set(
                            serialized.type,
                            JSON.stringify(serialized.data)
                        );
                    }
                }

                if (componentMap.size > 0) {
                    snapshot.components.set(entity.id, componentMap);
                }
            }
        }

        // 快照场景数据
        if (opts.trackSceneData) {
            for (const [key, value] of scene.sceneData) {
                snapshot.sceneData.set(key, JSON.stringify(value));
            }
        }

        return snapshot;
    }

    /**
     * 计算增量变更
     *
     * @param scene 当前场景
     * @param baseSnapshot 基础快照
     * @param options 序列化选项
     * @returns 增量快照
     */
    public static computeIncremental(
        scene: IScene,
        baseSnapshot: SceneSnapshot,
        options?: IncrementalSerializationOptions
    ): IncrementalSnapshot {
        const opts = {
            deepComponentComparison: true,
            trackSceneData: true,
            ...options
        };

        const incremental: IncrementalSnapshot = {
            version: ++this.snapshotVersion,
            timestamp: Date.now(),
            sceneName: scene.name,
            baseVersion: baseSnapshot.version,
            entityChanges: [],
            componentChanges: [],
            sceneDataChanges: []
        };

        const currentEntityIds = new Set<number>();

        // 检测实体变更
        for (const entity of scene.entities.buffer) {
            currentEntityIds.add(entity.id);

            if (!baseSnapshot.entityIds.has(entity.id)) {
                // 新增实体
                incremental.entityChanges.push({
                    operation: ChangeOperation.EntityAdded,
                    entityId: entity.id,
                    entityName: entity.name,
                    entityData: {
                        id: entity.id,
                        name: entity.name,
                        tag: entity.tag,
                        active: entity.active,
                        enabled: entity.enabled,
                        updateOrder: entity.updateOrder,
                        ...(entity.parent && { parentId: entity.parent.id }),
                        components: [],
                        children: []
                    }
                });

                // 新增实体的所有组件都是新增
                for (const component of entity.components) {
                    const serialized = ComponentSerializer.serialize(component);
                    if (serialized) {
                        incremental.componentChanges.push({
                            operation: ChangeOperation.ComponentAdded,
                            entityId: entity.id,
                            componentType: serialized.type,
                            componentData: serialized
                        });
                    }
                }
            } else {
                // 检查实体属性变更
                const oldData = baseSnapshot.entities.get(entity.id)!;
                const entityChanged =
                    oldData.name !== entity.name ||
                    oldData.tag !== entity.tag ||
                    oldData.active !== entity.active ||
                    oldData.enabled !== entity.enabled ||
                    oldData.updateOrder !== entity.updateOrder ||
                    oldData.parentId !== entity.parent?.id;

                if (entityChanged) {
                    incremental.entityChanges.push({
                        operation: ChangeOperation.EntityUpdated,
                        entityId: entity.id,
                        entityData: {
                            name: entity.name,
                            tag: entity.tag,
                            active: entity.active,
                            enabled: entity.enabled,
                            updateOrder: entity.updateOrder,
                            ...(entity.parent && { parentId: entity.parent.id })
                        }
                    });
                }

                // 检查组件变更
                if (opts.deepComponentComparison) {
                    this.detectComponentChanges(
                        entity,
                        baseSnapshot,
                        incremental.componentChanges
                    );
                }
            }
        }

        // 检测删除的实体
        for (const oldEntityId of baseSnapshot.entityIds) {
            if (!currentEntityIds.has(oldEntityId)) {
                incremental.entityChanges.push({
                    operation: ChangeOperation.EntityRemoved,
                    entityId: oldEntityId
                });
            }
        }

        // 检测场景数据变更
        if (opts.trackSceneData) {
            this.detectSceneDataChanges(
                scene,
                baseSnapshot,
                incremental.sceneDataChanges
            );
        }

        return incremental;
    }

    /**
     * 检测组件变更
     */
    private static detectComponentChanges(
        entity: Entity,
        baseSnapshot: SceneSnapshot,
        componentChanges: ComponentChange[]
    ): void {
        const oldComponents = baseSnapshot.components.get(entity.id);
        const currentComponents = new Map<string, SerializedComponent>();

        // 收集当前组件
        for (const component of entity.components) {
            const serialized = ComponentSerializer.serialize(component);
            if (serialized) {
                currentComponents.set(serialized.type, serialized);
            }
        }

        // 检测新增和更新的组件
        for (const [type, serialized] of currentComponents) {
            const currentData = JSON.stringify(serialized.data);

            if (!oldComponents || !oldComponents.has(type)) {
                // 新增组件
                componentChanges.push({
                    operation: ChangeOperation.ComponentAdded,
                    entityId: entity.id,
                    componentType: type,
                    componentData: serialized
                });
            } else if (oldComponents.get(type) !== currentData) {
                // 组件数据变更
                componentChanges.push({
                    operation: ChangeOperation.ComponentUpdated,
                    entityId: entity.id,
                    componentType: type,
                    componentData: serialized
                });
            }
        }

        // 检测删除的组件
        if (oldComponents) {
            for (const oldType of oldComponents.keys()) {
                if (!currentComponents.has(oldType)) {
                    componentChanges.push({
                        operation: ChangeOperation.ComponentRemoved,
                        entityId: entity.id,
                        componentType: oldType
                    });
                }
            }
        }
    }

    /**
     * 检测场景数据变更
     */
    private static detectSceneDataChanges(
        scene: IScene,
        baseSnapshot: SceneSnapshot,
        sceneDataChanges: SceneDataChange[]
    ): void {
        const currentKeys = new Set<string>();

        // 检测新增和更新的场景数据
        for (const [key, value] of scene.sceneData) {
            currentKeys.add(key);
            const currentValue = JSON.stringify(value);
            const oldValue = baseSnapshot.sceneData.get(key);

            if (!oldValue || oldValue !== currentValue) {
                sceneDataChanges.push({
                    operation: ChangeOperation.SceneDataUpdated,
                    key,
                    value
                });
            }
        }

        // 检测删除的场景数据
        for (const oldKey of baseSnapshot.sceneData.keys()) {
            if (!currentKeys.has(oldKey)) {
                sceneDataChanges.push({
                    operation: ChangeOperation.SceneDataUpdated,
                    key: oldKey,
                    value: undefined,
                    deleted: true
                });
            }
        }
    }

    /**
     * 应用增量变更到场景
     *
     * @param scene 目标场景
     * @param incremental 增量快照
     * @param componentRegistry 组件类型注册表
     */
    public static applyIncremental(
        scene: IScene,
        incremental: IncrementalSnapshot,
        componentRegistry: Map<string, ComponentType>
    ): void {
        // 应用实体变更
        for (const change of incremental.entityChanges) {
            switch (change.operation) {
                case ChangeOperation.EntityAdded:
                    this.applyEntityAdded(scene, change);
                    break;
                case ChangeOperation.EntityRemoved:
                    this.applyEntityRemoved(scene, change);
                    break;
                case ChangeOperation.EntityUpdated:
                    this.applyEntityUpdated(scene, change);
                    break;
            }
        }

        // 应用组件变更
        for (const change of incremental.componentChanges) {
            switch (change.operation) {
                case ChangeOperation.ComponentAdded:
                    this.applyComponentAdded(scene, change, componentRegistry);
                    break;
                case ChangeOperation.ComponentRemoved:
                    this.applyComponentRemoved(scene, change, componentRegistry);
                    break;
                case ChangeOperation.ComponentUpdated:
                    this.applyComponentUpdated(scene, change, componentRegistry);
                    break;
            }
        }

        // 应用场景数据变更
        for (const change of incremental.sceneDataChanges) {
            if (change.deleted) {
                scene.sceneData.delete(change.key);
            } else {
                scene.sceneData.set(change.key, change.value);
            }
        }
    }

    private static applyEntityAdded(scene: IScene, change: EntityChange): void {
        if (!change.entityData) return;

        const entity = new Entity(change.entityName || 'Entity', change.entityId);
        entity.tag = change.entityData.tag || 0;
        entity.active = change.entityData.active ?? true;
        entity.enabled = change.entityData.enabled ?? true;
        entity.updateOrder = change.entityData.updateOrder || 0;

        scene.addEntity(entity);
    }

    private static applyEntityRemoved(scene: IScene, change: EntityChange): void {
        const entity = scene.entities.findEntityById(change.entityId);
        if (entity) {
            entity.destroy();
        }
    }

    private static applyEntityUpdated(scene: IScene, change: EntityChange): void {
        if (!change.entityData) return;

        const entity = scene.entities.findEntityById(change.entityId);
        if (!entity) return;

        if (change.entityData.name !== undefined) entity.name = change.entityData.name;
        if (change.entityData.tag !== undefined) entity.tag = change.entityData.tag;
        if (change.entityData.active !== undefined) entity.active = change.entityData.active;
        if (change.entityData.enabled !== undefined) entity.enabled = change.entityData.enabled;
        if (change.entityData.updateOrder !== undefined) entity.updateOrder = change.entityData.updateOrder;

        if (change.entityData.parentId !== undefined) {
            const newParent = scene.entities.findEntityById(change.entityData.parentId);
            if (newParent && entity.parent !== newParent) {
                if (entity.parent) {
                    entity.parent.removeChild(entity);
                }
                newParent.addChild(entity);
            }
        } else if (entity.parent) {
            entity.parent.removeChild(entity);
        }
    }

    private static applyComponentAdded(
        scene: IScene,
        change: ComponentChange,
        componentRegistry: Map<string, ComponentType>
    ): void {
        if (!change.componentData) return;

        const entity = scene.entities.findEntityById(change.entityId);
        if (!entity) return;

        const component = ComponentSerializer.deserialize(change.componentData, componentRegistry);
        if (component) {
            entity.addComponent(component);
        }
    }

    private static applyComponentRemoved(
        scene: IScene,
        change: ComponentChange,
        componentRegistry: Map<string, ComponentType>
    ): void {
        const entity = scene.entities.findEntityById(change.entityId);
        if (!entity) return;

        const componentClass = componentRegistry.get(change.componentType);
        if (!componentClass) return;

        entity.removeComponentByType(componentClass);
    }

    private static applyComponentUpdated(
        scene: IScene,
        change: ComponentChange,
        componentRegistry: Map<string, ComponentType>
    ): void {
        if (!change.componentData) return;

        const entity = scene.entities.findEntityById(change.entityId);
        if (!entity) return;

        const componentClass = componentRegistry.get(change.componentType);
        if (!componentClass) return;

        entity.removeComponentByType(componentClass);

        const component = ComponentSerializer.deserialize(change.componentData, componentRegistry);
        if (component) {
            entity.addComponent(component);
        }
    }

    /**
     * 序列化增量快照
     *
     * @param incremental 增量快照
     * @param options 序列化选项
     * @returns 序列化后的数据（JSON字符串或二进制Uint8Array）
     *
     * @example
     * ```typescript
     * // JSON格式（默认）
     * const jsonData = IncrementalSerializer.serializeIncremental(snapshot);
     *
     * // 二进制格式
     * const binaryData = IncrementalSerializer.serializeIncremental(snapshot, {
     *     format: 'binary'
     * });
     *
     * // 美化JSON
     * const prettyJson = IncrementalSerializer.serializeIncremental(snapshot, {
     *     format: 'json',
     *     pretty: true
     * });
     * ```
     */
    public static serializeIncremental(
        incremental: IncrementalSnapshot,
        options?: { format?: IncrementalSerializationFormat; pretty?: boolean }
    ): string | Uint8Array {
        const opts = {
            format: 'json' as IncrementalSerializationFormat,
            pretty: false,
            ...options
        };

        if (opts.format === 'binary') {
            return BinarySerializer.encode(incremental);
        } else {
            return opts.pretty
                ? JSON.stringify(incremental, null, 2)
                : JSON.stringify(incremental);
        }
    }

    /**
     * 反序列化增量快照
     *
     * @param data 序列化的数据（JSON字符串或二进制Uint8Array）
     * @returns 增量快照
     *
     * @example
     * ```typescript
     * // 从JSON反序列化
     * const snapshot = IncrementalSerializer.deserializeIncremental(jsonString);
     *
     * // 从二进制反序列化
     * const snapshot = IncrementalSerializer.deserializeIncremental(buffer);
     * ```
     */
    public static deserializeIncremental(data: string | Uint8Array): IncrementalSnapshot {
        if (typeof data === 'string') {
            return JSON.parse(data);
        } else {
            return BinarySerializer.decode(data) as IncrementalSnapshot;
        }
    }

    /**
     * 获取增量快照的统计信息
     *
     * @param incremental 增量快照
     * @returns 统计信息
     */
    public static getIncrementalStats(incremental: IncrementalSnapshot): {
        totalChanges: number;
        entityChanges: number;
        componentChanges: number;
        sceneDataChanges: number;
        addedEntities: number;
        removedEntities: number;
        updatedEntities: number;
        addedComponents: number;
        removedComponents: number;
        updatedComponents: number;
    } {
        return {
            totalChanges:
                incremental.entityChanges.length +
                incremental.componentChanges.length +
                incremental.sceneDataChanges.length,
            entityChanges: incremental.entityChanges.length,
            componentChanges: incremental.componentChanges.length,
            sceneDataChanges: incremental.sceneDataChanges.length,
            addedEntities: incremental.entityChanges.filter(
                (c) => c.operation === ChangeOperation.EntityAdded
            ).length,
            removedEntities: incremental.entityChanges.filter(
                (c) => c.operation === ChangeOperation.EntityRemoved
            ).length,
            updatedEntities: incremental.entityChanges.filter(
                (c) => c.operation === ChangeOperation.EntityUpdated
            ).length,
            addedComponents: incremental.componentChanges.filter(
                (c) => c.operation === ChangeOperation.ComponentAdded
            ).length,
            removedComponents: incremental.componentChanges.filter(
                (c) => c.operation === ChangeOperation.ComponentRemoved
            ).length,
            updatedComponents: incremental.componentChanges.filter(
                (c) => c.operation === ChangeOperation.ComponentUpdated
            ).length
        };
    }

    /**
     * 重置快照版本号（用于测试）
     */
    public static resetVersion(): void {
        this.snapshotVersion = 0;
    }
}
