import { Entity } from '../Entity';
import { Core } from '../../Core';
import { getComponentInstanceTypeName } from '../Decorators';

/**
 * 实体调试信息接口
 */
export interface EntityDebugInfo {
    name: string;
    id: number;
    enabled: boolean;
    active: boolean;
    activeInHierarchy: boolean;
    destroyed: boolean;
    componentCount: number;
    componentTypes: string[];
    componentMask: {
        binary: string;
        hex: string;
        decimal: string;
        registeredComponents: Record<string, boolean>;
    };
    parentId: number | null;
    childCount: number;
    childIds: number[];
    depth: number;
    indexMappingSize: number;
}

/**
 * 实体调试视图
 */
export class EntityDebugView {
    /**
     * 获取实体的调试信息
     * 
     * @param entity - 要获取调试信息的实体
     * @returns 包含实体详细信息的对象
     */
    public static getDebugInfo(entity: Entity): EntityDebugInfo {
        const componentSetDebugInfo = entity['_componentSet'].getDebugInfo();
        
        return {
            name: entity.name,
            id: entity.id,
            enabled: entity.enabled,
            active: entity.active,
            activeInHierarchy: entity.activeInHierarchy,
            destroyed: entity.isDestroyed,
            componentCount: componentSetDebugInfo.componentCount,
            componentTypes: componentSetDebugInfo.componentTypes,
            componentMask: componentSetDebugInfo.componentMask,
            parentId: Core.entityHierarchyEnabled ? (EntityDebugView.getParentId(entity) || null) : null,
            childCount: Core.entityHierarchyEnabled ? EntityDebugView.getChildCount(entity) : 0,
            childIds: Core.entityHierarchyEnabled ? EntityDebugView.getChildIds(entity) : [],
            depth: Core.entityHierarchyEnabled ? EntityDebugView.getDepth(entity) : 0,
            indexMappingSize: componentSetDebugInfo.indexMappingSize
        };
    }

    /**
     * 获取父实体ID
     * 
     * @param entity - 实体
     * @returns 父实体ID或null
     */
    private static getParentId(entity: Entity): number | null {
        try {
            const parent = entity.parent;
            return parent ? parent.id : null;
        } catch {
            // 如果父子关系功能未启用，会抛出错误
            return null;
        }
    }

    /**
     * 获取子实体数量
     * 
     * @param entity - 实体
     * @returns 子实体数量
     */
    private static getChildCount(entity: Entity): number {
        try {
            return entity.childCount;
        } catch {
            // 如果父子关系功能未启用，会抛出错误
            return 0;
        }
    }

    /**
     * 获取子实体ID列表
     * 
     * @param entity - 实体
     * @returns 子实体ID数组
     */
    private static getChildIds(entity: Entity): number[] {
        try {
            return entity.children.map(c => c.id);
        } catch {
            // 如果父子关系功能未启用，会抛出错误
            return [];
        }
    }

    /**
     * 获取实体在层次结构中的深度
     * 
     * @param entity - 实体
     * @returns 层次深度
     */
    private static getDepth(entity: Entity): number {
        try {
            return entity.getDepth();
        } catch {
            // 如果父子关系功能未启用，会抛出错误
            return 0;
        }
    }

    /**
     * 获取实体的简化调试信息
     * 
     * 仅包含基本信息，用于日志输出或快速检查
     * 
     * @param entity - 实体
     * @returns 简化的调试信息
     */
    public static getSimpleDebugInfo(entity: Entity): {
        name: string;
        id: number;
        componentCount: number;
        active: boolean;
        destroyed: boolean;
    } {
        return {
            name: entity.name,
            id: entity.id,
            componentCount: entity.components.length,
            active: entity.active,
            destroyed: entity.isDestroyed
        };
    }

    /**
     * 获取实体的组件调试信息
     * 
     * 专门用于查看实体的组件状态
     * 
     * @param entity - 实体
     * @returns 组件相关的调试信息
     */
    public static getComponentDebugInfo(entity: Entity): {
        componentCount: number;
        componentTypes: string[];
        componentMask: {
            binary: string;
            hex: string;
            decimal: string;
            registeredComponents: Record<string, boolean>;
        };
    } {
        return entity['_componentSet'].getDebugInfo();
    }

    /**
     * 生成实体的调试字符串
     * 
     * @param entity - 实体
     * @param includeComponents - 是否包含组件信息
     * @returns 格式化的调试字符串
     */
    public static toDebugString(entity: Entity, includeComponents: boolean = false): string {
        const info = EntityDebugView.getSimpleDebugInfo(entity);
        let result = `Entity[${info.name}:${info.id}] `;
        result += `(components: ${info.componentCount}, `;
        result += `active: ${info.active}, destroyed: ${info.destroyed})`;
        
        if (includeComponents && entity.components.length > 0) {
            const componentNames = entity.components.map(c => getComponentInstanceTypeName(c));
            result += `\n  Components: [${componentNames.join(', ')}]`;
        }
        
        return result;
    }
}