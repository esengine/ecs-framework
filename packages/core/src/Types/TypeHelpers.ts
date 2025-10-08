/**
 * TypeScript类型工具集
 *
 * 提供高级类型推断和类型安全的工具类型
 */

import type { IComponent } from './index';
import { Component } from '../ECS/Component';

/**
 * 组件类型提取器
 * 从组件构造函数中提取实例类型
 */
export type ComponentInstance<T> = T extends new (...args: any[]) => infer R ? R : never;

/**
 * 组件构造函数类型
 *
 * 与 ComponentType 保持一致，避免类型转换
 */
export type ComponentConstructor<T extends IComponent = IComponent> = new (...args: any[]) => T;

/**
 * 组件类型的通用约束
 *
 * 用于确保类型参数是有效的组件构造函数
 */
export type AnyComponentConstructor = ComponentConstructor<any>;

/**
 * 多组件类型提取
 * 从组件构造函数数组中提取所有实例类型的联合
 */
export type ExtractComponents<T extends readonly ComponentConstructor[]> = {
    [K in keyof T]: ComponentInstance<T[K]>;
};

/**
 * 组件类型映射
 * 将组件构造函数数组转换为实例类型的元组
 */
export type ComponentTypeMap<T extends readonly ComponentConstructor[]> = {
    [K in keyof T]: T[K] extends ComponentConstructor<infer C> ? C : never;
};

/**
 * 实体with组件的类型
 * 表示一个实体确定拥有某些组件
 */
export interface EntityWithComponents<T extends readonly ComponentConstructor[]> {
    readonly id: number;
    readonly name: string;

    /**
     * 类型安全的组件获取
     * 确保返回非空的组件实例
     */
    getComponent<C extends ComponentConstructor>(componentType: C): ComponentInstance<C>;

    /**
     * 检查是否拥有组件
     */
    hasComponent<C extends ComponentConstructor>(componentType: C): boolean;

    /**
     * 获取所有组件
     */
    readonly components: ComponentTypeMap<T>;
}

/**
 * 查询结果类型
 * 根据查询条件推断实体必定拥有的组件
 */
export type QueryResult<
    All extends readonly ComponentConstructor[] = [],
    Any extends readonly ComponentConstructor[] = [],
    None extends readonly ComponentConstructor[] = []
> = {
    /**
     * 实体列表，确保拥有All中的所有组件
     */
    readonly entities: ReadonlyArray<EntityWithComponents<All>>;

    /**
     * 实体数量
     */
    readonly length: number;

    /**
     * 遍历实体
     */
    forEach(callback: (entity: EntityWithComponents<All>, index: number) => void): void;

    /**
     * 映射转换
     */
    map<R>(callback: (entity: EntityWithComponents<All>, index: number) => R): R[];

    /**
     * 过滤实体
     */
    filter(predicate: (entity: EntityWithComponents<All>, index: number) => boolean): QueryResult<All, Any, None>;
};

/**
 * System处理的实体类型
 * 根据Matcher推断System处理的实体类型
 */
export type SystemEntityType<M> = M extends {
    getCondition(): {
        all: infer All extends readonly ComponentConstructor[];
    };
}
    ? EntityWithComponents<All>
    : never;

/**
 * 组件字段类型提取
 * 提取组件中所有可序列化的字段
 */
export type SerializableFields<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * 只读组件类型
 * 将组件的所有字段转为只读
 */
export type ReadonlyComponent<T extends IComponent> = {
    readonly [K in keyof T]: T[K];
};

/**
 * 部分组件类型
 * 用于组件更新操作
 */
export type PartialComponent<T extends IComponent> = {
    [K in SerializableFields<T>]?: T[K];
};

/**
 * 组件类型约束
 * 确保类型参数是有效的组件
 */
export type ValidComponent<T> = T extends Component ? T : never;

/**
 * 组件数组约束
 * 确保数组中的所有元素都是组件构造函数
 */
export type ValidComponentArray<T extends readonly any[]> = T extends readonly ComponentConstructor[]
    ? T
    : never;

/**
 * 事件处理器类型
 * 提供类型安全的事件处理
 */
export type TypedEventHandler<T> = (data: T) => void | Promise<void>;

/**
 * 系统生命周期钩子类型
 */
export interface SystemLifecycleHooks<T extends readonly ComponentConstructor[]> {
    /**
     * 实体添加到系统时调用
     */
    onAdded?: (entity: EntityWithComponents<T>) => void;

    /**
     * 实体从系统移除时调用
     */
    onRemoved?: (entity: EntityWithComponents<T>) => void;

    /**
     * 系统初始化时调用
     */
    onInitialize?: () => void;

    /**
     * 系统销毁时调用
     */
    onDestroy?: () => void;
}

/**
 * Fluent API构建器类型
 */
export interface TypeSafeBuilder<T> {
    /**
     * 完成构建
     */
    build(): T;
}

/**
 * 组件池类型
 */
export interface ComponentPool<T extends IComponent> {
    /**
     * 从池中获取组件实例
     */
    obtain(): T;

    /**
     * 归还组件到池中
     */
    free(component: T): void;

    /**
     * 清空池
     */
    clear(): void;

    /**
     * 池中可用对象数量
     */
    readonly available: number;
}

/**
 * 实体查询条件类型
 */
export interface TypedQueryCondition<
    All extends readonly ComponentConstructor[] = [],
    Any extends readonly ComponentConstructor[] = [],
    None extends readonly ComponentConstructor[] = []
> {
    all: All;
    any: Any;
    none: None;
    tag?: number;
    name?: string;
}

/**
 * 组件类型守卫
 */
export function isComponentType<T extends IComponent>(
    value: any
): value is ComponentConstructor<T> {
    return typeof value === 'function' && value.prototype instanceof Component;
}

/**
 * 类型安全的组件数组守卫
 */
export function isComponentArray(
    value: any[]
): value is ComponentConstructor[] {
    return value.every(isComponentType);
}

/**
 * 提取组件类型名称（编译时）
 */
export type ComponentTypeName<T extends ComponentConstructor> = T extends {
    prototype: { constructor: { name: infer N } };
}
    ? N
    : string;

/**
 * 多组件类型名称联合
 */
export type ComponentTypeNames<T extends readonly ComponentConstructor[]> = {
    [K in keyof T]: ComponentTypeName<T[K]>;
}[number];

/**
 * 深度只读类型
 */
export type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/**
 * 深度可选类型
 */
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * 排除方法的类型
 */
export type DataOnly<T> = {
    [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

/**
 * 可序列化的组件数据
 */
export type SerializableComponent<T extends IComponent> = DeepPartial<DataOnly<T>>;
