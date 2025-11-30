/**
 * 实体序列化器
 *
 * 负责实体的序列化和反序列化操作
 */

import { Entity } from '../Entity';
import { ComponentType } from '../Core/ComponentStorage';
import { ComponentSerializer, SerializedComponent } from './ComponentSerializer';
import { IScene } from '../IScene';
import { HierarchyComponent } from '../Components/HierarchyComponent';
import { HierarchySystem } from '../Systems/HierarchySystem';

/**
 * 序列化后的实体数据
 */
export interface SerializedEntity {
    /**
     * 实体ID
     */
    id: number;

    /**
     * 实体名称
     */
    name: string;

    /**
     * 实体标签
     */
    tag: number;

    /**
     * 激活状态
     */
    active: boolean;

    /**
     * 启用状态
     */
    enabled: boolean;

    /**
     * 更新顺序
     */
    updateOrder: number;

    /**
     * 组件列表
     */
    components: SerializedComponent[];

    /**
     * 子实体列表
     */
    children: SerializedEntity[];

    /**
     * 父实体ID（如果有）
     */
    parentId?: number;
}

/**
 * 实体序列化器类
 */
export class EntitySerializer {
    /**
     * 序列化单个实体
     *
     * @param entity 要序列化的实体
     * @param includeChildren 是否包含子实体（默认true）
     * @param hierarchySystem 层级系统（可选，用于获取层级信息）
     * @returns 序列化后的实体数据
     */
    public static serialize(
        entity: Entity,
        includeChildren: boolean = true,
        hierarchySystem?: HierarchySystem
    ): SerializedEntity {
        const serializedComponents = ComponentSerializer.serializeComponents(
            Array.from(entity.components)
        );

        const serializedEntity: SerializedEntity = {
            id: entity.id,
            name: entity.name,
            tag: entity.tag,
            active: entity.active,
            enabled: entity.enabled,
            updateOrder: entity.updateOrder,
            components: serializedComponents,
            children: []
        };

        // 通过 HierarchyComponent 获取层级信息
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (hierarchy?.parentId !== null && hierarchy?.parentId !== undefined) {
            serializedEntity.parentId = hierarchy.parentId;
        }

        // 序列化子实体
        // 直接使用 HierarchyComponent.childIds 获取子实体
        if (includeChildren && hierarchy && hierarchy.childIds.length > 0) {
            // 获取场景引用：优先从 hierarchySystem，否则从 entity.scene
            const scene = hierarchySystem?.scene ?? entity.scene;
            if (scene) {
                for (const childId of hierarchy.childIds) {
                    const child = scene.findEntityById(childId);
                    if (child) {
                        serializedEntity.children.push(this.serialize(child, true, hierarchySystem));
                    }
                }
            }
        }

        return serializedEntity;
    }

    /**
     * 反序列化实体
     *
     * @param serializedEntity 序列化的实体数据
     * @param componentRegistry 组件类型注册表
     * @param idGenerator 实体ID生成器（用于生成新ID或保持原ID）
     * @param preserveIds 是否保持原始ID（默认false）
     * @param scene 目标场景（可选，用于设置entity.scene以支持添加组件）
     * @param hierarchySystem 层级系统（可选，用于建立层级关系）
     * @returns 反序列化后的实体
     */
    public static deserialize(
        serializedEntity: SerializedEntity,
        componentRegistry: Map<string, ComponentType>,
        idGenerator: () => number,
        preserveIds: boolean = false,
        scene?: IScene,
        hierarchySystem?: HierarchySystem | null,
        allEntities?: Map<number, Entity>
    ): Entity {
        // 创建实体（使用原始ID或新生成的ID）
        const entityId = preserveIds ? serializedEntity.id : idGenerator();
        const entity = new Entity(serializedEntity.name, entityId);

        // 将实体添加到收集 Map 中（用于后续添加到场景）
        allEntities?.set(entity.id, entity);

        // 如果提供了scene，先设置entity.scene以支持添加组件
        if (scene) {
            entity.scene = scene;
        }

        // 恢复实体属性
        entity.tag = serializedEntity.tag;
        entity.active = serializedEntity.active;
        entity.enabled = serializedEntity.enabled;
        entity.updateOrder = serializedEntity.updateOrder;

        // 反序列化组件
        const components = ComponentSerializer.deserializeComponents(
            serializedEntity.components,
            componentRegistry
        );

        for (const component of components) {
            entity.addComponent(component);
        }

        // 重要：清除 HierarchyComponent 中的旧 ID
        // 当 preserveIds=false 时，序列化的 parentId 和 childIds 是旧 ID，需要重新建立
        // 通过 hierarchySystem.setParent 会正确设置新的 ID
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (hierarchy) {
            hierarchy.parentId = null;
            hierarchy.childIds = [];
        }

        // 反序列化子实体并建立层级关系
        for (const childData of serializedEntity.children) {
            const childEntity = this.deserialize(
                childData,
                componentRegistry,
                idGenerator,
                preserveIds,
                scene,
                hierarchySystem,
                allEntities
            );
            // 使用 HierarchySystem 建立层级关系
            hierarchySystem?.setParent(childEntity, entity);
        }

        return entity;
    }

    /**
     * 批量序列化实体
     *
     * @param entities 实体数组
     * @param includeChildren 是否包含子实体
     * @param hierarchySystem 层级系统（可选，用于获取层级信息）
     * @returns 序列化后的实体数据数组
     */
    public static serializeEntities(
        entities: Entity[],
        includeChildren: boolean = true,
        hierarchySystem?: HierarchySystem
    ): SerializedEntity[] {
        const result: SerializedEntity[] = [];

        for (const entity of entities) {
            // 只序列化顶层实体（没有父实体的实体）
            // 子实体会在父实体序列化时一并处理
            const hierarchy = entity.getComponent(HierarchyComponent);
            const bHasParent = hierarchy?.parentId !== null && hierarchy?.parentId !== undefined;
            if (!bHasParent || !includeChildren) {
                result.push(this.serialize(entity, includeChildren, hierarchySystem));
            }
        }

        return result;
    }

    /**
     * 批量反序列化实体
     *
     * @param serializedEntities 序列化的实体数据数组
     * @param componentRegistry 组件类型注册表
     * @param idGenerator 实体ID生成器
     * @param preserveIds 是否保持原始ID
     * @param scene 目标场景（可选，用于设置entity.scene以支持添加组件）
     * @param hierarchySystem 层级系统（可选，用于建立层级关系）
     * @returns 反序列化后的实体数组
     */
    public static deserializeEntities(
        serializedEntities: SerializedEntity[],
        componentRegistry: Map<string, ComponentType>,
        idGenerator: () => number,
        preserveIds: boolean = false,
        scene?: IScene,
        hierarchySystem?: HierarchySystem | null
    ): { rootEntities: Entity[]; allEntities: Map<number, Entity> } {
        const rootEntities: Entity[] = [];
        const allEntities = new Map<number, Entity>();

        for (const serialized of serializedEntities) {
            const entity = this.deserialize(
                serialized,
                componentRegistry,
                idGenerator,
                preserveIds,
                scene,
                hierarchySystem,
                allEntities
            );
            rootEntities.push(entity);
        }

        return { rootEntities, allEntities };
    }

    /**
     * 创建实体的深拷贝
     *
     * @param entity 要拷贝的实体
     * @param componentRegistry 组件类型注册表
     * @param idGenerator ID生成器
     * @returns 拷贝后的新实体
     */
    public static clone(
        entity: Entity,
        componentRegistry: Map<string, ComponentType>,
        idGenerator: () => number
    ): Entity {
        const serialized = this.serialize(entity, true);
        return this.deserialize(serialized, componentRegistry, idGenerator, false);
    }
}
