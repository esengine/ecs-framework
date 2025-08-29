import { Core } from '../../Core';

/**
 * 层级行为策略
 */
export enum HierarchyBehavior {
    /** 当层级功能禁用时返回空值/默认值 */
    ReturnEmpty,
    /** 当层级功能禁用时抛出错误 */
    ThrowError
}

/**
 * 层级节点信息
 */
interface HierarchyNode {
    /** 父实体ID */
    parentId: number | null;
    /** 子实体ID集合 */
    childIds: Set<number>;
}

/**
 * 层级关系管理器
 * 
 * 专门管理实体的父子关系，只存储entityId关系，不直接触碰组件与场景
 */
export class Hierarchy {
    /**
     * 层级数据存储 entityId -> HierarchyNode
     */
    private static _nodes = new Map<number, HierarchyNode>();

    /**
     * 默认行为策略
     */
    private static _defaultBehavior: HierarchyBehavior = HierarchyBehavior.ThrowError;

    /**
     * 设置默认行为策略
     * 
     * @param behavior - 行为策略
     */
    public static setDefaultBehavior(behavior: HierarchyBehavior): void {
        Hierarchy._defaultBehavior = behavior;
    }

    /**
     * 检查层级功能是否启用，根据策略返回或抛错
     * 
     * @param behavior - 可选的行为策略，默认使用全局设置
     * @returns 是否启用
     */
    private static checkEnabled(behavior?: HierarchyBehavior): boolean {
        if (Core.entityHierarchyEnabled) {
            return true;
        }

        const useBehavior = behavior ?? Hierarchy._defaultBehavior;
        if (useBehavior === HierarchyBehavior.ThrowError) {
            throw new Error("Entity父子关系功能已禁用。这不符合纯ECS设计，如需使用请在Core配置中启用entityHierarchy选项");
        }

        return false;
    }

    /**
     * 获取或创建节点
     * 
     * @param entityId - 实体ID
     * @returns 层级节点
     */
    private static getOrCreateNode(entityId: number): HierarchyNode {
        let node = Hierarchy._nodes.get(entityId);
        if (!node) {
            node = {
                parentId: null,
                childIds: new Set()
            };
            Hierarchy._nodes.set(entityId, node);
        }
        return node;
    }

    /**
     * 设置父子关系
     * 
     * @param childId - 子实体ID
     * @param parentId - 父实体ID
     * @param behavior - 行为策略
     */
    public static setParent(childId: number, parentId: number, behavior?: HierarchyBehavior): void {
        if (!Hierarchy.checkEnabled(behavior)) {
            return;
        }

        if (childId === parentId) {
            throw new Error("Entity cannot be its own parent");
        }

        // 检查是否会造成循环引用
        if (Hierarchy.isDescendantOf(parentId, childId, behavior)) {
            throw new Error("Setting parent would create a circular reference");
        }

        const childNode = Hierarchy.getOrCreateNode(childId);
        const parentNode = Hierarchy.getOrCreateNode(parentId);

        // 如果子实体已有父实体，先从原父实体移除
        if (childNode.parentId !== null) {
            Hierarchy.removeParent(childId, behavior);
        }

        // 设置新的父子关系
        childNode.parentId = parentId;
        parentNode.childIds.add(childId);
    }

    /**
     * 移除父子关系
     * 
     * @param childId - 子实体ID
     * @param behavior - 行为策略
     */
    public static removeParent(childId: number, behavior?: HierarchyBehavior): void {
        if (!Hierarchy.checkEnabled(behavior)) {
            return;
        }

        const childNode = Hierarchy._nodes.get(childId);
        if (!childNode || childNode.parentId === null) {
            return;
        }

        const parentId = childNode.parentId;
        const parentNode = Hierarchy._nodes.get(parentId);
        
        if (parentNode) {
            parentNode.childIds.delete(childId);
        }

        childNode.parentId = null;
    }

    /**
     * 获取父实体ID
     * 
     * @param entityId - 实体ID
     * @param behavior - 行为策略
     * @returns 父实体ID或null
     */
    public static getParentId(entityId: number, behavior?: HierarchyBehavior): number | null {
        if (!Hierarchy.checkEnabled(behavior)) {
            return null;
        }

        const node = Hierarchy._nodes.get(entityId);
        return node?.parentId || null;
    }

    /**
     * 获取子实体ID列表
     * 
     * @param entityId - 实体ID
     * @param behavior - 行为策略
     * @returns 子实体ID数组
     */
    public static getChildIds(entityId: number, behavior?: HierarchyBehavior): number[] {
        if (!Hierarchy.checkEnabled(behavior)) {
            return [];
        }

        const node = Hierarchy._nodes.get(entityId);
        return node ? Array.from(node.childIds) : [];
    }

    /**
     * 获取子实体数量
     * 
     * @param entityId - 实体ID
     * @param behavior - 行为策略
     * @returns 子实体数量
     */
    public static getChildCount(entityId: number, behavior?: HierarchyBehavior): number {
        if (!Hierarchy.checkEnabled(behavior)) {
            return 0;
        }

        const node = Hierarchy._nodes.get(entityId);
        return node?.childIds.size || 0;
    }

    /**
     * 获取层级深度
     * 
     * @param entityId - 实体ID
     * @param behavior - 行为策略
     * @returns 在层次结构中的深度（根实体为0）
     */
    public static getDepth(entityId: number, behavior?: HierarchyBehavior): number {
        if (!Hierarchy.checkEnabled(behavior)) {
            return 0;
        }

        let depth = 0;
        let currentId: number | null = entityId;
        
        while (currentId !== null) {
            const parentId = Hierarchy.getParentId(currentId, HierarchyBehavior.ReturnEmpty);
            if (parentId === null) {
                break;
            }
            depth++;
            currentId = parentId;
            
            // 防止无限循环（虽然理论上不应该发生）
            if (depth > 1000) {
                throw new Error("Hierarchy depth exceeds maximum limit, possible circular reference");
            }
        }
        
        return depth;
    }

    /**
     * 获取根实体ID
     * 
     * @param entityId - 实体ID
     * @param behavior - 行为策略
     * @returns 根实体ID
     */
    public static getRootId(entityId: number, behavior?: HierarchyBehavior): number {
        if (!Hierarchy.checkEnabled(behavior)) {
            return entityId;
        }

        let rootId = entityId;
        let currentId: number | null = entityId;
        
        while (currentId !== null) {
            const parentId = Hierarchy.getParentId(currentId, HierarchyBehavior.ReturnEmpty);
            if (parentId === null) {
                rootId = currentId;
                break;
            }
            currentId = parentId;
            
            // 防止无限循环
            if (rootId !== entityId && currentId === entityId) {
                throw new Error("Circular reference detected in hierarchy");
            }
        }
        
        return rootId;
    }

    /**
     * 检查是否是指定实体的祖先
     * 
     * @param ancestorId - 潜在的祖先实体ID
     * @param descendantId - 潜在的后代实体ID
     * @param behavior - 行为策略
     * @returns 是否是祖先关系
     */
    public static isAncestorOf(ancestorId: number, descendantId: number, behavior?: HierarchyBehavior): boolean {
        if (!Hierarchy.checkEnabled(behavior)) {
            return false;
        }

        let currentId: number | null = descendantId;
        
        while (currentId !== null) {
            const parentId = Hierarchy.getParentId(currentId, HierarchyBehavior.ReturnEmpty);
            if (parentId === ancestorId) {
                return true;
            }
            currentId = parentId;
            
            // 防止无限循环
            if (currentId === descendantId) {
                break;
            }
        }
        
        return false;
    }

    /**
     * 检查是否是指定实体的后代
     * 
     * @param descendantId - 潜在的后代实体ID
     * @param ancestorId - 潜在的祖先实体ID
     * @param behavior - 行为策略
     * @returns 是否是后代关系
     */
    public static isDescendantOf(descendantId: number, ancestorId: number, behavior?: HierarchyBehavior): boolean {
        return Hierarchy.isAncestorOf(ancestorId, descendantId, behavior);
    }

    /**
     * 根据名称查找子实体ID
     * 
     * @param parentId - 父实体ID
     * @param name - 子实体名称
     * @param recursive - 是否递归查找
     * @param nameResolver - 名称解析函数（实体ID -> 名称）
     * @param behavior - 行为策略
     * @returns 找到的子实体ID或null
     */
    public static findChildIdByName(
        parentId: number, 
        name: string, 
        recursive: boolean,
        nameResolver: (entityId: number) => string,
        behavior?: HierarchyBehavior
    ): number | null {
        if (!Hierarchy.checkEnabled(behavior)) {
            return null;
        }

        const childIds = Hierarchy.getChildIds(parentId, behavior);
        
        // 在直接子实体中查找
        for (const childId of childIds) {
            if (nameResolver(childId) === name) {
                return childId;
            }
        }

        // 递归查找
        if (recursive) {
            for (const childId of childIds) {
                const found = Hierarchy.findChildIdByName(childId, name, true, nameResolver, behavior);
                if (found !== null) {
                    return found;
                }
            }
        }

        return null;
    }

    /**
     * 根据标签查找子实体ID
     * 
     * @param parentId - 父实体ID
     * @param tag - 标签
     * @param recursive - 是否递归查找
     * @param tagResolver - 标签解析函数（实体ID -> 标签）
     * @param behavior - 行为策略
     * @returns 找到的子实体ID数组
     */
    public static findChildIdsByTag(
        parentId: number, 
        tag: number, 
        recursive: boolean,
        tagResolver: (entityId: number) => number,
        behavior?: HierarchyBehavior
    ): number[] {
        if (!Hierarchy.checkEnabled(behavior)) {
            return [];
        }

        const result: number[] = [];
        const childIds = Hierarchy.getChildIds(parentId, behavior);

        // 在直接子实体中查找
        for (const childId of childIds) {
            if (tagResolver(childId) === tag) {
                result.push(childId);
            }
        }

        // 递归查找
        if (recursive) {
            for (const childId of childIds) {
                result.push(...Hierarchy.findChildIdsByTag(childId, tag, true, tagResolver, behavior));
            }
        }

        return result;
    }

    /**
     * 遍历所有子实体ID（深度优先）
     * 
     * @param parentId - 父实体ID
     * @param callback - 对每个子实体执行的回调函数
     * @param recursive - 是否递归遍历
     * @param behavior - 行为策略
     */
    public static forEachChildId(
        parentId: number, 
        callback: (childId: number, index: number) => void, 
        recursive: boolean,
        behavior?: HierarchyBehavior
    ): void {
        if (!Hierarchy.checkEnabled(behavior)) {
            return;
        }

        const childIds = Hierarchy.getChildIds(parentId, behavior);
        
        childIds.forEach((childId, index) => {
            callback(childId, index);
            if (recursive) {
                Hierarchy.forEachChildId(childId, callback, true, behavior);
            }
        });
    }

    /**
     * 清理实体的层级关系
     * 
     * @param entityId - 实体ID
     * @param behavior - 行为策略
     */
    public static cleanup(entityId: number, behavior?: HierarchyBehavior): void {
        if (!Hierarchy.checkEnabled(behavior)) {
            return;
        }

        // 移除与父实体的关系
        Hierarchy.removeParent(entityId, behavior);

        // 将所有子实体设为孤立实体
        const childIds = Hierarchy.getChildIds(entityId, behavior);
        for (const childId of childIds) {
            Hierarchy.removeParent(childId, behavior);
        }

        // 删除节点
        Hierarchy._nodes.delete(entityId);
    }

    /**
     * 获取层级统计信息
     * 
     * @returns 层级统计信息
     */
    public static getStats(): {
        totalNodes: number;
        rootNodes: number;
        maxDepth: number;
    } {
        const totalNodes = Hierarchy._nodes.size;
        let rootNodes = 0;
        let maxDepth = 0;

        for (const [entityId, node] of Hierarchy._nodes) {
            if (node.parentId === null) {
                rootNodes++;
            }
            
            try {
                const depth = Hierarchy.getDepth(entityId, HierarchyBehavior.ReturnEmpty);
                maxDepth = Math.max(maxDepth, depth);
            } catch {
                // 忽略错误（可能是循环引用）
            }
        }

        return {
            totalNodes,
            rootNodes,
            maxDepth
        };
    }

    /**
     * 清空所有层级数据
     */
    public static clear(): void {
        Hierarchy._nodes.clear();
    }
}