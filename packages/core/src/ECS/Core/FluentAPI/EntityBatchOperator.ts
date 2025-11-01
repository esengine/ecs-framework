import { Entity } from '../../Entity';
import { Component } from '../../Component';
import { ComponentType } from '../ComponentStorage';

/**
 * 实体批量操作器
 * 提供对多个实体的批量操作
 */
export class EntityBatchOperator {
    private entities: Entity[];

    constructor(entities: Entity[]) {
        this.entities = entities;
    }

    /**
     * 批量添加组件
     * @param component 组件实例
     * @returns 批量操作器
     */
    public addComponent<T extends Component>(component: T): EntityBatchOperator {
        for (const entity of this.entities) {
            entity.addComponent(component);
        }
        return this;
    }

    /**
     * 批量移除组件
     * @param componentType 组件类型
     * @returns 批量操作器
     */
    public removeComponent<T extends Component>(componentType: ComponentType<T>): EntityBatchOperator {
        for (const entity of this.entities) {
            entity.removeComponentByType(componentType);
        }
        return this;
    }

    /**
     * 批量设置活跃状态
     * @param active 是否活跃
     * @returns 批量操作器
     */
    public setActive(active: boolean): EntityBatchOperator {
        for (const entity of this.entities) {
            entity.active = active;
        }
        return this;
    }

    /**
     * 批量设置标签
     * @param tag 标签
     * @returns 批量操作器
     */
    public setTag(tag: number): EntityBatchOperator {
        for (const entity of this.entities) {
            entity.tag = tag;
        }
        return this;
    }

    /**
     * 批量执行操作
     * @param operation 操作函数
     * @returns 批量操作器
     */
    public forEach(operation: (entity: Entity, index: number) => void): EntityBatchOperator {
        this.entities.forEach(operation);
        return this;
    }

    /**
     * 过滤实体
     * @param predicate 过滤条件
     * @returns 新的批量操作器
     */
    public filter(predicate: (entity: Entity) => boolean): EntityBatchOperator {
        return new EntityBatchOperator(this.entities.filter(predicate));
    }

    /**
     * 获取实体数组
     * @returns 实体数组
     */
    public toArray(): Entity[] {
        return this.entities.slice();
    }

    /**
     * 获取实体数量
     * @returns 实体数量
     */
    public count(): number {
        return this.entities.length;
    }
}
