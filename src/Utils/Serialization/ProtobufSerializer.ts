/**
 * Protobuf序列化器
 * 
 * 处理组件的protobuf序列化和反序列化
 */

import { Component } from '../../ECS/Component';
import { 
    ProtobufRegistry, 
    ProtoComponentDefinition, 
    ProtoFieldDefinition,
    ProtoFieldType,
    isProtoSerializable,
    getProtoName 
} from './ProtobufDecorators';

/**
 * 序列化数据接口
 */
export interface SerializedData {
    /** 组件类型名称 */
    componentType: string;
    /** 序列化后的数据 */
    data: Uint8Array;
    /** 数据大小（字节） */
    size: number;
}

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
    
    /** 是否启用数据验证 */
    private enableValidation: boolean = process.env.NODE_ENV === 'development';
    
    private constructor() {
        this.registry = ProtobufRegistry.getInstance();
        this.initializeProtobuf();
    }
    
    /**
     * 设置性能选项
     */
    public setPerformanceOptions(options: {
        enableValidation?: boolean;
        clearCache?: boolean;
    }): void {
        if (options.enableValidation !== undefined) {
            this.enableValidation = options.enableValidation;
        }
        if (options.clearCache) {
            this.messageTypeCache.clear();
        }
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
     * 
     * @param protobufJs protobuf.js库实例
     */
    public initialize(protobufJs: any): void {
        this.protobuf = protobufJs;
        this.buildProtoDefinitions();
        console.log('[ProtobufSerializer] Protobuf支持已手动启用');
    }
    
    /**
     * 序列化组件
     * 
     * @param component 要序列化的组件
     * @returns 序列化数据
     * @throws Error 如果组件不支持protobuf序列化
     */
    public serialize(component: Component): SerializedData {
        const componentType = component.constructor.name;
        
        // 检查是否支持protobuf序列化
        if (!isProtoSerializable(component)) {
            throw new Error(`[ProtobufSerializer] 组件 ${componentType} 不支持protobuf序列化，请添加@ProtoSerializable装饰器`);
        }
        
        const protoName = getProtoName(component);
        if (!protoName) {
            throw new Error(`[ProtobufSerializer] 组件 ${componentType} 未设置protobuf名称`);
        }
        
        const definition = this.registry.getComponentDefinition(protoName);
        if (!definition) {
            throw new Error(`[ProtobufSerializer] 未找到组件定义: ${protoName}`);
        }
        
        // 获取protobuf消息类型
        const MessageType = this.getMessageType(protoName);
        if (!MessageType) {
            throw new Error(`[ProtobufSerializer] 未找到消息类型: ${protoName}`);
        }
        
        try {
            // 构建protobuf数据对象
            const protoData = this.buildProtoData(component, definition);
            
            // 数据验证（仅在开发环境）
            if (this.enableValidation) {
                const error = MessageType.verify(protoData);
                if (error) {
                    throw new Error(`[ProtobufSerializer] 数据验证失败: ${error}`);
                }
            }
            
            // 创建消息并编码
            const message = MessageType.create(protoData);
            const buffer = MessageType.encode(message).finish();
            
            return {
                componentType: componentType,
                data: buffer,
                size: buffer.length
            };
            
        } catch (error) {
            throw new Error(`[ProtobufSerializer] 序列化失败: ${componentType} - ${error}`);
        }
    }
    
    /**
     * 反序列化组件
     * 
     * @param component 目标组件实例
     * @param serializedData 序列化数据
     * @throws Error 如果反序列化失败
     */
    public deserialize(component: Component, serializedData: SerializedData): void {
        const protoName = getProtoName(component);
        if (!protoName) {
            throw new Error(`[ProtobufSerializer] 组件 ${component.constructor.name} 未设置protobuf名称`);
        }
        
        const MessageType = this.getMessageType(protoName);
        if (!MessageType) {
            throw new Error(`[ProtobufSerializer] 未找到消息类型: ${protoName}`);
        }
        
        try {
            // 解码消息
            const message = MessageType.decode(serializedData.data);
            const data = MessageType.toObject(message);
            
            // 应用数据到组件
            this.applyDataToComponent(component, data);
            
        } catch (error) {
            throw new Error(`[ProtobufSerializer] 反序列化失败: ${component.constructor.name} - ${error}`);
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
     * 
     * @param components 要序列化的组件数组
     * @returns 序列化结果数组
     */
    public serializeBatch(components: Component[]): SerializedData[] {
        const results: SerializedData[] = [];
        
        // 按组件类型分组，减少重复查找
        const componentGroups = new Map<string, Component[]>();
        
        for (const component of components) {
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
        }
        
        // 按组分别序列化
        for (const [protoName, groupComponents] of componentGroups) {
            const definition = this.registry.getComponentDefinition(protoName);
            const MessageType = this.getMessageType(protoName);
            
            if (!definition || !MessageType) {
                throw new Error(`[ProtobufSerializer] 组件类型 ${protoName} 未正确注册`);
            }
            
            for (const component of groupComponents) {
                try {
                    const protoData = this.buildProtoData(component, definition);
                    
                    // 数据验证（仅在开发环境）
                    if (this.enableValidation) {
                        const error = MessageType.verify(protoData);
                        if (error) {
                            throw new Error(`[ProtobufSerializer] 数据验证失败: ${error}`);
                        }
                    }
                    
                    const message = MessageType.create(protoData);
                    const buffer = MessageType.encode(message).finish();
                    
                    results.push({
                        componentType: component.constructor.name,
                        data: buffer,
                        size: buffer.length
                    });
                } catch (error) {
                    throw new Error(`[ProtobufSerializer] 批量序列化失败: ${component.constructor.name} - ${error}`);
                }
            }
        }
        
        return results;
    }
    
    /**
     * 获取序列化统计信息
     */
    public getStats(): {
        registeredComponents: number;
        protobufAvailable: boolean;
        cacheSize: number;
    } {
        return {
            registeredComponents: this.registry.getAllComponents().size,
            protobufAvailable: !!this.protobuf,
            cacheSize: this.messageTypeCache.size
        };
    }
    
    /**
     * 构建protobuf数据对象
     */
    private buildProtoData(component: Component, definition: ProtoComponentDefinition): any {
        const data: any = {};
        
        for (const [propertyName, fieldDef] of definition.fields) {
            const value = (component as any)[propertyName];
            
            if (value !== undefined && value !== null) {
                data[fieldDef.name] = this.convertValueToProtoType(value, fieldDef);
            }
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
                
            case ProtoFieldType.FLOAT:
            case ProtoFieldType.DOUBLE:
                return typeof value === 'number' ? value : (parseFloat(value) || 0);
                
            case ProtoFieldType.BOOL:
                return typeof value === 'boolean' ? value : Boolean(value);
                
            case ProtoFieldType.STRING:
                return typeof value === 'string' ? value : String(value);
                
            default:
                return value;
        }
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
}