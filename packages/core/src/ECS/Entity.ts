import { Component, IComponentLifecycle } from './Component';
import { ComponentType } from './Core/ComponentStorage';
import { IBigIntLike } from './Utils/BigIntCompatibility';
import { createLogger } from '../Utils/Logger';
import { getComponentInstanceTypeName, getComponentTypeName } from './Decorators';
import { Core } from '../Core';
import { IScene } from './IScene';
import { ComponentSet } from './Core/ComponentSet';
import { SceneBindings } from './Core/SceneBindings';
import { EntityEvents } from './Core/EntityEvents';
import { EntityDebugView, EntityDebugInfo } from './Debug/EntityDebugView';
import { Hierarchy, HierarchyBehavior } from './Core/Hierarchy';

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
        const updateOrderDiff = self.updateOrder - other.updateOrder;
        if (updateOrderDiff !== 0) {
            return updateOrderDiff;
        }
        return self.id - other.id;
    }
}



/**
 * ECS架构中的实体，作为组件的容器
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
     * 组件管理器
     */
    private _componentSet: ComponentSet = new ComponentSet();
    
    /**
     * 所属场景
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
     */
    public get isDestroyed(): boolean {
        return this._isDestroyed;
    }

    /**
     * 获取组件数组的只读视图
     * 
     * @returns 组件数组的只读视图
     */
    public get components(): readonly Component[] {
        return this._componentSet.components;
    }

    /**
     * 获取父实体
     * 
     * @returns 父实体，如果没有父实体则返回null
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public get parent(): Entity | null {
        const parentId = Hierarchy.getParentId(this.id);
        if (parentId === null) {
            return null;
        }
        
        // 通过场景查找父实体实例
        if (this.scene) {
            return this.scene.entities.findEntityById(parentId) || null;
        }
        
        return null;
    }

    /**
     * 获取子实体数组的只读副本
     * 
     * @returns 子实体数组的副本
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public get children(): readonly Entity[] {
        const childIds = Hierarchy.getChildIds(this.id);
        if (!this.scene) {
            return [];
        }
        
        const children: Entity[] = [];
        for (const childId of childIds) {
            const child = this.scene.entities.findEntityById(childId);
            if (child) {
                children.push(child);
            }
        }
        
        return children;
    }

    /**
     * 获取子实体数量
     * 
     * @returns 子实体的数量
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public get childCount(): number {
        return Hierarchy.getChildCount(this.id);
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
     * 如果父子关系功能未启用，则仅返回自身的活跃状态。
     * 
     * @returns 有效的活跃状态
     */
    public get activeInHierarchy(): boolean {
        if (!this._active) return false;
        
        // 如果父子关系功能未启用，只检查自身状态
        if (!Core.entityHierarchyEnabled) {
            return true;
        }
        
        const parent = this.parent;
        if (parent) {
            return parent.activeInHierarchy;
        }
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
    public get componentMask(): IBigIntLike {
        return this._componentSet.componentMask;
    }

    /**
     * 创建并添加组件
     */
    public createComponent<T extends Component>(
        componentType: ComponentType<T>, 
        ...args: any[]
    ): T {
        const component = new componentType(...args);
        return this.addComponent(component);
    }

    /**
     * 内部添加组件方法
     */
    private addComponentInternal<T extends Component>(component: T): T {
        // 设置组件的实体引用
        component.entity = this;

        // 委托给 ComponentSet 处理
        return this._componentSet.addComponent(component);
    }

    /**
     * 添加组件到实体
     */
    public addComponent<T extends Component>(component: T): T {
        const componentType = component.constructor as ComponentType<T>;
        
        // 检查是否已有此类型的组件
        if (this.hasComponent(componentType)) {
            throw new Error(`Entity ${this.name} already has component ${getComponentTypeName(componentType)}`);
        }

        // 使用内部方法添加组件
        this.addComponentInternal(component);
        
        // 如果场景存在且有组件存储管理器，添加到存储器
        if (this.scene && this.scene.componentStorageManager) {
            this.scene.componentStorageManager.addComponent(this.id, component);
        }

        // 调用组件的生命周期方法（仅在未抑制副作用时）
        if (!SceneBindings.shouldSuppressEffects(this.scene)) {
            component.onAddedToEntity();
        }

        // 发射组件添加事件
        EntityEvents.emitComponentAdded(this, component);
        
        // 统一通知场景变更
        SceneBindings.notifyComponentChanged(this);

        return component;
    }

    /**
     * 获取指定类型的组件
     */
    public getComponent<T extends Component>(type: ComponentType<T>): T | null {
        // 首先从 ComponentSet 获取
        const component = this._componentSet.getComponent(type);
        if (component) {
            return component;
        }

        // 如果场景有组件存储管理器，从存储器获取
        if (this.scene && this.scene.componentStorageManager) {
            const storageComponent = this.scene.componentStorageManager.getComponent(this.id, type);
            if (storageComponent) {
                // 更新本地索引信息
                const componentIndex = this._componentSet.components.indexOf(storageComponent);
                if (componentIndex === -1) {
                    // 如果组件不在本地数组中，说明索引不一致，标记为脏状态
                    this._componentSet.markIndexDirty();
                }
                return storageComponent;
            }
        }

        return null;
    }




    /**
     * 检查实体是否有指定类型的组件
     */
    public hasComponent<T extends Component>(type: ComponentType<T>): boolean {
        return this._componentSet.hasComponent(type);
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
     */
    public removeComponent(component: Component): void {
        const componentType = component.constructor as ComponentType;
        
        // 委托给 ComponentSet 移除组件
        const removedComponent = this._componentSet.removeComponent(component);
        if (!removedComponent) {
            // 组件不存在，直接返回
            return;
        }

        // 从组件存储管理器中移除
        if (this.scene && this.scene.componentStorageManager) {
            this.scene.componentStorageManager.removeComponent(this.id, componentType);
        }

        // 调用组件的生命周期方法（仅在未抑制副作用时）
        if (component.onRemovedFromEntity && !SceneBindings.shouldSuppressEffects(this.scene)) {
            component.onRemovedFromEntity();
        }

        // 发射组件移除事件
        EntityEvents.emitComponentRemoved(this, component);
        
        // 清除组件的实体引用
        component.entity = null as any;

        // 统一通知场景变更
        SceneBindings.notifyComponentChanged(this);
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
        // 从 ComponentSet 移除所有组件
        const componentsToRemove = this._componentSet.removeAllComponents();
        
        // 移除组件
        for (const component of componentsToRemove) {
            const componentType = component.constructor as ComponentType;
            
            // 从组件存储管理器中移除
            if (this.scene && this.scene.componentStorageManager) {
                this.scene.componentStorageManager.removeComponent(this.id, componentType);
            }

            // 调用组件的生命周期方法（仅在未抑制副作用时）
            if (!SceneBindings.shouldSuppressEffects(this.scene)) {
                component.onRemovedFromEntity();
            }
            
            // 发射组件移除事件
            EntityEvents.emitComponentRemoved(this, component);
            
            // 清除组件的实体引用
            component.entity = null as any;
        }

        // 统一通知场景变更
        SceneBindings.notifyComponentChanged(this);
    }

    /**
     * 高性能批量移除组件
     * 
     * 通过批量处理减少重复计算和系统调用，提供更好的性能。
     * 适用于需要一次性移除多个组件的场景。
     * 
     * @param options - 批量移除选项
     */
    public removeAllComponentsBatch(
        options: {
            suppressLifecycle?: boolean;
            suppressEvents?: boolean;
            suppressQueryUpdate?: boolean;
        } = {}
    ): Component[] {
        if (this._componentSet.size === 0) {
            return [];
        }

        // 从 ComponentSet 移除所有组件
        const componentsToRemove = this._componentSet.removeAllComponents();
        const componentTypes: ComponentType[] = [];
        
        // 收集组件类型信息
        for (const component of componentsToRemove) {
            const componentType = component.constructor as ComponentType;
            componentTypes.push(componentType);
        }
        
        // 批量从组件存储管理器中移除
        if (this.scene && this.scene.componentStorageManager) {
            for (const componentType of componentTypes) {
                this.scene.componentStorageManager.removeComponent(this.id, componentType);
            }
        }

        // 批量生命周期处理（如果未抑制）
        if (!options.suppressLifecycle && (!this.scene || !this.scene.suspendEffects)) {
            for (const component of componentsToRemove) {
                component.onRemovedFromEntity();
            }
        }
        
        // 批量事件发射（如果未抑制）
        if (!options.suppressEvents) {
            for (const component of componentsToRemove) {
                EntityEvents.emitComponentRemoved(this, component);
            }
        }
        
        // 批量清除组件的实体引用
        for (const component of componentsToRemove) {
            component.entity = null as any;
        }

        // 统一通知场景变更
        SceneBindings.notifyComponentChanged(this, {
            suppressQueryUpdate: options.suppressQueryUpdate
        });

        return componentsToRemove;
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
                Entity._logger.warn(`添加组件失败 ${getComponentInstanceTypeName(component)}:`, error);
            }
        }
        
        return addedComponents;
    }

    /**
     * 高性能批量添加组件
     * 
     * 通过批量处理减少重复计算和系统调用，提供更好的性能。
     * 适用于需要一次性添加多个组件的场景，如实体初始化。
     * 
     * @param components - 要添加的组件数组
     * @param options - 批量添加选项
     * @returns 添加的组件数组
     */
    public addComponentsBatch<T extends Component>(
        components: T[], 
        options: {
            suppressLifecycle?: boolean;
            suppressEvents?: boolean;
            suppressQueryUpdate?: boolean;
        } = {}
    ): T[] {
        if (components.length === 0) {
            return [];
        }

        const addedComponents: T[] = [];
        
        // 设置所有组件的实体引用
        for (const component of components) {
            component.entity = this;
        }
        
        // 使用 ComponentSet 批量添加组件
        const actuallyAddedComponents = this._componentSet.addComponents(components);
        addedComponents.push(...actuallyAddedComponents as T[]);

        if (addedComponents.length === 0) {
            return [];
        }

        // 批量添加到组件存储管理器
        if (this.scene && this.scene.componentStorageManager) {
            for (const component of addedComponents) {
                this.scene.componentStorageManager.addComponent(this.id, component);
            }
        }

        // 批量生命周期和事件处理（如果未抑制）
        if (!options.suppressLifecycle && (!this.scene || !this.scene.suspendEffects)) {
            for (const component of addedComponents) {
                component.onAddedToEntity();
            }
        }
        
        if (!options.suppressEvents) {
            for (const component of addedComponents) {
                EntityEvents.emitComponentAdded(this, component);
            }
        }

        // 统一通知场景变更
        SceneBindings.notifyComponentChanged(this, {
            suppressQueryUpdate: options.suppressQueryUpdate
        });

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
        return this._componentSet.getComponents(type);
    }

    /**
     * 添加子实体
     * 
     * @param child - 要添加的子实体
     * @returns 添加的子实体
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public addChild(child: Entity): Entity {
        if (child === this) {
            throw new Error("Entity cannot be its own child");
        }

        const currentParentId = Hierarchy.getParentId(child.id, HierarchyBehavior.ReturnEmpty);
        if (currentParentId === this.id) {
            return child; // 已经是子实体
        }

        // 设置父子关系
        Hierarchy.setParent(child.id, this.id);

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
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public removeChild(child: Entity): boolean {
        const parentId = Hierarchy.getParentId(child.id, HierarchyBehavior.ReturnEmpty);
        if (parentId !== this.id) {
            return false;
        }

        // 移除父子关系
        Hierarchy.removeParent(child.id);
        return true;
    }

    /**
     * 移除所有子实体
     * 
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public removeAllChildren(): void {
        const childIds = Hierarchy.getChildIds(this.id);
        
        for (const childId of childIds) {
            Hierarchy.removeParent(childId);
        }
    }

    /**
     * 根据名称查找子实体
     * 
     * @param name - 子实体名称
     * @param recursive - 是否递归查找
     * @returns 找到的子实体或null
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public findChild(name: string, recursive: boolean = false): Entity | null {
        if (!this.scene) {
            return null;
        }

        const foundId = Hierarchy.findChildIdByName(
            this.id, 
            name, 
            recursive, 
            (entityId) => {
                const entity = this.scene?.entities.findEntityById(entityId);
                return entity?.name || '';
            }
        );

        if (foundId === null) {
            return null;
        }

        return this.scene.entities.findEntityById(foundId) || null;
    }

    /**
     * 根据标签查找子实体
     * 
     * @param tag - 标签
     * @param recursive - 是否递归查找
     * @returns 找到的子实体数组
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public findChildrenByTag(tag: number, recursive: boolean = false): Entity[] {
        if (!this.scene) {
            return [];
        }

        const foundIds = Hierarchy.findChildIdsByTag(
            this.id,
            tag,
            recursive,
            (entityId) => {
                const entity = this.scene?.entities.findEntityById(entityId);
                return entity?.tag || 0;
            }
        );

        const result: Entity[] = [];
        for (const foundId of foundIds) {
            const entity = this.scene.entities.findEntityById(foundId);
            if (entity) {
                result.push(entity);
            }
        }

        return result;
    }

    /**
     * 获取根实体
     * 
     * @returns 层次结构的根实体
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public getRoot(): Entity {
        const rootId = Hierarchy.getRootId(this.id);
        
        if (this.scene) {
            const rootEntity = this.scene.entities.findEntityById(rootId);
            if (rootEntity) {
                return rootEntity;
            }
        }
        
        return this;
    }

    /**
     * 检查是否是指定实体的祖先
     * 
     * @param entity - 要检查的实体
     * @returns 如果是祖先则返回true
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public isAncestorOf(entity: Entity): boolean {
        return Hierarchy.isAncestorOf(this.id, entity.id);
    }

    /**
     * 检查是否是指定实体的后代
     * 
     * @param entity - 要检查的实体
     * @returns 如果是后代则返回true
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public isDescendantOf(entity: Entity): boolean {
        return Hierarchy.isDescendantOf(this.id, entity.id);
    }

    /**
     * 获取层次深度
     * 
     * @returns 在层次结构中的深度（根实体为0）
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public getDepth(): number {
        return Hierarchy.getDepth(this.id);
    }

    /**
     * 遍历所有子实体（深度优先）
     * 
     * @param callback - 对每个子实体执行的回调函数
     * @param recursive - 是否递归遍历
     * @throws 如果未启用Entity父子关系功能则抛出错误
     */
    public forEachChild(callback: (child: Entity, index: number) => void, recursive: boolean = false): void {
        if (!this.scene) {
            return;
        }

        let index = 0;
        Hierarchy.forEachChildId(
            this.id,
            (childId) => {
                const child = this.scene?.entities.findEntityById(childId);
                if (child) {
                    callback(child, index++);
                }
            },
            recursive
        );
    }

    /**
     * 活跃状态改变时的回调
     */
    private onActiveChanged(): void {
        // 通知所有组件活跃状态改变
        for (const component of this._componentSet.components) {
            const lifecycleComponent = component as IComponentLifecycle;
            if (lifecycleComponent.onActiveChanged) {
                lifecycleComponent.onActiveChanged();
            }
        }

        // 通知场景实体状态改变
        EntityEvents.emitActiveChanged(this);
    }

    /**
     * 更新实体
     * 
     * 调用所有组件的更新方法，并更新子实体。
     * 注意：此功能不符合纯ECS设计，默认禁用，需要在Core配置中启用
     */
    public update(): void {
        // 检查是否启用Entity/Component更新遍历功能
        if (!Core.entityComponentUpdateEnabled) {
            return;
        }

        if (!this.activeInHierarchy || this._isDestroyed) {
            return;
        }

        // 更新所有组件
        for (const component of this._componentSet.components) {
            if (component.enabled) {
                component.update();
            }
        }

        // 更新所有子实体（如果启用父子关系）
        if (Core.entityHierarchyEnabled && this.scene) {
            const childIds = Hierarchy.getChildIds(this.id, HierarchyBehavior.ReturnEmpty);
            for (const childId of childIds) {
                const child = this.scene.entities.findEntityById(childId);
                if (child) {
                    child.update();
                }
            }
        }
    }

    /**
     * 销毁实体
     */
    public destroy(): void {
        if (this._isDestroyed) {
            return;
        }

        EntityEvents.emitEntityDestroyed(this);

        this._isDestroyed = true;
        
        // 销毁所有子实体（如果启用父子关系）
        if (Core.entityHierarchyEnabled) {
            const childIds = Hierarchy.getChildIds(this.id, HierarchyBehavior.ReturnEmpty);
            
            if (this.scene) {
                for (const childId of childIds) {
                    const child = this.scene.entities.findEntityById(childId);
                    if (child) {
                        child.destroy();
                    }
                }
            }
            
            // 清理层级关系
            Hierarchy.cleanup(this.id, HierarchyBehavior.ReturnEmpty);
        }
        
        this.removeAllComponents();
        
        SceneBindings.removeFromScene(this);
    }

    /**
     * 比较实体
     */
    public compareTo(other: Entity): number {
        return EntityComparer.prototype.compare(this, other);
    }

    /**
     * 获取实体的字符串表示
     */
    public toString(): string {
        return `Entity[${this.name}:${this.id}]`;
    }

    /**
     * 获取实体的调试信息
     * 
     * @returns 包含实体详细信息的对象
     */
    public getDebugInfo(): EntityDebugInfo {
        return EntityDebugView.getDebugInfo(this);
    }

    /**
     * 获取实体的调试字符串表示
     * 
     * @param includeComponents - 是否包含组件信息
     * @returns 格式化的调试字符串
     */
    public toDebugString(includeComponents: boolean = false): string {
        return EntityDebugView.toDebugString(this, includeComponents);
    }
}
