/**
 * Protobuf序列化器
 * 
 * 处理组件的protobuf序列化和反序列化
 */

import { Component } from '@esengine/ecs-framework';
import * as protobuf from 'protobufjs';
import { 
    ProtobufRegistry,
    isProtoSerializable,
    getProtoName 
} from './ProtobufDecorators';
import { SerializedData } from './SerializationTypes';

/**
 * 可序列化组件接口
 */
interface SerializableComponent extends Component {
    readonly constructor: { name: string };
}



/**
 * Protobuf序列化器
 */
export class ProtobufSerializer {
    private registry: ProtobufRegistry;
    private static instance: ProtobufSerializer;
    
    /** protobuf.js根对象 */
    private root: protobuf.Root | null = null;
    
    /** MessageType缓存映射表 */
    private messageTypeCache: Map<string, protobuf.Type> = new Map();
    
    /** 组件序列化数据缓存 */
    private componentDataCache: Map<string, Record<string, any>> = new Map();
    
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
            this.cacheAccessCount.clear();
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
            this.buildProtoDefinitions();
            console.log('[ProtobufSerializer] Protobuf支持已启用');
        } catch (error) {
            throw new Error('[ProtobufSerializer] 初始化protobuf失败: ' + error);
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
     * @param protobufRoot protobuf根对象
     */
    public initialize(protobufRoot?: protobuf.Root): void {
        if (protobufRoot) {
            this.root = protobufRoot;
        } else {
            this.buildProtoDefinitions();
        }
        console.log('[ProtobufSerializer] Protobuf支持已手动启用');
    }
    
    /**
     * 序列化组件
     * @param component 要序列化的组件
     * @returns 序列化数据
     */
    public serialize(component: SerializableComponent): SerializedData {
        const componentType = component.constructor.name;
        
        // 检查是否支持protobuf序列化
        if (!isProtoSerializable(component)) {
            throw new Error(`组件 ${componentType} 不支持protobuf序列化，请添加@ProtoSerializable装饰器`);
        }
        
        const protoName = getProtoName(component);
        if (!protoName) {
            throw new Error(`组件 ${componentType} 未设置protobuf名称`);
        }
        
        // 获取protobuf消息类型
        const MessageType = this.getMessageType(protoName);
        if (!MessageType) {
            throw new Error(`未找到消息类型: ${protoName}`);
        }
        
        // 数据验证（可选）
        if (this.enableValidation && MessageType.verify) {
            const error = MessageType.verify(component);
            if (error) {
                throw new Error(`数据验证失败: ${error}`);
            }
        }
        
        // 直接让protobufjs处理序列化
        const message = MessageType.create(component);
        const buffer = MessageType.encode(message).finish();
        
        return {
            type: 'protobuf',
            componentType: componentType,
            data: buffer,
            size: buffer.length
        };
    }
    
    /**
     * 反序列化组件
     * @param component 目标组件实例
     * @param serializedData 序列化数据
     */
    public deserialize(component: SerializableComponent, serializedData: SerializedData): void {
        if (serializedData.type !== 'protobuf') {
            throw new Error(`不支持的序列化类型: ${serializedData.type}`);
        }
        
        const protoName = getProtoName(component);
        if (!protoName) {
            throw new Error(`组件 ${component.constructor.name} 未设置protobuf名称`);
        }
        
        const MessageType = this.getMessageType(protoName);
        if (!MessageType) {
            throw new Error(`未找到消息类型: ${protoName}`);
        }
        
        // 解码消息并直接应用到组件
        const message = MessageType.decode(serializedData.data);
        const decoded = MessageType.toObject(message);
        
        // 直接应用解码后的数据到组件
        Object.assign(component, decoded);
    }
    
    /**
     * 检查组件是否支持protobuf序列化
     */
    public canSerialize(component: SerializableComponent): boolean {
        if (!this.root) return false;
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
        components: SerializableComponent[], 
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
                    continue;
                } else {
                    throw error;
                }
            }
            
            for (const component of groupComponents) {
                try {
                    const result = this.serializeSingleComponent(component, MessageType);
                    results.push(result);
                } catch (error) {
                    if (continueOnError) {
                        errors.push(error instanceof Error ? error : new Error(String(error)));
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
        component: SerializableComponent, 
        MessageType: protobuf.Type
    ): SerializedData {
        // 数据验证
        if (this.enableValidation && MessageType.verify) {
            const error = MessageType.verify(component);
            if (error) {
                throw new Error(`[ProtobufSerializer] 数据验证失败: ${error}`);
            }
        }
        
        const message = MessageType.create(component);
        const buffer = MessageType.encode(message).finish();
        
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
        components: SerializableComponent[], 
        continueOnError: boolean, 
        errors: Error[]
    ): Map<string, SerializableComponent[]> {
        const componentGroups = new Map<string, SerializableComponent[]>();
        
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
     * 根据需要清理缓存
     */
    private cleanupCacheIfNeeded(): void {
        if (this.messageTypeCache.size <= this.maxCacheSize) {
            return;
        }
        
        const entries = Array.from(this.cacheAccessCount.entries())
            .sort((a, b) => a[1] - b[1]) 
            .slice(0, Math.floor(this.maxCacheSize * 0.2)); 
        
        for (const [key] of entries) {
            this.messageTypeCache.delete(key);
            this.cacheAccessCount.delete(key);
            this.componentDataCache.delete(key);
        }
        
        console.log(`[ProtobufSerializer] 清理了 ${entries.length} 个缓存项`);
    }
    
    /**
     * 将数组分割成批次
     */
    private splitIntoBatches<T extends SerializableComponent>(items: T[], batchSize: number): T[][] {
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
            protobufAvailable: !!this.root,
            messageTypeCacheSize: this.messageTypeCache.size,
            componentDataCacheSize: this.componentDataCache.size,
            enableComponentDataCache: this.enableComponentDataCache,
            maxCacheSize: this.maxCacheSize
        };
    }
    
    
    
    
    
    
    
    /**
     * 构建protobuf定义
     */
    private buildProtoDefinitions(): void {
        try {
            const protoDefinition = this.registry.generateProtoDefinition();
            this.root = protobuf.parse(protoDefinition).root;
            // 清空缓存，schema已更新
            this.messageTypeCache.clear();
            this.cacheAccessCount.clear();
        } catch (error) {
            console.error('[ProtobufSerializer] 构建protobuf定义失败:', error);
        }
    }
    
    /**
     * 获取消息类型并缓存结果
     */
    private getMessageType(typeName: string): protobuf.Type | null {
        if (!this.root) return null;
        
        // 检查缓存
        const fullTypeName = `ecs.${typeName}`;
        if (this.messageTypeCache.has(fullTypeName)) {
            this.cacheAccessCount.set(fullTypeName, (this.cacheAccessCount.get(fullTypeName) || 0) + 1);
            return this.messageTypeCache.get(fullTypeName)!;
        }
        
        try {
            const messageType = this.root.lookupType(fullTypeName);
            if (messageType) {
                // 缓存MessageType
                this.messageTypeCache.set(fullTypeName, messageType);
                this.cacheAccessCount.set(fullTypeName, 1);
                
                this.cleanupCacheIfNeeded();
                return messageType;
            }
            return null;
        } catch (error) {
            console.warn(`[ProtobufSerializer] 未找到消息类型: ${fullTypeName}`);
            return null;
        }
    }
    
    
    
    
    
    
    
}