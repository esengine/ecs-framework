import { HierarchyComponent } from '../Components/HierarchyComponent';
import { ComponentManager } from './ComponentManager';
import { EventBus } from './EventBus';

/**
 * 层次结构管理器
 * 
 * 专门管理实体的父子关系，提供层次结构操作的统一接口。
 * 将层次关系管理从Entity类中分离出来，实现更清晰的关注点分离。
 * 
 * @example
 * ```typescript
 * const hierarchyManager = new HierarchyManager(componentManager, eventBus);
 * 
 * // 建立父子关系
 * hierarchyManager.addChild(parentId, childId);
 * 
 * // 查询子实体
 * const children = hierarchyManager.getChildren(parentId);
 * 
 * // 查询父实体
 * const parent = hierarchyManager.getParent(childId);
 * ```
 */
export class HierarchyManager {
    /** 组件管理器引用 */
    private _componentManager: ComponentManager;
    
    /** 事件总线引用 */
    private _eventBus: EventBus;
    
    /** 层次结构变更监听器 */
    private _hierarchyChangeListeners: Array<(entityId: number, changeType: 'parent_changed' | 'child_added' | 'child_removed') => void> = [];
    
    /**
     * 构造函数
     * 
     * @param componentManager 组件管理器实例
     * @param eventBus 事件总线实例
     */
    constructor(componentManager: ComponentManager, eventBus: EventBus) {
        this._componentManager = componentManager;
        this._eventBus = eventBus;
    }
    
    /**
     * 添加子实体
     * 
     * 建立父子关系，如果子实体已有父实体则先从原父实体移除。
     * 
     * @param parentId 父实体ID
     * @param childId 子实体ID
     * @returns 是否成功添加
     * @throws {Error} 如果尝试将实体设为自己的子实体
     */
    public addChild(parentId: number, childId: number): boolean {
        if (parentId === childId) {
            throw new Error("Entity cannot be its own child");
        }
        
        // 检查是否会形成循环引用
        if (this.isAncestorOf(childId, parentId)) {
            throw new Error("Cannot add child: would create circular hierarchy");
        }
        
        // 获取或创建父实体的层次组件
        let parentHierarchy = this._componentManager.getComponent(parentId, HierarchyComponent);
        if (!parentHierarchy) {
            parentHierarchy = this._componentManager.addComponent(parentId, new HierarchyComponent());
        }
        
        // 获取或创建子实体的层次组件
        let childHierarchy = this._componentManager.getComponent(childId, HierarchyComponent);
        if (!childHierarchy) {
            childHierarchy = this._componentManager.addComponent(childId, new HierarchyComponent());
        }
        
        // 如果子实体已经是这个父实体的子实体，直接返回
        if (childHierarchy.parentId === parentId) {
            return true;
        }
        
        // 如果子实体已有其他父实体，先移除
        if (childHierarchy.parentId !== null) {
            this.removeChild(childHierarchy.parentId, childId);
        }
        
        // 建立父子关系
        parentHierarchy.addChildId(childId);
        childHierarchy.setParentId(parentId);
        
        // 更新深度
        this.updateDepth(childId);
        
        // 通知监听器
        this.notifyHierarchyChange(parentId, 'child_added');
        this.notifyHierarchyChange(childId, 'parent_changed');
        
        // 发射事件
        this._eventBus.emit('hierarchy:child_added', {
            parentId,
            childId,
            timestamp: Date.now()
        });
        
        return true;
    }
    
    /**
     * 移除子实体
     * 
     * 断开父子关系，子实体变为根实体。
     * 
     * @param parentId 父实体ID
     * @param childId 子实体ID
     * @returns 是否成功移除
     */
    public removeChild(parentId: number, childId: number): boolean {
        const parentHierarchy = this._componentManager.getComponent(parentId, HierarchyComponent);
        const childHierarchy = this._componentManager.getComponent(childId, HierarchyComponent);
        
        if (!parentHierarchy || !childHierarchy) {
            return false;
        }
        
        if (childHierarchy.parentId !== parentId) {
            return false; // 不是父子关系
        }
        
        // 断开父子关系
        parentHierarchy.removeChildId(childId);
        childHierarchy.setParentId(null);
        
        // 更新深度
        this.updateDepth(childId);
        
        // 通知监听器
        this.notifyHierarchyChange(parentId, 'child_removed');
        this.notifyHierarchyChange(childId, 'parent_changed');
        
        // 发射事件
        this._eventBus.emit('hierarchy:child_removed', {
            parentId,
            childId,
            timestamp: Date.now()
        });
        
        return true;
    }
    
    /**
     * 移除实体的所有子实体
     * 
     * @param parentId 父实体ID
     * @returns 被移除的子实体ID数组
     */
    public removeAllChildren(parentId: number): number[] {
        const parentHierarchy = this._componentManager.getComponent(parentId, HierarchyComponent);
        if (!parentHierarchy || !parentHierarchy.hasChildren()) {
            return [];
        }
        
        // 复制子实体列表，避免在迭代时修改
        const childrenToRemove = [...parentHierarchy.childIds];
        
        for (const childId of childrenToRemove) {
            this.removeChild(parentId, childId);
        }
        
        return childrenToRemove;
    }
    
    /**
     * 设置实体的父实体
     * 
     * @param childId 子实体ID
     * @param parentId 父实体ID，null表示设为根实体
     * @returns 是否成功设置
     */
    public setParent(childId: number, parentId: number | null): boolean {
        if (parentId === null) {
            // 设为根实体
            const childHierarchy = this._componentManager.getComponent(childId, HierarchyComponent);
            if (childHierarchy && childHierarchy.parentId !== null) {
                return this.removeChild(childHierarchy.parentId, childId);
            }
            return true;
        } else {
            // 设置新父实体
            return this.addChild(parentId, childId);
        }
    }
    
    /**
     * 获取实体的父实体ID
     * 
     * @param entityId 实体ID
     * @returns 父实体ID，如果是根实体则返回null
     */
    public getParent(entityId: number): number | null {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        return hierarchy?.parentId || null;
    }
    
    /**
     * 获取实体的所有子实体ID
     * 
     * @param entityId 实体ID
     * @returns 子实体ID数组
     */
    public getChildren(entityId: number): number[] {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        return hierarchy ? [...hierarchy.childIds] : [];
    }
    
    /**
     * 获取实体的子实体数量
     * 
     * @param entityId 实体ID
     * @returns 子实体数量
     */
    public getChildCount(entityId: number): number {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        return hierarchy?.getChildCount() || 0;
    }
    
    /**
     * 检查实体是否有子实体
     * 
     * @param entityId 实体ID
     * @returns 如果有子实体则返回true
     */
    public hasChildren(entityId: number): boolean {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        return hierarchy?.hasChildren() || false;
    }
    
    /**
     * 检查实体是否为根实体
     * 
     * @param entityId 实体ID
     * @returns 如果是根实体则返回true
     */
    public isRoot(entityId: number): boolean {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        return hierarchy?.isRoot() !== false; // 没有层次组件的实体也认为是根实体
    }
    
    /**
     * 获取根实体ID
     * 
     * 向上遍历找到层次结构的根实体。
     * 
     * @param entityId 实体ID
     * @returns 根实体ID
     */
    public getRoot(entityId: number): number {
        let current = entityId;
        let parent = this.getParent(current);
        
        while (parent !== null) {
            current = parent;
            parent = this.getParent(current);
        }
        
        return current;
    }
    
    /**
     * 检查实体是否是另一个实体的祖先
     * 
     * @param ancestorId 可能的祖先实体ID
     * @param descendantId 可能的后代实体ID
     * @returns 如果是祖先关系则返回true
     */
    public isAncestorOf(ancestorId: number, descendantId: number): boolean {
        let current = this.getParent(descendantId);
        
        while (current !== null) {
            if (current === ancestorId) {
                return true;
            }
            current = this.getParent(current);
        }
        
        return false;
    }
    
    /**
     * 检查实体是否是另一个实体的后代
     * 
     * @param descendantId 可能的后代实体ID
     * @param ancestorId 可能的祖先实体ID
     * @returns 如果是后代关系则返回true
     */
    public isDescendantOf(descendantId: number, ancestorId: number): boolean {
        return this.isAncestorOf(ancestorId, descendantId);
    }
    
    /**
     * 获取实体在层次结构中的深度
     * 
     * @param entityId 实体ID
     * @returns 深度值（根实体为0）
     */
    public getDepth(entityId: number): number {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        return hierarchy?.depth || 0;
    }
    
    /**
     * 根据名称查找子实体
     * 
     * @param parentId 父实体ID
     * @param name 子实体名称
     * @param recursive 是否递归查找
     * @param getEntityName 获取实体名称的函数
     * @returns 找到的子实体ID或null
     */
    public findChildByName(
        parentId: number, 
        name: string, 
        recursive: boolean = false,
        getEntityName: (entityId: number) => string | null
    ): number | null {
        const children = this.getChildren(parentId);
        
        // 在直接子实体中查找
        for (const childId of children) {
            const childName = getEntityName(childId);
            if (childName === name) {
                return childId;
            }
        }
        
        // 递归查找
        if (recursive) {
            for (const childId of children) {
                const found = this.findChildByName(childId, name, true, getEntityName);
                if (found !== null) {
                    return found;
                }
            }
        }
        
        return null;
    }
    
    /**
     * 根据标签查找子实体
     * 
     * @param parentId 父实体ID
     * @param tag 标签
     * @param recursive 是否递归查找
     * @param getEntityTag 获取实体标签的函数
     * @returns 找到的子实体ID数组
     */
    public findChildrenByTag(
        parentId: number, 
        tag: number, 
        recursive: boolean = false,
        getEntityTag: (entityId: number) => number | null
    ): number[] {
        const result: number[] = [];
        const children = this.getChildren(parentId);
        
        // 在直接子实体中查找
        for (const childId of children) {
            const childTag = getEntityTag(childId);
            if (childTag === tag) {
                result.push(childId);
            }
        }
        
        // 递归查找
        if (recursive) {
            for (const childId of children) {
                result.push(...this.findChildrenByTag(childId, tag, true, getEntityTag));
            }
        }
        
        return result;
    }
    
    /**
     * 遍历所有子实体
     * 
     * @param parentId 父实体ID
     * @param callback 对每个子实体执行的回调函数
     * @param recursive 是否递归遍历
     */
    public forEachChild(
        parentId: number, 
        callback: (childId: number, index: number) => void, 
        recursive: boolean = false
    ): void {
        const children = this.getChildren(parentId);
        
        children.forEach((childId, index) => {
            callback(childId, index);
            if (recursive) {
                this.forEachChild(childId, callback, true);
            }
        });
    }
    
    /**
     * 获取所有后代实体ID
     * 
     * @param parentId 父实体ID
     * @returns 所有后代实体ID数组
     */
    public getAllDescendants(parentId: number): number[] {
        const descendants: number[] = [];
        const children = this.getChildren(parentId);
        
        for (const childId of children) {
            descendants.push(childId);
            descendants.push(...this.getAllDescendants(childId));
        }
        
        return descendants;
    }
    
    /**
     * 添加层次结构变更监听器
     * 
     * @param listener 监听器函数
     */
    public addHierarchyChangeListener(
        listener: (entityId: number, changeType: 'parent_changed' | 'child_added' | 'child_removed') => void
    ): void {
        this._hierarchyChangeListeners.push(listener);
    }
    
    /**
     * 移除层次结构变更监听器
     * 
     * @param listener 要移除的监听器函数
     * @returns 是否成功移除
     */
    public removeHierarchyChangeListener(
        listener: (entityId: number, changeType: 'parent_changed' | 'child_added' | 'child_removed') => void
    ): boolean {
        const index = this._hierarchyChangeListeners.indexOf(listener);
        if (index !== -1) {
            this._hierarchyChangeListeners.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * 清理实体的层次结构数据
     * 
     * 在实体销毁时调用，清理所有相关的层次关系。
     * 
     * @param entityId 要清理的实体ID
     */
    public cleanupEntity(entityId: number): void {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        if (!hierarchy) {
            return;
        }
        
        // 从父实体中移除
        if (hierarchy.parentId !== null) {
            this.removeChild(hierarchy.parentId, entityId);
        }
        
        // 移除所有子实体（让它们变为根实体）
        this.removeAllChildren(entityId);
        
        // 移除层次组件
        this._componentManager.removeComponentByType(entityId, HierarchyComponent);
    }
    
    /**
     * 获取层次结构统计信息
     */
    public getHierarchyStats(): {
        totalEntitiesWithHierarchy: number;
        rootEntities: number;
        maxDepth: number;
        averageChildrenPerParent: number;
    } {
        const entities = new Set<number>();
        let rootCount = 0;
        let maxDepth = 0;
        let totalChildren = 0;
        let parentsWithChildren = 0;
        
        // 遍历所有有层次组件的实体
        // 这里需要从组件管理器获取所有HierarchyComponent
        // 实际实现可能需要配合实体管理器
        
        return {
            totalEntitiesWithHierarchy: entities.size,
            rootEntities: rootCount,
            maxDepth,
            averageChildrenPerParent: parentsWithChildren > 0 ? totalChildren / parentsWithChildren : 0
        };
    }
    
    /**
     * 更新实体及其所有后代的深度
     * 
     * @param entityId 实体ID
     * @private
     */
    private updateDepth(entityId: number): void {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        if (!hierarchy) {
            return;
        }
        
        // 计算深度
        let depth = 0;
        let parentId = hierarchy.parentId;
        while (parentId !== null) {
            depth++;
            const parentHierarchy = this._componentManager.getComponent(parentId, HierarchyComponent);
            if (!parentHierarchy) {
                break;
            }
            parentId = parentHierarchy.parentId;
        }
        
        // 设置深度
        hierarchy.setDepth(depth);
        
        // 递归更新所有子实体的深度
        for (const childId of hierarchy.childIds) {
            this.updateDepth(childId);
        }
    }
    
    /**
     * 通知层次结构变更
     * 
     * @param entityId 实体ID
     * @param changeType 变更类型
     * @private
     */
    private notifyHierarchyChange(entityId: number, changeType: 'parent_changed' | 'child_added' | 'child_removed'): void {
        for (const listener of this._hierarchyChangeListeners) {
            try {
                listener(entityId, changeType);
            } catch (error) {
                console.warn('层次结构变更监听器执行失败:', error);
            }
        }
    }
}