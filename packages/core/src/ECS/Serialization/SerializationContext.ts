import type { Entity } from '../Entity';
import type { Component } from '../Component';

/**
 * 序列化的实体引用格式
 *
 * Serialized entity reference format.
 */
export interface SerializedEntityRef {
    /**
     * 运行时 ID（向后兼容）
     *
     * Runtime ID (backward compatible).
     */
    id?: number | undefined;

    /**
     * 持久化 GUID（新格式）
     *
     * Persistent GUID (new format).
     */
    guid?: string | undefined;
}

/**
 * 待解析的实体引用记录
 *
 * Pending entity reference record.
 */
interface PendingEntityRef {
    /**
     * 持有引用的组件
     */
    component: Component;

    /**
     * 属性名
     */
    propertyKey: string;

    /**
     * 原始运行时 ID（可选）
     */
    originalId: number | undefined;

    /**
     * 原始 GUID（可选）
     */
    originalGuid: string | undefined;
}

/**
 * 序列化上下文
 *
 * 用于管理两阶段序列化/反序列化过程中的状态。
 * 第一阶段：创建所有实体和组件，收集待解析的引用。
 * 第二阶段：解析所有实体引用，建立正确的对象关系。
 *
 * Serialization context for managing two-phase serialization/deserialization.
 * Phase 1: Create all entities and components, collect pending references.
 * Phase 2: Resolve all entity references, establish correct object relationships.
 *
 * @example
 * ```typescript
 * const context = new SerializationContext();
 *
 * // 第一阶段：反序列化实体
 * for (const entityData of entities) {
 *     const entity = scene.createEntity(entityData.name);
 *     context.registerEntity(entity, entityData.id, entityData.guid);
 *
 *     // 反序列化组件时，遇到 EntityRef 注册为待解析
 *     context.registerPendingRef(component, 'target', entityData.targetId, entityData.targetGuid);
 * }
 *
 * // 第二阶段：解析所有引用
 * context.resolveAllReferences();
 * ```
 */
export class SerializationContext {
    /**
     * 运行时 ID 映射：原始 ID -> Entity
     *
     * Runtime ID mapping: original ID -> Entity.
     */
    private _idRemapping: Map<number, Entity> = new Map();

    /**
     * GUID 映射：persistentId -> Entity
     *
     * GUID mapping: persistentId -> Entity.
     */
    private _guidLookup: Map<string, Entity> = new Map();

    /**
     * 待解析的实体引用列表
     *
     * Pending entity references to resolve.
     */
    private _pendingRefs: PendingEntityRef[] = [];

    /**
     * 是否保留原始 ID
     *
     * Whether to preserve original IDs.
     */
    private _preserveIds: boolean = false;

    /**
     * 设置是否保留原始 ID
     *
     * Set whether to preserve original IDs.
     */
    public setPreserveIds(value: boolean): void {
        this._preserveIds = value;
    }

    /**
     * 获取是否保留原始 ID
     *
     * Get whether to preserve original IDs.
     */
    public get preserveIds(): boolean {
        return this._preserveIds;
    }

    /**
     * 注册实体到上下文
     *
     * Register entity to context for later reference resolution.
     *
     * @param entity - 实体实例
     * @param originalId - 原始运行时 ID（可选，用于 ID 映射）
     * @param originalGuid - 原始 GUID（可选，用于 GUID 映射，默认使用 entity.persistentId）
     */
    public registerEntity(entity: Entity, originalId?: number, originalGuid?: string): void {
        // 使用实体自身的 persistentId 或提供的 originalGuid
        const guid = originalGuid ?? entity.persistentId;
        this._guidLookup.set(guid, entity);

        // 如果提供了原始 ID，建立 ID 映射
        if (originalId !== undefined) {
            this._idRemapping.set(originalId, entity);
        }
    }

    /**
     * 根据原始 ID 获取实体
     *
     * Get entity by original runtime ID.
     *
     * @param originalId - 原始运行时 ID
     * @returns 实体实例或 null
     */
    public getEntityById(originalId: number): Entity | null {
        return this._idRemapping.get(originalId) ?? null;
    }

    /**
     * 根据 GUID 获取实体
     *
     * Get entity by GUID.
     *
     * @param guid - 持久化 GUID
     * @returns 实体实例或 null
     */
    public getEntityByGuid(guid: string): Entity | null {
        return this._guidLookup.get(guid) ?? null;
    }

    /**
     * 解析实体引用
     *
     * Resolve entity reference, preferring GUID over ID.
     *
     * @param ref - 序列化的实体引用
     * @returns 实体实例或 null
     */
    public resolveEntityRef(ref: SerializedEntityRef | null | undefined): Entity | null {
        if (!ref) {
            return null;
        }

        // 优先使用 GUID
        if (ref.guid) {
            const entity = this._guidLookup.get(ref.guid);
            if (entity) {
                return entity;
            }
        }

        // 降级使用 ID
        if (ref.id !== undefined) {
            const entity = this._idRemapping.get(ref.id);
            if (entity) {
                return entity;
            }
        }

        return null;
    }

    /**
     * 注册待解析的实体引用
     *
     * Register a pending entity reference to be resolved later.
     *
     * @param component - 持有引用的组件
     * @param propertyKey - 属性名
     * @param originalId - 原始运行时 ID
     * @param originalGuid - 原始 GUID
     */
    public registerPendingRef(
        component: Component,
        propertyKey: string,
        originalId?: number,
        originalGuid?: string
    ): void {
        this._pendingRefs.push({
            component,
            propertyKey,
            originalId,
            originalGuid
        });
    }

    /**
     * 解析所有待处理的实体引用
     *
     * Resolve all pending entity references.
     * Should be called after all entities have been created.
     *
     * @returns 成功解析的引用数量
     */
    public resolveAllReferences(): number {
        let resolvedCount = 0;

        for (const pending of this._pendingRefs) {
            const entity = this.resolveEntityRef({
                id: pending.originalId,
                guid: pending.originalGuid
            });

            if (entity) {
                // 使用类型断言设置属性值
                (pending.component as unknown as Record<string, unknown>)[pending.propertyKey] = entity;
                resolvedCount++;
            }
            // 如果无法解析，保持为 null（已在反序列化时设置）
        }

        return resolvedCount;
    }

    /**
     * 获取未解析的引用数量
     *
     * Get count of unresolved references.
     */
    public getUnresolvedCount(): number {
        let count = 0;
        for (const pending of this._pendingRefs) {
            const entity = this.resolveEntityRef({
                id: pending.originalId,
                guid: pending.originalGuid
            });
            if (!entity) {
                count++;
            }
        }
        return count;
    }

    /**
     * 获取待解析引用数量
     *
     * Get count of pending references.
     */
    public getPendingCount(): number {
        return this._pendingRefs.length;
    }

    /**
     * 获取已注册实体数量
     *
     * Get count of registered entities.
     */
    public getRegisteredEntityCount(): number {
        return this._guidLookup.size;
    }

    /**
     * 清除上下文状态
     *
     * Clear context state.
     */
    public clear(): void {
        this._idRemapping.clear();
        this._guidLookup.clear();
        this._pendingRefs = [];
    }

    /**
     * 获取调试信息
     *
     * Get debug information.
     */
    public getDebugInfo(): {
        registeredEntities: number;
        pendingRefs: number;
        unresolvedRefs: number;
        preserveIds: boolean;
    } {
        return {
            registeredEntities: this._guidLookup.size,
            pendingRefs: this._pendingRefs.length,
            unresolvedRefs: this.getUnresolvedCount(),
            preserveIds: this._preserveIds
        };
    }
}
