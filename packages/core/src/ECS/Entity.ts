import { Component } from './Component';
import { ComponentRegistry, ComponentType } from './Core/ComponentStorage';
import { BitMask64Utils, BitMask64Data } from './Utils/BigIntCompatibility';
import { createLogger } from '../Utils/Logger';
import { getComponentInstanceTypeName, getComponentTypeName } from './Decorators';
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
 * 支持父子关系，可以构建实体层次结构。
 *
 * @example
 * ```typescript
 * // 创建实体
 * const entity = new Entity("Player", 1);
 *
 * // 添加组件
 * const healthComponent = entity.addComponent(new HealthComponent(100));
 *
 * // 获取组件
 * const health = entity.getComponent(HealthComponent);
 *
 * // 添加位置组件
 * entity.addComponent(new PositionComponent(100, 200));
 *
 * // 添加子实体
 * const weapon = new Entity("Weapon", 2);
 * entity.addChild(weapon);
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
     * 实体唯一标识符
     */
    public readonly id: number;

    /**
     * 所属场景引用
     */
    public scene: IScene | null = null;

    /**
     * 销毁状态标志
     */
    private _isDestroyed: boolean = false;

    /**
     * 父实体引用
     */
    private _parent: Entity | null = null;

    /**
     * 子实体集合
     */
    private _children: Entity[] = [];

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
     * 构造函数
     *
     * @param name - 实体名称
     * @param id - 实体唯一标识符
     */
    constructor(name: string, id: number) {
        this.name = name;
        this.id = id;
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
     * 获取父实体
     * @returns 父实体，如果没有父实体则返回null
     */
    public get parent(): Entity | null {
        return this._parent;
    }

    /**
     * 获取子实体数组的只读副本
     *
     * @returns 子实体数组的副本
     */
    public get children(): readonly Entity[] {
        return [...this._children];
    }

    /**
     * 获取子实体数量
     *
     * @returns 子实体的数量
     */
    public get childCount(): number {
        return this._children.length;
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
     * 设置实体的活跃状态，会影响子实体的有效活跃状态。
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
     * 获取实体的有效活跃状态
     *
     * 考虑父实体的活跃状态，只有当实体本身和所有父实体都处于活跃状态时才返回true。
     *
     * @returns 有效的活跃状态
     */
    public get activeInHierarchy(): boolean {
        if (!this._active) return false;
        if (this._parent) return this._parent.activeInHierarchy;
        return true;
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

        if (!ComponentRegistry.isRegistered(componentType)) {
            ComponentRegistry.register(componentType);
        }

        // 更新位掩码
        const componentMask = ComponentRegistry.getBitMask(componentType);
        BitMask64Utils.orInPlace(this._componentMask, componentMask);

        // 使缓存失效
        this._componentCache = null;

        return component;
    }

    /**
     * 通知Scene中的QuerySystem实体组件发生变动
     */
    private notifyQuerySystems(): void {
        if (this.scene && this.scene.querySystem) {
            this.scene.querySystem.updateEntity(this);
            this.scene.clearSystemEntityCaches();
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
        component.onAddedToEntity();

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

        this.notifyQuerySystems();

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

        this.notifyQuerySystems();
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
     * 添加子实体
     *
     * @param child - 要添加的子实体
     * @returns 添加的子实体
     */
    public addChild(child: Entity): Entity {
        if (child === this) {
            throw new Error('Entity cannot be its own child');
        }

        if (child._parent === this) {
            return child; // 已经是子实体
        }

        if (child._parent) {
            child._parent.removeChild(child);
        }

        child._parent = this;
        this._children.push(child);

        if (!child.scene && this.scene) {
            child.scene = this.scene;
            this.scene.addEntity(child);
        }

        return child;
    }

    /**
     * 移除子实体
     *
     * @param child - 要移除的子实体
     * @returns 是否成功移除
     */
    public removeChild(child: Entity): boolean {
        const index = this._children.indexOf(child);
        if (index === -1) {
            return false;
        }

        this._children.splice(index, 1);
        child._parent = null;

        return true;
    }

    /**
     * 移除所有子实体
     */
    public removeAllChildren(): void {
        const childrenToRemove = [...this._children];

        for (const child of childrenToRemove) {
            this.removeChild(child);
        }
    }

    /**
     * 根据名称查找子实体
     *
     * @param name - 子实体名称
     * @param recursive - 是否递归查找
     * @returns 找到的子实体或null
     */
    public findChild(name: string, recursive: boolean = false): Entity | null {
        for (const child of this._children) {
            if (child.name === name) {
                return child;
            }
        }

        if (recursive) {
            for (const child of this._children) {
                const found = child.findChild(name, true);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }

    /**
     * 根据标签查找子实体
     *
     * @param tag - 标签
     * @param recursive - 是否递归查找
     * @returns 找到的子实体数组
     */
    public findChildrenByTag(tag: number, recursive: boolean = false): Entity[] {
        const result: Entity[] = [];

        for (const child of this._children) {
            if (child.tag === tag) {
                result.push(child);
            }
        }

        if (recursive) {
            for (const child of this._children) {
                result.push(...child.findChildrenByTag(tag, true));
            }
        }

        return result;
    }

    /**
     * 获取根实体
     *
     * @returns 层次结构的根实体
     */
    public getRoot(): Entity {
        if (!this._parent) {
            return this;
        }
        return this._parent.getRoot();
    }

    /**
     * 检查是否是指定实体的祖先
     *
     * @param entity - 要检查的实体
     * @returns 如果是祖先则返回true
     */
    public isAncestorOf(entity: Entity): boolean {
        let current = entity._parent;
        while (current) {
            if (current === this) {
                return true;
            }
            current = current._parent;
        }
        return false;
    }

    /**
     * 检查是否是指定实体的后代
     *
     * @param entity - 要检查的实体
     * @returns 如果是后代则返回true
     */
    public isDescendantOf(entity: Entity): boolean {
        return entity.isAncestorOf(this);
    }

    /**
     * 获取层次深度
     *
     * @returns 在层次结构中的深度（根实体为0）
     */
    public getDepth(): number {
        let depth = 0;
        let current = this._parent;
        while (current) {
            depth++;
            current = current._parent;
        }
        return depth;
    }

    /**
     * 遍历所有子实体（深度优先）
     *
     * @param callback - 对每个子实体执行的回调函数
     * @param recursive - 是否递归遍历
     */
    public forEachChild(callback: (child: Entity, index: number) => void, recursive: boolean = false): void {
        this._children.forEach((child, index) => {
            callback(child, index);
            if (recursive) {
                child.forEachChild(callback, true);
            }
        });
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
                active: this._active,
                activeInHierarchy: this.activeInHierarchy
            });
        }
    }

    /**
     * 销毁实体
     *
     * 移除所有组件、子实体并标记为已销毁
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

        const childrenToDestroy = [...this._children];
        for (const child of childrenToDestroy) {
            child.destroy();
        }

        if (this._parent) {
            this._parent.removeChild(this);
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
     * 批量销毁所有子实体
     */
    public destroyAllChildren(): void {
        if (this._children.length === 0) return;

        const scene = this.scene;
        const toDestroy: Entity[] = [];

        const collectChildren = (entity: Entity) => {
            for (const child of entity._children) {
                toDestroy.push(child);
                collectChildren(child);
            }
        };
        collectChildren(this);

        for (const entity of toDestroy) {
            entity.setDestroyedState(true);
        }

        for (const entity of toDestroy) {
            entity.removeAllComponents();
        }

        if (scene) {
            for (const entity of toDestroy) {
                scene.entities.remove(entity);
                scene.querySystem.removeEntity(entity);
            }

            scene.clearSystemEntityCaches();
        }

        this._children.length = 0;
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
        return `Entity[${this.name}:${this.id}]`;
    }

    /**
     * 获取实体的调试信息（包含组件缓存信息）
     *
     * @returns 包含实体详细信息的对象
     */
    public getDebugInfo(): {
        name: string;
        id: number;
        enabled: boolean;
        active: boolean;
        activeInHierarchy: boolean;
        destroyed: boolean;
        componentCount: number;
        componentTypes: string[];
        componentMask: string;
        parentId: number | null;
        childCount: number;
        childIds: number[];
        depth: number;
        cacheBuilt: boolean;
        } {
        return {
            name: this.name,
            id: this.id,
            enabled: this._enabled,
            active: this._active,
            activeInHierarchy: this.activeInHierarchy,
            destroyed: this._isDestroyed,
            componentCount: this.components.length,
            componentTypes: this.components.map((c) => getComponentInstanceTypeName(c)),
            componentMask: BitMask64Utils.toString(this._componentMask, 2), // 二进制表示
            parentId: this._parent?.id || null,
            childCount: this._children.length,
            childIds: this._children.map((c) => c.id),
            depth: this.getDepth(),
            cacheBuilt: this._componentCache !== null
        };
    }
}
