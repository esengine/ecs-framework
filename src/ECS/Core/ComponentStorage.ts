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
 * SIMD友好的数据字段描述
 */
interface SIMDFieldDescriptor {
    name: string;
    type: 'float32' | 'int32' | 'uint32' | 'float64' | 'int16' | 'uint16' | 'int8' | 'uint8';
    size: number;
    offset: number;
    alignment: number;
}

/**
 * SIMD布局配置
 */
interface SIMDLayoutConfig {
    fields: SIMDFieldDescriptor[];
    structSize: number;
    alignment: number;
}

/**
 * 类型化数组联合类型
 */
type TypedArray = Float32Array | Float64Array | Int8Array | Int16Array | Int32Array | 
                  Uint8Array | Uint16Array | Uint32Array;

/**
 * 统一SIMD组件存储器
 * 
 * 整合了SIMD优化的SoA布局，提供最佳的数据并行处理性能。
 * 使用密集存储和TypedArray来最大化缓存效率和SIMD指令利用率。
 */
export class ComponentStorage<T extends Component> {
    /** 组件类型 */
    private componentType: ComponentType<T>;
    
    /** SIMD布局配置 */
    private layout: SIMDLayoutConfig;
    
    /** 字段数据存储（按字段类型分离）*/
    private fieldArrays = new Map<string, ArrayBuffer>();
    private fieldViews = new Map<string, DataView>();
    
    /** 实体ID数组 */
    private entityIds: Uint32Array;
    private entityToIndex = new Map<number, number>();
    
    /** 当前容量和大小 */
    private capacity: number = 0;
    private _size: number = 0;
    
    /** 内存对齐配置 */
    private readonly CACHE_LINE_SIZE = 64;
    private readonly SIMD_ALIGNMENT = 32;
    
    /** 增长因子 */
    private readonly GROWTH_FACTOR = 1.5;
    private readonly INITIAL_CAPACITY = 64;
    
    /** 批量操作支持 */
    private _batchUpdating: boolean = false;
    private _pendingOperations: Array<{
        entityId: number;
        component?: T;
        operation: 'add' | 'remove';
    }> = [];

    constructor(componentType: ComponentType<T>, layout?: SIMDLayoutConfig) {
        this.componentType = componentType;
        this.capacity = this.INITIAL_CAPACITY;
        
        // 如果没有提供布局，自动推导
        this.layout = layout || this.inferSIMDLayout(componentType);
        
        // 确保组件类型已注册
        if (!ComponentRegistry.isRegistered(componentType)) {
            ComponentRegistry.register(componentType);
        }
        
        // 初始化SIMD存储
        this.initializeFieldArrays();
        this.entityIds = new Uint32Array(this.capacity);
    }

    /**
     * 自动推导组件的SIMD布局
     */
    private inferSIMDLayout(componentType: ComponentType<T>): SIMDLayoutConfig {
        // 创建组件实例来分析字段
        const instance = new componentType();
        const fields: SIMDFieldDescriptor[] = [];
        let offset = 0;
        
        // 遍历组件的所有可枚举属性
        for (const key in instance) {
            if (instance.hasOwnProperty(key)) {
                const value = instance[key];
                let type: SIMDFieldDescriptor['type'];
                let size: number;
                let alignment: number;
                
                // 根据值类型推断SIMD类型
                if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        // 对于整数，默认使用有符号类型以支持负数
                        type = 'int32';
                        size = 4;
                        alignment = 4;
                    } else {
                        type = 'float32';
                        size = 4;
                        alignment = 4;
                    }
                } else if (typeof value === 'boolean') {
                    // 布尔值存储为uint8
                    type = 'uint8';
                    size = 1;
                    alignment = 1;
                } else {
                    // 默认为float32
                    type = 'float32';
                    size = 4;
                    alignment = 4;
                }
                
                // 对齐偏移量
                offset = Math.ceil(offset / alignment) * alignment;
                
                fields.push({
                    name: key,
                    type,
                    size,
                    offset,
                    alignment
                });
                
                offset += size;
            }
        }
        
        const structSize = Math.ceil(offset / this.SIMD_ALIGNMENT) * this.SIMD_ALIGNMENT;
        
        return {
            fields,
            structSize,
            alignment: this.SIMD_ALIGNMENT
        };
    }

    /**
     * 初始化字段数组
     */
    private initializeFieldArrays(): void {
        for (const field of this.layout.fields) {
            const bytesPerElement = this.getBytesPerElement(field.type);
            const bufferSize = this.alignSize(this.capacity * bytesPerElement, this.SIMD_ALIGNMENT);
            
            const buffer = new ArrayBuffer(bufferSize);
            this.fieldArrays.set(field.name, buffer);
            this.fieldViews.set(field.name, new DataView(buffer));
        }
    }

    /**
     * 获取每个元素的字节数
     */
    private getBytesPerElement(type: string): number {
        switch (type) {
            case 'float64': return 8;
            case 'float32': case 'int32': case 'uint32': return 4;
            case 'int16': case 'uint16': return 2;
            case 'int8': case 'uint8': return 1;
            default: throw new Error(`Unsupported SIMD field type: ${type}`);
        }
    }

    /**
     * 对齐大小到指定边界
     */
    private alignSize(size: number, alignment: number): number {
        return Math.ceil(size / alignment) * alignment;
    }

    /**
     * 添加组件
     * @param entityId 实体ID
     * @param component 组件实例
     */
    public addComponent(entityId: number, component: T): void {
        if (this._batchUpdating) {
            this._pendingOperations.push({ entityId, component, operation: 'add' });
            return;
        }
        
        this.addComponentImmediate(entityId, component);
    }

    /**
     * 立即添加组件（内部方法）
     */
    private addComponentImmediate(entityId: number, component: T): void {
        if (this.entityToIndex.has(entityId)) {
            throw new Error(`Entity ${entityId} already has component ${this.componentType.name}`);
        }

        // 检查是否需要扩容
        if (this._size >= this.capacity) {
            this.resize();
        }

        const index = this._size;
        
        // 存储实体ID
        this.entityIds[index] = entityId;
        this.entityToIndex.set(entityId, index);
        
        // 将组件数据分解到各个字段数组
        this.decomposeComponent(component, index);
        
        this._size++;
    }

    /**
     * 将组件分解到字段数组
     */
    private decomposeComponent(component: T, index: number): void {
        for (const field of this.layout.fields) {
            const value = (component as any)[field.name];
            if (value !== undefined) {
                this.setFieldValue(field, index, value);
            }
        }
    }

    /**
     * 设置字段值
     */
    private setFieldValue(field: SIMDFieldDescriptor, index: number, value: number | boolean): void {
        const view = this.fieldViews.get(field.name);
        if (!view) return;
        
        const byteOffset = index * this.getBytesPerElement(field.type);
        
        const numValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
        
        switch (field.type) {
            case 'float64':
                view.setFloat64(byteOffset, numValue, true);
                break;
            case 'float32':
                view.setFloat32(byteOffset, numValue, true);
                break;
            case 'int32':
                view.setInt32(byteOffset, numValue, true);
                break;
            case 'uint32':
                view.setUint32(byteOffset, numValue, true);
                break;
            case 'int16':
                view.setInt16(byteOffset, numValue, true);
                break;
            case 'uint16':
                view.setUint16(byteOffset, numValue, true);
                break;
            case 'int8':
                view.setInt8(byteOffset, numValue);
                break;
            case 'uint8':
                view.setUint8(byteOffset, numValue);
                break;
        }
    }

    /**
     * 获取组件
     * @param entityId 实体ID
     * @returns 重构的组件实例或null
     */
    public getComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        if (index === undefined) {
            return null;
        }

        return this.reconstructComponent(index);
    }

    /**
     * 从字段数组重构组件
     */
    private reconstructComponent(index: number): T {
        const component = new this.componentType() as T;
        
        for (const field of this.layout.fields) {
            const value = this.getFieldValue(field, index);
            (component as any)[field.name] = value;
        }
        
        return component;
    }

    /**
     * 获取字段值
     */
    private getFieldValue(field: SIMDFieldDescriptor, index: number): number | boolean {
        const view = this.fieldViews.get(field.name);
        if (!view) return 0;
        
        const byteOffset = index * this.getBytesPerElement(field.type);
        
        let rawValue: number;
        
        switch (field.type) {
            case 'float64':
                rawValue = view.getFloat64(byteOffset, true);
                break;
            case 'float32':
                rawValue = view.getFloat32(byteOffset, true);
                break;
            case 'int32':
                rawValue = view.getInt32(byteOffset, true);
                break;
            case 'uint32':
                rawValue = view.getUint32(byteOffset, true);
                break;
            case 'int16':
                rawValue = view.getInt16(byteOffset, true);
                break;
            case 'uint16':
                rawValue = view.getUint16(byteOffset, true);
                break;
            case 'int8':
                rawValue = view.getInt8(byteOffset);
                break;
            case 'uint8':
                rawValue = view.getUint8(byteOffset);
                break;
            default:
                rawValue = 0;
        }
        
        // 检查原始字段是否为布尔类型
        const instance = new this.componentType();
        const originalValue = (instance as any)[field.name];
        if (typeof originalValue === 'boolean') {
            return rawValue !== 0;
        }
        
        return rawValue;
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
     * 移除组件（swap-to-end算法）
     * @param entityId 实体ID
     * @returns 被移除的组件或null
     */
    public removeComponent(entityId: number): T | null {
        if (this._batchUpdating) {
            this._pendingOperations.push({ entityId, operation: 'remove' });
            return null;
        }
        
        return this.removeComponentImmediate(entityId);
    }

    /**
     * 立即移除组件（内部方法，使用swap-to-end算法）
     */
    private removeComponentImmediate(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        if (index === undefined) {
            return null;
        }

        const component = this.reconstructComponent(index);
        const lastIndex = this._size - 1;

        if (index !== lastIndex) {
            // 将最后一个元素的数据复制到要删除的位置
            this.entityIds[index] = this.entityIds[lastIndex];
            
            // 更新被移动实体的索引映射
            this.entityToIndex.set(this.entityIds[index], index);
            
            // 复制所有字段数据
            for (const field of this.layout.fields) {
                const lastValue = this.getFieldValue(field, lastIndex);
                this.setFieldValue(field, index, lastValue);
            }
        }

        this.entityToIndex.delete(entityId);
        this._size--;

        return component;
    }

    /**
     * 扩容数组
     */
    private resize(): void {
        const oldCapacity = this.capacity;
        this.capacity = Math.ceil(this.capacity * this.GROWTH_FACTOR);
        
        // 扩容实体ID数组
        const newEntityIds = new Uint32Array(this.capacity);
        newEntityIds.set(this.entityIds.subarray(0, this._size));
        this.entityIds = newEntityIds;
        
        // 扩容所有字段数组
        for (const field of this.layout.fields) {
            const oldBuffer = this.fieldArrays.get(field.name)!;
            const bytesPerElement = this.getBytesPerElement(field.type);
            const newBufferSize = this.alignSize(this.capacity * bytesPerElement, this.SIMD_ALIGNMENT);
            
            const newBuffer = new ArrayBuffer(newBufferSize);
            const newView = new DataView(newBuffer);
            
            // 复制旧数据
            const oldBytes = new Uint8Array(oldBuffer, 0, this._size * bytesPerElement);
            const newBytes = new Uint8Array(newBuffer);
            newBytes.set(oldBytes);
            
            this.fieldArrays.set(field.name, newBuffer);
            this.fieldViews.set(field.name, newView);
        }
    }

    /**
     * 高效遍历所有组件
     * @param callback 回调函数，接收重构的组件和实体ID
     */
    public forEach(callback: (component: T, entityId: number, index: number) => void): void {
        for (let i = 0; i < this._size; i++) {
            const component = this.reconstructComponent(i);
            const entityId = this.entityIds[i];
            callback(component, entityId, i);
        }
    }

    /**
     * 获取所有组件（密集数组）
     * @returns 组件数组
     */
    public getDenseArray(): { components: T[]; entityIds: number[] } {
        const components: T[] = [];
        const entityIds: number[] = [];

        for (let i = 0; i < this._size; i++) {
            components.push(this.reconstructComponent(i));
            entityIds.push(this.entityIds[i]);
        }

        return { components, entityIds };
    }

    /**
     * 清空所有组件
     */
    public clear(): void {
        this._size = 0;
        this.entityToIndex.clear();
        
        // 重置字段数组（保持容量）
        for (const [fieldName, buffer] of this.fieldArrays) {
            new Uint8Array(buffer).fill(0);
        }
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
     * 压缩存储（对于SIMD存储，这个操作是空操作）
     * 
     * SIMD存储天然没有碎片，所以不需要压缩操作。
     * 提供此方法是为了保持API兼容性。
     */
    public compact(): void {
        // SIMD存储不需要压缩
    }

    /**
     * 开始批量更新模式
     */
    public beginBatchUpdate(): void {
        this._batchUpdating = true;
        this._pendingOperations.length = 0;
    }

    /**
     * 提交批量更新
     */
    public commitBatchUpdates(): void {
        if (!this._batchUpdating) {
            return;
        }

        // 按操作类型分组优化执行顺序
        const removeOps = this._pendingOperations.filter(op => op.operation === 'remove');
        const addOps = this._pendingOperations.filter(op => op.operation === 'add');

        // 先执行删除操作
        for (const op of removeOps) {
            this.removeComponentImmediate(op.entityId);
        }

        // 再执行添加操作
        for (const op of addOps) {
            if (op.component) {
                this.addComponentImmediate(op.entityId, op.component);
            }
        }

        this._batchUpdating = false;
        this._pendingOperations.length = 0;
    }

    /**
     * 获取指定字段的SIMD友好数组
     * 
     * 这些数组可以直接用于SIMD操作或WebAssembly
     * 
     * @param fieldName 字段名
     * @returns 字段的类型化数组
     */
    public getFieldArray(fieldName: string): TypedArray | null {
        const buffer = this.fieldArrays.get(fieldName);
        if (!buffer) return null;
        
        const field = this.layout.fields.find(f => f.name === fieldName);
        if (!field) return null;
        
        const elementCount = this._size;
        
        switch (field.type) {
            case 'float64':
                return new Float64Array(buffer, 0, elementCount);
            case 'float32':
                return new Float32Array(buffer, 0, elementCount);
            case 'int32':
                return new Int32Array(buffer, 0, elementCount);
            case 'uint32':
                return new Uint32Array(buffer, 0, elementCount);
            case 'int16':
                return new Int16Array(buffer, 0, elementCount);
            case 'uint16':
                return new Uint16Array(buffer, 0, elementCount);
            case 'int8':
                return new Int8Array(buffer, 0, elementCount);
            case 'uint8':
                return new Uint8Array(buffer, 0, elementCount);
            default:
                return null;
        }
    }

    /**
     * 获取存储统计信息
     */
    public getStats(): {
        totalSlots: number;
        usedSlots: number;
        freeSlots: number;
        fragmentation: number;
        cacheHitRate: number;
        memoryUsage: number;
        alignmentEfficiency: number;
    } {
        let totalMemoryUsage = 0;
        
        for (const field of this.layout.fields) {
            const buffer = this.fieldArrays.get(field.name);
            const fieldSize = buffer ? buffer.byteLength : 0;
            totalMemoryUsage += fieldSize;
        }
        
        // 添加实体ID数组的内存使用
        totalMemoryUsage += this.entityIds.byteLength;
        
        const idealMemoryUsage = this._size * this.layout.structSize;
        const alignmentEfficiency = idealMemoryUsage > 0 ? idealMemoryUsage / totalMemoryUsage : 1;

        return {
            totalSlots: this.capacity,
            usedSlots: this._size,
            freeSlots: this.capacity - this._size,
            fragmentation: 0, // SIMD存储不产生碎片
            cacheHitRate: 1, // SIMD存储缓存友好
            memoryUsage: totalMemoryUsage,
            alignmentEfficiency
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
     * 开始批量更新模式
     * 
     * 对所有存储器启用批量更新，提升大量组件操作的性能。
     */
    public beginBatchUpdate(): void {
        for (const storage of this.storages.values()) {
            storage.beginBatchUpdate();
        }
    }

    /**
     * 提交所有批量更新
     * 
     * 提交所有存储器的批量更新并退出批量模式。
     */
    public commitBatchUpdates(): void {
        for (const storage of this.storages.values()) {
            storage.commitBatchUpdates();
        }
    }

    /**
     * 清除所有存储器的缓存
     * 
     * SIMD存储不需要缓存管理，此方法保持API兼容性。
     */
    public clearAllCaches(): void {
        // SIMD存储不需要缓存管理
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