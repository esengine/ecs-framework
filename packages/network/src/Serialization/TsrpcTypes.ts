/**
 * TSRPC序列化类型定义
 */

import { Component } from '@esengine/ecs-framework';

/**
 * TSRPC同步字段配置选项
 */
export interface SyncFieldOptions {
    /**
     * 同步优先级
     * - 'critical': 关键字段，每帧必须同步
     * - 'high': 高优先级，频繁同步
     * - 'normal': 普通优先级，正常同步频率
     * - 'low': 低优先级，较少同步
     */
    priority?: 'critical' | 'high' | 'normal' | 'low';
    
    /**
     * 值变化时的回调函数名
     * 回调函数签名: (oldValue: T, newValue: T) => void
     */
    hook?: string;
    
    /**
     * 是否只有拥有权限的客户端才能修改
     */
    authorityOnly?: boolean;
    
    /**
     * 同步频率限制（毫秒）
     * 防止过于频繁的网络同步，默认为0（不限制）
     */
    throttle?: number;
    
    /**
     * 是否启用增量同步
     * 对于对象和数组类型，启用后只同步变化的部分
     */
    delta?: boolean;
    
    /**
     * 自定义比较函数
     * 用于判断值是否发生变化，默认使用深度比较
     */
    compare?: (oldValue: any, newValue: any) => boolean;
}

/**
 * TSRPC序列化组件配置选项
 */
export interface TsrpcSerializableOptions {
    /**
     * 组件版本号，用于兼容性检查
     */
    version?: number;
    
    /**
     * 是否启用类型验证
     * 在开发模式下默认启用，生产模式下默认关闭
     */
    validation?: boolean;
    
    /**
     * 是否启用压缩
     */
    compression?: boolean;
    
    /**
     * 自定义序列化名称，默认使用类名
     */
    name?: string;
    
    /**
     * 序列化策略
     * - 'full': 完整序列化所有字段
     * - 'partial': 只序列化标记为@SyncField的字段
     * - 'auto': 自动检测，推荐使用
     */
    strategy?: 'full' | 'partial' | 'auto';
}

/**
 * TSRPC字段元数据
 */
export interface TsrpcFieldMetadata {
    /** 属性名称 */
    propertyKey: string;
    
    /** 字段选项 */
    options: SyncFieldOptions;
    
    /** TypeScript类型信息 */
    typeInfo: {
        /** 基本类型名 */
        typeName: string;
        /** 是否为数组 */
        isArray: boolean;
        /** 是否可选 */
        isOptional: boolean;
        /** 是否为联合类型 */
        isUnion: boolean;
        /** 联合类型成员（如果是联合类型） */
        unionTypes?: string[];
        /** 泛型参数（如果有） */
        genericTypes?: string[];
    };
    
    /** 运行时类型检查函数 */
    typeChecker?: (value: any) => boolean;
    
    /** 字段索引（用于二进制序列化） */
    fieldIndex: number;
}

/**
 * TSRPC组件元数据
 */
export interface TsrpcComponentMetadata {
    /** 组件类型名称 */
    componentType: string;
    
    /** 组件配置选项 */
    options: TsrpcSerializableOptions;
    
    /** 字段元数据映射 */
    fields: Map<string, TsrpcFieldMetadata>;
    
    /** 组件构造函数 */
    constructor: new (...args: any[]) => Component;
    
    /** TSBuffer schema */
    schema?: any;
    
    /** 序列化版本 */
    version: number;
    
    /** 创建时间戳 */
    createdAt: number;
}

/**
 * TSRPC可序列化组件接口
 */
export interface TsrpcSerializable {
    /** 获取TSRPC序列化数据 */
    getTsrpcData(): Record<string, any>;
    
    /** 应用TSRPC序列化数据 */
    applyTsrpcData(data: Record<string, any>): void;
    
    /** 获取变化的字段 */
    getDirtyFields(): string[];
    
    /** 标记字段为clean状态 */
    markClean(fieldNames?: string[]): void;
}

/**
 * 支持的TypeScript基本类型
 */
export const TsrpcSupportedTypes = {
    // 基本类型
    BOOLEAN: 'boolean',
    NUMBER: 'number', 
    BIGINT: 'bigint',
    STRING: 'string',
    
    // 对象类型
    OBJECT: 'object',
    ARRAY: 'array',
    DATE: 'Date',
    REGEXP: 'RegExp',
    
    // 特殊类型
    UNDEFINED: 'undefined',
    NULL: 'null',
    
    // 二进制类型
    UINT8ARRAY: 'Uint8Array',
    BUFFER: 'Buffer',
    ARRAYBUFFER: 'ArrayBuffer',
    
    // 联合类型和字面量类型
    UNION: 'union',
    LITERAL: 'literal',
    ENUM: 'enum'
} as const;

/**
 * TSRPC序列化统计信息
 */
export interface TsrpcSerializationStats {
    /** 序列化次数 */
    serializeCount: number;
    
    /** 反序列化次数 */
    deserializeCount: number;
    
    /** 总序列化时间 */
    totalSerializeTime: number;
    
    /** 总反序列化时间 */
    totalDeserializeTime: number;
    
    /** 平均序列化大小 */
    averageSerializedSize: number;
    
    /** 错误次数 */
    errorCount: number;
    
    /** 缓存命中次数 */
    cacheHits: number;
    
    /** 缓存未命中次数 */
    cacheMisses: number;
}