/**
 * Entity类型安全工具函数
 *
 * 提供类型安全的组件操作工具函数，无需修改Entity类
 */

import { Entity } from './Entity';
import type { Component } from './Component';
import type { ComponentType } from './Core/ComponentStorage';
import type { ComponentConstructor, ComponentInstance } from '../Types/TypeHelpers';
import { HierarchySystem } from './Systems/HierarchySystem';

/**
 * 获取组件，如果不存在则抛出错误
 *
 * @param entity - 实体实例
 * @param componentType - 组件类型构造函数
 * @returns 组件实例（保证非空）
 * @throws {Error} 如果组件不存在
 *
 * @example
 * ```typescript
 * const position = requireComponent(entity, Position);
 * position.x += 10;
 * ```
 */
export function requireComponent<T extends ComponentConstructor>(
    entity: Entity,
    componentType: T
): ComponentInstance<T> {
    const component = entity.getComponent(componentType as unknown as ComponentType<ComponentInstance<T>>);
    if (!component) {
        throw new Error(
            `Component ${componentType.name} not found on entity ${entity.name} (id: ${entity.id})`
        );
    }
    return component;
}

/**
 * 尝试获取组件
 *
 * @param entity - 实体实例
 * @param componentType - 组件类型构造函数
 * @returns 组件实例或undefined
 *
 * @example
 * ```typescript
 * const health = tryGetComponent(entity, Health);
 * if (health) {
 *     health.value -= 10;
 * }
 * ```
 */
export function tryGetComponent<T extends ComponentConstructor>(
    entity: Entity,
    componentType: T
): ComponentInstance<T> | undefined {
    const component = entity.getComponent(componentType as unknown as ComponentType<ComponentInstance<T>>);
    return component !== null ? component : undefined;
}

/**
 * 批量获取组件
 *
 * @param entity - 实体实例
 * @param types - 组件类型构造函数数组
 * @returns 组件实例元组，每个元素可能为null
 *
 * @example
 * ```typescript
 * const [pos, vel, health] = getComponents(entity, Position, Velocity, Health);
 * if (pos && vel && health) {
 *     pos.x += vel.dx;
 * }
 * ```
 */
export function getComponents<T extends readonly ComponentConstructor[]>(
    entity: Entity,
    ...types: T
): { [K in keyof T]: ComponentInstance<T[K]> | null } {
    return types.map((type) =>
        entity.getComponent(type as unknown as ComponentType<ComponentInstance<typeof type>>)
    ) as { [K in keyof T]: ComponentInstance<T[K]> | null };
}

/**
 * 检查实体是否拥有所有指定的组件
 *
 * @param entity - 实体实例
 * @param types - 组件类型构造函数数组
 * @returns 如果拥有所有组件返回true，否则返回false
 *
 * @example
 * ```typescript
 * if (hasComponents(entity, Position, Velocity)) {
 *     const pos = entity.getComponent(Position)!;
 *     const vel = entity.getComponent(Velocity)!;
 * }
 * ```
 */
export function hasComponents(entity: Entity, ...types: ComponentConstructor[]): boolean {
    return types.every((type) => entity.hasComponent(type as unknown as ComponentType));
}

/**
 * 检查实体是否拥有至少一个指定的组件
 *
 * @param entity - 实体实例
 * @param types - 组件类型构造函数数组
 * @returns 如果拥有任意一个组件返回true，否则返回false
 */
export function hasAnyComponent(entity: Entity, ...types: ComponentConstructor[]): boolean {
    return types.some((type) => entity.hasComponent(type as unknown as ComponentType));
}

/**
 * 添加组件并立即配置
 *
 * @param entity - 实体实例
 * @param component - 组件实例
 * @param configure - 配置回调函数
 * @returns 实体实例（支持链式调用）
 *
 * @example
 * ```typescript
 * addAndConfigure(entity, new Health(), health => {
 *     health.maxValue = 100;
 *     health.value = 50;
 * });
 * ```
 */
export function addAndConfigure<T extends Component>(
    entity: Entity,
    component: T,
    configure: (component: T) => void
): Entity {
    entity.addComponent(component);
    configure(component);
    return entity;
}

/**
 * 获取或添加组件
 *
 * 如果组件已存在则返回现有组件，否则通过工厂函数创建并添加
 *
 * @param entity - 实体实例
 * @param componentType - 组件类型构造函数
 * @param factory - 组件工厂函数（仅在组件不存在时调用）
 * @returns 组件实例
 *
 * @example
 * ```typescript
 * const health = getOrAddComponent(entity, Health, () => new Health(100));
 * ```
 */
export function getOrAddComponent<T extends ComponentConstructor>(
    entity: Entity,
    componentType: T,
    factory: () => ComponentInstance<T>
): ComponentInstance<T> {
    let component = entity.getComponent(componentType as unknown as ComponentType<ComponentInstance<T>>);
    if (!component) {
        component = factory();
        entity.addComponent(component);
    }
    return component;
}

/**
 * 更新组件的部分字段
 *
 * @param entity - 实体实例
 * @param componentType - 组件类型构造函数
 * @param data - 要更新的部分数据
 * @returns 如果更新成功返回true，组件不存在返回false
 *
 * @example
 * ```typescript
 * updateComponent(entity, Position, { x: 100 });
 * ```
 */
export function updateComponent<T extends ComponentConstructor>(
    entity: Entity,
    componentType: T,
    data: Partial<ComponentInstance<T>>
): boolean {
    const component = entity.getComponent(componentType as unknown as ComponentType<ComponentInstance<T>>);
    if (!component) {
        return false;
    }

    Object.assign(component, data);
    return true;
}

/**
 * 类型安全的实体构建器
 *
 * @example
 * ```typescript
 * const player = buildEntity(scene.createEntity("Player"))
 *     .with(new Position(100, 100))
 *     .with(new Velocity(0, 0))
 *     .withTag(1)
 *     .build();
 * ```
 */
export class TypedEntityBuilder {
    private _entity: Entity;

    constructor(entity: Entity) {
        this._entity = entity;
    }

    /**
     * 添加组件
     */
    with<T extends Component>(component: T): this {
        this._entity.addComponent(component);
        return this;
    }

    /**
     * 添加并配置组件
     */
    withConfigured<T extends Component>(
        component: T,
        configure: (component: T) => void
    ): this {
        this._entity.addComponent(component);
        configure(component);
        return this;
    }

    /**
     * 设置标签
     */
    withTag(tag: number): this {
        this._entity.tag = tag;
        return this;
    }

    /**
     * 设置名称
     */
    withName(name: string): this {
        this._entity.name = name;
        return this;
    }

    /**
     * 设置激活状态
     */
    withActive(active: boolean): this {
        this._entity.active = active;
        return this;
    }

    /**
     * 设置启用状态
     */
    withEnabled(enabled: boolean): this {
        this._entity.enabled = enabled;
        return this;
    }

    /**
     * 设置更新顺序
     */
    withUpdateOrder(order: number): this {
        this._entity.updateOrder = order;
        return this;
    }

    /**
     * 添加子实体
     */
    withChild(child: Entity): this {
        const hierarchySystem = this._entity.scene?.getSystem(HierarchySystem);
        hierarchySystem?.setParent(child, this._entity);
        return this;
    }

    /**
     * 完成构建
     */
    build(): Entity {
        return this._entity;
    }

    /**
     * 获取正在构建的实体
     */
    get entity(): Entity {
        return this._entity;
    }
}

/**
 * 创建类型安全的实体构建器
 *
 * @param entity - 要包装的实体
 * @returns 实体构建器
 */
export function buildEntity(entity: Entity): TypedEntityBuilder {
    return new TypedEntityBuilder(entity);
}
