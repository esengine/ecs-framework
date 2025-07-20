import { EntitySystem } from './EntitySystem';
import { HierarchyComponent } from '../Components/HierarchyComponent';
import { HierarchyManager } from '../Core/HierarchyManager';
import { ComponentManager } from '../Core/ComponentManager';
import { Entity } from '../Entity';

/**
 * 变换系统
 * 
 * 负责管理和更新实体的层次结构关系，处理层次结构的激活状态传播、
 * 深度计算和脏标记更新。这个系统将层次结构管理从Entity类中分离出来。
 * 
 * @example
 * ```typescript
 * const transformSystem = new TransformSystem(hierarchyManager, componentManager);
 * scene.addSystem(transformSystem);
 * 
 * // 系统会自动处理层次结构更新
 * // 包括激活状态传播、深度计算等
 * ```
 */
export class TransformSystem extends EntitySystem {
    /** 层次结构管理器引用 */
    private _hierarchyManager: HierarchyManager;
    
    /** 组件管理器引用 */
    private _componentManager: ComponentManager;
    
    /** 需要更新的实体队列 */
    private _dirtyEntities: Set<number> = new Set();
    
    /** 根实体缓存 */
    private _rootEntities: Set<number> = new Set();
    
    
    /** 批量更新模式 */
    private _batchUpdateMode: boolean = false;
    
    /** 性能统计 */
    private _stats = {
        entitiesProcessed: 0,
        hierarchyUpdates: 0,
        activationPropagations: 0,
        depthCalculations: 0
    };
    
    /**
     * 构造函数
     * 
     * @param hierarchyManager 层次结构管理器
     * @param componentManager 组件管理器
     */
    constructor(hierarchyManager: HierarchyManager, componentManager: ComponentManager) {
        super();
        this._hierarchyManager = hierarchyManager;
        this._componentManager = componentManager;
        
        // 监听层次结构变更
        this._hierarchyManager.addHierarchyChangeListener((entityId, changeType) => {
            this.markEntityDirty(entityId);
            
            // 如果是父子关系变更，也需要更新相关实体
            if (changeType === 'parent_changed') {
                const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
                if (hierarchy?.parentId) {
                    this.markEntityDirty(hierarchy.parentId);
                }
            }
        });
    }
    
    /**
     * 获取系统关注的组件类型
     * 
     * @returns 组件类型数组
     */
    public getComponentTypes(): Function[] {
        return [HierarchyComponent];
    }
    
    /**
     * 系统更新
     * 
     * 处理所有标记为脏的实体，更新层次结构状态。
     * 
     * @param deltaTime 时间增量
     */
    public override update(): void {
        const deltaTime = 0; // deltaTime not used in hierarchy updates
        if (!this.enabled || this._dirtyEntities.size === 0) {
            return;
        }
        
        // 批量处理脏实体
        this.processDirtyEntities();
        
        // 更新统计信息
        this._stats.entitiesProcessed += this._dirtyEntities.size;
        
        // 清空脏实体列表
        this._dirtyEntities.clear();
    }
    
    /**
     * 处理单个实体
     * 
     * 更新实体的层次结构状态，包括激活状态和深度。
     * 
     * @param entity 要处理的实体
     */
    public processEntity(entity: Entity): void {
        this.updateEntityHierarchy(entity.id);
    }
    
    /**
     * 标记实体为脏（需要更新）
     * 
     * @param entityId 实体ID
     */
    public markEntityDirty(entityId: number): void {
        this._dirtyEntities.add(entityId);
        
        // 如果不在批量模式，立即处理
        if (!this._batchUpdateMode) {
            this.updateEntityHierarchy(entityId);
            this._dirtyEntities.delete(entityId);
        }
    }
    
    /**
     * 标记整个层次结构为脏
     * 
     * 递归标记实体及其所有后代为需要更新。
     * 
     * @param rootEntityId 根实体ID
     */
    public markHierarchyDirty(rootEntityId: number): void {
        const descendants = this._hierarchyManager.getAllDescendants(rootEntityId);
        
        this._dirtyEntities.add(rootEntityId);
        for (const descendantId of descendants) {
            this._dirtyEntities.add(descendantId);
        }
    }
    
    /**
     * 开始批量更新模式
     * 
     * 在批量模式下，标记为脏的实体不会立即更新，
     * 而是等待commitBatchUpdate()调用时统一处理。
     */
    public beginBatchUpdate(): void {
        this._batchUpdateMode = true;
    }
    
    /**
     * 提交批量更新
     * 
     * 结束批量更新模式并处理所有脏实体。
     */
    public commitBatchUpdate(): void {
        if (this._batchUpdateMode) {
            this.processDirtyEntities();
            this._batchUpdateMode = false;
            this._dirtyEntities.clear();
        }
    }
    
    /**
     * 更新所有根实体
     * 
     * 强制更新所有根实体及其层次结构。
     */
    public updateAllRootEntities(): void {
        this.rebuildRootEntityCache();
        
        for (const rootEntityId of this._rootEntities) {
            this.updateEntityHierarchyRecursive(rootEntityId);
        }
    }
    
    /**
     * 设置实体的激活状态
     * 
     * 设置实体的本地激活状态并传播到子实体。
     * 
     * @param entityId 实体ID
     * @param active 激活状态
     */
    public setEntityActive(entityId: number, active: boolean): void {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        if (!hierarchy) {
            return;
        }
        
        hierarchy.setLocalActive(active);
        this.propagateActivationState(entityId);
        this._stats.activationPropagations++;
    }
    
    /**
     * 获取实体在层次结构中的激活状态
     * 
     * @param entityId 实体ID
     * @returns 在层次结构中的激活状态
     */
    public getEntityActiveInHierarchy(entityId: number): boolean {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        return hierarchy?.activeInHierarchy ?? true;
    }
    
    /**
     * 获取实体的本地激活状态
     * 
     * @param entityId 实体ID
     * @returns 本地激活状态
     */
    public getEntityLocalActive(entityId: number): boolean {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        return hierarchy?.localActive ?? true;
    }
    
    /**
     * 启用或禁用系统
     * 
     * @param enabled 是否启用
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
    
    /**
     * 获取系统是否启用
     * 
     * @returns 是否启用
     */
    public isEnabled(): boolean {
        return this.enabled;
    }
    
    /**
     * 获取系统统计信息
     * 
     * @returns 统计信息对象
     */
    public getStats(): {
        entitiesProcessed: number;
        hierarchyUpdates: number;
        activationPropagations: number;
        depthCalculations: number;
        dirtyEntitiesCount: number;
        rootEntitiesCount: number;
    } {
        return {
            ...this._stats,
            dirtyEntitiesCount: this._dirtyEntities.size,
            rootEntitiesCount: this._rootEntities.size
        };
    }
    
    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this._stats = {
            entitiesProcessed: 0,
            hierarchyUpdates: 0,
            activationPropagations: 0,
            depthCalculations: 0
        };
    }
    
    /**
     * 清理系统资源
     */
    public cleanup(): void {
        this._dirtyEntities.clear();
        this._rootEntities.clear();
        this.resetStats();
    }
    
    /**
     * 处理所有脏实体
     * 
     * @private
     */
    private processDirtyEntities(): void {
        // 按深度排序，先处理浅层实体
        const sortedEntities = Array.from(this._dirtyEntities).sort((a, b) => {
            const depthA = this._hierarchyManager.getDepth(a);
            const depthB = this._hierarchyManager.getDepth(b);
            return depthA - depthB;
        });
        
        for (const entityId of sortedEntities) {
            this.updateEntityHierarchy(entityId);
        }
    }
    
    /**
     * 更新单个实体的层次结构
     * 
     * @param entityId 实体ID
     * @private
     */
    private updateEntityHierarchy(entityId: number): void {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        if (!hierarchy) {
            return;
        }
        
        // 如果不是脏的，跳过更新
        if (!hierarchy.isDirty) {
            return;
        }
        
        // 更新深度
        this.updateEntityDepth(entityId);
        
        // 更新激活状态
        this.updateEntityActivation(entityId);
        
        // 清除脏标记
        hierarchy.clearDirty();
        
        this._stats.hierarchyUpdates++;
    }
    
    /**
     * 递归更新实体层次结构
     * 
     * @param entityId 实体ID
     * @private
     */
    private updateEntityHierarchyRecursive(entityId: number): void {
        this.updateEntityHierarchy(entityId);
        
        // 递归更新所有子实体
        const children = this._hierarchyManager.getChildren(entityId);
        for (const childId of children) {
            this.updateEntityHierarchyRecursive(childId);
        }
    }
    
    /**
     * 更新实体深度
     * 
     * @param entityId 实体ID
     * @private
     */
    private updateEntityDepth(entityId: number): void {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        if (!hierarchy) {
            return;
        }
        
        let depth = 0;
        let parentId = hierarchy.parentId;
        
        // 向上遍历计算深度
        while (parentId !== null) {
            depth++;
            const parentHierarchy = this._componentManager.getComponent(parentId, HierarchyComponent);
            if (!parentHierarchy) {
                break;
            }
            parentId = parentHierarchy.parentId;
        }
        
        hierarchy.setDepth(depth);
        this._stats.depthCalculations++;
    }
    
    /**
     * 更新实体激活状态
     * 
     * @param entityId 实体ID
     * @private
     */
    private updateEntityActivation(entityId: number): void {
        const hierarchy = this._componentManager.getComponent(entityId, HierarchyComponent);
        if (!hierarchy) {
            return;
        }
        
        let activeInHierarchy = hierarchy.localActive;
        
        // 检查父实体的激活状态
        if (hierarchy.parentId !== null) {
            const parentHierarchy = this._componentManager.getComponent(hierarchy.parentId, HierarchyComponent);
            if (parentHierarchy) {
                activeInHierarchy = activeInHierarchy && parentHierarchy.activeInHierarchy;
            }
        }
        
        const oldActiveInHierarchy = hierarchy.activeInHierarchy;
        hierarchy.setActiveInHierarchy(activeInHierarchy);
        
        // 如果激活状态发生变化，传播到子实体
        if (oldActiveInHierarchy !== activeInHierarchy) {
            this.propagateActivationState(entityId);
        }
    }
    
    /**
     * 传播激活状态到子实体
     * 
     * @param entityId 实体ID
     * @private
     */
    private propagateActivationState(entityId: number): void {
        const children = this._hierarchyManager.getChildren(entityId);
        
        for (const childId of children) {
            this.updateEntityActivation(childId);
            this.propagateActivationState(childId); // 递归传播
        }
    }
    
    /**
     * 重建根实体缓存
     * 
     * @private
     */
    private rebuildRootEntityCache(): void {
        this._rootEntities.clear();
        
        // 这里需要遍历所有有HierarchyComponent的实体
        // 实际实现可能需要配合实体管理器
        // 临时实现：假设可以从组件管理器获取所有相关实体
        
        // TODO: 实现实际的根实体发现逻辑
        // 可能需要从场景或实体管理器获取所有实体列表
    }
}