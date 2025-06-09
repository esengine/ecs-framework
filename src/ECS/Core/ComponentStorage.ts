import { Component } from '../Component';

/**
 * 组件类型定义
 */
export type ComponentType<T extends Component = Component> = new (...args: any[]) => T;

/**
 * 组件注册表
 * 管理组件类型的位掩码分配
 */
export class ComponentRegistry {
    private static componentTypes = new Map<Function, number>();
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
        return bitIndex;
    }

    /**
     * 获取组件类型的位掩码
     * @param componentType 组件类型
     * @returns 位掩码
     */
    public static getBitMask<T extends Component>(componentType: ComponentType<T>): bigint {
        const bitIndex = this.componentTypes.get(componentType);
        if (bitIndex === undefined) {
            throw new Error(`Component type ${componentType.name} is not registered`);
        }
        return BigInt(1) << BigInt(bitIndex);
    }

    /**
     * 获取组件类型的位索引
     * @param componentType 组件类型
     * @returns 位索引
     */
    public static getBitIndex<T extends Component>(componentType: ComponentType<T>): number {
        const bitIndex = this.componentTypes.get(componentType);
        if (bitIndex === undefined) {
            throw new Error(`Component type ${componentType.name} is not registered`);
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
     * 获取所有已注册的组件类型
     * @returns 组件类型映射
     */
    public static getAllRegisteredTypes(): Map<Function, number> {
        return new Map(this.componentTypes);
    }
}

/**
 * 高性能组件存储器
 * 使用SoA（Structure of Arrays）模式存储组件
 */
export class ComponentStorage<T extends Component> {
    private components: (T | null)[] = [];
    private entityToIndex = new Map<number, number>();
    private indexToEntity: number[] = [];
    private freeIndices: number[] = [];
    private componentType: ComponentType<T>;
    private _size = 0;

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
            throw new Error(`Entity ${entityId} already has component ${this.componentType.name}`);
        }

        let index: number;
        
        if (this.freeIndices.length > 0) {
            // 重用空闲索引
            index = this.freeIndices.pop()!;
            this.components[index] = component;
            this.indexToEntity[index] = entityId;
        } else {
            // 添加到末尾
            index = this.components.length;
            this.components.push(component);
            this.indexToEntity.push(entityId);
        }
        
        this.entityToIndex.set(entityId, index);
        this._size++;
    }

    /**
     * 获取组件
     * @param entityId 实体ID
     * @returns 组件实例或null
     */
    public getComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        return index !== undefined ? this.components[index] : null;
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

        const component = this.components[index];
        this.entityToIndex.delete(entityId);
        this.components[index] = null;
        this.freeIndices.push(index);
        this._size--;

        return component;
    }

    /**
     * 高效遍历所有组件
     * @param callback 回调函数
     */
    public forEach(callback: (component: T, entityId: number, index: number) => void): void {
        for (let i = 0; i < this.components.length; i++) {
            const component = this.components[i];
            if (component) {
                callback(component, this.indexToEntity[i], i);
            }
        }
    }

    /**
     * 获取所有组件（密集数组）
     * @returns 组件数组
     */
    public getDenseArray(): { components: T[]; entityIds: number[] } {
        const components: T[] = [];
        const entityIds: number[] = [];

        for (let i = 0; i < this.components.length; i++) {
            const component = this.components[i];
            if (component) {
                components.push(component);
                entityIds.push(this.indexToEntity[i]);
            }
        }

        return { components, entityIds };
    }

    /**
     * 清空所有组件
     */
    public clear(): void {
        this.components.length = 0;
        this.entityToIndex.clear();
        this.indexToEntity.length = 0;
        this.freeIndices.length = 0;
        this._size = 0;
    }

    /**
     * 获取组件数量
     */
    public get size(): number {
        return this._size;
    }

    /**
     * 获取组件类型
     */
    public get type(): ComponentType<T> {
        return this.componentType;
    }

    /**
     * 压缩存储（移除空洞）
     */
    public compact(): void {
        if (this.freeIndices.length === 0) {
            return; // 没有空洞，无需压缩
        }

        const newComponents: T[] = [];
        const newIndexToEntity: number[] = [];
        const newEntityToIndex = new Map<number, number>();

        let newIndex = 0;
        for (let i = 0; i < this.components.length; i++) {
            const component = this.components[i];
            if (component) {
                newComponents[newIndex] = component;
                newIndexToEntity[newIndex] = this.indexToEntity[i];
                newEntityToIndex.set(this.indexToEntity[i], newIndex);
                newIndex++;
            }
        }

        this.components = newComponents;
        this.indexToEntity = newIndexToEntity;
        this.entityToIndex = newEntityToIndex;
        this.freeIndices.length = 0;
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
        const totalSlots = this.components.length;
        const usedSlots = this._size;
        const freeSlots = this.freeIndices.length;
        const fragmentation = totalSlots > 0 ? freeSlots / totalSlots : 0;

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
    private storages = new Map<Function, ComponentStorage<any>>();

    /**
     * 获取或创建组件存储器
     * @param componentType 组件类型
     * @returns 组件存储器
     */
    public getStorage<T extends Component>(componentType: ComponentType<T>): ComponentStorage<T> {
        let storage = this.storages.get(componentType);
        
        if (!storage) {
            storage = new ComponentStorage(componentType);
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
    public getComponentMask(entityId: number): bigint {
        let mask = BigInt(0);
        
        for (const [componentType, storage] of this.storages.entries()) {
            if (storage.hasComponent(entityId)) {
                mask |= ComponentRegistry.getBitMask(componentType as ComponentType);
            }
        }
        
        return mask;
    }

    /**
     * 压缩所有存储器
     */
    public compactAll(): void {
        for (const storage of this.storages.values()) {
            storage.compact();
        }
    }

    /**
     * 获取所有存储器的统计信息
     */
    public getAllStats(): Map<string, any> {
        const stats = new Map<string, any>();
        
        for (const [componentType, storage] of this.storages.entries()) {
            const typeName = (componentType as any).name || 'Unknown';
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