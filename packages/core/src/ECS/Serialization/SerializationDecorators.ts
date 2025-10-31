/**
 * 序列化装饰器
 *
 * 提供组件级别的序列化支持，包括字段级装饰器和类级装饰器
 */

import { Component } from '../Component';

/**
 * 序列化元数据的Symbol键
 */
export const SERIALIZABLE_METADATA = Symbol('SerializableMetadata');
export const SERIALIZE_FIELD = Symbol('SerializeField');
export const SERIALIZE_OPTIONS = Symbol('SerializeOptions');

/**
 * 可序列化配置选项
 */
export interface SerializableOptions {
    /**
     * 序列化版本号，用于数据迁移
     */
    version: number;

    /**
     * 组件类型标识符（可选，默认使用类名）
     */
    typeId?: string;
}

/**
 * 字段序列化配置
 */
export interface FieldSerializeOptions {
    /**
     * 自定义序列化器
     */
    serializer?: (value: any) => any;

    /**
     * 自定义反序列化器
     */
    deserializer?: (value: any) => any;

    /**
     * 字段别名（用于序列化后的键名）
     */
    alias?: string;
}

/**
 * 序列化元数据
 */
export interface SerializationMetadata {
    options: SerializableOptions;
    fields: Map<string | symbol, FieldSerializeOptions>;
    ignoredFields: Set<string | symbol>;
}

/**
 * 组件可序列化装饰器
 *
 * 标记组件类为可序列化，必须与字段装饰器配合使用
 *
 * @param options 序列化配置选项
 *
 * @example
 * ```typescript
 * @ECSComponent('Player')
 * @Serializable({ version: 1 })
 * class PlayerComponent extends Component {
 *     @Serialize() name: string = 'Player';
 *     @Serialize() level: number = 1;
 * }
 * ```
 */
export function Serializable(options: SerializableOptions) {
    return function <T extends new (...args: any[]) => Component>(target: T): T {
        if (!options || typeof options.version !== 'number') {
            throw new Error('Serializable装饰器必须提供有效的版本号');
        }

        // 初始化或获取现有元数据
        let metadata: SerializationMetadata = (target as any)[SERIALIZABLE_METADATA];
        if (!metadata) {
            metadata = {
                options,
                fields: new Map(),
                ignoredFields: new Set()
            };
            (target as any)[SERIALIZABLE_METADATA] = metadata;
        } else {
            metadata.options = options;
        }

        return target;
    };
}

/**
 * 字段序列化装饰器
 *
 * 标记字段为可序列化
 *
 * @param options 字段序列化选项（可选）
 *
 * @example
 * ```typescript
 * @Serialize()
 * name: string = 'Player';
 *
 * @Serialize({ alias: 'hp' })
 * health: number = 100;
 * ```
 */
export function Serialize(options?: FieldSerializeOptions) {
    return function (target: any, propertyKey: string | symbol) {
        const constructor = target.constructor;

        // 获取或创建元数据
        let metadata: SerializationMetadata = constructor[SERIALIZABLE_METADATA];
        if (!metadata) {
            metadata = {
                options: { version: 1 }, // 默认版本
                fields: new Map(),
                ignoredFields: new Set()
            };
            constructor[SERIALIZABLE_METADATA] = metadata;
        }

        // 记录字段
        metadata.fields.set(propertyKey, options || {});
    };
}

/**
 * Map序列化装饰器
 *
 * 专门用于序列化Map类型字段
 *
 * @example
 * ```typescript
 * @SerializeAsMap()
 * inventory: Map<string, number> = new Map();
 * ```
 */
export function SerializeAsMap() {
    return function (target: any, propertyKey: string | symbol) {
        Serialize({
            serializer: (value: Map<any, any>) => {
                if (!(value instanceof Map)) {
                    return null;
                }
                return Array.from(value.entries());
            },
            deserializer: (value: any) => {
                if (!Array.isArray(value)) {
                    return new Map();
                }
                return new Map(value);
            }
        })(target, propertyKey);
    };
}

/**
 * Set序列化装饰器
 *
 * 专门用于序列化Set类型字段
 *
 * @example
 * ```typescript
 * @SerializeAsSet()
 * tags: Set<string> = new Set();
 * ```
 */
export function SerializeAsSet() {
    return function (target: any, propertyKey: string | symbol) {
        Serialize({
            serializer: (value: Set<any>) => {
                if (!(value instanceof Set)) {
                    return null;
                }
                return Array.from(value);
            },
            deserializer: (value: any) => {
                if (!Array.isArray(value)) {
                    return new Set();
                }
                return new Set(value);
            }
        })(target, propertyKey);
    };
}

/**
 * 忽略序列化装饰器
 *
 * 标记字段不参与序列化
 *
 * @example
 * ```typescript
 * @IgnoreSerialization()
 * tempCache: any = null;
 * ```
 */
export function IgnoreSerialization() {
    return function (target: any, propertyKey: string | symbol) {
        const constructor = target.constructor;

        // 获取或创建元数据
        let metadata: SerializationMetadata = constructor[SERIALIZABLE_METADATA];
        if (!metadata) {
            metadata = {
                options: { version: 1 },
                fields: new Map(),
                ignoredFields: new Set()
            };
            constructor[SERIALIZABLE_METADATA] = metadata;
        }

        // 记录忽略字段
        metadata.ignoredFields.add(propertyKey);
    };
}

/**
 * 获取组件的序列化元数据
 *
 * @param componentClass 组件类或组件实例
 * @returns 序列化元数据，如果组件不可序列化则返回null
 */
export function getSerializationMetadata(componentClass: any): SerializationMetadata | null {
    if (!componentClass) {
        return null;
    }

    // 如果是实例，获取其构造函数
    const constructor = typeof componentClass === 'function'
        ? componentClass
        : componentClass.constructor;

    return constructor[SERIALIZABLE_METADATA] || null;
}

/**
 * 检查组件是否可序列化
 *
 * @param component 组件类或组件实例
 * @returns 如果组件可序列化返回true
 */
export function isSerializable(component: any): boolean {
    return getSerializationMetadata(component) !== null;
}
