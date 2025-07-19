import { Component } from './Component';
import { ComponentRegistry, ComponentType } from './Core/ComponentStorage';
import { EventBus } from './Core/EventBus';

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
        if (compare == 0)
            compare = self.id - other.id;
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
     * 实体比较器实例
     */
    public static entityComparer: EntityComparer = new EntityComparer();
    
    /**
     * 全局事件总线实例
     * 用于发射组件相关事件
     */
    public static eventBus: EventBus | null = null;
    
    /**
     * 实体名称
     * 
     * 用于标识和调试的友好名称。
     */
    public name: string;
    
    /**
     * 实体唯一标识符
     * 
     * 在场景中唯一的数字标识符。
     */
    public readonly id: number;
    
    /**
     * 组件数量缓存
     * 
     * 用于快速获取组件数量，避免遍历存储系统。
     */
    private _componentCount: number = 0;
    
    /**
     * 所属场景引用
     * 
     * 指向实体所在的场景实例。
     */
    public scene: any; // 使用any避免循环依赖
    
    /**
     * 更新间隔
     * 
     * 控制实体更新的频率，值越大更新越不频繁。
     */
    public updateInterval: number = 1;
    
    /**
     * 销毁状态标志
     * 
     * 标记实体是否已被销毁。
     */
    public _isDestroyed: boolean = false;

    /**
     * 父实体引用
     * 
     * 指向父级实体，用于构建实体层次结构。
     */
    private _parent: Entity | null = null;

    /**
     * 子实体集合
     * 
     * 存储所有子级实体的数组。
     */
    private _children: Entity[] = [];

    /**
     * 激活状态
     * 
     * 控制实体是否处于激活状态。
     */
    private _active: boolean = true;
    
    /**
     * 实体标签
     * 
     * 用于分类和查询的数字标签。
     */
    private _tag: number = 0;
    
    /**
     * 启用状态
     * 
     * 控制实体是否启用更新和处理。
     */
    private _enabled: boolean = true;
    
    /**
     * 更新顺序
     * 
     * 控制实体在系统中的更新优先级。
     */
    private _updateOrder: number = 0;

    /**
     * 组件位掩码
     * 
     * 用于快速查询实体拥有的组件类型。
     */
    private _componentMask: bigint = BigInt(0);

    /**
     * 缓存的组件类型集合
     * 
     * 用于快速检查实体是否拥有特定组件类型，避免重复查询存储系统。
     */
    private _componentTypes = new Set<ComponentType>();

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
     * 
     * @returns 如果实体已被销毁则返回true
     */
    public get isDestroyed(): boolean {
        return this._isDestroyed;
    }

    /**
     * 获取父实体
     * 
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
    public get componentMask(): bigint {
        return this._componentMask;
    }

    /**
     * 获取组件数量
     * 
     * @returns 实体拥有的组件数量
     */
    public get componentCount(): number {
        return this._componentCount;
    }

    /**
     * 获取组件类型集合（只读）
     * 
     * @returns 实体拥有的组件类型集合
     */
    public get componentTypes(): ReadonlySet<ComponentType> {
        return this._componentTypes;
    }

    /**
     * 创建并添加组件
     * 
     * @param componentType - 组件类型
     * @param args - 组件构造函数参数
     * @returns 创建的组件实例
     */
    public createComponent<T extends Component>(
        componentType: ComponentType<T>, 
        ...args: any[]
    ): T {
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

        // 注册组件类型（如果尚未注册）
        if (!ComponentRegistry.isRegistered(componentType)) {
            ComponentRegistry.register(componentType);
        }

        // 设置组件的实体引用
        component.entity = this;

        // 更新组件类型缓存和数量
        this._componentTypes.add(componentType);
        this._componentCount++;

        // 更新位掩码
        this._componentMask |= ComponentRegistry.getBitMask(componentType);

        return component;
    }

    /**
     * 添加组件到实体
     * 
     * @param component - 要添加的组件实例
     * @returns 添加的组件实例
     * @throws {Error} 如果组件类型已存在
     */
    public addComponent<T extends Component>(component: T): T {
        const componentType = component.constructor as ComponentType<T>;
        
        // 检查是否已有此类型的组件
        if (this.hasComponent(componentType)) {
            throw new Error(`Entity ${this.name} already has component ${componentType.name}`);
        }

        // 使用内部方法添加组件
        this.addComponentInternal(component);
        
        // 如果场景存在且有组件存储管理器，添加到存储器
        if (this.scene && this.scene.componentStorageManager) {
            this.scene.componentStorageManager.addComponent(this.id, component);
        }

        // 调用组件的生命周期方法
        component.onAddedToEntity();
        
        // 发射组件添加事件
        if (Entity.eventBus) {
            Entity.eventBus.emitComponentAdded({
                timestamp: Date.now(),
                source: 'Entity',
                entityId: this.id,
                entityName: this.name,
                entityTag: this.tag?.toString(),
                componentType: componentType.name,
                component: component
            });
        }
        
        // 通知场景实体已改变
        if (this.scene && this.scene.entityProcessors) {
            for (const processor of this.scene.entityProcessors.processors) {
                processor.onChanged(this);
            }
        }

        return component;
    }

    /**
     * 获取指定类型的组件
     * 
     * @param type - 组件类型
     * @returns 组件实例或null
     */
    public getComponent<T extends Component>(type: ComponentType<T>): T | null {
        // 首先检查位掩码，快速排除（O(1)）
        if (!ComponentRegistry.isRegistered(type)) {
            return null;
        }

        const mask = ComponentRegistry.getBitMask(type);
        if ((this._componentMask & mask) === BigInt(0)) {
            return null;
        }

        // 从组件存储管理器获取组件（统一存储）
        if (this.scene && this.scene.componentStorageManager) {
            return this.scene.componentStorageManager.getComponent(this.id, type);
        }

        return null;
    }



    /**
     * 检查实体是否有指定类型的组件
     * 
     * @param type - 组件类型
     * @returns 如果有该组件则返回true
     */
    public hasComponent<T extends Component>(type: ComponentType<T>): boolean {
        if (!ComponentRegistry.isRegistered(type)) {
            return false;
        }
        
        const mask = ComponentRegistry.getBitMask(type);
        return (this._componentMask & mask) !== BigInt(0);
    }

    /**
     * 获取或创建指定类型的组件
     * 
     * @param type - 组件类型
     * @param args - 组件构造函数参数（仅在创建时使用）
     * @returns 组件实例
     */
    public getOrCreateComponent<T extends Component>(
        type: ComponentType<T>, 
        ...args: any[]
    ): T {
        let component = this.getComponent(type);
        if (!component) {
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
        
        // 更新组件类型缓存和数量
        if (this._componentTypes.has(componentType)) {
            this._componentTypes.delete(componentType);
            this._componentCount--;
        }

        // 更新位掩码
        if (ComponentRegistry.isRegistered(componentType)) {
            this._componentMask &= ~ComponentRegistry.getBitMask(componentType);
        }

        // 从组件存储管理器中移除
        if (this.scene && this.scene.componentStorageManager) {
            this.scene.componentStorageManager.removeComponent(this.id, componentType);
        }

        // 调用组件的生命周期方法
        component.onRemovedFromEntity();
        
        // 发射组件移除事件
        if (Entity.eventBus) {
            Entity.eventBus.emitComponentRemoved({
                timestamp: Date.now(),
                source: 'Entity',
                entityId: this.id,
                entityName: this.name,
                entityTag: this.tag?.toString(),
                componentType: componentType.name,
                component: component
            });
        }
        
        // 清除组件的实体引用
        component.entity = null as any;

        // 通知场景实体已改变
        if (this.scene && this.scene.entityProcessors) {
            for (const processor of this.scene.entityProcessors.processors) {
                processor.onChanged(this);
            }
        }
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
        // 获取所有组件类型，避免在迭代时修改
        const componentTypesToRemove = Array.from(this._componentTypes);
        
        // 清空缓存和位掩码
        this._componentTypes.clear();
        this._componentCount = 0;
        this._componentMask = BigInt(0);
        
        // 移除所有组件
        if (this.scene && this.scene.componentStorageManager) {
            for (const componentType of componentTypesToRemove) {
                const component = this.scene.componentStorageManager.getComponent(this.id, componentType);
                if (component) {
                    // 调用组件的生命周期方法
                    component.onRemovedFromEntity();
                    
                    // 清除组件的实体引用
                    component.entity = null as any;
                }
                
                // 从组件存储管理器中移除
                this.scene.componentStorageManager.removeComponent(this.id, componentType);
            }
        }

        // 通知场景实体已改变
        if (this.scene && this.scene.entityProcessors) {
            for (const processor of this.scene.entityProcessors.processors) {
                processor.onChanged(this);
            }
        }
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
                // 如果某个组件添加失败，继续添加其他组件
                console.warn(`添加组件失败 ${component.constructor.name}:`, error);
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
        
        // 如果有存储管理器，使用批量操作
        if (this.scene && this.scene.componentStorageManager && componentTypes.length > 1) {
            this.scene.componentStorageManager.beginBatchUpdate();
            
            for (const componentType of componentTypes) {
                removedComponents.push(this.removeComponentByType(componentType));
            }
            
            this.scene.componentStorageManager.commitBatchUpdates();
        } else {
            // 逐个移除
            for (const componentType of componentTypes) {
                removedComponents.push(this.removeComponentByType(componentType));
            }
        }
        
        return removedComponents;
    }

    /**
     * 批量添加组件（优化版本）
     * 
     * 使用批量操作模式来提升性能，特别适合在实体初始化时添加多个组件。
     * 
     * @param components - 要添加的组件数组
     * @returns 添加的组件数组
     */
    public addComponentsBatch<T extends Component>(components: T[]): T[] {
        if (components.length === 0) {
            return [];
        }

        const addedComponents: T[] = [];

        // 如果有存储管理器且组件数量大于1，使用批量操作
        if (this.scene && this.scene.componentStorageManager && components.length > 1) {
            this.scene.componentStorageManager.beginBatchUpdate();
            
            try {
                for (const component of components) {
                    try {
                        addedComponents.push(this.addComponent(component));
                    } catch (error) {
                        console.warn(`批量添加组件失败 ${component.constructor.name}:`, error);
                    }
                }
            } finally {
                this.scene.componentStorageManager.commitBatchUpdates();
            }
        } else {
            // 使用原有的批量添加方法
            return this.addComponents(components);
        }

        return addedComponents;
    }

    /**
     * 快速检查多个组件类型
     * 
     * 优化的批量组件检查，减少重复的位掩码计算。
     * 
     * @param componentTypes - 要检查的组件类型数组
     * @returns 对应的检查结果数组
     */
    public hasMultipleComponents(componentTypes: ComponentType[]): boolean[] {
        const results: boolean[] = new Array(componentTypes.length);
        
        for (let i = 0; i < componentTypes.length; i++) {
            results[i] = this.hasComponent(componentTypes[i]);
        }
        
        return results;
    }

    /**
     * 批量获取多个组件
     * 
     * 优化的批量组件获取，减少存储器查找开销。
     * 
     * @param componentTypes - 要获取的组件类型数组
     * @returns 对应的组件数组，不存在的组件为null
     */
    public getMultipleComponents(componentTypes: ComponentType[]): (Component | null)[] {
        const results: (Component | null)[] = new Array(componentTypes.length);
        
        for (let i = 0; i < componentTypes.length; i++) {
            results[i] = this.getComponent(componentTypes[i]);
        }
        
        return results;
    }



    /**
     * 获取所有指定类型的组件
     * 
     * @param type - 组件类型
     * @returns 组件实例数组
     */
    public getComponents<T extends Component>(type: ComponentType<T>): T[] {
        const result: T[] = [];
        
        // 从组件存储管理器获取
        if (this.scene && this.scene.componentStorageManager) {
            const component = this.scene.componentStorageManager.getComponent(this.id, type);
            if (component) {
                result.push(component);
            }
        }
        
        return result;
    }

    /**
     * 添加子实体
     * 
     * @param child - 要添加的子实体
     * @returns 添加的子实体
     */
    public addChild(child: Entity): Entity {
        if (child === this) {
            throw new Error("Entity cannot be its own child");
        }

        if (child._parent === this) {
            return child; // 已经是子实体
        }

        // 如果子实体已有父实体，先从原父实体移除
        if (child._parent) {
            child._parent.removeChild(child);
        }

        // 设置父子关系
        child._parent = this;
        this._children.push(child);

        // 如果子实体还没有场景，设置为父实体的场景
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

        // 移除父子关系
        this._children.splice(index, 1);
        child._parent = null;

        return true;
    }

    /**
     * 移除所有子实体
     */
    public removeAllChildren(): void {
        // 复制子实体列表，避免在迭代时修改
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
        // 在直接子实体中查找
        for (const child of this._children) {
            if (child.name === name) {
                return child;
            }
        }

        // 递归查找
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

        // 在直接子实体中查找
        for (const child of this._children) {
            if (child.tag === tag) {
                result.push(child);
            }
        }

        // 递归查找
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
        let root: Entity = this;
        while (root._parent) {
            root = root._parent;
        }
        return root;
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
        // 通知所有组件活跃状态改变
        if (this.scene && this.scene.componentStorageManager) {
            for (const componentType of this._componentTypes) {
                const component = this.scene.componentStorageManager.getComponent(this.id, componentType);
                if (component && 'onActiveChanged' in component && typeof component.onActiveChanged === 'function') {
                    (component as any).onActiveChanged();
                }
            }
        }

        // 通知场景实体状态改变
        if (this.scene && this.scene.eventSystem) {
            this.scene.eventSystem.emitSync('entity:activeChanged', { 
                entity: this, 
                active: this._active,
                activeInHierarchy: this.activeInHierarchy
            });
        }
    }

    /**
     * 更新实体
     * 
     * 调用所有组件的更新方法，并更新子实体。
     */
    public update(): void {
        if (!this.activeInHierarchy || this._isDestroyed) {
            return;
        }

        // 更新所有组件
        if (this.scene && this.scene.componentStorageManager) {
            for (const componentType of this._componentTypes) {
                const component = this.scene.componentStorageManager.getComponent(this.id, componentType);
                if (component && component.enabled) {
                    component.update();
                }
            }
        }

        // 更新所有子实体
        for (const child of this._children) {
            child.update();
        }
    }

    /**
     * 销毁实体
     * 
     * 移除所有组件、子实体并标记为已销毁。
     */
    public destroy(): void {
        if (this._isDestroyed) {
            return;
        }

        this._isDestroyed = true;
        
        // 销毁所有子实体
        const childrenToDestroy = [...this._children];
        for (const child of childrenToDestroy) {
            child.destroy();
        }
        
        // 从父实体中移除
        if (this._parent) {
            this._parent.removeChild(this);
        }
        
        // 移除所有组件
        this.removeAllComponents();
        
        // 从场景中移除
        if (this.scene && this.scene.entities) {
            this.scene.entities.remove(this);
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
        cachedComponentTypesSize: number;
    } {
        return {
            name: this.name,
            id: this.id,
            enabled: this._enabled,
            active: this._active,
            activeInHierarchy: this.activeInHierarchy,
            destroyed: this._isDestroyed,
            componentCount: this._componentCount,
            componentTypes: Array.from(this._componentTypes).map(t => t.name),
            componentMask: this._componentMask.toString(2), // 二进制表示
            parentId: this._parent?.id || null,
            childCount: this._children.length,
            childIds: this._children.map(c => c.id),
            depth: this.getDepth(),
            cachedComponentTypesSize: this._componentTypes.size
        };
    }
}
