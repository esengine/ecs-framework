/**
 * 简化的Schema定义
 * 
 * 基于组件名称和字段名称，自动生成稳定的hash ID
 * 用户无需关心ID管理，系统自动处理
 */

export interface ComponentSchema {
    /** 组件名称 */
    name: string;
    
    /** 字段定义 */
    fields: Record<string, FieldSchema>;
}

export interface FieldSchema {
    /** 字段名称 */
    name: string;
    
    /** 数据类型 */
    dataType: FieldDataType;
    
    /** 默认值 */
    defaultValue?: any;
    
    /** 是否可空 */
    nullable?: boolean;
    
    /** 序列化选项 */
    serializationOptions?: FieldSerializationOptions;
}

export interface FieldSerializationOptions {
    /** 是否跳过默认值 */
    skipDefaults?: boolean;
    
    /** 自定义序列化器名称 */
    serializer?: string;
    
    /** 二进制格式选项 */
    binaryOptions?: {
        precision?: 'float32' | 'float64';
        compression?: boolean;
        encoding?: 'varint' | 'zigzag' | 'raw';
    };
}

/**
 * 支持的字段数据类型
 */
export type FieldDataType = 
    | 'string'
    | 'number' 
    | 'boolean'
    | 'float32'
    | 'float64'
    | 'int32'
    | 'uint32'
    | 'int16'
    | 'uint16'
    | 'int8'
    | 'uint8'
    | 'string[]'
    | 'number[]'
    | 'boolean[]'
    | 'float32[]'
    | 'int32[]'
    | 'vector3'
    | 'vector2'
    | 'quaternion'
    | 'matrix4'
    | 'custom';

/**
 * 组件注册表 - 简单的名称到Schema的映射
 */
export interface ComponentRegistry {
    /** 已注册的组件Schema */
    components: Record<string, ComponentSchema>;
}