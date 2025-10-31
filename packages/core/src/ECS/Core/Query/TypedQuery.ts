/**
 * 类型安全的Query查询系统
 *
 * 提供完整的TypeScript类型推断，在编译时确保类型安全
 */

import type { Entity } from '../../Entity';
import type { ComponentConstructor } from '../../../Types/TypeHelpers';
import { Matcher, type QueryCondition } from '../../Utils/Matcher';

/**
 * 类型安全的查询结果
 *
 * 根据查询条件自动推断实体必定拥有的组件类型
 */
export class TypedQueryResult<TAll extends readonly ComponentConstructor[]> {
    private _entities: readonly Entity[];
    private _componentTypes: TAll;

    constructor(entities: readonly Entity[], componentTypes: TAll) {
        this._entities = entities;
        this._componentTypes = componentTypes;
    }

    /**
     * 获取实体列表
     */
    get entities(): readonly Entity[] {
        return this._entities;
    }

    /**
     * 实体数量
     */
    get length(): number {
        return this._entities.length;
    }

    /**
     * 遍历所有实体
     *
     * @example
     * ```typescript
     * query.forEach((entity) => {
     *     // entity.getComponent返回类型自动推断
     *     const pos = entity.getComponent(Position); // Position类型
     *     const vel = entity.getComponent(Velocity); // Velocity类型
     * });
     * ```
     */
    forEach(callback: (entity: Entity, index: number) => void): void {
        this._entities.forEach(callback);
    }

    /**
     * 映射转换实体
     */
    map<R>(callback: (entity: Entity, index: number) => R): R[] {
        return this._entities.map(callback);
    }

    /**
     * 过滤实体
     */
    filter(predicate: (entity: Entity, index: number) => boolean): TypedQueryResult<TAll> {
        return new TypedQueryResult(this._entities.filter(predicate), this._componentTypes);
    }

    /**
     * 查找第一个匹配的实体
     */
    find(predicate: (entity: Entity, index: number) => boolean): Entity | undefined {
        return this._entities.find(predicate);
    }

    /**
     * 检查是否存在匹配的实体
     */
    some(predicate: (entity: Entity, index: number) => boolean): boolean {
        return this._entities.some(predicate);
    }

    /**
     * 检查是否所有实体都匹配
     */
    every(predicate: (entity: Entity, index: number) => boolean): boolean {
        return this._entities.every(predicate);
    }

    /**
     * 获取指定索引的实体
     */
    get(index: number): Entity | undefined {
        return this._entities[index];
    }

    /**
     * 获取第一个实体
     */
    get first(): Entity | undefined {
        return this._entities[0];
    }

    /**
     * 获取最后一个实体
     */
    get last(): Entity | undefined {
        return this._entities[this._entities.length - 1];
    }

    /**
     * 检查查询结果是否为空
     */
    get isEmpty(): boolean {
        return this._entities.length === 0;
    }

    /**
     * 转换为数组
     */
    toArray(): Entity[] {
        return [...this._entities];
    }

    /**
     * 获取组件类型信息（用于调试）
     */
    getComponentTypes(): readonly ComponentConstructor[] {
        return this._componentTypes;
    }

    /**
     * 迭代器支持
     */
    [Symbol.iterator](): Iterator<Entity> {
        return this._entities[Symbol.iterator]();
    }
}

/**
 * 类型安全的查询构建器
 *
 * 支持链式调用，自动推断查询结果的类型
 *
 * @example
 * ```typescript
 * // 基础查询
 * const query = new TypedQueryBuilder()
 *     .withAll(Position, Velocity)
 *     .build();
 *
 * // 复杂查询
 * const complexQuery = new TypedQueryBuilder()
 *     .withAll(Transform, Renderer)
 *     .withAny(BoxCollider, CircleCollider)
 *     .withNone(Disabled)
 *     .withTag(EntityTags.Enemy)
 *     .build();
 * ```
 */
export class TypedQueryBuilder<
    TAll extends readonly ComponentConstructor[] = [],
    TAny extends readonly ComponentConstructor[] = [],
    TNone extends readonly ComponentConstructor[] = []
> {
    private _all: TAll;
    private _any: TAny;
    private _none: TNone;
    private _tag?: number;
    private _name?: string;

    constructor(
        all?: TAll,
        any?: TAny,
        none?: TNone,
        tag?: number,
        name?: string
    ) {
        this._all = (all || []) as TAll;
        this._any = (any || []) as TAny;
        this._none = (none || []) as TNone;
        if (tag !== undefined) {
            this._tag = tag;
        }
        if (name !== undefined) {
            this._name = name;
        }
    }

    /**
     * 要求实体拥有所有指定的组件
     *
     * @param types 组件类型
     * @returns 新的查询构建器，类型参数更新
     */
    withAll<TNewAll extends readonly ComponentConstructor[]>(
        ...types: TNewAll
    ): TypedQueryBuilder<
        readonly [...TAll, ...TNewAll],
        TAny,
        TNone
    > {
        return new TypedQueryBuilder(
            [...this._all, ...types] as readonly [...TAll, ...TNewAll],
            this._any,
            this._none,
            this._tag,
            this._name
        );
    }

    /**
     * 要求实体至少拥有一个指定的组件
     *
     * @param types 组件类型
     * @returns 新的查询构建器
     */
    withAny<TNewAny extends readonly ComponentConstructor[]>(
        ...types: TNewAny
    ): TypedQueryBuilder<
        TAll,
        readonly [...TAny, ...TNewAny],
        TNone
    > {
        return new TypedQueryBuilder(
            this._all,
            [...this._any, ...types] as readonly [...TAny, ...TNewAny],
            this._none,
            this._tag,
            this._name
        );
    }

    /**
     * 排除拥有指定组件的实体
     *
     * @param types 组件类型
     * @returns 新的查询构建器
     */
    withNone<TNewNone extends readonly ComponentConstructor[]>(
        ...types: TNewNone
    ): TypedQueryBuilder<
        TAll,
        TAny,
        readonly [...TNone, ...TNewNone]
    > {
        return new TypedQueryBuilder(
            this._all,
            this._any,
            [...this._none, ...types] as readonly [...TNone, ...TNewNone],
            this._tag,
            this._name
        );
    }

    /**
     * 按标签过滤实体
     *
     * @param tag 标签值
     * @returns 新的查询构建器
     */
    withTag(tag: number): TypedQueryBuilder<TAll, TAny, TNone> {
        return new TypedQueryBuilder(
            this._all,
            this._any,
            this._none,
            tag,
            this._name
        );
    }

    /**
     * 按名称过滤实体
     *
     * @param name 实体名称
     * @returns 新的查询构建器
     */
    withName(name: string): TypedQueryBuilder<TAll, TAny, TNone> {
        return new TypedQueryBuilder(
            this._all,
            this._any,
            this._none,
            this._tag,
            name
        );
    }

    /**
     * 构建Matcher对象
     *
     * @returns Matcher实例，用于传统查询API
     */
    buildMatcher(): Matcher {
        let matcher = Matcher.complex();

        if (this._all.length > 0) {
            matcher = matcher.all(...(this._all as unknown as ComponentConstructor[]));
        }

        if (this._any.length > 0) {
            matcher = matcher.any(...(this._any as unknown as ComponentConstructor[]));
        }

        if (this._none.length > 0) {
            matcher = matcher.none(...(this._none as unknown as ComponentConstructor[]));
        }

        if (this._tag !== undefined) {
            matcher = matcher.withTag(this._tag);
        }

        if (this._name !== undefined) {
            matcher = matcher.withName(this._name);
        }

        return matcher;
    }

    /**
     * 获取查询条件
     *
     * @returns 查询条件对象
     */
    getCondition(): QueryCondition {
        return {
            all: [...this._all] as ComponentConstructor[],
            any: [...this._any] as ComponentConstructor[],
            none: [...this._none] as ComponentConstructor[],
            ...(this._tag !== undefined && { tag: this._tag }),
            ...(this._name !== undefined && { name: this._name })
        };
    }

    /**
     * 获取required组件类型（用于类型推断）
     */
    getRequiredTypes(): TAll {
        return this._all;
    }

    /**
     * 克隆查询构建器
     */
    clone(): TypedQueryBuilder<TAll, TAny, TNone> {
        return new TypedQueryBuilder(
            [...this._all] as unknown as TAll,
            [...this._any] as unknown as TAny,
            [...this._none] as unknown as TNone,
            this._tag,
            this._name
        );
    }
}

/**
 * 创建类型安全的查询构建器
 *
 * @example
 * ```typescript
 * const query = createQuery()
 *     .withAll(Position, Velocity)
 *     .withNone(Disabled);
 *
 * // 在System或Scene中使用
 * const entities = scene.query(query);
 * entities.forEach(entity => {
 *     const pos = entity.getComponent(Position);  // 自动推断为Position
 *     const vel = entity.getComponent(Velocity);  // 自动推断为Velocity
 * });
 * ```
 */
export function createQuery(): TypedQueryBuilder<[], [], []> {
    return new TypedQueryBuilder();
}

/**
 * 创建单组件查询的便捷方法
 *
 * @param componentType 组件类型
 * @returns 查询构建器
 *
 * @example
 * ```typescript
 * const healthEntities = queryFor(HealthComponent);
 * ```
 */
export function queryFor<T extends ComponentConstructor>(
    componentType: T
): TypedQueryBuilder<readonly [T], [], []> {
    return new TypedQueryBuilder([componentType] as readonly [T]);
}

/**
 * 创建多组件查询的便捷方法
 *
 * @param types 组件类型数组
 * @returns 查询构建器
 *
 * @example
 * ```typescript
 * const movableEntities = queryForAll(Position, Velocity);
 * ```
 */
export function queryForAll<T extends readonly ComponentConstructor[]>(
    ...types: T
): TypedQueryBuilder<T, [], []> {
    return new TypedQueryBuilder(types);
}
