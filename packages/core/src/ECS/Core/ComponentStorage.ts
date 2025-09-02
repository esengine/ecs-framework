import { Component } from '../Component';
import { IBigIntLike, BigIntFactory } from '../Utils/BigIntCompatibility';
import { SoAStorage, EnableSoA, HighPrecision, Float64, Int32, SerializeMap, SerializeSet, SerializeArray, DeepCopy } from './SoAStorage';
import { createLogger } from '../../Utils/Logger';
import { getComponentTypeName } from '../Decorators';

// 重新导出装饰器
export { EnableSoA, HighPrecision, Float64, Int32, SerializeMap, SerializeSet, SerializeArray, DeepCopy };

/**
 * 组件类型定义
 * 支持任意构造函数签名，提供更好的类型安全性
 */
export type ComponentType<T extends Component = Component> = new (...args: any[]) => T;

/**
 * 组件注册表
 * 管理组件类型的位掩码分配
 */
export class ComponentRegistry {
    protected static readonly _logger = createLogger('ComponentStorage');
    private static componentTypes = new Map<Function, number>();
    private static componentNameToType = new Map<string, Function>();
    private static componentNameToId = new Map<string, number>();
    private static maskCache = new Map<string, IBigIntLike>();
    private static nextBitIndex = 0;
    private static maxComponents = 64; // 支持最多64种组件类型

    /**
     * 注册组件类型并分配位掩码
     * @param componentType 组件类型
     * @returns 分配的位索引
     */
    public static register<T extends Component>(componentType: ComponentType<T>): number {
        if (this.componentTypes.has(componentType)) {
            return this.componentTypes.get(componentType)!;
        }

        if (this.nextBitIndex >= this.maxComponents) {
            throw new Error(`Maximum number of component types (${this.maxComponents}) exceeded`);
        }

        const bitIndex = this.nextBitIndex++;
        this.componentTypes.set(componentType, bitIndex);
        this.componentNameToType.set(getComponentTypeName(componentType), componentType);
        this.componentNameToId.set(getComponentTypeName(componentType), bitIndex);
        return bitIndex;
    }

    /**
     * 获取组件类型的位掩码
     * @param componentType 组件类型
     * @returns 位掩码
     */
    public static getBitMask<T extends Component>(componentType: ComponentType<T>): IBigIntLike {
        const bitIndex = this.componentTypes.get(componentType);
        if (bitIndex === undefined) {
            throw new Error(`Component type ${getComponentTypeName(componentType)} is not registered`);
        }
        return BigIntFactory.one().shiftLeft(bitIndex);
    }

    /**
     * 获取组件类型的位索引
     * @param componentType 组件类型
     * @returns 位索引
     */
    public static getBitIndex<T extends Component>(componentType: ComponentType<T>): number {
        const bitIndex = this.componentTypes.get(componentType);
        if (bitIndex === undefined) {
            throw new Error(`Component type ${getComponentTypeName(componentType)} is not registered`);
        }
        return bitIndex;
    }

    /**
     * 检查组件类型是否已注册
     * @param componentType 组件类型
     * @returns 是否已注册
     */
    public static isRegistered<T extends Component>(componentType: ComponentType<T>): boolean {
        return this.componentTypes.has(componentType);
    }

    /**
     * 通过名称获取组件类型
     * @param componentName 组件名称
     * @returns 组件类型构造函数
     */
    public static getComponentType(componentName: string): Function | null {
        return this.componentNameToType.get(componentName) || null;
    }

    /**
     * 获取所有已注册的组件类型
     * @returns 组件类型映射
     */
    public static getAllRegisteredTypes(): Map<Function, number> {
        return new Map(this.componentTypes);
    }

    /**
     * 获取所有组件名称到类型的映射
     * @returns 名称到类型的映射
     */
    public static getAllComponentNames(): Map<string, Function> {
        return new Map(this.componentNameToType);
    }

    /**
     * 通过名称获取组件类型ID
     * @param componentName 组件名称
     * @returns 组件类型ID
     */
    public static getComponentId(componentName: string): number | undefined {
        return this.componentNameToId.get(componentName);
    }

    /**
     * 注册组件类型（通过名称）
     * @param componentName 组件名称
     * @returns 分配的组件ID
     */
    public static registerComponentByName(componentName: string): number {
        if (this.componentNameToId.has(componentName)) {
            return this.componentNameToId.get(componentName)!;
        }

        if (this.nextBitIndex >= this.maxComponents) {
            throw new Error(`Maximum number of component types (${this.maxComponents}) exceeded`);
        }

        const bitIndex = this.nextBitIndex++;
        this.componentNameToId.set(componentName, bitIndex);
        return bitIndex;
    }

    /**
     * 创建单个组件的掩码
     * @param componentName 组件名称
     * @returns 组件掩码
     */
    public static createSingleComponentMask(componentName: string): IBigIntLike {
        const cacheKey = `single:${componentName}`;
        
        if (this.maskCache.has(cacheKey)) {
            return this.maskCache.get(cacheKey)!;
        }

        const componentId = this.getComponentId(componentName);
        if (componentId === undefined) {
            throw new Error(`Component type ${componentName} is not registered`);
        }

        const mask = BigIntFactory.one().shiftLeft(componentId);
        this.maskCache.set(cacheKey, mask);
        return mask;
    }

    /**
     * 创建多个组件的掩码
     * @param componentNames 组件名称数组
     * @returns 组合掩码
     */
    public static createComponentMask(componentNames: string[]): IBigIntLike {
        const sortedNames = [...componentNames].sort();
        const cacheKey = `multi:${sortedNames.join(',')}`;
        
        if (this.maskCache.has(cacheKey)) {
            return this.maskCache.get(cacheKey)!;
        }

        let mask = BigIntFactory.zero();
        for (const name of componentNames) {
            const componentId = this.getComponentId(name);
            if (componentId !== undefined) {
                mask = mask.or(BigIntFactory.one().shiftLeft(componentId));
            }
        }

        this.maskCache.set(cacheKey, mask);
        return mask;
    }

    /**
     * 清除掩码缓存
     */
    public static clearMaskCache(): void {
        this.maskCache.clear();
    }

    /**
     * 重置注册表（用于测试）
     */
    public static reset(): void {
        this.componentTypes.clear();
        this.componentNameToType.clear();
        this.componentNameToId.clear();
        this.maskCache.clear();
        this.nextBitIndex = 0;
    }
}

/**
 * 高性能组件存储器
 */
export class ComponentStorage<T extends Component> {
    private dense: T[] = [];
    private entityIds: number[] = [];
    private entityToIndex = new Map<number, number>();
    private componentType: ComponentType<T>;

    constructor(componentType: ComponentType<T>) {
        this.componentType = componentType;
        
        // 确保组件类型已注册
        if (!ComponentRegistry.isRegistered(componentType)) {
            ComponentRegistry.register(componentType);
        }
    }

    /**
     * 添加组件
     * @param entityId 实体ID
     * @param component 组件实例
     */
    public addComponent(entityId: number, component: T): void {
        // 检查实体是否已有此组件
        if (this.entityToIndex.has(entityId)) {
            throw new Error(`Entity ${entityId} already has component ${getComponentTypeName(this.componentType)}`);
        }

        // 末尾插入到致密数组
        const index = this.dense.length;
        this.dense.push(component);
        this.entityIds.push(entityId);
        this.entityToIndex.set(entityId, index);
    }

    /**
     * 获取组件
     * @param entityId 实体ID
     * @returns 组件实例或null
     */
    public getComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        return index !== undefined ? this.dense[index] : null;
    }

    /**
     * 检查实体是否有此组件
     * @param entityId 实体ID
     * @returns 是否有组件
     */
    public hasComponent(entityId: number): boolean {
        return this.entityToIndex.has(entityId);
    }

    /**
     * 移除组件
     * @param entityId 实体ID
     * @returns 被移除的组件或null
     */
    public removeComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        if (index === undefined) {
            return null;
        }

        const component = this.dense[index];
        const lastIndex = this.dense.length - 1;

        if (index !== lastIndex) {
            // 将末尾元素交换到要删除的位置
            const lastComponent = this.dense[lastIndex];
            const lastEntityId = this.entityIds[lastIndex];
            
            this.dense[index] = lastComponent;
            this.entityIds[index] = lastEntityId;
            
            // 更新被交换元素的映射
            this.entityToIndex.set(lastEntityId, index);
        }

        // 移除末尾元素
        this.dense.pop();
        this.entityIds.pop();
        this.entityToIndex.delete(entityId);

        return component;
    }

    /**
     * 高效遍历所有组件
     * @param callback 回调函数
     */
    public forEach(callback: (component: T, entityId: number, index: number) => void): void {
        for (let i = 0; i < this.dense.length; i++) {
            callback(this.dense[i], this.entityIds[i], i);
        }
    }

    /**
     * 获取所有组件
     * @returns 组件数组
     */
    public getDenseArray(): { components: T[]; entityIds: number[] } {
        return {
            components: [...this.dense],
            entityIds: [...this.entityIds]
        };
    }

    /**
     * 清空所有组件
     */
    public clear(): void {
        this.dense.length = 0;
        this.entityIds.length = 0;
        this.entityToIndex.clear();
    }

    /**
     * 获取组件数量
     */
    public get size(): number {
        return this.dense.length;
    }

    /**
     * 获取组件类型
     */
    public get type(): ComponentType<T> {
        return this.componentType;
    }


    /**
     * 获取存储统计信息
     */
    public getStats(): {
        totalSlots: number;
        usedSlots: number;
        freeSlots: number;
        fragmentation: number;
    } {
        const totalSlots = this.dense.length;
        const usedSlots = this.dense.length;
        const freeSlots = 0; // 永远无空洞
        const fragmentation = 0; // 永远无碎片

        return {
            totalSlots,
            usedSlots,
            freeSlots,
            fragmentation
        };
    }
}

/**
 * 组件存储管理器
 * 管理所有组件类型的存储器
 */
export class ComponentStorageManager {
    private static readonly _logger = createLogger('ComponentStorage');
    private storages = new Map<Function, ComponentStorage<any> | SoAStorage<any>>();

    /**
     * 检查组件类型是否启用SoA存储
     * @param componentType 组件类型
     * @returns 是否为SoA存储
     */
    public isSoAStorage<T extends Component>(componentType: ComponentType<T>): boolean {
        const storage = this.storages.get(componentType);
        return storage instanceof SoAStorage;
    }

    /**
     * 获取SoA存储器（类型安全）
     * @param componentType 组件类型
     * @returns SoA存储器或null
     */
    public getSoAStorage<T extends Component>(componentType: ComponentType<T>): SoAStorage<T> | null {
        const storage = this.getStorage(componentType);
        return storage instanceof SoAStorage ? storage : null;
    }

    /**
     * 直接获取SoA字段数组（类型安全）
     * @param componentType 组件类型
     * @param fieldName 字段名
     * @returns TypedArray或null
     */
    public getFieldArray<T extends Component>(
        componentType: ComponentType<T>, 
        fieldName: string
    ): Float32Array | Float64Array | Int32Array | null {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getFieldArray(fieldName) : null;
    }

    /**
     * 直接获取SoA字段数组（类型安全，带字段名检查）
     * @param componentType 组件类型
     * @param fieldName 字段名（类型检查）
     * @returns TypedArray或null
     */
    public getTypedFieldArray<T extends Component, K extends keyof T>(
        componentType: ComponentType<T>, 
        fieldName: K
    ): Float32Array | Float64Array | Int32Array | null {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getTypedFieldArray(fieldName) : null;
    }

    /**
     * 获取SoA存储的活跃索引
     * @param componentType 组件类型
     * @returns 活跃索引数组或空数组
     */
    public getActiveIndices<T extends Component>(componentType: ComponentType<T>): number[] {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getActiveIndices() : [];
    }

    /**
     * 获取实体在SoA存储中的索引
     * @param componentType 组件类型
     * @param entityId 实体ID
     * @returns 存储索引或undefined
     */
    public getEntityIndex<T extends Component>(componentType: ComponentType<T>, entityId: number): number | undefined {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getEntityIndex(entityId) : undefined;
    }

    /**
     * 根据索引获取实体ID
     * @param componentType 组件类型
     * @param index 存储索引
     * @returns 实体ID或undefined
     */
    public getEntityIdByIndex<T extends Component>(componentType: ComponentType<T>, index: number): number | undefined {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getEntityIdByIndex(index) : undefined;
    }

    /**
     * 获取或创建组件存储器（默认原始存储）
     * @param componentType 组件类型
     * @returns 组件存储器
     */
    public getStorage<T extends Component>(componentType: ComponentType<T>): ComponentStorage<T> | SoAStorage<T> {
        let storage = this.storages.get(componentType);
        
        if (!storage) {
            // 检查是否启用SoA优化
            const enableSoA = (componentType as any).__enableSoA;
            
            if (enableSoA) {
                // 使用SoA优化存储
                storage = new SoAStorage(componentType);
                ComponentStorageManager._logger.info(`为 ${getComponentTypeName(componentType)} 启用SoA优化（适用于大规模批量操作）`);
            } else {
                // 默认使用原始存储
                storage = new ComponentStorage(componentType);
            }
            
            this.storages.set(componentType, storage);
        }
        
        return storage;
    }

    /**
     * 添加组件
     * @param entityId 实体ID
     * @param component 组件实例
     */
    public addComponent<T extends Component>(entityId: number, component: T): void {
        const componentType = component.constructor as ComponentType<T>;
        const storage = this.getStorage(componentType);
        storage.addComponent(entityId, component);
    }

    /**
     * 获取组件
     * @param entityId 实体ID
     * @param componentType 组件类型
     * @returns 组件实例或null
     */
    public getComponent<T extends Component>(entityId: number, componentType: ComponentType<T>): T | null {
        const storage = this.storages.get(componentType);
        return storage ? storage.getComponent(entityId) : null;
    }

    /**
     * 检查实体是否有组件
     * @param entityId 实体ID
     * @param componentType 组件类型
     * @returns 是否有组件
     */
    public hasComponent<T extends Component>(entityId: number, componentType: ComponentType<T>): boolean {
        const storage = this.storages.get(componentType);
        return storage ? storage.hasComponent(entityId) : false;
    }

    /**
     * 移除组件
     * @param entityId 实体ID
     * @param componentType 组件类型
     * @returns 被移除的组件或null
     */
    public removeComponent<T extends Component>(entityId: number, componentType: ComponentType<T>): T | null {
        const storage = this.storages.get(componentType);
        return storage ? storage.removeComponent(entityId) : null;
    }

    /**
     * 移除实体的所有组件
     * @param entityId 实体ID
     */
    public removeAllComponents(entityId: number): void {
        for (const storage of this.storages.values()) {
            storage.removeComponent(entityId);
        }
    }

    /**
     * 获取实体的组件位掩码
     * @param entityId 实体ID
     * @returns 组件位掩码
     */
    public getComponentMask(entityId: number): IBigIntLike {
        let mask = BigIntFactory.zero();
        
        for (const [componentType, storage] of this.storages.entries()) {
            if (storage.hasComponent(entityId)) {
                const componentMask = ComponentRegistry.getBitMask(componentType as ComponentType);
                mask = mask.or(componentMask);
            }
        }
        
        return mask;
    }


    /**
     * 获取所有存储器的统计信息
     */
    public getAllStats(): Map<string, any> {
        const stats = new Map<string, any>();
        
        for (const [componentType, storage] of this.storages.entries()) {
            const typeName = getComponentTypeName(componentType as ComponentType);
            stats.set(typeName, storage.getStats());
        }
        
        return stats;
    }

    /**
     * 清空所有存储器
     */
    public clear(): void {
        for (const storage of this.storages.values()) {
            storage.clear();
        }
        this.storages.clear();
    }
}