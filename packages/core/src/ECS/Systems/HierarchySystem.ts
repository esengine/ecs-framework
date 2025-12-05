import { Entity } from '../Entity';
import { EntitySystem } from './EntitySystem';
import { Matcher } from '../Utils/Matcher';
import { HierarchyComponent } from '../Components/HierarchyComponent';

/**
 * 层级关系系统 - 管理实体间的父子关系
 *
 * 提供层级操作的统一 API，维护层级缓存（depth、activeInHierarchy）。
 * 所有层级操作应通过此系统进行，而非直接修改 HierarchyComponent。
 *
 * @example
 * ```typescript
 * const hierarchySystem = scene.getSystem(HierarchySystem);
 *
 * // 设置父子关系
 * hierarchySystem.setParent(child, parent);
 *
 * // 查询层级
 * const parent = hierarchySystem.getParent(entity);
 * const children = hierarchySystem.getChildren(entity);
 * const depth = hierarchySystem.getDepth(entity);
 * ```
 */
export class HierarchySystem extends EntitySystem {
    private static readonly MAX_DEPTH = 32;

    /**
     * 脏实体集合 - 只有这些实体需要在 process() 中更新缓存
     * Dirty entity set - only these entities need cache update in process()
     */
    private dirtyEntities: Set<Entity> = new Set();

    constructor() {
        super(Matcher.empty().all(HierarchyComponent));
    }

    /**
     * 系统优先级，确保在其他系统之前更新层级缓存
     */
    public override get updateOrder(): number {
        return -1000;
    }

    protected override process(_entities: readonly Entity[]): void {
        // 只更新脏实体，不遍历所有实体 | Only update dirty entities, no full iteration
        if (this.dirtyEntities.size === 0) {
            return;
        }

        for (const entity of this.dirtyEntities) {
            // 确保实体仍然有效 | Ensure entity is still valid
            if (entity.scene) {
                this.updateHierarchyCache(entity);
            }
        }
        this.dirtyEntities.clear();
    }

    /**
     * 设置实体的父级
     *
     * @param child - 子实体
     * @param parent - 父实体，null 表示移动到根级
     */
    public setParent(child: Entity, parent: Entity | null): void {
        let childHierarchy = child.getComponent(HierarchyComponent);

        // 如果子实体没有 HierarchyComponent，自动添加
        if (!childHierarchy) {
            childHierarchy = new HierarchyComponent();
            child.addComponent(childHierarchy);
        }

        // 检查是否需要变更
        const currentParentId = childHierarchy.parentId;
        const newParentId = parent?.id ?? null;
        if (currentParentId === newParentId) {
            return;
        }

        // 防止循环引用
        if (parent && this.isAncestorOf(child, parent)) {
            throw new Error('Cannot set parent: would create circular reference');
        }

        // 从旧父级移除
        if (currentParentId !== null) {
            const oldParent = this.scene?.findEntityById(currentParentId);
            if (oldParent) {
                const oldParentHierarchy = oldParent.getComponent(HierarchyComponent);
                if (oldParentHierarchy) {
                    const idx = oldParentHierarchy.childIds.indexOf(child.id);
                    if (idx !== -1) {
                        oldParentHierarchy.childIds.splice(idx, 1);
                    }
                }
            }
        }

        // 添加到新父级
        if (parent) {
            let parentHierarchy = parent.getComponent(HierarchyComponent);
            if (!parentHierarchy) {
                parentHierarchy = new HierarchyComponent();
                parent.addComponent(parentHierarchy);
            }
            childHierarchy.parentId = parent.id;
            parentHierarchy.childIds.push(child.id);
        } else {
            childHierarchy.parentId = null;
        }

        // 标记缓存脏
        this.markCacheDirty(child);
    }

    /**
     * 在指定位置插入子实体
     *
     * @param parent - 父实体
     * @param child - 子实体
     * @param index - 插入位置索引，-1 表示追加到末尾
     */
    public insertChildAt(parent: Entity, child: Entity, index: number): void {
        let childHierarchy = child.getComponent(HierarchyComponent);
        let parentHierarchy = parent.getComponent(HierarchyComponent);

        // 自动添加 HierarchyComponent
        if (!childHierarchy) {
            childHierarchy = new HierarchyComponent();
            child.addComponent(childHierarchy);
        }
        if (!parentHierarchy) {
            parentHierarchy = new HierarchyComponent();
            parent.addComponent(parentHierarchy);
        }

        // 防止循环引用
        if (this.isAncestorOf(child, parent)) {
            throw new Error('Cannot set parent: would create circular reference');
        }

        // 从旧父级移除
        if (childHierarchy.parentId !== null && childHierarchy.parentId !== parent.id) {
            const oldParent = this.scene?.findEntityById(childHierarchy.parentId);
            if (oldParent) {
                const oldParentHierarchy = oldParent.getComponent(HierarchyComponent);
                if (oldParentHierarchy) {
                    const idx = oldParentHierarchy.childIds.indexOf(child.id);
                    if (idx !== -1) {
                        oldParentHierarchy.childIds.splice(idx, 1);
                    }
                }
            }
        }

        // 设置新父级
        childHierarchy.parentId = parent.id;

        // 从当前父级的子列表中移除（如果已存在）
        const existingIdx = parentHierarchy.childIds.indexOf(child.id);
        if (existingIdx !== -1) {
            parentHierarchy.childIds.splice(existingIdx, 1);
        }

        // 插入到指定位置
        if (index < 0 || index >= parentHierarchy.childIds.length) {
            parentHierarchy.childIds.push(child.id);
        } else {
            parentHierarchy.childIds.splice(index, 0, child.id);
        }

        // 标记缓存脏
        this.markCacheDirty(child);
    }

    /**
     * 移除子实体（将其移动到根级）
     */
    public removeChild(parent: Entity, child: Entity): boolean {
        const parentHierarchy = parent.getComponent(HierarchyComponent);
        const childHierarchy = child.getComponent(HierarchyComponent);

        if (!parentHierarchy || !childHierarchy) {
            return false;
        }

        if (childHierarchy.parentId !== parent.id) {
            return false;
        }

        const idx = parentHierarchy.childIds.indexOf(child.id);
        if (idx !== -1) {
            parentHierarchy.childIds.splice(idx, 1);
        }

        childHierarchy.parentId = null;
        this.markCacheDirty(child);

        return true;
    }

    /**
     * 移除所有子实体
     */
    public removeAllChildren(parent: Entity): void {
        const parentHierarchy = parent.getComponent(HierarchyComponent);
        if (!parentHierarchy) return;

        const childIds = [...parentHierarchy.childIds];
        for (const childId of childIds) {
            const child = this.scene?.findEntityById(childId);
            if (child) {
                this.removeChild(parent, child);
            }
        }
    }

    /**
     * 获取实体的父级
     */
    public getParent(entity: Entity): Entity | null {
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (!hierarchy || hierarchy.parentId === null) {
            return null;
        }
        return this.scene?.findEntityById(hierarchy.parentId) ?? null;
    }

    /**
     * 获取实体的子级列表
     */
    public getChildren(entity: Entity): Entity[] {
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (!hierarchy) return [];

        const children: Entity[] = [];
        for (const childId of hierarchy.childIds) {
            const child = this.scene?.findEntityById(childId);
            if (child) {
                children.push(child);
            }
        }
        return children;
    }

    /**
     * 获取子级数量
     */
    public getChildCount(entity: Entity): number {
        const hierarchy = entity.getComponent(HierarchyComponent);
        return hierarchy?.childIds.length ?? 0;
    }

    /**
     * 检查实体是否有子级
     */
    public hasChildren(entity: Entity): boolean {
        return this.getChildCount(entity) > 0;
    }

    /**
     * 检查 ancestor 是否是 entity 的祖先
     */
    public isAncestorOf(ancestor: Entity, entity: Entity): boolean {
        let current = this.getParent(entity);
        let depth = 0;

        while (current && depth < HierarchySystem.MAX_DEPTH) {
            if (current.id === ancestor.id) {
                return true;
            }
            current = this.getParent(current);
            depth++;
        }

        return false;
    }

    /**
     * 检查 descendant 是否是 entity 的后代
     */
    public isDescendantOf(descendant: Entity, entity: Entity): boolean {
        return this.isAncestorOf(entity, descendant);
    }

    /**
     * 获取根实体
     */
    public getRoot(entity: Entity): Entity {
        let current = entity;
        let parent = this.getParent(current);
        let depth = 0;

        while (parent && depth < HierarchySystem.MAX_DEPTH) {
            current = parent;
            parent = this.getParent(current);
            depth++;
        }

        return current;
    }

    /**
     * 获取实体在层级中的深度
     */
    public getDepth(entity: Entity): number {
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (!hierarchy) return 0;

        // 如果缓存有效，直接返回
        if (!hierarchy.bCacheDirty) {
            return hierarchy.depth;
        }

        // 重新计算
        let depth = 0;
        let current = this.getParent(entity);
        while (current && depth < HierarchySystem.MAX_DEPTH) {
            depth++;
            current = this.getParent(current);
        }

        hierarchy.depth = depth;
        return depth;
    }

    /**
     * 检查实体在层级中是否激活
     */
    public isActiveInHierarchy(entity: Entity): boolean {
        if (!entity.active) return false;

        const hierarchy = entity.getComponent(HierarchyComponent);
        if (!hierarchy) return entity.active;

        // 如果缓存有效，直接返回
        if (!hierarchy.bCacheDirty) {
            return hierarchy.bActiveInHierarchy;
        }

        // 重新计算
        const parent = this.getParent(entity);
        if (!parent) {
            hierarchy.bActiveInHierarchy = entity.active;
        } else {
            hierarchy.bActiveInHierarchy = entity.active && this.isActiveInHierarchy(parent);
        }

        return hierarchy.bActiveInHierarchy;
    }

    /**
     * 获取所有根实体（没有父级的实体）
     */
    public getRootEntities(): Entity[] {
        const roots: Entity[] = [];
        for (const entity of this.entities) {
            const hierarchy = entity.getComponent(HierarchyComponent);
            if (hierarchy && hierarchy.parentId === null) {
                roots.push(entity);
            }
        }
        return roots;
    }

    /**
     * 根据名称查找子实体
     *
     * @param entity - 父实体
     * @param name - 子实体名称
     * @param bRecursive - 是否递归查找
     */
    public findChild(entity: Entity, name: string, bRecursive: boolean = false): Entity | null {
        const children = this.getChildren(entity);

        for (const child of children) {
            if (child.name === name) {
                return child;
            }
        }

        if (bRecursive) {
            for (const child of children) {
                const found = this.findChild(child, name, true);
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
     * @param entity - 父实体
     * @param tag - 标签值
     * @param bRecursive - 是否递归查找
     */
    public findChildrenByTag(entity: Entity, tag: number, bRecursive: boolean = false): Entity[] {
        const result: Entity[] = [];
        const children = this.getChildren(entity);

        for (const child of children) {
            if ((child.tag & tag) !== 0) {
                result.push(child);
            }

            if (bRecursive) {
                result.push(...this.findChildrenByTag(child, tag, true));
            }
        }

        return result;
    }

    /**
     * 遍历所有子级
     *
     * @param entity - 父实体
     * @param callback - 回调函数
     * @param bRecursive - 是否递归遍历
     */
    public forEachChild(
        entity: Entity,
        callback: (child: Entity) => void,
        bRecursive: boolean = false
    ): void {
        const children = this.getChildren(entity);

        for (const child of children) {
            callback(child);

            if (bRecursive) {
                this.forEachChild(child, callback, true);
            }
        }
    }

    /**
     * 扁平化层级树（用于虚拟化渲染）
     *
     * @param expandedIds - 展开的实体 ID 集合
     * @returns 扁平化的节点列表
     */
    public flattenHierarchy(expandedIds: Set<number>): Array<{
        entity: Entity;
        depth: number;
        bHasChildren: boolean;
        bIsExpanded: boolean;
    }> {
        const result: Array<{
            entity: Entity;
            depth: number;
            bHasChildren: boolean;
            bIsExpanded: boolean;
        }> = [];

        const traverse = (entity: Entity, depth: number): void => {
            const bHasChildren = this.hasChildren(entity);
            const bIsExpanded = expandedIds.has(entity.id);

            result.push({
                entity,
                depth,
                bHasChildren,
                bIsExpanded
            });

            if (bHasChildren && bIsExpanded) {
                for (const child of this.getChildren(entity)) {
                    traverse(child, depth + 1);
                }
            }
        };

        for (const root of this.getRootEntities()) {
            traverse(root, 0);
        }

        return result;
    }

    /**
     * 标记缓存为脏，并添加到脏实体集合
     * Mark cache as dirty and add to dirty entity set
     */
    private markCacheDirty(entity: Entity): void {
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (!hierarchy) return;

        // 如果已经是脏的，跳过（避免重复递归）
        // Skip if already dirty (avoid redundant recursion)
        if (hierarchy.bCacheDirty) return;

        hierarchy.bCacheDirty = true;
        this.dirtyEntities.add(entity);

        // 递归标记所有子级 | Recursively mark all children
        for (const childId of hierarchy.childIds) {
            const child = this.scene?.findEntityById(childId);
            if (child) {
                this.markCacheDirty(child);
            }
        }
    }

    /**
     * 更新层级缓存
     */
    private updateHierarchyCache(entity: Entity): void {
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (!hierarchy) return;

        // 计算深度
        hierarchy.depth = this.getDepth(entity);

        // 计算激活状态
        hierarchy.bActiveInHierarchy = this.isActiveInHierarchy(entity);

        // 标记缓存有效
        hierarchy.bCacheDirty = false;
    }

    /**
     * 当实体被添加到系统时，将其加入脏集合
     * When entity is added to system, add it to dirty set
     */
    protected override onAdded(entity: Entity): void {
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (hierarchy && hierarchy.bCacheDirty) {
            this.dirtyEntities.add(entity);
        }
    }

    /**
     * 当实体被移除时清理层级关系
     * When entity is removed, clean up hierarchy relationships
     */
    protected override onRemoved(entity: Entity): void {
        // 从脏集合中移除 | Remove from dirty set
        this.dirtyEntities.delete(entity);

        const hierarchy = entity.getComponent(HierarchyComponent);
        if (!hierarchy) return;

        // 从父级移除 | Remove from parent
        if (hierarchy.parentId !== null) {
            const parent = this.scene?.findEntityById(hierarchy.parentId);
            if (parent) {
                const parentHierarchy = parent.getComponent(HierarchyComponent);
                if (parentHierarchy) {
                    const idx = parentHierarchy.childIds.indexOf(entity.id);
                    if (idx !== -1) {
                        parentHierarchy.childIds.splice(idx, 1);
                    }
                }
            }
        }

        // 处理子级：将子级移动到根级
        // Handle children: move children to root level
        for (const childId of hierarchy.childIds) {
            const child = this.scene?.findEntityById(childId);
            if (child) {
                const childHierarchy = child.getComponent(HierarchyComponent);
                if (childHierarchy) {
                    childHierarchy.parentId = null;
                    this.markCacheDirty(child);
                }
            }
        }
    }

    public override dispose(): void {
        // 清理脏实体集合 | Clear dirty entity set
        this.dirtyEntities.clear();
    }
}
