import { Component } from '../Component';
import { ComponentType } from './ComponentStorage';

/**
 * 启用SoA优化装饰器
 * 默认关闭SoA，只有在大规模批量操作场景下才建议开启
 */
export function EnableSoA<T extends ComponentType>(target: T): T {
    (target as any).__enableSoA = true;
    return target;
}


/**
 * 高精度数值装饰器
 * 标记字段需要保持完整精度，存储为复杂对象而非TypedArray
 */
export function HighPrecision(target: any, propertyKey: string | symbol): void {
    const key = String(propertyKey);
    if (!target.constructor.__highPrecisionFields) {
        target.constructor.__highPrecisionFields = new Set();
    }
    target.constructor.__highPrecisionFields.add(key);
}

/**
 * 64位浮点数装饰器
 * 标记字段使用Float64Array存储（更高精度但更多内存）
 */
export function Float64(target: any, propertyKey: string | symbol): void {
    const key = String(propertyKey);
    if (!target.constructor.__float64Fields) {
        target.constructor.__float64Fields = new Set();
    }
    target.constructor.__float64Fields.add(key);
}

/**
 * 32位浮点数装饰器
 * 标记字段使用Float32Array存储（默认类型，平衡性能和精度）
 */
export function Float32(target: any, propertyKey: string | symbol): void {
    const key = String(propertyKey);
    if (!target.constructor.__float32Fields) {
        target.constructor.__float32Fields = new Set();
    }
    target.constructor.__float32Fields.add(key);
}

/**
 * 32位整数装饰器
 * 标记字段使用Int32Array存储（适用于整数值）
 */
export function Int32(target: any, propertyKey: string | symbol): void {
    const key = String(propertyKey);
    if (!target.constructor.__int32Fields) {
        target.constructor.__int32Fields = new Set();
    }
    target.constructor.__int32Fields.add(key);
}


/**
 * 序列化Map装饰器
 * 标记Map字段需要序列化/反序列化存储
 */
export function SerializeMap(target: any, propertyKey: string | symbol): void {
    const key = String(propertyKey);
    if (!target.constructor.__serializeMapFields) {
        target.constructor.__serializeMapFields = new Set();
    }
    target.constructor.__serializeMapFields.add(key);
}

/**
 * 序列化Set装饰器
 * 标记Set字段需要序列化/反序列化存储
 */
export function SerializeSet(target: any, propertyKey: string | symbol): void {
    const key = String(propertyKey);
    if (!target.constructor.__serializeSetFields) {
        target.constructor.__serializeSetFields = new Set();
    }
    target.constructor.__serializeSetFields.add(key);
}

/**
 * 序列化Array装饰器
 * 标记Array字段需要序列化/反序列化存储
 */
export function SerializeArray(target: any, propertyKey: string | symbol): void {
    const key = String(propertyKey);
    if (!target.constructor.__serializeArrayFields) {
        target.constructor.__serializeArrayFields = new Set();
    }
    target.constructor.__serializeArrayFields.add(key);
}

/**
 * 深拷贝装饰器
 * 标记字段需要深拷贝处理（适用于嵌套对象）
 */
export function DeepCopy(target: any, propertyKey: string | symbol): void {
    const key = String(propertyKey);
    if (!target.constructor.__deepCopyFields) {
        target.constructor.__deepCopyFields = new Set();
    }
    target.constructor.__deepCopyFields.add(key);
}

/**
 * SoA存储器（需要装饰器启用）
 * 使用Structure of Arrays存储模式，在大规模批量操作时提供优异性能
 */
export class SoAStorage<T extends Component> {
    private fields = new Map<string, Float32Array | Float64Array | Int32Array>();
    private stringFields = new Map<string, string[]>(); // 专门存储字符串
    private serializedFields = new Map<string, string[]>(); // 序列化存储Map/Set/Array
    private complexFields = new Map<number, Map<string, any>>(); // 存储复杂对象
    private entityToIndex = new Map<number, number>();
    private indexToEntity: number[] = [];
    private freeIndices: number[] = [];
    private _size = 0;
    private _capacity = 1000;
    public readonly type: ComponentType<T>;
    
    constructor(componentType: ComponentType<T>) {
        this.type = componentType;
        this.initializeFields(componentType);
    }
    
    private initializeFields(componentType: ComponentType<T>): void {
        const instance = new componentType();
        const highPrecisionFields = (componentType as any).__highPrecisionFields || new Set();
        const float64Fields = (componentType as any).__float64Fields || new Set();
        const float32Fields = (componentType as any).__float32Fields || new Set();
        const int32Fields = (componentType as any).__int32Fields || new Set();
        const serializeMapFields = (componentType as any).__serializeMapFields || new Set();
        const serializeSetFields = (componentType as any).__serializeSetFields || new Set();
        const serializeArrayFields = (componentType as any).__serializeArrayFields || new Set();
        // const deepCopyFields = (componentType as any).__deepCopyFields || new Set(); // 未使用，但保留供future使用
        
        for (const key in instance) {
            if (instance.hasOwnProperty(key) && key !== 'id') {
                const value = (instance as any)[key];
                const type = typeof value;
                
                if (type === 'number') {
                    if (highPrecisionFields.has(key)) {
                        // 标记为高精度，作为复杂对象处理
                        // 不添加到fields，会在updateComponentAtIndex中自动添加到complexFields
                    } else if (float64Fields.has(key)) {
                        // 使用Float64Array存储
                        this.fields.set(key, new Float64Array(this._capacity));
                    } else if (int32Fields.has(key)) {
                        // 使用Int32Array存储
                        this.fields.set(key, new Int32Array(this._capacity));
                    } else if (float32Fields.has(key)) {
                        // 使用Float32Array存储
                        this.fields.set(key, new Float32Array(this._capacity));
                    } else {
                        // 默认使用Float32Array
                        this.fields.set(key, new Float32Array(this._capacity));
                    }
                } else if (type === 'boolean') {
                    // 布尔值使用Float32Array存储为0/1
                    this.fields.set(key, new Float32Array(this._capacity));
                } else if (type === 'string') {
                    // 字符串专门处理
                    this.stringFields.set(key, new Array(this._capacity));
                } else if (type === 'object' && value !== null) {
                    // 处理集合类型
                    if (serializeMapFields.has(key) || serializeSetFields.has(key) || serializeArrayFields.has(key)) {
                        // 序列化存储
                        this.serializedFields.set(key, new Array(this._capacity));
                    }
                    // 其他对象类型会在updateComponentAtIndex中作为复杂对象处理
                }
            }
        }
    }
    
    public addComponent(entityId: number, component: T): void {
        if (this.entityToIndex.has(entityId)) {
            const index = this.entityToIndex.get(entityId)!;
            this.updateComponentAtIndex(index, component);
            return;
        }
        
        let index: number;
        if (this.freeIndices.length > 0) {
            index = this.freeIndices.pop()!;
        } else {
            index = this._size;
            if (index >= this._capacity) {
                this.resize(this._capacity * 2);
            }
        }
        
        this.entityToIndex.set(entityId, index);
        this.indexToEntity[index] = entityId;
        this.updateComponentAtIndex(index, component);
        this._size++;
    }
    
    private updateComponentAtIndex(index: number, component: T): void {
        const entityId = this.indexToEntity[index];
        const complexFieldMap = new Map<string, any>();
        const highPrecisionFields = (this.type as any).__highPrecisionFields || new Set();
        const serializeMapFields = (this.type as any).__serializeMapFields || new Set();
        const serializeSetFields = (this.type as any).__serializeSetFields || new Set();
        const serializeArrayFields = (this.type as any).__serializeArrayFields || new Set();
        const deepCopyFields = (this.type as any).__deepCopyFields || new Set();
        
        // 处理所有字段
        for (const key in component) {
            if (component.hasOwnProperty(key) && key !== 'id') {
                const value = (component as any)[key];
                const type = typeof value;
                
                if (type === 'number') {
                    if (highPrecisionFields.has(key) || !this.fields.has(key)) {
                        // 标记为高精度或未在TypedArray中的数值作为复杂对象存储
                        complexFieldMap.set(key, value);
                    } else {
                        // 存储到TypedArray
                        const array = this.fields.get(key)!;
                        array[index] = value;
                    }
                } else if (type === 'boolean' && this.fields.has(key)) {
                    // 布尔值存储到TypedArray  
                    const array = this.fields.get(key)!;
                    array[index] = value ? 1 : 0;
                } else if (this.stringFields.has(key)) {
                    // 字符串字段专门处理
                    const stringArray = this.stringFields.get(key)!;
                    stringArray[index] = String(value);
                } else if (this.serializedFields.has(key)) {
                    // 序列化字段处理
                    const serializedArray = this.serializedFields.get(key)!;
                    serializedArray[index] = this.serializeValue(value, key, serializeMapFields, serializeSetFields, serializeArrayFields);
                } else {
                    // 复杂字段单独存储
                    if (deepCopyFields.has(key)) {
                        // 深拷贝处理
                        complexFieldMap.set(key, this.deepClone(value));
                    } else {
                        complexFieldMap.set(key, value);
                    }
                }
            }
        }
        
        // 存储复杂字段
        if (complexFieldMap.size > 0) {
            this.complexFields.set(entityId, complexFieldMap);
        }
    }
    
    /**
     * 序列化值为JSON字符串
     */
    private serializeValue(value: any, key: string, mapFields: Set<string>, setFields: Set<string>, arrayFields: Set<string>): string {
        try {
            if (mapFields.has(key) && value instanceof Map) {
                // Map序列化为数组形式
                return JSON.stringify(Array.from(value.entries()));
            } else if (setFields.has(key) && value instanceof Set) {
                // Set序列化为数组形式
                return JSON.stringify(Array.from(value));
            } else if (arrayFields.has(key) && Array.isArray(value)) {
                // Array直接序列化
                return JSON.stringify(value);
            } else {
                // 其他对象直接序列化
                return JSON.stringify(value);
            }
        } catch (error) {
            console.warn(`SoA序列化字段 ${key} 失败:`, error);
            return '{}';
        }
    }
    
    /**
     * 反序列化JSON字符串为值
     */
    private deserializeValue(serialized: string, key: string, mapFields: Set<string>, setFields: Set<string>, arrayFields: Set<string>): any {
        try {
            const parsed = JSON.parse(serialized);
            
            if (mapFields.has(key)) {
                // 恢复Map
                return new Map(parsed);
            } else if (setFields.has(key)) {
                // 恢复Set
                return new Set(parsed);
            } else if (arrayFields.has(key)) {
                // 恢复Array
                return parsed;
            } else {
                return parsed;
            }
        } catch (error) {
            console.warn(`SoA反序列化字段 ${key} 失败:`, error);
            return null;
        }
    }
    
    /**
     * 深拷贝对象
     */
    private deepClone(obj: any): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (obj instanceof Map) {
            const cloned = new Map();
            for (const [key, value] of obj.entries()) {
                cloned.set(key, this.deepClone(value));
            }
            return cloned;
        }
        
        if (obj instanceof Set) {
            const cloned = new Set();
            for (const value of obj.values()) {
                cloned.add(this.deepClone(value));
            }
            return cloned;
        }
        
        // 普通对象
        const cloned: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    public getComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        if (index === undefined) {
            return null;
        }
        
        // 创建真正的组件实例以保持兼容性
        const component = new this.type() as any;
        const serializeMapFields = (this.type as any).__serializeMapFields || new Set();
        const serializeSetFields = (this.type as any).__serializeSetFields || new Set();
        const serializeArrayFields = (this.type as any).__serializeArrayFields || new Set();
        
        // 恢复数值字段
        for (const [fieldName, array] of this.fields.entries()) {
            const value = array[index];
            const fieldType = this.getFieldType(fieldName);
            
            if (fieldType === 'boolean') {
                component[fieldName] = value === 1;
            } else {
                component[fieldName] = value;
            }
        }
        
        // 恢复字符串字段
        for (const [fieldName, stringArray] of this.stringFields.entries()) {
            component[fieldName] = stringArray[index];
        }
        
        // 恢复序列化字段
        for (const [fieldName, serializedArray] of this.serializedFields.entries()) {
            const serialized = serializedArray[index];
            if (serialized) {
                component[fieldName] = this.deserializeValue(serialized, fieldName, serializeMapFields, serializeSetFields, serializeArrayFields);
            }
        }
        
        // 恢复复杂字段
        const complexFieldMap = this.complexFields.get(entityId);
        if (complexFieldMap) {
            for (const [fieldName, value] of complexFieldMap.entries()) {
                component[fieldName] = value;
            }
        }
        
        return component as T;
    }
    
    private getFieldType(fieldName: string): string {
        // 通过创建临时实例检查字段类型
        const tempInstance = new this.type();
        const value = (tempInstance as any)[fieldName];
        return typeof value;
    }
    
    public hasComponent(entityId: number): boolean {
        return this.entityToIndex.has(entityId);
    }
    
    public removeComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        if (index === undefined) {
            return null;
        }
        
        // 获取组件副本以便返回
        const component = this.getComponent(entityId);
        
        // 清理复杂字段
        this.complexFields.delete(entityId);
        
        this.entityToIndex.delete(entityId);
        this.freeIndices.push(index);
        this._size--;
        return component;
    }
    
    private resize(newCapacity: number): void {
        // 调整数值字段的TypedArray
        for (const [fieldName, oldArray] of this.fields.entries()) {
            let newArray: Float32Array | Float64Array | Int32Array;
            
            if (oldArray instanceof Float32Array) {
                newArray = new Float32Array(newCapacity);
            } else if (oldArray instanceof Float64Array) {
                newArray = new Float64Array(newCapacity);
            } else {
                newArray = new Int32Array(newCapacity);
            }
            
            newArray.set(oldArray);
            this.fields.set(fieldName, newArray);
        }
        
        // 调整字符串字段的数组
        for (const [fieldName, oldArray] of this.stringFields.entries()) {
            const newArray = new Array(newCapacity);
            for (let i = 0; i < oldArray.length; i++) {
                newArray[i] = oldArray[i];
            }
            this.stringFields.set(fieldName, newArray);
        }
        
        // 调整序列化字段的数组
        for (const [fieldName, oldArray] of this.serializedFields.entries()) {
            const newArray = new Array(newCapacity);
            for (let i = 0; i < oldArray.length; i++) {
                newArray[i] = oldArray[i];
            }
            this.serializedFields.set(fieldName, newArray);
        }
        
        this._capacity = newCapacity;
    }
    
    public getActiveIndices(): number[] {
        return Array.from(this.entityToIndex.values());
    }
    
    public getFieldArray(fieldName: string): Float32Array | Float64Array | Int32Array | null {
        return this.fields.get(fieldName) || null;
    }
    
    public size(): number {
        return this._size;
    }
    
    public clear(): void {
        this.entityToIndex.clear();
        this.indexToEntity = [];
        this.freeIndices = [];
        this.complexFields.clear();
        this._size = 0;
        
        // 重置数值字段数组
        for (const array of this.fields.values()) {
            array.fill(0);
        }
        
        // 重置字符串字段数组
        for (const stringArray of this.stringFields.values()) {
            for (let i = 0; i < stringArray.length; i++) {
                stringArray[i] = undefined as any;
            }
        }
        
        // 重置序列化字段数组
        for (const serializedArray of this.serializedFields.values()) {
            for (let i = 0; i < serializedArray.length; i++) {
                serializedArray[i] = undefined as any;
            }
        }
    }

    public compact(): void {
        if (this.freeIndices.length === 0) {
            return;
        }

        const activeEntries = Array.from(this.entityToIndex.entries())
            .sort((a, b) => a[1] - b[1]);

        // 重新映射索引
        const newEntityToIndex = new Map<number, number>();
        const newIndexToEntity: number[] = [];

        for (let newIndex = 0; newIndex < activeEntries.length; newIndex++) {
            const [entityId, oldIndex] = activeEntries[newIndex];
            
            newEntityToIndex.set(entityId, newIndex);
            newIndexToEntity[newIndex] = entityId;

            // 移动字段数据
            if (newIndex !== oldIndex) {
                // 移动数值字段
                for (const [, array] of this.fields.entries()) {
                    array[newIndex] = array[oldIndex];
                }
                
                // 移动字符串字段
                for (const [, stringArray] of this.stringFields.entries()) {
                    stringArray[newIndex] = stringArray[oldIndex];
                }
                
                // 移动序列化字段
                for (const [, serializedArray] of this.serializedFields.entries()) {
                    serializedArray[newIndex] = serializedArray[oldIndex];
                }
            }
        }

        this.entityToIndex = newEntityToIndex;
        this.indexToEntity = newIndexToEntity;
        this.freeIndices = [];
        this._size = activeEntries.length;
    }

    public getStats(): any {
        let totalMemory = 0;
        const fieldStats = new Map<string, any>();

        for (const [fieldName, array] of this.fields.entries()) {
            let bytesPerElement: number;
            let typeName: string;
            
            if (array instanceof Float32Array) {
                bytesPerElement = 4;
                typeName = 'float32';
            } else if (array instanceof Float64Array) {
                bytesPerElement = 8;
                typeName = 'float64';
            } else {
                bytesPerElement = 4;
                typeName = 'int32';
            }
            
            const memory = array.length * bytesPerElement;
            totalMemory += memory;

            fieldStats.set(fieldName, {
                size: this._size,
                capacity: array.length,
                type: typeName,
                memory: memory
            });
        }

        return {
            size: this._size,
            capacity: this._capacity,
            usedSlots: this._size, // 兼容原测试
            fragmentation: this.freeIndices.length / this._capacity,
            memoryUsage: totalMemory,
            fieldStats: fieldStats
        };
    }

    /**
     * 执行向量化批量操作
     * @param operation 操作函数，接收字段数组和活跃索引
     */
    public performVectorizedOperation(operation: (fieldArrays: Map<string, Float32Array | Float64Array | Int32Array>, activeIndices: number[]) => void): void {
        const activeIndices = this.getActiveIndices();
        operation(this.fields, activeIndices);
    }
}