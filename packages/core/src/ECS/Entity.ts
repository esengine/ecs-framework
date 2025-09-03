import { Component } from './Component';
import { ComponentRegistry, ComponentType } from './Core/ComponentStorage';
import { EventBus } from './Core/EventBus';
import { BitMask64Utils, BitMask64Data } from './Utils/BigIntCompatibility';
import { createLogger } from '../Utils/Logger';
import { getComponentInstanceTypeName, getComponentTypeName } from './Decorators';
import type { IScene } from './IScene';

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
     * Entity专用日志器
     */
    private static _logger = createLogger('Entity');
    
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
     */
    public name: string;
    
    /**
     * 实体唯一标识符
     */
    public readonly id: number;
    
    /**
     * 组件集合
     */
    public readonly components: Component[] = [];
    
    /**
     * 所属场景引用
     */
    public scene: IScene | null = null;
    
    /**
     * 更新间隔
     */
    public updateInterval: number = 1;
    
    /**
     * 销毁状态标志
     */
    public _isDestroyed: boolean = false;

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
     * 组件位掩码
     */
    private _componentMask: BitMask64Data = BitMask64Utils.clone(BitMask64Utils.ZERO);

    /**
     * 按组件类型ID直址的稀疏数组
     */
    private _componentsByTypeId: (Component | undefined)[] = [];

    /**
     * typeId到components数组中密集索引的映射表
     */
    private _componentDenseIndexByTypeId: number[] = [];

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

        if (!ComponentRegistry.isRegistered(componentType)) {
            ComponentRegistry.register(componentType);
        }

        const typeId = ComponentRegistry.getBitIndex(componentType);

        component.entity = this;

        this._componentsByTypeId[typeId] = component;
        
        const denseIndex = this.components.length;
        this._componentDenseIndexByTypeId[typeId] = denseIndex;
        this.components.push(component);

        const componentMask = ComponentRegistry.getBitMask(componentType);
        BitMask64Utils.orInPlace(this._componentMask, componentMask);

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
        
        if (this.hasComponent(componentType)) {
            throw new Error(`Entity ${this.name} already has component ${getComponentTypeName(componentType)}`);
        }

        this.addComponentInternal(component);
        
        if (this.scene && this.scene.componentStorageManager) {
            this.scene.componentStorageManager.addComponent(this.id, component);
        }

        component.onAddedToEntity();
        
        if (Entity.eventBus) {
            Entity.eventBus.emitComponentAdded({
                timestamp: Date.now(),
                source: 'Entity',
                entityId: this.id,
                entityName: this.name,
                entityTag: this.tag?.toString(),
                componentType: getComponentTypeName(componentType),
                component: component
            });
        }
        
        
        if (this.scene && this.scene.querySystem) {
            this.scene.querySystem.removeEntity(this);
            this.scene.querySystem.addEntity(this);
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
        if (!ComponentRegistry.isRegistered(type)) {
            return null;
        }

        const mask = ComponentRegistry.getBitMask(type);
        if (BitMask64Utils.hasNone(this._componentMask, mask)) {
            return null;
        }

        const typeId = ComponentRegistry.getBitIndex(type);
        const component = this._componentsByTypeId[typeId];
        
        if (component && component.constructor === type) {
            return component as T;
        }

        if (this.scene && this.scene.componentStorageManager) {
            const storageComponent = this.scene.componentStorageManager.getComponent(this.id, type);
            if (storageComponent) {
                this._componentsByTypeId[typeId] = storageComponent;
                if (!this.components.includes(storageComponent)) {
                    const denseIndex = this.components.length;
                    this._componentDenseIndexByTypeId[typeId] = denseIndex;
                    this.components.push(storageComponent);
                }
                return storageComponent;
            }
        }

        for (let i = 0; i < this.components.length; i++) {
            const component = this.components[i];
            if (component instanceof type) {
                this._componentsByTypeId[typeId] = component;
                this._componentDenseIndexByTypeId[typeId] = i;
                return component as T;
            }
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
        return BitMask64Utils.hasAny(this._componentMask, mask);
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
        
        if (!ComponentRegistry.isRegistered(componentType)) {
            return;
        }

        const typeId = ComponentRegistry.getBitIndex(componentType);
        
        this._componentsByTypeId[typeId] = undefined;
        
        BitMask64Utils.clearBit(this._componentMask, typeId);
        
        const denseIndex = this._componentDenseIndexByTypeId[typeId];
        if (denseIndex !== undefined && denseIndex < this.components.length) {
            const lastIndex = this.components.length - 1;
            
            if (denseIndex !== lastIndex) {
                const lastComponent = this.components[lastIndex];
                this.components[denseIndex] = lastComponent;
                
                const lastComponentType = lastComponent.constructor as ComponentType;
                const lastTypeId = ComponentRegistry.getBitIndex(lastComponentType);
                this._componentDenseIndexByTypeId[lastTypeId] = denseIndex;
            }
            
            this.components.pop();
        }
        
        this._componentDenseIndexByTypeId[typeId] = -1;

        if (this.scene && this.scene.componentStorageManager) {
            this.scene.componentStorageManager.removeComponent(this.id, componentType);
        }

        if (component.onRemovedFromEntity) {
            component.onRemovedFromEntity();
        }
        
        if (Entity.eventBus) {
            Entity.eventBus.emitComponentRemoved({
                timestamp: Date.now(),
                source: 'Entity',
                entityId: this.id,
                entityName: this.name,
                entityTag: this.tag?.toString(),
                componentType: getComponentTypeName(componentType),
                component: component
            });
        }
        
        component.entity = null as any;

        if (this.scene && this.scene.querySystem) {
            this.scene.querySystem.removeEntity(this);
            this.scene.querySystem.addEntity(this);
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
        const componentsToRemove = [...this.components];
        
        this._componentsByTypeId.length = 0;
        this._componentDenseIndexByTypeId.length = 0;
        BitMask64Utils.clear(this._componentMask);
        
        for (const component of componentsToRemove) {
            const componentType = component.constructor as ComponentType;
            
            if (this.scene && this.scene.componentStorageManager) {
                this.scene.componentStorageManager.removeComponent(this.id, componentType);
            }

            component.onRemovedFromEntity();
            
            component.entity = null as any;
        }
        
        this.components.length = 0;
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
        for (const component of this.components) {
            if ('onActiveChanged' in component && typeof component.onActiveChanged === 'function') {
                (component as any).onActiveChanged();
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
     * 更新实体
     * 
     * 调用所有组件的更新方法，并更新子实体。
     */
    public update(): void {
        if (!this.activeInHierarchy || this._isDestroyed) {
            return;
        }

        for (const component of this.components) {
            if (component.enabled) {
                component.update();
            }
        }

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
        indexMappingSize: number;
        denseIndexMappingSize: number;
    } {
        return {
            name: this.name,
            id: this.id,
            enabled: this._enabled,
            active: this._active,
            activeInHierarchy: this.activeInHierarchy,
            destroyed: this._isDestroyed,
            componentCount: this.components.length,
            componentTypes: this.components.map(c => getComponentInstanceTypeName(c)),
            componentMask: BitMask64Utils.toString(this._componentMask, 2), // 二进制表示
            parentId: this._parent?.id || null,
            childCount: this._children.length,
            childIds: this._children.map(c => c.id),
            depth: this.getDepth(),
            indexMappingSize: this._componentsByTypeId.filter(c => c !== undefined).length,
            denseIndexMappingSize: this._componentDenseIndexByTypeId.filter(idx => idx !== -1 && idx !== undefined).length
        };
    }
}
