import 'reflect-metadata';
import type { Component } from '../Component';
import type { FieldDataType } from '../Core/Serialization/SchemaManifest';
import { SchemaRegistry } from '../Core/Serialization/SchemaRegistry';
import { getComponentTypeName } from './TypeDecorators';
import { createLogger } from '../../Utils/Logger';

/**
 * 组件级序列化选项
 */
export interface SerializableOptions {
    /** 是否启用二进制模式 */
    binaryMode?: boolean;
    
    /** 是否启用压缩 */
    compression?: boolean;
    
    /** 是否启用版本容错 */
    versionTolerant?: boolean;
    
    /** 序列化模式 */
    mode?: 'explicit' | 'all-fields';
}

/**
 * 字段级序列化选项
 */
export interface SerializableFieldOptions {
    /** 字段ID（由SchemaRegistry分配） */
    id?: number;
    
    /** 序列化格式 */
    format?: 'json' | 'binary';
    
    /** 数据类型 */
    dataType?: FieldDataType;
    
    /** 自定义序列化器 */
    serializer?: string | ((value: any) => any);
    
    /** 自定义反序列化器 */
    deserializer?: string | ((data: any) => any);
    
    /** 序列化模式 */
    mode?: 'auto' | 'self';
    
    /** 是否跳过默认值 */
    skipDefaults?: boolean;
    
    /** 默认值 */
    defaultValue?: any;
    
    /** 是否可空 */
    nullable?: boolean;
    
    /** 二进制序列化选项 */
    binaryOptions?: {
        precision?: 'float32' | 'float64';
        compression?: boolean;
        encoding?: 'varint' | 'zigzag' | 'raw';
    };
}

/**
 * 组件序列化元数据
 */
export interface ClassSerializationMeta {
    /** 类级选项 */
    options: SerializableOptions;
    
    /** 字段元数据 */
    fields: FieldMeta[];
    
    /** 预编译的快速序列化器 */
    fastSerializer?: SerializerPair;
}

/**
 * 字段元数据
 */
export interface FieldMeta {
    /** 字段名 */
    name: string;
    
    /** 字段ID */
    id: number;
    
    /** 序列化选项 */
    options: SerializableFieldOptions;
    
    /** 运行时类型推断 */
    runtimeType?: string;
}

/**
 * 序列化器对
 */
export interface SerializerPair {
    serialize: (instance: Component) => Record<string, unknown>;
    deserialize: (instance: Component, data: Record<string, unknown>) => void;
}

/**
 * 组件构造函数类型
 */
export type ComponentConstructor = new (...args: any[]) => Component;

// 使用WeakMap存储元数据，避免污染组件原型
const CLASS_META = new WeakMap<Function, ClassSerializationMeta>();

const logger = createLogger('SerializationDecorators');

/**
 * 组件序列化装饰器
 * 
 * 标记组件可序列化，支持C#风格的命名
 * 
 * @param options 序列化选项
 * @returns 类装饰器
 * 
 * @example
 * ```typescript
 * @Serializable()
 * class HealthComponent extends Component {
 *     @SerializableField({ id: 1 })
 *     public health: number = 100;
 * }
 * ```
 */
export function Serializable(options: SerializableOptions = {}) {
    return function<T extends ComponentConstructor>(constructor: T): T {
        const meta = CLASS_META.get(constructor) ?? { 
            options: {}, 
            fields: [] 
        };
        
        // 合并选项
        meta.options = { ...meta.options, ...options };
        
        // 存储元数据
        CLASS_META.set(constructor, meta);
        
        // 在类加载时注册到SchemaRegistry
        try {
            registerComponentToSchema(constructor);
        } catch (error) {
            const componentName = getComponentTypeName(constructor);
            logger.error(`注册组件Schema失败: ${componentName}`, error);
            // 简化错误处理，不再区分dev/prod模式
        }
        
        const componentName = getComponentTypeName(constructor);
        logger.debug(`组件 ${componentName} 已标记为可序列化`);
        return constructor;
    };
}

/**
 * 字段序列化装饰器
 * 
 * 标记字段需要序列化
 * 
 * @param options 字段序列化选项
 * @returns 属性装饰器
 * 
 * @example
 * ```typescript
 * @SerializableField({ id: 1, dataType: 'float32' })
 * public health: number = 100;
 * ```
 */
export function SerializableField(options: SerializableFieldOptions = {}) {
    return function(target: any, propertyKey: string): void {
        const constructor = target.constructor;
        const meta = CLASS_META.get(constructor) ?? { 
            options: {}, 
            fields: [] 
        };
        
        // 推断数据类型
        const inferredType = inferDataType(target, propertyKey);
        const dataType = options.dataType || inferredType;
        
        // 创建字段元数据
        const fieldMeta: FieldMeta = {
            name: propertyKey,
            id: options.id || 0, // 由SchemaRegistry分配
            options: {
                ...options,
                dataType
            },
            runtimeType: inferredType
        };
        
        // 检查重复字段
        const existingIndex = meta.fields.findIndex(f => f.name === propertyKey);
        if (existingIndex >= 0) {
            meta.fields[existingIndex] = fieldMeta;
            const componentName = getComponentTypeName(constructor);
            logger.warn(`字段 ${componentName}.${propertyKey} 重复定义，已覆盖`);
        } else {
            meta.fields.push(fieldMeta);
        }
        
        CLASS_META.set(constructor, meta);
        
        const componentName = getComponentTypeName(constructor);
        logger.debug(`字段 ${componentName}.${propertyKey} 已标记为可序列化`);
    };
}

/**
 * 推断字段数据类型
 */
function inferDataType(target: any, propertyKey: string): FieldDataType {
    // 尝试从TypeScript装饰器元数据推断
    if (typeof Reflect !== 'undefined' && Reflect.getMetadata) {
        const designType = Reflect.getMetadata('design:type', target, propertyKey);
        if (designType) {
            switch (designType) {
                case String: return 'string';
                case Number: return 'number';
                case Boolean: return 'boolean';
                case Array: return 'custom'; // 无法推断数组元素类型
            }
        }
    }
    
    // 尝试从默认值推断
    const defaultValue = target[propertyKey];
    if (defaultValue !== undefined) {
        const type = typeof defaultValue;
        switch (type) {
            case 'string': return 'string';
            case 'number': return 'number';
            case 'boolean': return 'boolean';
            case 'object':
                if (Array.isArray(defaultValue)) {
                    if (defaultValue.length > 0) {
                        const elementType = typeof defaultValue[0];
                        switch (elementType) {
                            case 'number': return 'number[]';
                            case 'string': return 'string[]';
                            case 'boolean': return 'boolean[]';
                        }
                    }
                    return 'custom';
                }
                return 'custom';
        }
    }
    
    // 默认为custom，需要用户显式指定
    return 'custom';
}

/**
 * 将组件注册到SchemaRegistry
 */
function registerComponentToSchema(constructor: ComponentConstructor): void {
    const meta = CLASS_META.get(constructor);
    if (!meta) {
        const componentName = getComponentTypeName(constructor);
        throw new Error(`组件 ${componentName} 元数据不存在`);
    }
    
    const componentName = getComponentTypeName(constructor);
    
    // 构建字段Schema
    const fields: Record<string, any> = {};
    for (const field of meta.fields) {
        fields[field.name] = {
            dataType: field.options.dataType || 'custom',
            defaultValue: field.options.defaultValue,
            nullable: field.options.nullable,
            serializationOptions: field.options
        };
    }
    
    // 注册到SchemaRegistry
    SchemaRegistry.registerComponent(componentName, fields);
    
    // 为字段生成并回填ID（基于hash）
    for (const field of meta.fields) {
        field.id = SchemaRegistry.getFieldId(componentName, field.name);
    }
    
    // 更新元数据
    CLASS_META.set(constructor, meta);
}

/**
 * 获取组件的序列化元数据
 */
export function getClassSerializationMeta(constructor: Function): ClassSerializationMeta | null {
    return CLASS_META.get(constructor) || null;
}

/**
 * 验证组件是否可序列化
 */
export function validateSerializableComponent(component: Component): void {
    const constructor = component.constructor;
    const meta = CLASS_META.get(constructor);
    
    const componentName = getComponentTypeName(component.constructor as ComponentConstructor);
    
    if (!meta) {
        throw new Error(
            `组件 ${componentName} 未使用 @Serializable() 装饰器。\n` +
            `请添加装饰器:\n` +
            `@Serializable()\n` +
            `class ${componentName} extends Component {\n` +
            `    @SerializableField({ id: 1 })\n` +
            `    public yourField: number;\n` +
            `}`
        );
    }
    
    if (meta.fields.length === 0) {
        logger.warn(`组件 ${componentName} 没有可序列化字段`);
    }
    
    // 验证字段ID
    for (const field of meta.fields) {
        if (!field.id || field.id === 0) {
            throw new Error(`组件 ${componentName} 字段 ${field.name} 缺少有效的字段ID`);
        }
    }
}

/**
 * 获取所有已注册的可序列化组件
 */
export function getAllSerializableComponents(): Map<Function, ClassSerializationMeta> {
    // 注意：这里不能直接返回WeakMap的内容，因为无法遍历
    // 实际使用中应该维护一个单独的注册表
    logger.warn('getAllSerializableComponents() 需要在SchemaRegistry中维护组件列表');
    return new Map();
}

/**
 * 检查字段是否应该序列化
 */
export function shouldSerializeField(field: FieldMeta, value: any): boolean {
    // 跳过默认值
    if (field.options.skipDefaults && field.options.defaultValue !== undefined) {
        return value !== field.options.defaultValue;
    }
    
    // 处理nullable字段
    if (!field.options.nullable && (value === null || value === undefined)) {
        return false;
    }
    
    return true;
}

/**
 * 创建字段的序列化描述符（用于调试）
 */
export function createFieldDescriptor(field: FieldMeta): string {
    const options = field.options;
    const parts = [
        `id:${field.id}`,
        `type:${options.dataType}`
    ];
    
    if (options.nullable) parts.push('nullable');
    if (options.skipDefaults) parts.push('skipDefaults');
    if (options.serializer) parts.push(`serializer:${typeof options.serializer === 'string' ? options.serializer : 'custom'}`);
    
    return `${field.name}(${parts.join(',')})`;
}