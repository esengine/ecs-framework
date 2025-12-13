import { Component } from './Component';
import { ComponentRegistry, ComponentType } from './Core/ComponentStorage';
import { EEntityLifecyclePolicy } from './Core/EntityLifecyclePolicy';
import { BitMask64Utils, BitMask64Data } from './Utils/BigIntCompatibility';
import { createLogger } from '../Utils/Logger';
import { getComponentInstanceTypeName, getComponentTypeName } from './Decorators';
import { generateGUID } from '../Utils/GUID';
import type { IScene } from './IScene';

/**
 * 组件活跃状态变化接口
 */
interface IActiveChangeable {
    onActiveChanged(): void;
}

/**
 * 实体比较器
 *
 * 用于比较两个实体的优先级，首先按更新顺序比较，然后按ID比较。
 */
export class EntityComparer {
    /**
     * 比较两个实体
     *
     * @param self - 第一个实体
     * @param other - 第二个实体
     * @returns 比较结果，负数表示self优先级更高，正数表示other优先级更高，0表示相等
     */
    public compare(self: Entity, other: Entity): number {
        let compare = self.updateOrder - other.updateOrder;
        if (compare == 0) compare = self.id - other.id;
        return compare;
    }
}

/**
 * 游戏实体类
 *
 * ECS架构中的实体（Entity），作为组件的容器。
 * 实体本身不包含游戏逻辑，所有功能都通过组件来实现。
 *
 * 层级关系通过 HierarchyComponent 和 HierarchySystem 管理，
 * 而非 Entity 内置属性，符合 ECS 组合原则。
 *
 * @example
 * ```typescript
 * // 创建实体
 * const entity = scene.createEntity("Player");
 *
 * // 添加组件
 * const healthComponent = entity.addComponent(new HealthComponent(100));
 *
 * // 获取组件
 * const health = entity.getComponent(HealthComponent);
 *
 * // 层级关系使用 HierarchySystem
 * const hierarchySystem = scene.getSystem(HierarchySystem);
 * hierarchySystem.setParent(childEntity, parentEntity);
 * ```
 */
export class Entity {
    /**
     * Entity专用日志器
     */
    private static _logger = createLogger('Entity');

    /**
     * 实体比较器实例
     */
    public static entityComparer: EntityComparer = new EntityComparer();

    /**
     * 实体名称
     */
    public name: string;

    /**
     * 实体唯一标识符（运行时 ID）
     *
     * Runtime identifier for fast lookups.
     */
    public readonly id: number;

    /**
     * 持久化唯一标识符（GUID）
     *
     * 用于序列化/反序列化时保持实体引用一致性。
     * 在场景保存和加载时保持不变。
     *
     * Persistent identifier for serialization.
     * Remains stable across save/load cycles.
     */
    public readonly persistentId: string;

    /**
     * 所属场景引用
     */
    public scene: IScene | null = null;

    /**
     * 销毁状态标志
     */
    private _isDestroyed: boolean = false;

    /**
     * 激活状态
     */
    private _active: boolean = true;

    /**
     * 实体标签
     */
    private _tag: number = 0;

    /**
     * 启用状态
     */
    private _enabled: boolean = true;

    /**
     * 更新顺序
     */
    private _updateOrder: number = 0;

    /**
     * 组件位掩码（用于快速 hasComponent 检查）
     */
    private _componentMask: BitMask64Data = BitMask64Utils.clone(BitMask64Utils.ZERO);

    /**
     * 懒加载的组件数组缓存
     */
    private _componentCache: Component[] | null = null;

    /**
     * 生命周期策略
     *
     * Lifecycle policy for scene transitions.
     */
    private _lifecyclePolicy: EEntityLifecyclePolicy = EEntityLifecyclePolicy.SceneLocal;

    /**
     * 构造函数
     *
     * @param name - 实体名称
     * @param id - 实体唯一标识符（运行时 ID）
     * @param persistentId - 持久化标识符（可选，用于反序列化时恢复）
     */
    constructor(name: string, id: number, persistentId?: string) {
        this.name = name;
        this.id = id;
        this.persistentId = persistentId ?? generateGUID();
    }

    /**
     * 获取生命周期策略
     *
     * Get lifecycle policy.
     */
    public get lifecyclePolicy(): EEntityLifecyclePolicy {
        return this._lifecyclePolicy;
    }

    /**
     * 检查实体是否为持久化实体
     *
     * Check if entity is persistent (survives scene transitions).
     */
    public get isPersistent(): boolean {
        return this._lifecyclePolicy === EEntityLifecyclePolicy.Persistent;
    }

    /**
     * 设置实体为持久化（跨场景保留）
     *
     * 标记后的实体在场景切换时不会被销毁，会自动迁移到新场景。
     *
     * Mark entity as persistent (survives scene transitions).
     * Persistent entities are automatically migrated to the new scene.
     *
     * @returns this，支持链式调用 | Returns this for chaining
     *
     * @example
     * ```typescript
     * const player = scene.createEntity('Player')
     *     .setPersistent()
     *     .addComponent(new PlayerComponent());
     * ```
     */
    public setPersistent(): this {
        this._lifecyclePolicy = EEntityLifecyclePolicy.Persistent;
        return this;
    }

    /**
     * 设置实体为场景本地（随场景销毁）
     *
     * 将实体恢复为默认行为。
     *
     * Mark entity as scene-local (destroyed with scene).
     * Restores default behavior.
     *
     * @returns this，支持链式调用 | Returns this for chaining
     */
    public setSceneLocal(): this {
        this._lifecyclePolicy = EEntityLifecyclePolicy.SceneLocal;
        return this;
    }

    /**
     * 获取销毁状态
     * @returns 如果实体已被销毁则返回true
     */
    public get isDestroyed(): boolean {
        return this._isDestroyed;
    }

    /**
     * 设置销毁状态（内部使用）
     *
     * 此方法供Scene和批量操作使用，以提高性能。
     * 不应在普通业务逻辑中调用，应使用destroy()方法。
     *
     * @internal
     */
    public setDestroyedState(destroyed: boolean): void {
        this._isDestroyed = destroyed;
    }

    /**
     * 获取组件数组（懒加载）
     * @returns 只读的组件数组
     */
    public get components(): readonly Component[] {
        if (this._componentCache === null) {
            this._rebuildComponentCache();
        }
        return this._componentCache!;
    }

    /**
     * 从存储重建组件缓存
     */
    private _rebuildComponentCache(): void {
        const components: Component[] = [];

        if (!this.scene?.componentStorageManager) {
            this._componentCache = components;
            return;
        }

        const mask = this._componentMask;
        const maxBitIndex = ComponentRegistry.getRegisteredCount();

        for (let bitIndex = 0; bitIndex < maxBitIndex; bitIndex++) {
            if (BitMask64Utils.getBit(mask, bitIndex)) {
                const componentType = ComponentRegistry.getTypeByBitIndex(bitIndex);
                if (componentType) {
                    const component = this.scene.componentStorageManager.getComponent(this.id, componentType);

                    if (component) {
                        components.push(component);
                    }
                }
            }
        }

        this._componentCache = components;
    }

    /**
     * 获取活跃状态
     *
     * @returns 如果实体处于活跃状态则返回true
     */
    public get active(): boolean {
        return this._active;
    }

    /**
     * 设置活跃状态
     *
     * @param value - 新的活跃状态
     */
    public set active(value: boolean) {
        if (this._active !== value) {
            this._active = value;
            this.onActiveChanged();
        }
    }

    /**
     * 获取实体标签
     *
     * @returns 实体的数字标签
     */
    public get tag(): number {
        return this._tag;
    }

    /**
     * 设置实体标签
     *
     * @param value - 新的标签值
     */
    public set tag(value: number) {
        this._tag = value;
    }

    /**
     * 获取启用状态
     *
     * @returns 如果实体已启用则返回true
     */
    public get enabled(): boolean {
        return this._enabled;
    }

    /**
     * 设置启用状态
     *
     * @param value - 新的启用状态
     */
    public set enabled(value: boolean) {
        this._enabled = value;
    }

    /**
     * 获取更新顺序
     *
     * @returns 实体的更新顺序值
     */
    public get updateOrder(): number {
        return this._updateOrder;
    }

    /**
     * 设置更新顺序
     *
     * @param value - 新的更新顺序值
     */
    public set updateOrder(value: number) {
        this._updateOrder = value;
    }

    /**
     * 获取组件位掩码
     *
     * @returns 实体的组件位掩码
     */
    public get componentMask(): BitMask64Data {
        return this._componentMask;
    }

    /**
     * 创建并添加组件
     *
     * @param componentType - 组件类型构造函数
     * @param args - 组件构造函数参数
     * @returns 创建的组件实例
     *
     * @example
     * ```typescript
     * const position = entity.createComponent(Position, 100, 200);
     * const health = entity.createComponent(Health, 100);
     * ```
     */
    public createComponent<T extends Component>(
        componentType: ComponentType<T>,
        ...args: ConstructorParameters<ComponentType<T>>
    ): T {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const component = new componentType(...args);
        return this.addComponent(component);
    }

    /**
     * 内部添加组件方法（不进行重复检查，用于初始化）
     *
     * @param component - 要添加的组件实例
     * @returns 添加的组件实例
     */
    private addComponentInternal<T extends Component>(component: T): T {
        const componentType = component.constructor as ComponentType<T>;

        // 更新位掩码（组件已通过 @ECSComponent 装饰器自动注册）
        // Update bitmask (component already registered via @ECSComponent decorator)
        const componentMask = ComponentRegistry.getBitMask(componentType);
        BitMask64Utils.orInPlace(this._componentMask, componentMask);

        // 使缓存失效
        this._componentCache = null;

        return component;
    }

    /**
     * 通知Scene中的QuerySystem实体组件发生变动
     *
     * Notify the QuerySystem in Scene that entity components have changed
     *
     * @param changedComponentType 变化的组件类型（可选，用于优化通知） | Changed component type (optional, for optimized notification)
     */
    private notifyQuerySystems(changedComponentType?: ComponentType): void {
        if (this.scene && this.scene.querySystem) {
            this.scene.querySystem.updateEntity(this);
            this.scene.clearSystemEntityCaches();
            // 事件驱动：立即通知关心该组件的系统 | Event-driven: notify systems that care about this component
            if (this.scene.notifyEntityComponentChanged) {
                this.scene.notifyEntityComponentChanged(this, changedComponentType);
            }
        }
    }

    /**
     * 添加组件到实体
     *
     * @param component - 要添加的组件实例
     * @returns 添加的组件实例
     * @throws {Error} 如果实体已存在该类型的组件
     *
     * @example
     * ```typescript
     * const position = new Position(100, 200);
     * entity.addComponent(position);
     * ```
     */
    public addComponent<T extends Component>(component: T): T {
        const componentType = component.constructor as ComponentType<T>;

        if (!this.scene) {
            throw new Error(
                'Entity must be added to Scene before adding components. Use scene.createEntity() instead of new Entity()'
            );
        }

        if (!this.scene.componentStorageManager) {
            throw new Error('Scene does not have componentStorageManager');
        }

        if (this.hasComponent(componentType)) {
            throw new Error(`Entity ${this.name} already has component ${getComponentTypeName(componentType)}`);
        }

        this.addComponentInternal(component);

        this.scene.componentStorageManager.addComponent(this.id, component);

        component.entityId = this.id;
        if (this.scene.referenceTracker) {
            this.scene.referenceTracker.registerEntityScene(this.id, this.scene);
        }

        // 编辑器模式下延迟执行 onAddedToEntity | Defer onAddedToEntity in editor mode
        if (this.scene.isEditorMode) {
            this.scene.queueDeferredComponentCallback(() => {
                component.onAddedToEntity();
            });
        } else {
            component.onAddedToEntity();
        }

        if (this.scene && this.scene.eventSystem) {
            this.scene.eventSystem.emitSync('component:added', {
                timestamp: Date.now(),
                source: 'Entity',
                entityId: this.id,
                entityName: this.name,
                entityTag: this.tag?.toString(),
                componentType: getComponentTypeName(componentType),
                component: component
            });
        }

        this.notifyQuerySystems(componentType);

        return component;
    }

    /**
     * 获取指定类型的组件
     *
     * @param type - 组件类型构造函数
     * @returns 组件实例，如果不存在则返回null
     *
     * @example
     * ```typescript
     * const position = entity.getComponent(Position);
     * if (position) {
     *     position.x += 10;
     *     position.y += 20;
     * }
     * ```
     */
    public getComponent<T extends Component>(type: ComponentType<T>): T | null {
        // 快速检查：位掩码
        if (!this.hasComponent(type)) {
            return null;
        }

        // 从Scene存储获取
        if (!this.scene?.componentStorageManager) {
            return null;
        }

        const component = this.scene.componentStorageManager.getComponent(this.id, type);
        return component as T | null;
    }

    /**
     * 检查实体是否拥有指定类型的组件
     *
     * @param type - 组件类型构造函数
     * @returns 如果实体拥有该组件返回true，否则返回false
     *
     * @example
     * ```typescript
     * if (entity.hasComponent(Position)) {
     *     const position = entity.getComponent(Position)!;
     *     position.x += 10;
     * }
     * ```
     */
    public hasComponent<T extends Component>(type: ComponentType<T>): boolean {
        if (!ComponentRegistry.isRegistered(type)) {
            return false;
        }

        const mask = ComponentRegistry.getBitMask(type);
        return BitMask64Utils.hasAny(this._componentMask, mask);
    }

    /**
     * 获取或创建指定类型的组件
     *
     * 如果组件已存在则返回现有组件，否则创建新组件并添加到实体
     *
     * @param type - 组件类型构造函数
     * @param args - 组件构造函数参数（仅在创建新组件时使用）
     * @returns 组件实例
     *
     * @example
     * ```typescript
     * // 确保实体拥有Position组件
     * const position = entity.getOrCreateComponent(Position, 0, 0);
     * position.x = 100;
     * ```
     */
    public getOrCreateComponent<T extends Component>(
        type: ComponentType<T>,
        ...args: ConstructorParameters<ComponentType<T>>
    ): T {
        let component = this.getComponent(type);
        if (!component) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            component = this.createComponent(type, ...args);
        }
        return component;
    }

    /**
     * 移除指定的组件
     *
     * @param component - 要移除的组件实例
     */
    public removeComponent(component: Component): void {
        const componentType = component.constructor as ComponentType;

        if (!ComponentRegistry.isRegistered(componentType)) {
            return;
        }

        const bitIndex = ComponentRegistry.getBitIndex(componentType);

        // 更新位掩码
        BitMask64Utils.clearBit(this._componentMask, bitIndex);

        // 使缓存失效
        this._componentCache = null;

        // 从Scene存储移除
        if (this.scene?.componentStorageManager) {
            this.scene.componentStorageManager.removeComponent(this.id, componentType);
        }

        if (this.scene?.referenceTracker) {
            this.scene.referenceTracker.clearComponentReferences(component);
        }

        if (component.onRemovedFromEntity) {
            component.onRemovedFromEntity();
        }

        component.entityId = null;

        if (this.scene && this.scene.eventSystem) {
            this.scene.eventSystem.emitSync('component:removed', {
                timestamp: Date.now(),
                source: 'Entity',
                entityId: this.id,
                entityName: this.name,
                entityTag: this.tag?.toString(),
                componentType: getComponentTypeName(componentType),
                component: component
            });
        }

        this.notifyQuerySystems(componentType);
    }

    /**
     * 移除指定类型的组件
     *
     * @param type - 组件类型
     * @returns 被移除的组件实例或null
     */
    public removeComponentByType<T extends Component>(type: ComponentType<T>): T | null {
        const component = this.getComponent(type);
        if (component) {
            this.removeComponent(component);
            return component;
        }
        return null;
    }

    /**
     * 移除所有组件
     */
    public removeAllComponents(): void {
        const componentsToRemove = [...this.components];

        // 清除位掩码
        BitMask64Utils.clear(this._componentMask);

        // 使缓存失效
        this._componentCache = null;

        for (const component of componentsToRemove) {
            const componentType = component.constructor as ComponentType;

            if (this.scene?.componentStorageManager) {
                this.scene.componentStorageManager.removeComponent(this.id, componentType);
            }

            component.onRemovedFromEntity();
        }

        this.notifyQuerySystems();
    }

    /**
     * 批量添加组件
     *
     * @param components - 要添加的组件数组
     * @returns 添加的组件数组
     */
    public addComponents<T extends Component>(components: T[]): T[] {
        const addedComponents: T[] = [];

        for (const component of components) {
            try {
                addedComponents.push(this.addComponent(component));
            } catch (error) {
                Entity._logger.warn(`添加组件失败 ${getComponentInstanceTypeName(component)}:`, error);
            }
        }

        return addedComponents;
    }

    /**
     * 批量移除组件类型
     *
     * @param componentTypes - 要移除的组件类型数组
     * @returns 被移除的组件数组
     */
    public removeComponentsByTypes<T extends Component>(componentTypes: ComponentType<T>[]): (T | null)[] {
        const removedComponents: (T | null)[] = [];

        for (const componentType of componentTypes) {
            removedComponents.push(this.removeComponentByType(componentType));
        }

        return removedComponents;
    }

    /**
     * 获取所有指定类型的组件
     *
     * @param type - 组件类型
     * @returns 组件实例数组
     */
    public getComponents<T extends Component>(type: ComponentType<T>): T[] {
        const result: T[] = [];

        for (const component of this.components) {
            if (component instanceof type) {
                result.push(component as T);
            }
        }

        return result;
    }

    /**
     * 获取指定基类的组件（支持继承查找）
     *
     * 与 getComponent() 不同，此方法使用 instanceof 检查，支持子类查找。
     * 性能比位掩码查询稍慢，但支持继承层次结构。
     *
     * @param baseType - 组件基类类型
     * @returns 第一个匹配的组件实例，如果不存在则返回 null
     *
     * @example
     * ```typescript
     * // 查找 CompositeNodeComponent 或其子类
     * const composite = entity.getComponentByType(CompositeNodeComponent);
     * if (composite) {
     *     // composite 可能是 SequenceNode, SelectorNode 等
     * }
     * ```
     */
    public getComponentByType<T extends Component>(baseType: ComponentType<T>): T | null {
        for (const component of this.components) {
            if (component instanceof baseType) {
                return component as T;
            }
        }
        return null;
    }

    /**
     * 活跃状态改变时的回调
     */
    private onActiveChanged(): void {
        for (const component of this.components) {
            if ('onActiveChanged' in component && typeof component.onActiveChanged === 'function') {
                (component as IActiveChangeable).onActiveChanged();
            }
        }

        if (this.scene && this.scene.eventSystem) {
            this.scene.eventSystem.emitSync('entity:activeChanged', {
                entity: this,
                active: this._active
            });
        }
    }

    /**
     * 销毁实体
     *
     * 移除所有组件并标记为已销毁。
     * 层级关系的清理由 HierarchySystem 处理。
     */
    public destroy(): void {
        if (this._isDestroyed) {
            return;
        }

        this._isDestroyed = true;

        if (this.scene && this.scene.referenceTracker) {
            this.scene.referenceTracker.clearReferencesTo(this.id);
            this.scene.referenceTracker.unregisterEntityScene(this.id);
        }

        this.removeAllComponents();

        if (this.scene) {
            if (this.scene.querySystem) {
                this.scene.querySystem.removeEntity(this);
            }

            if (this.scene.entities) {
                this.scene.entities.remove(this);
            }
        }
    }

    /**
     * 比较实体
     *
     * @param other - 另一个实体
     * @returns 比较结果
     */
    public compareTo(other: Entity): number {
        return EntityComparer.prototype.compare(this, other);
    }

    /**
     * 获取实体的字符串表示
     *
     * @returns 实体的字符串描述
     */
    public toString(): string {
        return `Entity[${this.name}:${this.id}:${this.persistentId.slice(0, 8)}]`;
    }

    /**
     * 获取实体的调试信息（包含组件缓存信息）
     *
     * @returns 包含实体详细信息的对象
     */
    public getDebugInfo(): {
        name: string;
        id: number;
        persistentId: string;
        enabled: boolean;
        active: boolean;
        destroyed: boolean;
        componentCount: number;
        componentTypes: string[];
        componentMask: string;
        cacheBuilt: boolean;
    } {
        return {
            name: this.name,
            id: this.id,
            persistentId: this.persistentId,
            enabled: this._enabled,
            active: this._active,
            destroyed: this._isDestroyed,
            componentCount: this.components.length,
            componentTypes: this.components.map((c) => getComponentInstanceTypeName(c)),
            componentMask: BitMask64Utils.toString(this._componentMask, 2),
            cacheBuilt: this._componentCache !== null
        };
    }
}
