/**
 * Protobuf序列化装饰器
 * 
 * 提供装饰器语法来标记组件和字段进行protobuf序列化
 */

import 'reflect-metadata';
import { Component } from '../../ECS/Component';
import { BigIntFactory } from '../../ECS/Utils/BigIntCompatibility';

/**
 * Protobuf字段类型枚举
 */
export enum ProtoFieldType {
    DOUBLE = 'double',
    FLOAT = 'float',
    INT32 = 'int32',
    INT64 = 'int64',
    UINT32 = 'uint32',
    UINT64 = 'uint64',
    SINT32 = 'sint32',
    SINT64 = 'sint64',
    FIXED32 = 'fixed32',
    FIXED64 = 'fixed64',
    SFIXED32 = 'sfixed32',
    SFIXED64 = 'sfixed64',
    BOOL = 'bool',
    STRING = 'string',
    BYTES = 'bytes',
    // 扩展类型
    MESSAGE = 'message',
    ENUM = 'enum',
    ANY = 'google.protobuf.Any',
    TIMESTAMP = 'google.protobuf.Timestamp',
    DURATION = 'google.protobuf.Duration',
    STRUCT = 'google.protobuf.Struct',
    VALUE = 'google.protobuf.Value'
}

/**
 * Protobuf字段定义接口
 */
export interface ProtoFieldDefinition {
    /** 字段编号 */
    fieldNumber: number;
    /** 字段类型 */
    type: ProtoFieldType;
    /** 是否为数组 */
    repeated?: boolean;
    /** 是否可选 */
    optional?: boolean;
    /** 字段名称 */
    name: string;
    /** 自定义类型名称 */
    customTypeName?: string;
    /** 枚举值映射 */
    enumValues?: Record<string, number>;
    /** 默认值 */
    defaultValue?: any;
}

/**
 * Protobuf组件定义接口
 */
export interface ProtoComponentDefinition {
    /** 组件名称 */
    name: string;
    /** 字段定义列表 */
    fields: Map<string, ProtoFieldDefinition>;
    /** 构造函数 */
    constructor: any;
}

/**
 * Protobuf注册表
 */
export class ProtobufRegistry {
    private static instance: ProtobufRegistry;
    private components = new Map<string, ProtoComponentDefinition>();
    
    public static getInstance(): ProtobufRegistry {
        if (!ProtobufRegistry.instance) {
            ProtobufRegistry.instance = new ProtobufRegistry();
        }
        return ProtobufRegistry.instance;
    }
    
    /**
     * 注册组件定义
     */
    public registerComponent(componentName: string, definition: ProtoComponentDefinition): void {
        this.components.set(componentName, definition);
    }
    
    /**
     * 获取组件定义
     */
    public getComponentDefinition(componentName: string): ProtoComponentDefinition | undefined {
        return this.components.get(componentName);
    }
    
    /**
     * 检查组件是否支持protobuf
     */
    public hasProtoDefinition(componentName: string): boolean {
        return this.components.has(componentName);
    }
    
    /**
     * 获取所有注册的组件
     */
    public getAllComponents(): Map<string, ProtoComponentDefinition> {
        return new Map(this.components);
    }
    
    /**
     * 生成proto文件定义
     */
    public generateProtoDefinition(): string {
        let protoContent = 'syntax = "proto3";\n\n';
        protoContent += 'package ecs;\n\n';
        
        // 生成消息定义
        for (const [name, definition] of this.components) {
            protoContent += `message ${name} {\n`;
            
            // 按字段编号排序
            const sortedFields = Array.from(definition.fields.values())
                .sort((a, b) => a.fieldNumber - b.fieldNumber);
            
            for (const field of sortedFields) {
                let fieldDef = '  ';
                
                if (field.repeated) {
                    fieldDef += 'repeated ';
                } else if (field.optional) {
                    fieldDef += 'optional ';
                }
                
                fieldDef += `${field.type} ${field.name} = ${field.fieldNumber};\n`;
                protoContent += fieldDef;
            }
            
            protoContent += '}\n\n';
        }
        
        return protoContent;
    }
}

/**
 * ProtoSerializable 组件装饰器
 * 
 * 标记组件支持protobuf序列化
 * @param protoName protobuf消息名称，默认使用类名
 * @example
 * ```typescript
 * @ProtoSerializable('Position')
 * class PositionComponent extends Component {
 *     // 组件实现
 * }
 * ```
 */
export function ProtoSerializable(protoName?: string) {
    return function <T extends { new(...args: any[]): Component }>(constructor: T) {
        const componentName = protoName || constructor.name;
        const registry = ProtobufRegistry.getInstance();
        
        // 获取字段定义
        const fields = (constructor.prototype._protoFields as Map<string, ProtoFieldDefinition>) 
            || new Map<string, ProtoFieldDefinition>();
        
        // 注册组件定义
        registry.registerComponent(componentName, {
            name: componentName,
            fields: fields,
            constructor: constructor
        });
        
        // 标记组件支持protobuf
        (constructor.prototype._isProtoSerializable = true);
        (constructor.prototype._protoName = componentName);
        
        return constructor;
    };
}

/**
 * ProtoField 字段装饰器
 * 
 * 标记字段参与protobuf序列化
 * @param fieldNumber protobuf字段编号，必须唯一且大于0
 * @param type 字段类型，默认自动推断
 * @param options 额外选项
 * @param options.repeated 是否为数组
 * @param options.optional 是否可选
 * @param options.customTypeName 自定义类型名称
 * @param options.enumValues 枚举值映射
 * @param options.defaultValue 默认值
 * @example
 * ```typescript
 * class PositionComponent extends Component {
 *     @ProtoField(1, ProtoFieldType.FLOAT)
 *     public x: number = 0;
 *     
 *     @ProtoField(2, ProtoFieldType.FLOAT)
 *     public y: number = 0;
 * }
 * ```
 */
export function ProtoField(
    fieldNumber: number,
    type?: ProtoFieldType,
    options?: {
        repeated?: boolean;
        optional?: boolean;
        customTypeName?: string;
        enumValues?: Record<string, number>;
        defaultValue?: any;
    }
) {
    return function (target: any, propertyKey: string) {
        // 验证字段编号
        if (fieldNumber <= 0) {
            throw new Error(`ProtoField: 字段编号必须大于0，当前值: ${fieldNumber}`);
        }
        
        // 初始化字段集合
        if (!target._protoFields) {
            target._protoFields = new Map<string, ProtoFieldDefinition>();
        }
        
        // 自动推断类型
        let inferredType = type;
        if (!inferredType) {
            const designType = Reflect.getMetadata?.('design:type', target, propertyKey);
            inferredType = inferProtoType(designType);
        }
        
        // 检查字段编号冲突
        for (const [key, field] of target._protoFields) {
            if (field.fieldNumber === fieldNumber && key !== propertyKey) {
                throw new Error(`ProtoField: 字段编号 ${fieldNumber} 已被字段 ${key} 使用`);
            }
        }
        
        // 添加字段定义
        target._protoFields.set(propertyKey, {
            fieldNumber,
            type: inferredType || ProtoFieldType.STRING,
            repeated: options?.repeated || false,
            optional: options?.optional || false,
            name: propertyKey,
            customTypeName: options?.customTypeName,
            enumValues: options?.enumValues,
            defaultValue: options?.defaultValue
        });
    };
}

/**
 * 自动推断protobuf类型
 */
function inferProtoType(jsType: any): ProtoFieldType {
    if (!jsType) return ProtoFieldType.STRING;
    
    switch (jsType) {
        case Number:
            return ProtoFieldType.DOUBLE;
        case Boolean:
            return ProtoFieldType.BOOL;
        case String:
            return ProtoFieldType.STRING;
        case Date:
            return ProtoFieldType.TIMESTAMP;
        case Array:
            return ProtoFieldType.STRING;
        case Uint8Array:
        case ArrayBuffer:
            return ProtoFieldType.BYTES;
        case Object:
            return ProtoFieldType.STRUCT;
        default:
            return ProtoFieldType.STRING;
    }
}

/**
 * 便捷装饰器 - 常用类型
 */
export const ProtoInt32 = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.INT32, options);

export const ProtoFloat = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.FLOAT, options);

export const ProtoString = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.STRING, options);

export const ProtoBool = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.BOOL, options);

// 扩展的便捷装饰器
export const ProtoDouble = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.DOUBLE, options);

export const ProtoInt64 = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.INT64, options);

export const ProtoUint32 = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.UINT32, options);

export const ProtoUint64 = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.UINT64, options);

export const ProtoBytes = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.BYTES, options);

export const ProtoTimestamp = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.TIMESTAMP, options);

export const ProtoDuration = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.DURATION, options);

export const ProtoStruct = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.STRUCT, options);

/**
 * 自定义消息类型装饰器
 * @param fieldNumber 字段编号
 * @param customTypeName 自定义类型名称
 * @param options 额外选项
 */
export const ProtoMessage = (fieldNumber: number, customTypeName: string, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.MESSAGE, { ...options, customTypeName });

/**
 * 枚举类型装饰器
 * @param fieldNumber 字段编号
 * @param enumValues 枚举值映射
 * @param options 额外选项
 */
export const ProtoEnum = (fieldNumber: number, enumValues: Record<string, number>, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoFieldType.ENUM, { ...options, enumValues });

/**
 * 检查组件是否支持protobuf序列化
 */
export function isProtoSerializable(component: Component): boolean {
    return !!(component as any)._isProtoSerializable;
}

/**
 * 获取组件的protobuf名称
 */
export function getProtoName(component: Component): string | undefined {
    return (component as any)._protoName;
}