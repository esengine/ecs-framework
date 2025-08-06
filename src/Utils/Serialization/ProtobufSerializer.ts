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
    /** 序列化类型 */
    type: 'protobuf' | 'json';
    /** 组件类型名称 */
    componentType: string;
    /** 序列化后的数据 */
    data: Uint8Array | any;
    /** 数据大小（字节） */
    size: number;
}

/**
 * Protobuf序列化器
 */
export class ProtobufSerializer {
    private registry: ProtobufRegistry;
    private static instance: ProtobufSerializer;
    
    /** protobuf.js实例 */
    private protobuf: any = null;
    private root: any = null;
    
    private constructor() {
        this.registry = ProtobufRegistry.getInstance();
        this.initializeProtobuf();
    }
    
    /**
     * 自动初始化protobuf支持
     */
    private async initializeProtobuf(): Promise<void> {
        try {
            // 动态导入protobufjs
            this.protobuf = await import('protobufjs');
            this.buildProtoDefinitions();
            console.log('[ProtobufSerializer] Protobuf支持已自动启用');
        } catch (error) {
            console.warn('[ProtobufSerializer] 无法加载protobufjs，将使用JSON序列化:', error);
        }
    }
    
    public static getInstance(): ProtobufSerializer {
        if (!ProtobufSerializer.instance) {
            ProtobufSerializer.instance = new ProtobufSerializer();
        }
        return ProtobufSerializer.instance;
    }
    
    /**
     * 手动初始化protobuf.js（可选，通常会自动初始化）
     * 
     * @param protobufJs - protobuf.js库实例
     */
    public initialize(protobufJs: any): void {
        this.protobuf = protobufJs;
        this.buildProtoDefinitions();
        console.log('[ProtobufSerializer] Protobuf支持已手动启用');
    }
    
    /**
     * 序列化组件
     * 
     * @param component - 要序列化的组件
     * @returns 序列化数据
     */
    public serialize(component: Component): SerializedData {
        const componentType = component.constructor.name;
        
        // 检查是否支持protobuf序列化
        if (!isProtoSerializable(component)) {
            return this.fallbackToJSON(component);
        }
        
        try {
            const protoName = getProtoName(component);
            if (!protoName) {
                return this.fallbackToJSON(component);
            }
            
            const definition = this.registry.getComponentDefinition(protoName);
            if (!definition) {
                console.warn(`[ProtobufSerializer] 未找到组件定义: ${protoName}`);
                return this.fallbackToJSON(component);
            }
            
            // 构建protobuf数据对象
            const protoData = this.buildProtoData(component, definition);
            
            // 获取protobuf消息类型
            const MessageType = this.getMessageType(protoName);
            if (!MessageType) {
                console.warn(`[ProtobufSerializer] 未找到消息类型: ${protoName}`);
                return this.fallbackToJSON(component);
            }
            
            // 验证数据
            const error = MessageType.verify(protoData);
            if (error) {
                console.warn(`[ProtobufSerializer] 数据验证失败: ${error}`);
                return this.fallbackToJSON(component);
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
            console.warn(`[ProtobufSerializer] 序列化失败，回退到JSON: ${componentType}`, error);
            return this.fallbackToJSON(component);
        }
    }
    
    /**
     * 反序列化组件
     * 
     * @param component - 目标组件实例
     * @param serializedData - 序列化数据
     */
    public deserialize(component: Component, serializedData: SerializedData): void {
        if (serializedData.type === 'json') {
            this.deserializeFromJSON(component, serializedData.data);
            return;
        }
        
        try {
            const protoName = getProtoName(component);
            if (!protoName) {
                this.deserializeFromJSON(component, serializedData.data);
                return;
            }
            
            const MessageType = this.getMessageType(protoName);
            if (!MessageType) {
                console.warn(`[ProtobufSerializer] 反序列化时未找到消息类型: ${protoName}`);
                return;
            }
            
            // 解码消息
            const message = MessageType.decode(serializedData.data as Uint8Array);
            const data = MessageType.toObject(message);
            
            // 应用数据到组件
            this.applyDataToComponent(component, data);
            
        } catch (error) {
            console.warn(`[ProtobufSerializer] 反序列化失败: ${component.constructor.name}`, error);
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
     * 获取序列化统计信息
     */
    public getStats(): {
        registeredComponents: number;
        protobufAvailable: boolean;
    } {
        return {
            registeredComponents: this.registry.getAllComponents().size,
            protobufAvailable: !!this.protobuf
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
     * 转换单个值
     */
    private convertSingleValue(value: any, type: ProtoFieldType): any {
        switch (type) {
            case ProtoFieldType.INT32:
            case ProtoFieldType.UINT32:
            case ProtoFieldType.SINT32:
            case ProtoFieldType.FIXED32:
            case ProtoFieldType.SFIXED32:
                return parseInt(value) || 0;
                
            case ProtoFieldType.FLOAT:
            case ProtoFieldType.DOUBLE:
                return parseFloat(value) || 0;
                
            case ProtoFieldType.BOOL:
                return Boolean(value);
                
            case ProtoFieldType.STRING:
                return String(value);
                
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
     * 回退到JSON序列化
     */
    private fallbackToJSON(component: Component): SerializedData {
        const data = this.defaultJSONSerialize(component);
        const jsonString = JSON.stringify(data);
        
        return {
            type: 'json',
            componentType: component.constructor.name,
            data: data,
            size: new Blob([jsonString]).size
        };
    }
    
    /**
     * 默认JSON序列化
     */
    private defaultJSONSerialize(component: Component): any {
        const data: any = {};
        
        for (const key in component) {
            if (component.hasOwnProperty(key) && 
                typeof (component as any)[key] !== 'function' && 
                key !== 'id' && 
                key !== 'entity' &&
                key !== '_enabled' &&
                key !== '_updateOrder') {
                
                const value = (component as any)[key];
                if (this.isSerializableValue(value)) {
                    data[key] = value;
                }
            }
        }
        
        return data;
    }
    
    /**
     * JSON反序列化
     */
    private deserializeFromJSON(component: Component, data: any): void {
        for (const key in data) {
            if (component.hasOwnProperty(key) && 
                typeof (component as any)[key] !== 'function' && 
                key !== 'id' && 
                key !== 'entity' &&
                key !== '_enabled' &&
                key !== '_updateOrder') {
                
                (component as any)[key] = data[key];
            }
        }
    }
    
    /**
     * 检查值是否可序列化
     */
    private isSerializableValue(value: any): boolean {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
        if (Array.isArray(value)) return value.every(v => this.isSerializableValue(v));
        if (typeof value === 'object') {
            try {
                JSON.stringify(value);
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }
    
    /**
     * 构建protobuf定义
     */
    private buildProtoDefinitions(): void {
        if (!this.protobuf) return;
        
        try {
            const protoDefinition = this.registry.generateProtoDefinition();
            this.root = this.protobuf.parse(protoDefinition).root;
        } catch (error) {
            console.error('[ProtobufSerializer] 构建protobuf定义失败:', error);
        }
    }
    
    /**
     * 获取消息类型
     */
    private getMessageType(typeName: string): any {
        if (!this.root) return null;
        
        try {
            return this.root.lookupType(`ecs.${typeName}`);
        } catch (error) {
            console.warn(`[ProtobufSerializer] 未找到消息类型: ecs.${typeName}`);
            return null;
        }
    }
}