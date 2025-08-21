import type { Component } from '../Component';
import type { EntitySystem } from '../Systems/EntitySystem';
import type { ComponentType } from '../Core/ComponentStorage';

/**
 * 存储组件类型名称的Symbol键
 */
export const COMPONENT_TYPE_NAME = Symbol('ComponentTypeName');

/**
 * 存储系统类型名称的Symbol键
 */
export const SYSTEM_TYPE_NAME = Symbol('SystemTypeName');

/**
 * 存储系统元数据的Symbol键
 */
export const SYSTEM_METADATA = Symbol('SystemMetadata');

/**
 * 系统执行阶段枚举
 */
export enum SystemPhase {
    /** 预更新阶段 - 输入处理、状态重置等 */
    PreUpdate = 'pre-update',
    /** 主更新阶段 - 游戏逻辑、移动等 */
    Update = 'update',
    /** 后更新阶段 - 渲染准备、动画等 */
    PostUpdate = 'post-update',
    /** 固定步长更新阶段 - 物理计算、网络同步等 */
    FixedUpdate = 'fixed-update'
}

/**
 * 系统元数据接口
 */
export interface SystemMetadata {
    /** 系统名称 */
    name: string;
    /** 执行阶段，默认为Update */
    phase?: SystemPhase;
    /** 系统读取的组件类型，用于依赖分析 */
    reads?: ComponentType[];
    /** 系统写入的组件类型，用于依赖分析 */
    writes?: ComponentType[];
    /** 手动指定的更新顺序，数字越小越优先执行 */
    updateOrder?: number;
}

/**
 * 组件类型装饰器
 * 用于为组件类指定固定的类型名称，避免在代码混淆后失效
 * 
 * @param typeName 组件类型名称
 * @example
 * ```typescript
 * @ECSComponent('Position')
 * class PositionComponent extends Component {
 *     x: number = 0;
 *     y: number = 0;
 * }
 * ```
 */
export function ECSComponent(typeName: string) {
    return function <T extends new (...args: any[]) => Component>(target: T): T {
        if (!typeName || typeof typeName !== 'string') {
            throw new Error('ECSComponent装饰器必须提供有效的类型名称');
        }
        
        // 在构造函数上存储类型名称
        (target as any)[COMPONENT_TYPE_NAME] = typeName;
        
        return target;
    };
}

/**
 * 系统类型装饰器
 * 用于为系统类指定固定的类型名称和元数据，避免在代码混淆后失效
 * 
 * @param metadata 系统元数据或系统名称（向后兼容）
 * @example
 * ```typescript
 * // 基础用法（向后兼容）
 * @ECSSystem('Movement')
 * class MovementSystem extends EntitySystem {
 *     protected process(entities: Entity[]): void {
 *         // 系统逻辑
 *     }
 * }
 * 
 * // 完整元数据用法
 * @ECSSystem({
 *     name: 'Movement',
 *     phase: SystemPhase.Update,
 *     reads: [Position, Velocity],
 *     writes: [Position],
 *     updateOrder: 10
 * })
 * class MovementSystem extends EntitySystem {
 *     protected process(entities: Entity[]): void {
 *         // 系统逻辑
 *     }
 * }
 * ```
 */
export function ECSSystem(metadata: SystemMetadata | string) {
    return function <T extends new (...args: any[]) => EntitySystem>(target: T): T {
        let systemMetadata: SystemMetadata;
        
        // 向后兼容：支持旧的string参数
        if (typeof metadata === 'string') {
            if (!metadata || typeof metadata !== 'string') {
                throw new Error('ECSSystem装饰器必须提供有效的系统名称');
            }
            systemMetadata = { 
                name: metadata,
                phase: SystemPhase.Update // 默认阶段
            };
        } else {
            if (!metadata || !metadata.name) {
                throw new Error('ECSSystem装饰器必须提供有效的系统名称');
            }
            systemMetadata = {
                ...metadata,
                phase: metadata.phase ?? SystemPhase.Update // 默认阶段
            };
        }
        
        // 在构造函数上存储类型名称和元数据
        (target as any)[SYSTEM_TYPE_NAME] = systemMetadata.name;
        (target as any)[SYSTEM_METADATA] = systemMetadata;
        
        return target;
    };
}

/**
 * 获取组件类型的名称，优先使用装饰器指定的名称
 * 
 * @param componentType 组件构造函数
 * @returns 组件类型名称
 */
export function getComponentTypeName<T extends Component>(
    componentType: new (...args: any[]) => T
): string {
    // 优先使用装饰器指定的名称
    const decoratorName = (componentType as any)[COMPONENT_TYPE_NAME];
    if (decoratorName) {
        return decoratorName;
    }
    
    // 回退到constructor.name
    return componentType.name || 'UnknownComponent';
}

/**
 * 获取系统类型的名称，优先使用装饰器指定的名称
 * 
 * @param systemType 系统构造函数
 * @returns 系统类型名称
 */
export function getSystemTypeName<T extends EntitySystem>(
    systemType: new (...args: any[]) => T
): string {
    // 优先使用装饰器指定的名称
    const decoratorName = (systemType as any)[SYSTEM_TYPE_NAME];
    if (decoratorName) {
        return decoratorName;
    }
    
    // 回退到constructor.name
    return systemType.name || 'UnknownSystem';
}

/**
 * 获取系统的完整元数据，优先使用装饰器指定的元数据
 * 
 * @param systemType 系统构造函数
 * @returns 系统元数据
 */
export function getSystemMetadata<T extends EntitySystem>(
    systemType: new (...args: any[]) => T
): SystemMetadata {
    // 优先使用装饰器指定的元数据
    const decoratorMetadata = (systemType as any)[SYSTEM_METADATA];
    if (decoratorMetadata) {
        return decoratorMetadata;
    }
    
    // 回退到基础元数据
    return {
        name: getSystemTypeName(systemType),
        phase: SystemPhase.Update
    };
}

/**
 * 获取系统实例的元数据
 * 
 * @param systemInstance 系统实例
 * @returns 系统元数据
 */
export function getSystemInstanceMetadata(systemInstance: EntitySystem): SystemMetadata {
    return getSystemMetadata(systemInstance.constructor as any);
}

/**
 * 从组件实例获取类型名称
 * 
 * @param component 组件实例
 * @returns 组件类型名称
 */
export function getComponentInstanceTypeName(component: Component): string {
    return getComponentTypeName(component.constructor as new (...args: any[]) => Component);
}

/**
 * 从系统实例获取类型名称
 * 
 * @param system 系统实例
 * @returns 系统类型名称
 */
export function getSystemInstanceTypeName(system: EntitySystem): string {
    return getSystemTypeName(system.constructor as new (...args: any[]) => EntitySystem);
}

