/**
 * 实体序列化器
 *
 * 负责实体的序列化和反序列化操作
 */

import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentType } from '../Core/ComponentStorage';
import { ComponentSerializer, SerializedComponent } from './ComponentSerializer';
import { IScene } from '../IScene';

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
     * @returns 序列化后的实体数据
     */
    public static serialize(entity: Entity, includeChildren: boolean = true): SerializedEntity {
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

        // 序列化父实体引用
        if (entity.parent) {
            serializedEntity.parentId = entity.parent.id;
        }

        // 序列化子实体
        if (includeChildren) {
            for (const child of entity.children) {
                serializedEntity.children.push(this.serialize(child, true));
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
     * @returns 反序列化后的实体
     */
    public static deserialize(
        serializedEntity: SerializedEntity,
        componentRegistry: Map<string, ComponentType>,
        idGenerator: () => number,
        preserveIds: boolean = false,
        scene?: IScene
    ): Entity {
        // 创建实体（使用原始ID或新生成的ID）
        const entityId = preserveIds ? serializedEntity.id : idGenerator();
        const entity = new Entity(serializedEntity.name, entityId);

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

        // 反序列化子实体
        for (const childData of serializedEntity.children) {
            const childEntity = this.deserialize(
                childData,
                componentRegistry,
                idGenerator,
                preserveIds,
                scene
            );
            entity.addChild(childEntity);
        }

        return entity;
    }

    /**
     * 批量序列化实体
     *
     * @param entities 实体数组
     * @param includeChildren 是否包含子实体
     * @returns 序列化后的实体数据数组
     */
    public static serializeEntities(
        entities: Entity[],
        includeChildren: boolean = true
    ): SerializedEntity[] {
        const result: SerializedEntity[] = [];

        for (const entity of entities) {
            // 只序列化顶层实体（没有父实体的实体）
            // 子实体会在父实体序列化时一并处理
            if (!entity.parent || !includeChildren) {
                result.push(this.serialize(entity, includeChildren));
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
     * @returns 反序列化后的实体数组
     */
    public static deserializeEntities(
        serializedEntities: SerializedEntity[],
        componentRegistry: Map<string, ComponentType>,
        idGenerator: () => number,
        preserveIds: boolean = false,
        scene?: IScene
    ): Entity[] {
        const result: Entity[] = [];

        for (const serialized of serializedEntities) {
            const entity = this.deserialize(
                serialized,
                componentRegistry,
                idGenerator,
                preserveIds,
                scene
            );
            result.push(entity);
        }

        return result;
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
