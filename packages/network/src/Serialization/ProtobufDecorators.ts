/**
 * Protobuf序列化装饰器
 * 
 * 提供装饰器语法来标记组件和字段进行protobuf序列化
 */

import 'reflect-metadata';
import { Component } from '@esengine/ecs-framework';
import * as protobuf from 'protobufjs';

/**
 * 使用protobufjs官方字段类型定义
 */
export type ProtoFieldType = keyof typeof protobuf.types.basic | keyof typeof protobuf.types.defaults | 'message' | 'enum';

/**
 * protobufjs官方字段类型常量
 */
export const ProtoTypes = {
    // 基本数值类型
    DOUBLE: 'double' as ProtoFieldType,
    FLOAT: 'float' as ProtoFieldType,
    INT32: 'int32' as ProtoFieldType,
    INT64: 'int64' as ProtoFieldType,
    UINT32: 'uint32' as ProtoFieldType,
    UINT64: 'uint64' as ProtoFieldType,
    SINT32: 'sint32' as ProtoFieldType,
    SINT64: 'sint64' as ProtoFieldType,
    FIXED32: 'fixed32' as ProtoFieldType,
    FIXED64: 'fixed64' as ProtoFieldType,
    SFIXED32: 'sfixed32' as ProtoFieldType,
    SFIXED64: 'sfixed64' as ProtoFieldType,
    BOOL: 'bool' as ProtoFieldType,
    STRING: 'string' as ProtoFieldType,
    BYTES: 'bytes' as ProtoFieldType,
    // 复合类型
    MESSAGE: 'message' as ProtoFieldType,
    ENUM: 'enum' as ProtoFieldType
} as const;

/**
 * protobufjs官方类型映射
 */
export const ProtobufTypes = protobuf.types;

/**
 * 字段同步优先级
 */
export enum FieldSyncPriority {
    /** 关键字段 - 每帧必须同步 */
    CRITICAL = 'critical',
    /** 高优先级 - 高频同步 */
    HIGH = 'high',
    /** 中等优先级 - 中频同步 */
    MEDIUM = 'medium',
    /** 低优先级 - 低频同步 */
    LOW = 'low'
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
    
    // 帧同步特定选项
    /** 同步优先级 */
    syncPriority?: FieldSyncPriority;
    /** 数值精度（用于量化压缩） */
    precision?: number;
    /** 是否支持插值 */
    interpolation?: boolean;
    /** 量化位数 */
    quantizationBits?: number;
    /** 变化阈值（小于此值不同步） */
    changeThreshold?: number;
}

/**
 * 组件同步模式
 */
export enum ComponentSyncMode {
    /** 完整同步 - 传输所有字段 */
    FULL = 'full',
    /** 增量同步 - 只传输变化字段 */
    DELTA = 'delta',
    /** 自适应 - 根据变化量自动选择 */
    ADAPTIVE = 'adaptive'
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
    
    // 帧同步特定选项
    /** 同步模式 */
    syncMode?: ComponentSyncMode;
    /** 同步频率（每秒同步次数） */
    syncFrequency?: number;
    /** 是否启用压缩 */
    enableCompression?: boolean;
    /** 网络优先级 */
    networkPriority?: number;
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
 * 组件同步选项接口
 */
export interface ComponentSyncOptions {
    /** 同步模式 */
    syncMode?: ComponentSyncMode;
    /** 同步频率（每秒同步次数） */
    syncFrequency?: number;
    /** 是否启用压缩 */
    enableCompression?: boolean;
    /** 网络优先级（1-10，数字越大优先级越高） */
    networkPriority?: number;
}

/**
 * ProtoSerializable 组件装饰器
 * 
 * 标记组件支持protobuf序列化，专为帧同步框架优化
 * @param protoName protobuf消息名称，默认使用类名
 * @param options 同步选项
 * @example
 * ```typescript
 * @ProtoSerializable('Position', {
 *     syncMode: ComponentSyncMode.DELTA,
 *     syncFrequency: 30,
 *     networkPriority: 8
 * })
 * class PositionComponent extends Component {
 *     // 组件实现
 * }
 * ```
 */
export function ProtoSerializable(protoName?: string, options?: ComponentSyncOptions) {
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
            constructor: constructor,
            syncMode: options?.syncMode || ComponentSyncMode.FULL,
            syncFrequency: options?.syncFrequency || 30,
            enableCompression: options?.enableCompression || true,
            networkPriority: options?.networkPriority || 5
        });
        
        // 标记组件支持protobuf
        (constructor.prototype._isProtoSerializable = true);
        (constructor.prototype._protoName = componentName);
        
        return constructor;
    };
}

/**
 * 字段同步选项接口
 */
export interface FieldSyncOptions {
    /** 是否为数组 */
    repeated?: boolean;
    /** 是否可选 */
    optional?: boolean;
    /** 自定义类型名称 */
    customTypeName?: string;
    /** 枚举值映射 */
    enumValues?: Record<string, number>;
    /** 默认值 */
    defaultValue?: any;
    
    // 帧同步特定选项
    /** 同步优先级 */
    syncPriority?: FieldSyncPriority;
    /** 数值精度（用于量化压缩） */
    precision?: number;
    /** 是否支持插值 */
    interpolation?: boolean;
    /** 量化位数 */
    quantizationBits?: number;
    /** 变化阈值（小于此值不同步） */
    changeThreshold?: number;
}

/**
 * ProtoField 字段装饰器
 * 
 * 标记字段参与protobuf序列化，针对帧同步进行优化
 * @param fieldNumber protobuf字段编号，必须唯一且大于0
 * @param type 字段类型，默认自动推断
 * @param options 字段选项
 * @example
 * ```typescript
 * class PositionComponent extends Component {
 *     @ProtoField(1, ProtoFieldType.FLOAT, {
 *         syncPriority: FieldSyncPriority.CRITICAL,
 *         precision: 0.01,
 *         interpolation: true
 *     })
 *     public x: number = 0;
 *     
 *     @ProtoField(2, ProtoFieldType.FLOAT, {
 *         syncPriority: FieldSyncPriority.CRITICAL,
 *         precision: 0.01,
 *         interpolation: true
 *     })
 *     public y: number = 0;
 * }
 * ```
 */
export function ProtoField(
    fieldNumber: number,
    type?: ProtoFieldType,
    options?: FieldSyncOptions
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
            type: inferredType || ProtoTypes.STRING,
            repeated: options?.repeated || false,
            optional: options?.optional || false,
            name: propertyKey,
            customTypeName: options?.customTypeName,
            enumValues: options?.enumValues,
            defaultValue: options?.defaultValue,
            // 帧同步特定选项
            syncPriority: options?.syncPriority || FieldSyncPriority.MEDIUM,
            precision: options?.precision,
            interpolation: options?.interpolation || false,
            quantizationBits: options?.quantizationBits,
            changeThreshold: options?.changeThreshold || 0
        });
    };
}

/**
 * 自动推断protobuf类型
 */
function inferProtoType(jsType: any): ProtoFieldType {
    if (!jsType) return ProtoTypes.STRING;
    
    switch (jsType) {
        case Number:
            return ProtoTypes.DOUBLE;
        case Boolean:
            return ProtoTypes.BOOL;
        case String:
            return ProtoTypes.STRING;
        case Date:
            // 对于Date类型，使用int64存储时间戳或者使用message类型
            return ProtoTypes.INT64;
        case Array:
            return ProtoTypes.STRING;
        case Uint8Array:
        case ArrayBuffer:
            return ProtoTypes.BYTES;
        case Object:
            return ProtoTypes.MESSAGE;
        default:
            return ProtoTypes.STRING;
    }
}

/**
 * 便捷装饰器 - 常用类型
 */
export const ProtoInt32 = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.INT32, options);

export const ProtoFloat = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.FLOAT, options);

export const ProtoString = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.STRING, options);

export const ProtoBool = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.BOOL, options);

// 扩展的便捷装饰器
export const ProtoDouble = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.DOUBLE, options);

export const ProtoInt64 = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.INT64, options);

export const ProtoUint32 = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.UINT32, options);

export const ProtoUint64 = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.UINT64, options);

export const ProtoBytes = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.BYTES, options);

// 对于时间戳，使用int64存储毫秒时间戳
export const ProtoTimestamp = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.INT64, options);

// 对于持续时间，使用int32存储毫秒数
export const ProtoDuration = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.INT32, options);

// 对于结构体，使用message类型
export const ProtoStruct = (fieldNumber: number, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.MESSAGE, options);

/**
 * 自定义消息类型装饰器
 * @param fieldNumber 字段编号
 * @param customTypeName 自定义类型名称
 * @param options 额外选项
 */
export const ProtoMessage = (fieldNumber: number, customTypeName: string, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.MESSAGE, { ...options, customTypeName });

/**
 * 枚举类型装饰器
 * @param fieldNumber 字段编号
 * @param enumValues 枚举值映射
 * @param options 额外选项
 */
export const ProtoEnum = (fieldNumber: number, enumValues: Record<string, number>, options?: { repeated?: boolean; optional?: boolean }) =>
    ProtoField(fieldNumber, ProtoTypes.ENUM, { ...options, enumValues });

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