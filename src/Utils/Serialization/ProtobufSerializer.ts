/**
 * Protobuf序列化器
 * 
 * 处理组件的protobuf序列化和反序列化
 */

import { Component } from '../../ECS/Component';
import { BigIntFactory } from '../../ECS/Utils/BigIntCompatibility';
import { 
    ProtobufRegistry, 
    ProtoComponentDefinition, 
    ProtoFieldDefinition,
    ProtoFieldType,
    isProtoSerializable,
    getProtoName 
} from './ProtobufDecorators';
import { SerializedData } from './SerializationTypes';


/**
 * Protobuf序列化器
 */
export class ProtobufSerializer {
    private registry: ProtobufRegistry;
    private static instance: ProtobufSerializer;
    
    /** protobuf.js库实例 */
    private protobuf: any = null;
    private root: any = null;
    
    /** MessageType缓存映射表 */
    private messageTypeCache: Map<string, any> = new Map();
    
    /** 组件序列化数据缓存 */
    private componentDataCache: Map<string, any> = new Map();
    
    /** 缓存访问计数器 */
    private cacheAccessCount: Map<string, number> = new Map();
    
    /** 最大缓存大小 */
    private maxCacheSize: number = 1000;
    
    /** 是否启用数据验证 */
    private enableValidation: boolean = process.env.NODE_ENV === 'development';
    
    /** 是否启用组件数据缓存 */
    private enableComponentDataCache: boolean = true;
    
    private constructor() {
        this.registry = ProtobufRegistry.getInstance();
        this.initializeProtobuf();
    }
    
    /**
     * 设置性能选项
     * @param options 性能配置选项
     * @param options.enableValidation 是否启用数据验证
     * @param options.enableComponentDataCache 是否启用组件数据缓存
     * @param options.maxCacheSize 最大缓存大小
     * @param options.clearCache 是否清空消息类型缓存
     * @param options.clearAllCaches 是否清空所有缓存
     */
    public setPerformanceOptions(options: {
        enableValidation?: boolean;
        enableComponentDataCache?: boolean;
        maxCacheSize?: number;
        clearCache?: boolean;
        clearAllCaches?: boolean;
    }): void {
        if (options.enableValidation !== undefined) {
            this.enableValidation = options.enableValidation;
        }
        if (options.enableComponentDataCache !== undefined) {
            this.enableComponentDataCache = options.enableComponentDataCache;
        }
        if (options.maxCacheSize !== undefined && options.maxCacheSize > 0) {
            this.maxCacheSize = options.maxCacheSize;
        }
        if (options.clearCache) {
            this.messageTypeCache.clear();
        }
        if (options.clearAllCaches) {
            this.clearAllCaches();
        }
    }
    
    /**
     * 清空所有缓存
     */
    public clearAllCaches(): void {
        this.messageTypeCache.clear();
        this.componentDataCache.clear();
        this.cacheAccessCount.clear();
    }
    
    /**
     * 自动初始化protobuf支持
     */
    private async initializeProtobuf(): Promise<void> {
        try {
            // 动态导入protobufjs
            this.protobuf = await import('protobufjs');
            this.buildProtoDefinitions();
            console.log('[ProtobufSerializer] Protobuf支持已启用');
        } catch (error) {
            throw new Error('[ProtobufSerializer] 无法加载protobufjs: ' + error);
        }
    }
    
    public static getInstance(): ProtobufSerializer {
        if (!ProtobufSerializer.instance) {
            ProtobufSerializer.instance = new ProtobufSerializer();
        }
        return ProtobufSerializer.instance;
    }
    
    /**
     * 手动初始化protobuf.js库
     * @param protobufJs protobuf.js库实例
     */
    public initialize(protobufJs: any): void {
        this.protobuf = protobufJs;
        this.buildProtoDefinitions();
        console.log('[ProtobufSerializer] Protobuf支持已手动启用');
    }
    
    /**
     * 序列化组件
     * @param component 要序列化的组件
     * @returns 序列化数据
     */
    public serialize(component: Component): SerializedData {
        const componentType = component.constructor.name;
        
        // 检查是否支持protobuf序列化
        if (!isProtoSerializable(component)) {
            return this.fallbackToJsonSerialization(component, `组件 ${componentType} 不支持protobuf序列化`);
        }
        
        const protoName = getProtoName(component);
        if (!protoName) {
            return this.fallbackToJsonSerialization(component, `组件 ${componentType} 未设置protobuf名称`);
        }
        
        const definition = this.registry.getComponentDefinition(protoName);
        if (!definition) {
            return this.fallbackToJsonSerialization(component, `未找到组件定义: ${protoName}`);
        }
        
        // 获取protobuf消息类型
        const MessageType = this.getMessageType(protoName);
        if (!MessageType) {
            return this.fallbackToJsonSerialization(component, `未找到消息类型: ${protoName}`);
        }
        
        try {
            // 构建protobuf数据对象
            const protoData = this.buildProtoData(component, definition);
            
            // 数据验证
            if (this.enableValidation) {
                const error = MessageType.verify(protoData);
                if (error) {
                    return this.fallbackToJsonSerialization(component, `数据验证失败: ${error}`);
                }
            }
            
            // 创建消息并编码
            const message = MessageType.create(protoData);
            const buffer = MessageType.encode(message).finish();
            
            return {
                type: 'protobuf',
                componentType: componentType,
                data: buffer,
                size: buffer.length
            };
            
        } catch (error) {
            return this.fallbackToJsonSerialization(component, `序列化失败: ${error}`);
        }
    }
    
    /**
     * 反序列化组件
     * @param component 目标组件实例
     * @param serializedData 序列化数据
     */
    public deserialize(component: Component, serializedData: SerializedData): void {
        // 如果是JSON数据，使用JSON反序列化
        if (serializedData.type === 'json') {
            this.deserializeFromJson(component, serializedData);
            return;
        }
        
        // Protobuf反序列化
        const protoName = getProtoName(component);
        if (!protoName) {
            console.warn(`[ProtobufSerializer] 组件 ${component.constructor.name} 未设置protobuf名称，跳过反序列化`);
            return;
        }
        
        const MessageType = this.getMessageType(protoName);
        if (!MessageType) {
            console.warn(`[ProtobufSerializer] 未找到消息类型: ${protoName}，跳过反序列化`);
            return;
        }
        
        try {
            // 解码消息
            const message = MessageType.decode(serializedData.data);
            const data = MessageType.toObject(message);
            
            // 应用数据到组件
            this.applyDataToComponent(component, data);
            
        } catch (error) {
            console.error(`[ProtobufSerializer] 反序列化失败: ${component.constructor.name} - ${error}`);
            // 不抛出异常，避免影响整个反序列化流程
        }
    }
    
    /**
     * 检查组件是否支持protobuf序列化
     */
    public canSerialize(component: Component): boolean {
        if (!this.protobuf) return false;
        return isProtoSerializable(component);
    }
    
    /**
     * 批量序列化组件
     * @param components 要序列化的组件数组
     * @param options 批量序列化选项
     * @param options.continueOnError 遇到错误时是否继续处理
     * @param options.maxBatchSize 最大批次大小
     * @returns 序列化结果数组
     */
    public serializeBatch(
        components: Component[], 
        options?: {
            continueOnError?: boolean;
            maxBatchSize?: number;
        }
    ): SerializedData[] {
        const results: SerializedData[] = [];
        const errors: Error[] = [];
        
        const continueOnError = options?.continueOnError ?? false;
        const maxBatchSize = options?.maxBatchSize ?? 1000;
        
        // 分批处理大量组件
        const batches = this.splitIntoBatches(components, maxBatchSize);
        
        for (const batch of batches) {
            const batchResults = this.serializeBatchSerial(batch, continueOnError);
            results.push(...batchResults.results);
            errors.push(...batchResults.errors);
        }
        
        // 如果有错误且不继续执行，抛出第一个错误
        if (errors.length > 0 && !continueOnError) {
            throw errors[0];
        }
        
        // 记录错误统计
        if (errors.length > 0) {
            console.warn(`[ProtobufSerializer] 批量序列化完成，${results.length} 成功，${errors.length} 失败`);
        }
        
        return results;
    }
    
    /**
     * 串行批量序列化
     */
    private serializeBatchSerial(
        components: Component[], 
        continueOnError: boolean
    ): { results: SerializedData[], errors: Error[] } {
        const results: SerializedData[] = [];
        const errors: Error[] = [];
        
        // 按组件类型分组，减少重复查找
        const componentGroups = this.groupComponentsByType(components, continueOnError, errors);
        
        // 按组分别序列化
        for (const [protoName, groupComponents] of componentGroups) {
            const definition = this.registry.getComponentDefinition(protoName);
            const MessageType = this.getMessageType(protoName);
            
            if (!definition || !MessageType) {
                const error = new Error(`[ProtobufSerializer] 组件类型 ${protoName} 未正确注册`);
                if (continueOnError) {
                    errors.push(error);
                    // 回退到JSON序列化
                    for (const component of groupComponents) {
                        try {
                            const jsonResult = this.fallbackToJsonSerialization(component, `组件类型 ${protoName} 未正确注册`);
                            results.push(jsonResult);
                        } catch (jsonError) {
                            errors.push(jsonError instanceof Error ? jsonError : new Error(String(jsonError)));
                        }
                    }
                    continue;
                } else {
                    throw error;
                }
            }
            
            // 预编译消息类型和字段定义
            const compiledType = this.getCompiledMessageType(protoName, definition, MessageType);
            
            for (const component of groupComponents) {
                try {
                    const result = this.serializeSingleComponent(component, definition, compiledType);
                    results.push(result);
                } catch (error) {
                    if (continueOnError) {
                        errors.push(error instanceof Error ? error : new Error(String(error)));
                        // 尝试JSON回退
                        try {
                            const jsonResult = this.fallbackToJsonSerialization(component, `Protobuf序列化失败: ${error}`);
                            results.push(jsonResult);
                        } catch (jsonError) {
                            errors.push(jsonError instanceof Error ? jsonError : new Error(String(jsonError)));
                        }
                    } else {
                        throw error;
                    }
                }
            }
        }
        
        return { results, errors };
    }
    
    
    /**
     * 序列化单个组件
     */
    private serializeSingleComponent(
        component: Component, 
        definition: ProtoComponentDefinition,
        compiledType: any
    ): SerializedData {
        const protoData = this.buildProtoData(component, definition);
        
        // 数据验证
        if (this.enableValidation && compiledType.verify) {
            const error = compiledType.verify(protoData);
            if (error) {
                throw new Error(`[ProtobufSerializer] 数据验证失败: ${error}`);
            }
        }
        
        const message = compiledType.create(protoData);
        const buffer = compiledType.encode(message).finish();
        
        return {
            type: 'protobuf',
            componentType: component.constructor.name,
            data: buffer,
            size: buffer.length
        };
    }
    
    /**
     * 按类型分组组件
     */
    private groupComponentsByType(
        components: Component[], 
        continueOnError: boolean, 
        errors: Error[]
    ): Map<string, Component[]> {
        const componentGroups = new Map<string, Component[]>();
        
        for (const component of components) {
            try {
                if (!isProtoSerializable(component)) {
                    throw new Error(`[ProtobufSerializer] 组件 ${component.constructor.name} 不支持protobuf序列化`);
                }
                
                const protoName = getProtoName(component);
                if (!protoName) {
                    throw new Error(`[ProtobufSerializer] 组件 ${component.constructor.name} 未设置protobuf名称`);
                }
                
                if (!componentGroups.has(protoName)) {
                    componentGroups.set(protoName, []);
                }
                componentGroups.get(protoName)!.push(component);
            } catch (error) {
                if (continueOnError) {
                    errors.push(error instanceof Error ? error : new Error(String(error)));
                } else {
                    throw error;
                }
            }
        }
        
        return componentGroups;
    }
    
    /**
     * 获取编译后的消息类型
     */
    private getCompiledMessageType(_protoName: string, _definition: ProtoComponentDefinition, MessageType: any): any {
        // TODO: 实现消息类型编译和缓存优化
        return MessageType;
    }
    
    /**
     * 将数组分割成批次
     */
    private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    
    /**
     * 获取序列化统计信息
     */
    public getStats(): {
        registeredComponents: number;
        protobufAvailable: boolean;
        messageTypeCacheSize: number;
        componentDataCacheSize: number;
        enableComponentDataCache: boolean;
        maxCacheSize: number;
    } {
        return {
            registeredComponents: this.registry.getAllComponents().size,
            protobufAvailable: !!this.protobuf,
            messageTypeCacheSize: this.messageTypeCache.size,
            componentDataCacheSize: this.componentDataCache.size,
            enableComponentDataCache: this.enableComponentDataCache,
            maxCacheSize: this.maxCacheSize
        };
    }
    
    /**
     * 构建protobuf数据对象
     */
    private buildProtoData(component: Component, definition: ProtoComponentDefinition): any {
        const componentType = component.constructor.name;
        
        // 生成缓存键
        const cacheKey = this.generateComponentCacheKey(component, componentType);
        
        // 检查缓存
        if (this.enableComponentDataCache && this.componentDataCache.has(cacheKey)) {
            this.updateCacheAccess(cacheKey);
            return this.componentDataCache.get(cacheKey);
        }
        
        const data: any = {};
        
        for (const [propertyName, fieldDef] of definition.fields) {
            const value = (component as any)[propertyName];
            
            if (value !== undefined && value !== null) {
                data[fieldDef.name] = this.convertValueToProtoType(value, fieldDef);
            }
        }
        
        // 缓存结果，仅在启用且数据较小时缓存
        if (this.enableComponentDataCache && JSON.stringify(data).length < 1000) {
            this.setCacheWithLRU(cacheKey, data);
        }
        
        return data;
    }
    
    /**
     * 转换值到protobuf类型
     */
    private convertValueToProtoType(value: any, fieldDef: ProtoFieldDefinition): any {
        if (fieldDef.repeated && Array.isArray(value)) {
            return value.map(v => this.convertSingleValue(v, fieldDef.type));
        }
        
        return this.convertSingleValue(value, fieldDef.type);
    }
    
    /**
     * 转换单个值为protobuf类型
     */
    private convertSingleValue(value: any, type: ProtoFieldType): any {
        switch (type) {
            case ProtoFieldType.INT32:
            case ProtoFieldType.UINT32:
            case ProtoFieldType.SINT32:
            case ProtoFieldType.FIXED32:
            case ProtoFieldType.SFIXED32:
                return typeof value === 'number' ? (value | 0) : (parseInt(value) || 0);
                
            case ProtoFieldType.INT64:
            case ProtoFieldType.UINT64:
            case ProtoFieldType.SINT64:
            case ProtoFieldType.FIXED64:
            case ProtoFieldType.SFIXED64:
                // 使用BigIntFactory处理64位整数以确保兼容性
                const bigIntValue = BigIntFactory.create(value || 0);
                return bigIntValue.valueOf(); // 转换为数值用于protobuf
                
            case ProtoFieldType.FLOAT:
            case ProtoFieldType.DOUBLE:
                return typeof value === 'number' ? value : (parseFloat(value) || 0);
                
            case ProtoFieldType.BOOL:
                return typeof value === 'boolean' ? value : Boolean(value);
                
            case ProtoFieldType.STRING:
                return typeof value === 'string' ? value : String(value);
                
            case ProtoFieldType.BYTES:
                if (value instanceof Uint8Array) return value;
                if (value instanceof ArrayBuffer) return new Uint8Array(value);
                if (typeof value === 'string') return new TextEncoder().encode(value);
                return new Uint8Array();
                
            case ProtoFieldType.TIMESTAMP:
                if (value instanceof Date) {
                    return {
                        seconds: Math.floor(value.getTime() / 1000),
                        nanos: (value.getTime() % 1000) * 1000000
                    };
                }
                if (typeof value === 'string') {
                    const date = new Date(value);
                    return {
                        seconds: Math.floor(date.getTime() / 1000),
                        nanos: (date.getTime() % 1000) * 1000000
                    };
                }
                return { seconds: 0, nanos: 0 };
                
            case ProtoFieldType.DURATION:
                if (typeof value === 'number') {
                    return {
                        seconds: Math.floor(value / 1000),
                        nanos: (value % 1000) * 1000000
                    };
                }
                return { seconds: 0, nanos: 0 };
                
            case ProtoFieldType.STRUCT:
                if (value && typeof value === 'object') {
                    return this.convertObjectToStruct(value);
                }
                return {};
                
            case ProtoFieldType.MESSAGE:
            case ProtoFieldType.ENUM:
                // 对于自定义消息和枚举，直接返回值，让protobuf.js处理
                return value;
                
            default:
                return value;
        }
    }
    
    /**
     * 转换对象为Protobuf Struct格式
     */
    private convertObjectToStruct(obj: any): any {
        const result: any = { fields: {} };
        
        for (const [key, value] of Object.entries(obj)) {
            result.fields[key] = this.convertValueToStructValue(value);
        }
        
        return result;
    }
    
    /**
     * 转换值为Protobuf Value格式
     */
    private convertValueToStructValue(value: any): any {
        if (value === null) return { nullValue: 0 };
        if (typeof value === 'number') return { numberValue: value };
        if (typeof value === 'string') return { stringValue: value };
        if (typeof value === 'boolean') return { boolValue: value };
        if (Array.isArray(value)) {
            return {
                listValue: {
                    values: value.map(v => this.convertValueToStructValue(v))
                }
            };
        }
        if (typeof value === 'object') {
            return { structValue: this.convertObjectToStruct(value) };
        }
        return { stringValue: String(value) };
    }
    
    /**
     * 应用数据到组件
     */
    private applyDataToComponent(component: Component, data: any): void {
        const protoName = getProtoName(component);
        if (!protoName) return;
        
        const definition = this.registry.getComponentDefinition(protoName);
        if (!definition) return;
        
        for (const [propertyName, fieldDef] of definition.fields) {
            const value = data[fieldDef.name];
            if (value !== undefined) {
                (component as any)[propertyName] = value;
            }
        }
    }
    
    /**
     * 构建protobuf定义
     */
    private buildProtoDefinitions(): void {
        if (!this.protobuf) return;
        
        try {
            const protoDefinition = this.registry.generateProtoDefinition();
            this.root = this.protobuf.parse(protoDefinition).root;
            // 清空缓存，schema已更新
            this.messageTypeCache.clear();
        } catch (error) {
            console.error('[ProtobufSerializer] 构建protobuf定义失败:', error);
        }
    }
    
    /**
     * 获取消息类型并缓存结果
     */
    private getMessageType(typeName: string): any {
        if (!this.root) return null;
        
        // 检查缓存
        const fullTypeName = `ecs.${typeName}`;
        if (this.messageTypeCache.has(fullTypeName)) {
            return this.messageTypeCache.get(fullTypeName);
        }
        
        try {
            const messageType = this.root.lookupType(fullTypeName);
            // 缓存结果
            this.messageTypeCache.set(fullTypeName, messageType);
            return messageType;
        } catch (error) {
            console.warn(`[ProtobufSerializer] 未找到消息类型: ${fullTypeName}`);
            // 缓存null结果以避免重复查找
            this.messageTypeCache.set(fullTypeName, null);
            return null;
        }
    }
    
    /**
     * 回退到JSON序列化
     */
    private fallbackToJsonSerialization(component: Component, reason: string): SerializedData {
        console.warn(`[ProtobufSerializer] ${reason}，回退到JSON序列化`);
        
        try {
            const data = this.serializeToJson(component);
            const jsonString = JSON.stringify(data);
            const encoder = new TextEncoder();
            const buffer = encoder.encode(jsonString);
            
            return {
                type: 'json',
                componentType: component.constructor.name,
                data: data,
                size: buffer.length
            };
        } catch (error) {
            console.error(`[ProtobufSerializer] JSON序列化也失败: ${error}`);
            throw new Error(`[ProtobufSerializer] 序列化完全失败: ${component.constructor.name}`);
        }
    }
    
    /**
     * 从JSON数据反序列化
     */
    private deserializeFromJson(component: Component, serializedData: SerializedData): void {
        try {
            if (typeof (component as any).deserialize === 'function') {
                // 使用组件的自定义反序列化方法
                (component as any).deserialize(serializedData.data);
            } else {
                // 默认的属性赋值
                Object.assign(component, serializedData.data);
            }
        } catch (error) {
            console.error(`[ProtobufSerializer] JSON反序列化失败: ${component.constructor.name} - ${error}`);
        }
    }
    
    /**
     * 序列化为JSON对象
     */
    private serializeToJson(component: Component): any {
        if (typeof (component as any).serialize === 'function') {
            // 使用组件的自定义序列化方法
            return (component as any).serialize();
        } else {
            // 默认的属性序列化
            const data: any = {};
            
            // 获取所有可枚举属性
            for (const key of Object.keys(component)) {
                const value = (component as any)[key];
                if (this.isSerializableValue(value)) {
                    data[key] = this.deepCloneSerializableValue(value);
                }
            }
            
            return data;
        }
    }
    
    /**
     * 检查值是否可序列化
     */
    private isSerializableValue(value: any): boolean {
        if (value === null || value === undefined) return true;
        if (typeof value === 'function') return false;
        if (value instanceof Date) return true;
        if (Array.isArray(value)) return true;
        if (value instanceof Map || value instanceof Set) return true;
        if (typeof value === 'object' && value.constructor === Object) return true;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
        return false;
    }
    
    /**
     * 深拷贝可序列化的值
     */
    private deepCloneSerializableValue(value: any): any {
        if (value === null || value === undefined) return value;
        if (typeof value !== 'object') return value;
        if (value instanceof Date) return value.toISOString();
        
        if (Array.isArray(value)) {
            return value.map(item => this.deepCloneSerializableValue(item));
        }
        
        if (value instanceof Map) {
            return Array.from(value.entries());
        }
        
        if (value instanceof Set) {
            return Array.from(value);
        }
        
        if (value.constructor === Object) {
            const result: any = {};
            for (const key in value) {
                if (value.hasOwnProperty(key) && this.isSerializableValue(value[key])) {
                    result[key] = this.deepCloneSerializableValue(value[key]);
                }
            }
            return result;
        }
        
        return value;
    }
    
    /**
     * 生成组件缓存键
     */
    private generateComponentCacheKey(component: Component, componentType: string): string {
        // TODO: 考虑更高效的缓存键生成策略
        const properties = Object.keys(component).sort();
        const values = properties.map(key => String((component as any)[key])).join('|');
        return `${componentType}:${this.simpleHash(values)}`;
    }
    
    /**
     * 简单哈希函数
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }
    
    /**
     * 更新缓存访问计数
     */
    private updateCacheAccess(cacheKey: string): void {
        const currentCount = this.cacheAccessCount.get(cacheKey) || 0;
        this.cacheAccessCount.set(cacheKey, currentCount + 1);
    }
    
    /**
     * 使用LRU策略设置缓存
     */
    private setCacheWithLRU(cacheKey: string, data: any): void {
        // 检查是否需要淘汰缓存
        if (this.componentDataCache.size >= this.maxCacheSize) {
            this.evictLRUCache();
        }
        
        this.componentDataCache.set(cacheKey, data);
        this.cacheAccessCount.set(cacheKey, 1);
    }
    
    /**
     * 淘汰LRU缓存项
     */
    private evictLRUCache(): void {
        let lruKey = '';
        let minAccessCount = Number.MAX_SAFE_INTEGER;
        
        // 找到访问次数最少的缓存项
        for (const [key, count] of this.cacheAccessCount) {
            if (count < minAccessCount) {
                minAccessCount = count;
                lruKey = key;
            }
        }
        
        if (lruKey) {
            this.componentDataCache.delete(lruKey);
            this.cacheAccessCount.delete(lruKey);
        }
    }
}