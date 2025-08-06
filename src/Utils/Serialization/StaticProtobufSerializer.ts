/**
 * 静态Protobuf序列化器
 * 
 * 使用预生成的protobuf静态模块进行序列化
 */

import { Component } from '../../ECS/Component';
import { 
    ProtobufRegistry, 
    ProtoComponentDefinition,
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
 * 静态Protobuf序列化器
 * 
 * 使用CLI预生成的protobuf静态模块
 */
export class StaticProtobufSerializer {
    private registry: ProtobufRegistry;
    private static instance: StaticProtobufSerializer;
    
    /** 预生成的protobuf根对象 */
    private protobufRoot: any = null;
    private isInitialized: boolean = false;
    
    private constructor() {
        this.registry = ProtobufRegistry.getInstance();
        this.initializeStaticProtobuf();
    }
    
    public static getInstance(): StaticProtobufSerializer {
        if (!StaticProtobufSerializer.instance) {
            StaticProtobufSerializer.instance = new StaticProtobufSerializer();
        }
        return StaticProtobufSerializer.instance;
    }
    
    /**
     * 初始化静态protobuf模块
     */
    private async initializeStaticProtobuf(): Promise<void> {
        try {
            // 尝试加载预生成的protobuf模块
            const ecsProto = await this.loadGeneratedProtobuf();
            if (ecsProto && ecsProto.ecs) {
                this.protobufRoot = ecsProto.ecs;
                this.isInitialized = true;
                console.log('[StaticProtobufSerializer] 预生成的Protobuf模块已加载');
            } else {
                console.warn('[StaticProtobufSerializer] 未找到预生成的protobuf模块，将使用JSON序列化');
                console.log('💡 请运行: npm run proto:build');
            }
        } catch (error) {
            console.warn('[StaticProtobufSerializer] 初始化失败，将使用JSON序列化:', error.message);
        }
    }
    
    /**
     * 加载预生成的protobuf模块
     */
    private async loadGeneratedProtobuf(): Promise<any> {
        const possiblePaths = [
            // 项目中的生成路径
            './generated/ecs-components',
            '../generated/ecs-components',
            '../../generated/ecs-components',
            // 相对于当前文件的路径
            '../../../generated/ecs-components'
        ];
        
        for (const path of possiblePaths) {
            try {
                const module = await import(path);
                return module;
            } catch (error) {
                // 继续尝试下一个路径
                continue;
            }
        }
        
        // 如果所有路径都失败，尝试require方式
        for (const path of possiblePaths) {
            try {
                const module = require(path);
                return module;
            } catch (error) {
                continue;
            }
        }
        
        return null;
    }
    
    /**
     * 序列化组件
     */
    public serialize(component: Component): SerializedData {
        const componentType = component.constructor.name;
        
        // 检查是否支持protobuf序列化
        if (!isProtoSerializable(component) || !this.isInitialized) {
            return this.fallbackToJSON(component);
        }
        
        try {
            const protoName = getProtoName(component);
            if (!protoName) {
                return this.fallbackToJSON(component);
            }
            
            const definition = this.registry.getComponentDefinition(protoName);
            if (!definition) {
                console.warn(`[StaticProtobufSerializer] 未找到组件定义: ${protoName}`);
                return this.fallbackToJSON(component);
            }
            
            // 获取对应的protobuf消息类型
            const MessageType = this.protobufRoot[protoName];
            if (!MessageType) {
                console.warn(`[StaticProtobufSerializer] 未找到protobuf消息类型: ${protoName}`);
                return this.fallbackToJSON(component);
            }
            
            // 构建protobuf数据对象
            const protoData = this.buildProtoData(component, definition);
            
            // 验证数据
            const error = MessageType.verify(protoData);
            if (error) {
                console.warn(`[StaticProtobufSerializer] 数据验证失败: ${error}`);
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
            console.warn(`[StaticProtobufSerializer] 序列化失败，回退到JSON: ${componentType}`, error);
            return this.fallbackToJSON(component);
        }
    }
    
    /**
     * 反序列化组件
     */
    public deserialize(component: Component, serializedData: SerializedData): void {
        if (serializedData.type === 'json') {
            this.deserializeFromJSON(component, serializedData.data);
            return;
        }
        
        if (!this.isInitialized) {
            console.warn('[StaticProtobufSerializer] Protobuf未初始化，无法反序列化');
            return;
        }
        
        try {
            const protoName = getProtoName(component);
            if (!protoName) {
                this.deserializeFromJSON(component, serializedData.data);
                return;
            }
            
            const MessageType = this.protobufRoot[protoName];
            if (!MessageType) {
                console.warn(`[StaticProtobufSerializer] 反序列化时未找到消息类型: ${protoName}`);
                return;
            }
            
            // 解码消息
            const message = MessageType.decode(serializedData.data as Uint8Array);
            const data = MessageType.toObject(message);
            
            // 应用数据到组件
            this.applyDataToComponent(component, data);
            
        } catch (error) {
            console.warn(`[StaticProtobufSerializer] 反序列化失败: ${component.constructor.name}`, error);
        }
    }
    
    /**
     * 检查组件是否支持protobuf序列化
     */
    public canSerialize(component: Component): boolean {
        return this.isInitialized && isProtoSerializable(component);
    }
    
    /**
     * 获取序列化统计信息
     */
    public getStats(): {
        registeredComponents: number;
        protobufAvailable: boolean;
        initialized: boolean;
    } {
        return {
            registeredComponents: this.registry.getAllComponents().size,
            protobufAvailable: !!this.protobufRoot,
            initialized: this.isInitialized
        };
    }
    
    /**
     * 手动设置protobuf根对象（用于测试）
     */
    public setProtobufRoot(root: any): void {
        this.protobufRoot = root;
        this.isInitialized = !!root;
    }
    
    /**
     * 构建protobuf数据对象
     */
    private buildProtoData(component: Component, definition: ProtoComponentDefinition): any {
        const data: any = {};
        
        for (const [propertyName, fieldDef] of definition.fields) {
            const value = (component as any)[propertyName];
            
            if (value !== undefined && value !== null) {
                data[fieldDef.name] = this.convertValueToProtoType(value, fieldDef.type);
            }
        }
        
        return data;
    }
    
    /**
     * 转换值到protobuf类型
     */
    private convertValueToProtoType(value: any, type: string): any {
        switch (type) {
            case 'int32':
            case 'uint32':
            case 'sint32':
            case 'fixed32':
            case 'sfixed32':
                return parseInt(value) || 0;
                
            case 'float':
            case 'double':
                return parseFloat(value) || 0;
                
            case 'bool':
                return Boolean(value);
                
            case 'string':
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
}