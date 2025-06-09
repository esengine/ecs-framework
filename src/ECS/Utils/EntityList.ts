import { Entity } from '../Entity';
import { Component } from '../Component';

/**
 * 高性能实体列表管理器
 * 管理场景中的所有实体，支持快速查找和批量操作
 */
export class EntityList {
    public buffer: Entity[] = [];
    private _scene: any; // 临时使用any，避免循环依赖

    // 索引映射，提升查找性能
    private _idToEntity = new Map<number, Entity>();
    private _nameToEntities = new Map<string, Entity[]>();
    
    // 延迟操作队列
    private _entitiesToAdd: Entity[] = [];
    private _entitiesToRemove: Entity[] = [];
    private _isUpdating = false;

    public get count(): number {
        return this.buffer.length;
    }

    constructor(scene: any) {
        this._scene = scene;
    }

    /**
     * 添加实体（立即添加或延迟添加）
     * @param entity 要添加的实体
     */
    public add(entity: Entity): void {
        if (this._isUpdating) {
            // 如果正在更新中，延迟添加
            this._entitiesToAdd.push(entity);
        } else {
            this.addImmediate(entity);
        }
    }

    /**
     * 立即添加实体
     * @param entity 要添加的实体
     */
    private addImmediate(entity: Entity): void {
        // 检查是否已存在
        if (this._idToEntity.has(entity.id)) {
            return;
        }

        this.buffer.push(entity);
        this._idToEntity.set(entity.id, entity);
        
        // 更新名称索引
        this.updateNameIndex(entity, true);
    }

    /**
     * 移除实体（立即移除或延迟移除）
     * @param entity 要移除的实体
     */
    public remove(entity: Entity): void {
        if (this._isUpdating) {
            // 如果正在更新中，延迟移除
            this._entitiesToRemove.push(entity);
        } else {
            this.removeImmediate(entity);
        }
    }

    /**
     * 立即移除实体
     * @param entity 要移除的实体
     */
    private removeImmediate(entity: Entity): void {
        const index = this.buffer.indexOf(entity);
        if (index !== -1) {
            this.buffer.splice(index, 1);
            this._idToEntity.delete(entity.id);
            
            // 更新名称索引
            this.updateNameIndex(entity, false);
        }
    }

    /**
     * 移除所有实体
     */
    public removeAllEntities(): void {
        for (let i = this.buffer.length - 1; i >= 0; i--) {
            this.buffer[i].destroy();
        }
        
        this.buffer.length = 0;
        this._idToEntity.clear();
        this._nameToEntities.clear();
        this._entitiesToAdd.length = 0;
        this._entitiesToRemove.length = 0;
    }

    /**
     * 更新实体列表，处理延迟操作
     */
    public updateLists(): void {
        // 处理延迟添加的实体
        if (this._entitiesToAdd.length > 0) {
            for (const entity of this._entitiesToAdd) {
                this.addImmediate(entity);
            }
            this._entitiesToAdd.length = 0;
        }

        // 处理延迟移除的实体
        if (this._entitiesToRemove.length > 0) {
            for (const entity of this._entitiesToRemove) {
                this.removeImmediate(entity);
            }
            this._entitiesToRemove.length = 0;
        }
    }

    /**
     * 更新所有实体
     */
    public update(): void {
        this._isUpdating = true;
        
        try {
            for (let i = 0; i < this.buffer.length; i++) {
                const entity = this.buffer[i];
                if (entity.enabled && !entity.isDestroyed) {
                    entity.update();
                }
            }
        } finally {
            this._isUpdating = false;
        }
        
        // 处理延迟操作
        this.updateLists();
    }

    /**
     * 根据名称查找实体（使用索引，O(1)复杂度）
     * @param name 实体名称
     * @returns 找到的第一个实体或null
     */
    public findEntity(name: string): Entity | null {
        const entities = this._nameToEntities.get(name);
        return entities && entities.length > 0 ? entities[0] : null;
    }

    /**
     * 根据名称查找所有实体
     * @param name 实体名称
     * @returns 找到的所有实体数组
     */
    public findEntitiesByName(name: string): Entity[] {
        return this._nameToEntities.get(name) || [];
    }

    /**
     * 根据ID查找实体（使用索引，O(1)复杂度）
     * @param id 实体ID
     * @returns 找到的实体或null
     */
    public findEntityById(id: number): Entity | null {
        return this._idToEntity.get(id) || null;
    }

    /**
     * 根据标签查找实体
     * @param tag 标签
     * @returns 找到的所有实体数组
     */
    public findEntitiesByTag(tag: number): Entity[] {
        const result: Entity[] = [];
        
        for (const entity of this.buffer) {
            if (entity.tag === tag) {
                result.push(entity);
            }
        }
        
        return result;
    }

    /**
     * 根据组件类型查找实体
     * @param componentType 组件类型
     * @returns 找到的所有实体数组
     */
    public findEntitiesWithComponent<T extends Component>(componentType: new (...args: any[]) => T): Entity[] {
        const result: Entity[] = [];
        
        for (const entity of this.buffer) {
            if (entity.hasComponent(componentType)) {
                result.push(entity);
            }
        }
        
        return result;
    }

    /**
     * 批量操作：对所有实体执行指定操作
     * @param action 要执行的操作
     */
    public forEach(action: (entity: Entity) => void): void {
        for (const entity of this.buffer) {
            action(entity);
        }
    }

    /**
     * 批量操作：对符合条件的实体执行指定操作
     * @param predicate 筛选条件
     * @param action 要执行的操作
     */
    public forEachWhere(predicate: (entity: Entity) => boolean, action: (entity: Entity) => void): void {
        for (const entity of this.buffer) {
            if (predicate(entity)) {
                action(entity);
            }
        }
    }

    /**
     * 更新名称索引
     * @param entity 实体
     * @param isAdd 是否为添加操作
     */
    private updateNameIndex(entity: Entity, isAdd: boolean): void {
        if (!entity.name) {
            return;
        }

        if (isAdd) {
            let entities = this._nameToEntities.get(entity.name);
            if (!entities) {
                entities = [];
                this._nameToEntities.set(entity.name, entities);
            }
            entities.push(entity);
        } else {
            const entities = this._nameToEntities.get(entity.name);
            if (entities) {
                const index = entities.indexOf(entity);
                if (index !== -1) {
                    entities.splice(index, 1);
                    
                    // 如果数组为空，删除映射
                    if (entities.length === 0) {
                        this._nameToEntities.delete(entity.name);
                    }
                }
            }
        }
    }

    /**
     * 获取实体列表的统计信息
     * @returns 统计信息
     */
    public getStats(): {
        totalEntities: number;
        activeEntities: number;
        pendingAdd: number;
        pendingRemove: number;
        nameIndexSize: number;
    } {
        let activeCount = 0;
        for (const entity of this.buffer) {
            if (entity.enabled && !entity.isDestroyed) {
                activeCount++;
            }
        }

        return {
            totalEntities: this.buffer.length,
            activeEntities: activeCount,
            pendingAdd: this._entitiesToAdd.length,
            pendingRemove: this._entitiesToRemove.length,
            nameIndexSize: this._nameToEntities.size
        };
    }
}
