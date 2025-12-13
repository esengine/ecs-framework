/**
 * 组件序列化器
 *
 * 负责组件的序列化和反序列化操作
 */

import { Component } from '../Component';
import { ComponentType } from '../Core/ComponentStorage';
import { getComponentTypeName, isEntityRefProperty } from '../Decorators';
import {
    getSerializationMetadata
} from './SerializationDecorators';
import type { Entity } from '../Entity';
import type { SerializationContext, SerializedEntityRef } from './SerializationContext';

/**
 * 可序列化的值类型
 */
export type SerializableValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | SerializableValue[]
    | { [key: string]: SerializableValue }
    | { __type: 'Date'; value: string }
    | { __type: 'Map'; value: Array<[SerializableValue, SerializableValue]> }
    | { __type: 'Set'; value: SerializableValue[] }
    | { __entityRef: SerializedEntityRef };

/**
 * 序列化后的组件数据
 */
export interface SerializedComponent {
    /**
     * 组件类型名称
     */
    type: string;

    /**
     * 序列化版本
     */
    version: number;

    /**
     * 组件数据
     */
    data: Record<string, SerializableValue>;
}

/**
 * 组件序列化器类
 */
export class ComponentSerializer {
    /**
     * 序列化单个组件
     *
     * @param component 要序列化的组件实例
     * @returns 序列化后的组件数据，如果组件不可序列化则返回null
     */
    public static serialize(component: Component): SerializedComponent | null {
        const metadata = getSerializationMetadata(component);

        if (!metadata) {
            // 组件没有使用@Serializable装饰器，不可序列化
            return null;
        }

        const componentType = component.constructor as ComponentType;
        const typeName = metadata.options.typeId || getComponentTypeName(componentType);
        const data: Record<string, SerializableValue> = {};

        // 序列化标记的字段
        for (const [fieldName, options] of metadata.fields) {
            const fieldKey = typeof fieldName === 'symbol' ? fieldName.toString() : fieldName;
            const value = (component as unknown as Record<string | symbol, unknown>)[fieldName];

            // 跳过忽略的字段
            if (metadata.ignoredFields.has(fieldName)) {
                continue;
            }

            let serializedValue: SerializableValue;

            // 检查是否为 EntityRef 属性
            if (isEntityRefProperty(component, fieldKey)) {
                serializedValue = this.serializeEntityRef(value as Entity | null);
            } else if (options.serializer) {
                // 使用自定义序列化器
                serializedValue = options.serializer(value);
            } else {
                // 使用默认序列化
                serializedValue = this.serializeValue(value as SerializableValue);
            }

            // 使用别名或原始字段名
            const key = options.alias || fieldKey;
            data[key] = serializedValue;
        }

        return {
            type: typeName,
            version: metadata.options.version,
            data
        };
    }

    /**
     * 反序列化组件
     *
     * @param serializedData 序列化的组件数据
     * @param componentRegistry 组件类型注册表 (类型名 -> 构造函数)
     * @param context 序列化上下文（可选，用于解析 EntityRef）
     * @returns 反序列化后的组件实例，如果失败则返回null
     */
    public static deserialize(
        serializedData: SerializedComponent,
        componentRegistry: Map<string, ComponentType>,
        context?: SerializationContext
    ): Component | null {
        const componentClass = componentRegistry.get(serializedData.type);

        if (!componentClass) {
            console.warn(`未找到组件类型: ${serializedData.type}`);
            return null;
        }

        const metadata = getSerializationMetadata(componentClass);

        if (!metadata) {
            console.warn(`组件 ${serializedData.type} 不可序列化`);
            return null;
        }

        // 创建组件实例
        const component = new componentClass();

        // 反序列化字段
        for (const [fieldName, options] of metadata.fields) {
            const fieldKey = typeof fieldName === 'symbol' ? fieldName.toString() : fieldName;
            const key = options.alias || fieldKey;
            const serializedValue = serializedData.data[key];

            if (serializedValue === undefined) {
                continue; // 字段不存在于序列化数据中
            }

            // 检查是否为序列化的 EntityRef
            if (this.isSerializedEntityRef(serializedValue)) {
                // EntityRef 需要延迟解析
                if (context) {
                    const ref = serializedValue.__entityRef;
                    context.registerPendingRef(component, fieldKey, ref.id, ref.guid);
                }
                // 暂时设为 null，后续由 context.resolveAllReferences() 填充
                (component as unknown as Record<string | symbol, unknown>)[fieldName] = null;
                continue;
            }

            // 使用自定义反序列化器或默认反序列化
            const value = options.deserializer
                ? options.deserializer(serializedValue)
                : this.deserializeValue(serializedValue);

            (component as unknown as Record<string | symbol, SerializableValue>)[fieldName] = value;
        }

        return component;
    }

    /**
     * 批量序列化组件
     *
     * @param components 组件数组
     * @returns 序列化后的组件数据数组
     */
    public static serializeComponents(components: Component[]): SerializedComponent[] {
        const result: SerializedComponent[] = [];

        for (const component of components) {
            const serialized = this.serialize(component);
            if (serialized) {
                result.push(serialized);
            }
        }

        return result;
    }

    /**
     * 批量反序列化组件
     *
     * @param serializedComponents 序列化的组件数据数组
     * @param componentRegistry 组件类型注册表
     * @param context 序列化上下文（可选，用于解析 EntityRef）
     * @returns 反序列化后的组件数组
     */
    public static deserializeComponents(
        serializedComponents: SerializedComponent[],
        componentRegistry: Map<string, ComponentType>,
        context?: SerializationContext
    ): Component[] {
        const result: Component[] = [];

        for (const serialized of serializedComponents) {
            const component = this.deserialize(serialized, componentRegistry, context);
            if (component) {
                result.push(component);
            }
        }

        return result;
    }

    /**
     * 默认值序列化
     *
     * 处理基本类型、数组、对象等的序列化
     */
    private static serializeValue(value: SerializableValue): SerializableValue {
        if (value === null || value === undefined) {
            return value;
        }

        // 基本类型
        const type = typeof value;
        if (type === 'string' || type === 'number' || type === 'boolean') {
            return value;
        }

        // 日期
        if (value instanceof Date) {
            return {
                __type: 'Date',
                value: value.toISOString()
            };
        }

        // 数组
        if (Array.isArray(value)) {
            return value.map((item) => this.serializeValue(item));
        }

        // Map (如果没有使用@SerializeMap装饰器)
        if (value instanceof Map) {
            return {
                __type: 'Map',
                value: Array.from(value.entries())
            };
        }

        // Set
        if (value instanceof Set) {
            return {
                __type: 'Set',
                value: Array.from(value)
            };
        }

        // 普通对象
        if (type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
            const result: Record<string, SerializableValue> = {};
            const obj = value as Record<string, SerializableValue>;
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    result[key] = this.serializeValue(obj[key]);
                }
            }
            return result;
        }

        // 其他类型（函数等）不序列化
        return undefined;
    }

    /**
     * 默认值反序列化
     */
    private static deserializeValue(value: SerializableValue): SerializableValue {
        if (value === null || value === undefined) {
            return value;
        }

        // 基本类型直接返回
        const type = typeof value;
        if (type === 'string' || type === 'number' || type === 'boolean') {
            return value;
        }

        // 处理特殊类型标记
        if (type === 'object' && typeof value === 'object' && '__type' in value) {
            const typedValue = value as { __type: string; value: SerializableValue };
            switch (typedValue.__type) {
                case 'Date':
                    return { __type: 'Date', value: typeof typedValue.value === 'string' ? typedValue.value : String(typedValue.value) };
                case 'Map':
                    return { __type: 'Map', value: typedValue.value as Array<[SerializableValue, SerializableValue]> };
                case 'Set':
                    return { __type: 'Set', value: typedValue.value as SerializableValue[] };
            }
        }

        // 数组
        if (Array.isArray(value)) {
            return value.map((item) => this.deserializeValue(item));
        }

        // 普通对象
        if (type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
            const result: Record<string, SerializableValue> = {};
            const obj = value as Record<string, SerializableValue>;
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    result[key] = this.deserializeValue(obj[key]);
                }
            }
            return result;
        }

        return value;
    }

    /**
     * 验证序列化数据的版本
     *
     * @param serializedData 序列化数据
     * @param expectedVersion 期望的版本号
     * @returns 版本是否匹配
     */
    public static validateVersion(
        serializedData: SerializedComponent,
        expectedVersion: number
    ): boolean {
        return serializedData.version === expectedVersion;
    }

    /**
     * 获取组件的序列化信息
     *
     * @param component 组件实例或组件类
     * @returns 序列化信息对象，包含类型名、版本、可序列化字段列表
     */
    public static getSerializationInfo(component: Component | ComponentType): {
        type: string;
        version: number;
        fields: string[];
        ignoredFields: string[];
        isSerializable: boolean;
    } | null {
        const metadata = getSerializationMetadata(component);

        if (!metadata) {
            return {
                type: 'unknown',
                version: 0,
                fields: [],
                ignoredFields: [],
                isSerializable: false
            };
        }

        const componentType = typeof component === 'function'
            ? component
            : (component.constructor as ComponentType);

        return {
            type: metadata.options.typeId || getComponentTypeName(componentType),
            version: metadata.options.version,
            fields: Array.from(metadata.fields.keys()).map((k) =>
                typeof k === 'symbol' ? k.toString() : k
            ),
            ignoredFields: Array.from(metadata.ignoredFields).map((k) =>
                typeof k === 'symbol' ? k.toString() : k
            ),
            isSerializable: true
        };
    }

    /**
     * 序列化 Entity 引用
     *
     * Serialize an Entity reference to a portable format.
     *
     * @param entity Entity 实例或 null
     * @returns 序列化的引用格式
     */
    public static serializeEntityRef(entity: Entity | null): SerializableValue {
        if (!entity) {
            return null;
        }

        return {
            __entityRef: {
                id: entity.id,
                guid: entity.persistentId
            }
        };
    }

    /**
     * 检查值是否为序列化的 EntityRef
     *
     * Check if a value is a serialized EntityRef.
     *
     * @param value 要检查的值
     * @returns 如果是 EntityRef 返回 true
     */
    public static isSerializedEntityRef(value: unknown): value is { __entityRef: SerializedEntityRef } {
        return (
            typeof value === 'object' &&
            value !== null &&
            '__entityRef' in value
        );
    }
}
