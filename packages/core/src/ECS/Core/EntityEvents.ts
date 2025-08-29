import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentType } from './ComponentStorage';
import { getComponentTypeName } from '../Decorators';
import { SceneBindings } from './SceneBindings';

/**
 * 实体事件数据接口
 */
export interface EntityEventData {
    timestamp: number;
    source: string;
    entityId: number;
    entityName: string;
    entityTag?: string;
}

/**
 * 组件事件数据接口
 */
export interface ComponentEventData extends EntityEventData {
    componentType: string;
    component: Component;
}

/**
 * 实体销毁事件数据接口
 */
export interface EntityDestroyEventData extends EntityEventData {
    // 销毁事件的特定数据
}

/**
 * 实体激活状态变更事件数据接口
 */
export interface EntityActiveChangedEventData {
    entity: Entity;
    active: boolean;
    activeInHierarchy: boolean;
}

/**
 * 实体事件管理器
 * 
 * 统一处理所有实体相关事件的发射
 */
export class EntityEvents {
    /**
     * 发射组件添加事件
     */
    public static emitComponentAdded(entity: Entity, component: Component): void {
        if (SceneBindings.shouldSuppressEffects(entity.scene)) {
            return;
        }

        const componentType = component.constructor as ComponentType;
        const eventData: ComponentEventData = {
            timestamp: Date.now(),
            source: 'Entity',
            entityId: entity.id,
            entityName: entity.name,
            entityTag: entity.tag !== 0 ? entity.tag.toString() : undefined,
            componentType: getComponentTypeName(componentType),
            component: component
        };

        EntityEvents.emitToScene(entity, 'component:added', eventData);
    }

    /**
     * 发射组件移除事件
     */
    public static emitComponentRemoved(entity: Entity, component: Component): void {
        if (SceneBindings.shouldSuppressEffects(entity.scene)) {
            return;
        }

        const componentType = component.constructor as ComponentType;
        const eventData: ComponentEventData = {
            timestamp: Date.now(),
            source: 'Entity',
            entityId: entity.id,
            entityName: entity.name,
            entityTag: entity.tag !== 0 ? entity.tag.toString() : undefined,
            componentType: getComponentTypeName(componentType),
            component: component
        };

        EntityEvents.emitToScene(entity, 'component:removed', eventData);
    }

    /**
     * 发射实体销毁事件
     */
    public static emitEntityDestroyed(entity: Entity): void {
        if (SceneBindings.shouldSuppressEffects(entity.scene)) {
            return;
        }

        const eventData: EntityDestroyEventData = {
            timestamp: Date.now(),
            source: 'Entity',
            entityId: entity.id,
            entityName: entity.name,
            entityTag: entity.tag !== 0 ? entity.tag.toString() : undefined
        };

        EntityEvents.emitToScene(entity, 'entity:destroyed', eventData);
    }

    /**
     * 发射实体激活状态变更事件
     */
    public static emitActiveChanged(entity: Entity): void {
        if (SceneBindings.shouldSuppressEffects(entity.scene)) {
            return;
        }

        const eventData: EntityActiveChangedEventData = {
            entity: entity,
            active: entity.active,
            activeInHierarchy: entity.activeInHierarchy
        };

        EntityEvents.emitToScene(entity, 'entity:activeChanged', eventData);
    }

    /**
     * 向场景事件系统发射事件
     * 
     * @param entity - 实体实例
     * @param eventName - 事件名称
     * @param eventData - 事件数据
     * @private
     */
    private static emitToScene(entity: Entity, eventName: string, eventData: any): void {
        // 只使用场景事件系统，不再支持静态 eventBus
        if (entity.scene && entity.scene.eventSystem) {
            entity.scene.eventSystem.emitSync(eventName, eventData);
        }
    }
}