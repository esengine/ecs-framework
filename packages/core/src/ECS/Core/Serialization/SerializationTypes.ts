import type { FieldDataType } from './SchemaManifest';

/**
 * 字段序列化元数据
 */
export interface FieldSerializationMeta {
    /** 字段名称 */
    name: string;
    /** 字段ID */
    id: number;
    /** 数据类型 */
    dataType: FieldDataType;
    /** 默认值 */
    defaultValue?: unknown;
    /** 是否跳过默认值 */
    skipDefaults?: boolean;
    /** 是否可空 */
    nullable?: boolean;
    /** 自定义序列化器名称或函数 */
    serializer?: string | ((value: unknown) => unknown);
    /** 反序列化器函数 */
    deserializer?: (value: unknown) => unknown;
    /** 序列化选项 */
    options?: {
        precision?: 'float32' | 'float64';
        compression?: boolean;
        encoding?: 'varint' | 'fixed';
        serializer?: string | ((value: unknown) => unknown);
    };
}

/**
 * 类序列化元数据
 */
export interface ClassSerializationMeta {
    /** 类名 */
    className: string;
    /** 字段元数据列表 */
    fields: Map<string, FieldSerializationMeta>;
    /** 序列化选项 */
    options?: {
        binaryMode?: boolean;
        compression?: boolean;
        versionTolerant?: boolean;
        mode?: 'explicit' | 'implicit';
    };
}

/**
 * 组件Schema信息
 */
export interface ComponentSchemaInfo {
    /** 组件名称 */
    name: string;
    /** 字段列表 */
    fields: Array<{
        name: string;
        id: number;
        dataType: FieldDataType;
    }>;
}

/**
 * 序列化值类型
 */
export type SerializableValue = 
    | string 
    | number 
    | boolean 
    | string[] 
    | number[] 
    | boolean[]
    | { x: number; y: number; z?: number; w?: number } // Vector类型
    | Record<string, unknown> // 自定义对象
    | null 
    | undefined;

/**
 * 字段元数据获取器类型
 */
export type FieldMetaGetter = (target: object, propertyKey: string) => FieldSerializationMeta | undefined;

/**
 * 类元数据获取器类型
 */
export type ClassMetaGetter = (constructor: Function) => ClassSerializationMeta | undefined;