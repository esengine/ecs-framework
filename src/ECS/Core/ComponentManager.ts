import { Component } from '../Component';
import { ComponentRegistry, ComponentType } from './ComponentStorage';
import { EventBus } from './EventBus';

/**
 * 组件管理器
 * 
 * 接管Entity类中的组件管理逻辑，提供统一的组件操作接口。
 * 负责组件的添加、移除、查询和批量操作，维护组件缓存和位掩码。
 * 
 * @example
 * ```typescript
 * const componentManager = new ComponentManager(eventBus, componentStorage);
 * 
 * // 添加组件
 * const health = componentManager.addComponent(entityId, new HealthComponent(100));
 * 
 * // 获取组件
 * const healthComp = componentManager.getComponent(entityId, HealthComponent);
 * 
 * // 检查组件
 * const hasHealth = componentManager.hasComponent(entityId, HealthComponent);
 * ```
 */
export class ComponentManager {
    /** 事件总线引用 */
    private _eventBus: EventBus;
    
    /** 组件存储管理器引用 */
    private _componentStorage: any;
    
    /** 实体组件计数缓存 */
    private _entityComponentCounts: Map<number, number> = new Map();
    
    /** 实体组件类型缓存 */
    private _entityComponentTypes: Map<number, Set<ComponentType>> = new Map();
    
    /** 实体组件位掩码缓存 */
    private _entityComponentMasks: Map<number, bigint> = new Map();
    
    /** 批量操作状态 */
    private _batchOperationActive: boolean = false;
    private _pendingBatchUpdates: Array<() => void> = [];
    
    /**
     * 构造函数
     * 
     * @param eventBus 事件总线实例
     * @param componentStorage 组件存储管理器
     */
    constructor(eventBus: EventBus, componentStorage: any) {
        this._eventBus = eventBus;
        this._componentStorage = componentStorage;
    }
    
    /**
     * 添加组件到实体
     * 
     * @param entityId 实体ID
     * @param component 要添加的组件实例
     * @param entityName 实体名称（用于事件和调试）
     * @param entityTag 实体标签（用于事件）
     * @returns 添加的组件实例
     * @throws {Error} 如果组件类型已存在
     */
    public addComponent<T extends Component>(
        entityId: number, 
        component: T, 
        entityName?: string, 
        entityTag?: string
    ): T {
        const componentType = component.constructor as ComponentType<T>;
        
        // 检查是否已有此类型的组件
        if (this.hasComponent(entityId, componentType)) {
            throw new Error(`Entity ${entityId} already has component ${componentType.name}`);
        }
        
        // 注册组件类型（如果尚未注册）
        if (!ComponentRegistry.isRegistered(componentType)) {
            ComponentRegistry.register(componentType);
        }
        
        // 设置组件的实体引用
        (component as any).entityId = entityId;
        
        // 更新缓存
        this.updateComponentCache(entityId, componentType, true);
        
        // 添加到存储器
        if (this._componentStorage) {
            this._componentStorage.addComponent(entityId, component);
        }
        
        // 调用组件的生命周期方法
        component.onAddedToEntity();
        
        // 发射组件添加事件
        this._eventBus.emitComponentAdded({
            timestamp: Date.now(),
            source: 'ComponentManager',
            entityId: entityId,
            entityName: entityName || `Entity_${entityId}`,
            entityTag: entityTag?.toString(),
            componentType: componentType.name,
            component: component
        });
        
        return component;
    }
    
    /**
     * 获取指定类型的组件
     * 
     * @param entityId 实体ID
     * @param type 组件类型
     * @returns 组件实例或null
     */
    public getComponent<T extends Component>(entityId: number, type: ComponentType<T>): T | null {
        // 首先检查位掩码，快速排除（O(1)）
        if (!ComponentRegistry.isRegistered(type)) {
            return null;
        }
        
        const mask = ComponentRegistry.getBitMask(type);
        const entityMask = this._entityComponentMasks.get(entityId) || BigInt(0);
        if ((entityMask & mask) === BigInt(0)) {
            return null;
        }
        
        // 从组件存储管理器获取组件
        if (this._componentStorage) {
            return this._componentStorage.getComponent(entityId, type);
        }
        
        return null;
    }
    
    /**
     * 检查实体是否有指定类型的组件
     * 
     * @param entityId 实体ID
     * @param type 组件类型
     * @returns 如果有该组件则返回true
     */
    public hasComponent<T extends Component>(entityId: number, type: ComponentType<T>): boolean {
        if (!ComponentRegistry.isRegistered(type)) {
            return false;
        }
        
        const mask = ComponentRegistry.getBitMask(type);
        const entityMask = this._entityComponentMasks.get(entityId) || BigInt(0);
        return (entityMask & mask) !== BigInt(0);
    }
    
    /**
     * 获取或创建指定类型的组件
     * 
     * @param entityId 实体ID
     * @param type 组件类型
     * @param args 组件构造函数参数（仅在创建时使用）
     * @returns 组件实例
     */
    public getOrCreateComponent<T extends Component>(
        entityId: number,
        type: ComponentType<T>, 
        entityName?: string,
        entityTag?: string,
        ...args: any[]
    ): T {
        let component = this.getComponent(entityId, type);
        if (!component) {
            component = new type(...args);
            this.addComponent(entityId, component, entityName, entityTag);
        }
        return component;
    }
    
    /**
     * 移除指定的组件
     * 
     * @param entityId 实体ID
     * @param component 要移除的组件实例
     * @param entityName 实体名称（用于事件和调试）
     * @param entityTag 实体标签（用于事件）
     */
    public removeComponent(
        entityId: number, 
        component: Component, 
        entityName?: string, 
        entityTag?: string
    ): void {
        const componentType = component.constructor as ComponentType;
        
        // 更新缓存
        this.updateComponentCache(entityId, componentType, false);
        
        // 从组件存储管理器中移除
        if (this._componentStorage) {
            this._componentStorage.removeComponent(entityId, componentType);
        }
        
        // 调用组件的生命周期方法
        component.onRemovedFromEntity();
        
        // 发射组件移除事件
        this._eventBus.emitComponentRemoved({
            timestamp: Date.now(),
            source: 'ComponentManager',
            entityId: entityId,
            entityName: entityName || `Entity_${entityId}`,
            entityTag: entityTag?.toString(),
            componentType: componentType.name,
            component: component
        });
        
        // 清除组件的实体引用
        (component as any).entityId = null;
    }
    
    /**
     * 移除指定类型的组件
     * 
     * @param entityId 实体ID
     * @param type 组件类型
     * @param entityName 实体名称（用于事件和调试）
     * @param entityTag 实体标签（用于事件）
     * @returns 被移除的组件实例或null
     */
    public removeComponentByType<T extends Component>(
        entityId: number, 
        type: ComponentType<T>,
        entityName?: string,
        entityTag?: string
    ): T | null {
        const component = this.getComponent(entityId, type);
        if (component) {
            this.removeComponent(entityId, component, entityName, entityTag);
            return component;
        }
        return null;
    }
    
    /**
     * 移除实体的所有组件
     * 
     * @param entityId 实体ID
     * @param entityName 实体名称（用于事件和调试）
     * @param entityTag 实体标签（用于事件）
     */
    public removeAllComponents(entityId: number, entityName?: string, entityTag?: string): void {
        // 获取所有组件类型，避免在迭代时修改
        const componentTypes = this._entityComponentTypes.get(entityId);
        if (!componentTypes) {
            return;
        }
        
        const componentTypesToRemove = Array.from(componentTypes);
        
        // 清空缓存
        this._entityComponentTypes.delete(entityId);
        this._entityComponentCounts.delete(entityId);
        this._entityComponentMasks.delete(entityId);
        
        // 移除所有组件
        if (this._componentStorage) {
            for (const componentType of componentTypesToRemove) {
                const component = this._componentStorage.getComponent(entityId, componentType);
                if (component) {
                    // 调用组件的生命周期方法
                    component.onRemovedFromEntity();
                    
                    // 清除组件的实体引用
                    (component as any).entityId = null;
                }
                
                // 从组件存储管理器中移除
                this._componentStorage.removeComponent(entityId, componentType);
            }
        }
    }
    
    /**
     * 批量添加组件
     * 
     * @param entityId 实体ID
     * @param components 要添加的组件数组
     * @param entityName 实体名称
     * @param entityTag 实体标签
     * @returns 添加的组件数组
     */
    public addComponents<T extends Component>(
        entityId: number, 
        components: T[], 
        entityName?: string, 
        entityTag?: string
    ): T[] {
        const addedComponents: T[] = [];
        
        // 开始批量操作
        this.beginBatchUpdate();
        
        try {
            for (const component of components) {
                try {
                    addedComponents.push(this.addComponent(entityId, component, entityName, entityTag));
                } catch (error) {
                    console.warn(`添加组件失败 ${component.constructor.name}:`, error);
                }
            }
        } finally {
            // 提交批量操作
            this.commitBatchUpdates();
        }
        
        return addedComponents;
    }
    
    /**
     * 批量移除组件类型
     * 
     * @param entityId 实体ID
     * @param componentTypes 要移除的组件类型数组
     * @param entityName 实体名称
     * @param entityTag 实体标签
     * @returns 被移除的组件数组
     */
    public removeComponentsByTypes<T extends Component>(
        entityId: number,
        componentTypes: ComponentType<T>[], 
        entityName?: string, 
        entityTag?: string
    ): (T | null)[] {
        const removedComponents: (T | null)[] = [];
        
        // 开始批量操作
        this.beginBatchUpdate();
        
        try {
            for (const componentType of componentTypes) {
                removedComponents.push(this.removeComponentByType(entityId, componentType, entityName, entityTag));
            }
        } finally {
            // 提交批量操作
            this.commitBatchUpdates();
        }
        
        return removedComponents;
    }
    
    /**
     * 快速检查多个组件类型
     * 
     * @param entityId 实体ID
     * @param componentTypes 要检查的组件类型数组
     * @returns 对应的检查结果数组
     */
    public hasMultipleComponents(entityId: number, componentTypes: ComponentType[]): boolean[] {
        const results: boolean[] = new Array(componentTypes.length);
        
        for (let i = 0; i < componentTypes.length; i++) {
            results[i] = this.hasComponent(entityId, componentTypes[i]);
        }
        
        return results;
    }
    
    /**
     * 批量获取多个组件
     * 
     * @param entityId 实体ID
     * @param componentTypes 要获取的组件类型数组
     * @returns 对应的组件数组，不存在的组件为null
     */
    public getMultipleComponents(entityId: number, componentTypes: ComponentType[]): (Component | null)[] {
        const results: (Component | null)[] = new Array(componentTypes.length);
        
        for (let i = 0; i < componentTypes.length; i++) {
            results[i] = this.getComponent(entityId, componentTypes[i]);
        }
        
        return results;
    }
    
    /**
     * 获取实体的组件数量
     * 
     * @param entityId 实体ID
     * @returns 组件数量
     */
    public getComponentCount(entityId: number): number {
        return this._entityComponentCounts.get(entityId) || 0;
    }
    
    /**
     * 获取实体的组件类型集合
     * 
     * @param entityId 实体ID
     * @returns 组件类型集合
     */
    public getComponentTypes(entityId: number): ReadonlySet<ComponentType> {
        return this._entityComponentTypes.get(entityId) || new Set();
    }
    
    /**
     * 获取实体的组件位掩码
     * 
     * @param entityId 实体ID
     * @returns 组件位掩码
     */
    public getComponentMask(entityId: number): bigint {
        return this._entityComponentMasks.get(entityId) || BigInt(0);
    }
    
    /**
     * 开始批量更新操作
     */
    public beginBatchUpdate(): void {
        this._batchOperationActive = true;
        this._pendingBatchUpdates = [];
    }
    
    /**
     * 提交批量更新操作
     */
    public commitBatchUpdates(): void {
        if (this._batchOperationActive) {
            // 执行所有待处理的更新
            for (const update of this._pendingBatchUpdates) {
                update();
            }
            
            this._batchOperationActive = false;
            this._pendingBatchUpdates = [];
        }
    }
    
    /**
     * 清理实体的所有组件缓存
     * 
     * @param entityId 实体ID
     */
    public clearEntityCache(entityId: number): void {
        this._entityComponentCounts.delete(entityId);
        this._entityComponentTypes.delete(entityId);
        this._entityComponentMasks.delete(entityId);
    }
    
    /**
     * 获取管理器的统计信息
     */
    public getStats(): {
        totalEntitiesWithComponents: number;
        averageComponentsPerEntity: number;
        cacheMemoryUsage: number;
    } {
        const entityCount = this._entityComponentCounts.size;
        const totalComponents = Array.from(this._entityComponentCounts.values()).reduce((sum, count) => sum + count, 0);
        const averageComponents = entityCount > 0 ? totalComponents / entityCount : 0;
        
        // 估算缓存内存使用
        const cacheMemoryUsage = 
            this._entityComponentCounts.size * 16 +  // Map overhead + number
            this._entityComponentTypes.size * 32 +   // Map overhead + Set
            this._entityComponentMasks.size * 24;    // Map overhead + bigint
        
        return {
            totalEntitiesWithComponents: entityCount,
            averageComponentsPerEntity: Math.round(averageComponents * 100) / 100,
            cacheMemoryUsage
        };
    }
    
    /**
     * 更新组件缓存
     * 
     * @param entityId 实体ID
     * @param componentType 组件类型
     * @param isAdd 是否为添加操作
     * @private
     */
    private updateComponentCache(entityId: number, componentType: ComponentType, isAdd: boolean): void {
        // 获取或创建组件类型集合
        let componentTypes = this._entityComponentTypes.get(entityId);
        if (!componentTypes) {
            componentTypes = new Set();
            this._entityComponentTypes.set(entityId, componentTypes);
        }
        
        // 获取当前计数
        let count = this._entityComponentCounts.get(entityId) || 0;
        
        // 获取当前位掩码
        let mask = this._entityComponentMasks.get(entityId) || BigInt(0);
        
        if (isAdd) {
            // 添加组件
            componentTypes.add(componentType);
            count++;
            
            // 更新位掩码
            if (ComponentRegistry.isRegistered(componentType)) {
                mask |= ComponentRegistry.getBitMask(componentType);
            }
        } else {
            // 移除组件
            componentTypes.delete(componentType);
            count = Math.max(0, count - 1);
            
            // 更新位掩码
            if (ComponentRegistry.isRegistered(componentType)) {
                mask &= ~ComponentRegistry.getBitMask(componentType);
            }
        }
        
        // 更新缓存
        this._entityComponentCounts.set(entityId, count);
        this._entityComponentMasks.set(entityId, mask);
        
        // 如果没有组件了，清理缓存
        if (count === 0) {
            this._entityComponentCounts.delete(entityId);
            this._entityComponentTypes.delete(entityId);
            this._entityComponentMasks.delete(entityId);
        }
    }
}