import { Component } from '../Component';

/**
 * 层次结构组件
 * 
 * 存储实体的父子关系数据，用于构建实体层次结构。
 * 将层次关系管理从Entity类中分离出来，实现更清晰的关注点分离。
 * 
 * @example
 * ```typescript
 * // 创建层次结构
 * const parentEntity = entityManager.createEntity("Parent");
 * const childEntity = entityManager.createEntity("Child");
 * 
 * // 添加层次组件
 * const parentHierarchy = parentEntity.addComponent(new HierarchyComponent());
 * const childHierarchy = childEntity.addComponent(new HierarchyComponent());
 * 
 * // 通过HierarchyManager管理关系
 * hierarchyManager.addChild(parentEntity.id, childEntity.id);
 * ```
 */
export class HierarchyComponent extends Component {
    /**
     * 父实体ID
     * 
     * null表示没有父实体（根实体）
     */
    public parentId: number | null = null;
    
    /**
     * 子实体ID列表
     * 
     * 存储所有直接子实体的ID
     */
    public childIds: number[] = [];
    
    /**
     * 在层次结构中的深度
     * 
     * 根实体深度为0，每增加一层深度+1
     */
    public depth: number = 0;
    
    /**
     * 本地激活状态
     * 
     * 实体自身的激活状态，不考虑父实体的影响
     */
    public localActive: boolean = true;
    
    /**
     * 在层次结构中的激活状态
     * 
     * 考虑父实体激活状态的最终激活状态
     * 只有当实体本身和所有父实体都激活时才为true
     */
    public activeInHierarchy: boolean = true;
    
    /**
     * 变换是否为脏（需要更新）
     * 
     * 当层次关系发生变化时标记为true，由TransformSystem负责更新
     */
    public isDirty: boolean = true;
    
    /**
     * 子实体排序顺序
     * 
     * 用于控制子实体在层次结构中的显示顺序
     */
    public siblingIndex: number = 0;
    
    /**
     * 构造函数
     * 
     * @param parentId 父实体ID，可选
     * @param localActive 本地激活状态，默认为true
     */
    constructor(parentId: number | null = null, localActive: boolean = true) {
        super();
        this.parentId = parentId;
        this.localActive = localActive;
    }
    
    /**
     * 检查是否为根实体
     * 
     * @returns 如果没有父实体则返回true
     */
    public isRoot(): boolean {
        return this.parentId === null;
    }
    
    /**
     * 检查是否有子实体
     * 
     * @returns 如果有子实体则返回true
     */
    public hasChildren(): boolean {
        return this.childIds.length > 0;
    }
    
    /**
     * 获取子实体数量
     * 
     * @returns 子实体的数量
     */
    public getChildCount(): number {
        return this.childIds.length;
    }
    
    /**
     * 检查指定实体是否为子实体
     * 
     * @param entityId 要检查的实体ID
     * @returns 如果是子实体则返回true
     */
    public hasChild(entityId: number): boolean {
        return this.childIds.includes(entityId);
    }
    
    /**
     * 添加子实体ID
     * 
     * 内部方法，应该通过HierarchyManager调用
     * 
     * @param childId 子实体ID
     * @internal
     */
    public addChildId(childId: number): void {
        if (!this.hasChild(childId)) {
            this.childIds.push(childId);
            this.markDirty();
        }
    }
    
    /**
     * 移除子实体ID
     * 
     * 内部方法，应该通过HierarchyManager调用
     * 
     * @param childId 子实体ID
     * @returns 是否成功移除
     * @internal
     */
    public removeChildId(childId: number): boolean {
        const index = this.childIds.indexOf(childId);
        if (index !== -1) {
            this.childIds.splice(index, 1);
            this.markDirty();
            return true;
        }
        return false;
    }
    
    /**
     * 设置父实体ID
     * 
     * 内部方法，应该通过HierarchyManager调用
     * 
     * @param parentId 父实体ID
     * @internal
     */
    public setParentId(parentId: number | null): void {
        if (this.parentId !== parentId) {
            this.parentId = parentId;
            this.markDirty();
        }
    }
    
    /**
     * 设置层次深度
     * 
     * 内部方法，由TransformSystem调用
     * 
     * @param depth 新的深度值
     * @internal
     */
    public setDepth(depth: number): void {
        if (this.depth !== depth) {
            this.depth = depth;
            this.markDirty();
        }
    }
    
    /**
     * 设置本地激活状态
     * 
     * @param active 新的激活状态
     */
    public setLocalActive(active: boolean): void {
        if (this.localActive !== active) {
            this.localActive = active;
            this.markDirty();
        }
    }
    
    /**
     * 设置在层次结构中的激活状态
     * 
     * 内部方法，由TransformSystem计算和设置
     * 
     * @param active 在层次结构中的激活状态
     * @internal
     */
    public setActiveInHierarchy(active: boolean): void {
        if (this.activeInHierarchy !== active) {
            this.activeInHierarchy = active;
        }
    }
    
    /**
     * 设置兄弟节点索引
     * 
     * @param index 新的索引值
     */
    public setSiblingIndex(index: number): void {
        if (this.siblingIndex !== index) {
            this.siblingIndex = index;
            this.markDirty();
        }
    }
    
    /**
     * 标记为脏（需要更新）
     */
    public markDirty(): void {
        this.isDirty = true;
    }
    
    /**
     * 清除脏标记
     * 
     * 由TransformSystem在更新完成后调用
     * 
     * @internal
     */
    public clearDirty(): void {
        this.isDirty = false;
    }
    
    /**
     * 获取调试信息
     * 
     * @returns 包含层次结构详细信息的对象
     */
    public getDebugInfo(): {
        parentId: number | null;
        childIds: number[];
        childCount: number;
        depth: number;
        localActive: boolean;
        activeInHierarchy: boolean;
        isDirty: boolean;
        siblingIndex: number;
        isRoot: boolean;
    } {
        return {
            parentId: this.parentId,
            childIds: [...this.childIds],
            childCount: this.childIds.length,
            depth: this.depth,
            localActive: this.localActive,
            activeInHierarchy: this.activeInHierarchy,
            isDirty: this.isDirty,
            siblingIndex: this.siblingIndex,
            isRoot: this.isRoot()
        };
    }
    
    /**
     * 克隆组件
     * 
     * @returns 新的HierarchyComponent实例
     */
    public clone(): HierarchyComponent {
        const cloned = new HierarchyComponent(this.parentId, this.localActive);
        cloned.childIds = [...this.childIds];
        cloned.depth = this.depth;
        cloned.activeInHierarchy = this.activeInHierarchy;
        cloned.isDirty = this.isDirty;
        cloned.siblingIndex = this.siblingIndex;
        return cloned;
    }
}