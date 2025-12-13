/**
 * Type Decorators for ECS Components and Systems
 * ECS 组件和系统的类型装饰器
 *
 * Provides decorators to mark component/system types with stable names
 * that survive code minification.
 *
 * 提供装饰器为组件/系统类型标记稳定的名称，使其在代码混淆后仍然有效。
 */

import type { Component } from '../Component';
import type { EntitySystem } from '../Systems';
import { ComponentRegistry } from '../Core/ComponentStorage/ComponentRegistry';
import {
    COMPONENT_TYPE_NAME,
    COMPONENT_DEPENDENCIES,
    COMPONENT_EDITOR_OPTIONS,
    type ComponentEditorOptions
} from '../Core/ComponentStorage/ComponentTypeUtils';

/**
 * 存储系统类型名称的Symbol键
 * Symbol key for storing system type name
 */
export const SYSTEM_TYPE_NAME = Symbol('SystemTypeName');

/**
 * 组件装饰器配置选项
 * Component decorator options
 */
export interface ComponentOptions {
    /** 依赖的其他组件名称列表 | List of required component names */
    requires?: string[];

    /**
     * 编辑器相关选项
     * Editor-related options
     */
    editor?: ComponentEditorOptions;
}

/**
 * 组件类型装饰器
 * Component type decorator
 *
 * 用于为组件类指定固定的类型名称，避免在代码混淆后失效。
 * 装饰器执行时会自动注册到 ComponentRegistry，使组件可以通过名称反序列化。
 *
 * Assigns a stable type name to component classes that survives minification.
 * The decorator automatically registers to ComponentRegistry, enabling deserialization by name.
 *
 * @param typeName 组件类型名称 | Component type name
 * @param options 组件配置选项 | Component options
 * @example
 * ```typescript
 * @ECSComponent('Position')
 * class PositionComponent extends Component {
 *     x: number = 0;
 *     y: number = 0;
 * }
 *
 * // 带依赖声明 | With dependency declaration
 * @ECSComponent('SpriteAnimator', { requires: ['Sprite'] })
 * class SpriteAnimatorComponent extends Component {
 *     // ...
 * }
 * ```
 */
export function ECSComponent(typeName: string, options?: ComponentOptions) {
    return function <T extends new (...args: any[]) => Component>(target: T): T {
        if (!typeName || typeof typeName !== 'string') {
            throw new Error('ECSComponent装饰器必须提供有效的类型名称');
        }

        // 在构造函数上存储类型名称
        // Store type name on constructor
        (target as any)[COMPONENT_TYPE_NAME] = typeName;

        // 存储依赖关系
        // Store dependencies
        if (options?.requires) {
            (target as any)[COMPONENT_DEPENDENCIES] = options.requires;
        }

        // 存储编辑器选项
        // Store editor options
        if (options?.editor) {
            (target as any)[COMPONENT_EDITOR_OPTIONS] = options.editor;
        }

        // 自动注册到 ComponentRegistry，使组件可以通过名称查找
        // Auto-register to ComponentRegistry, enabling lookup by name
        ComponentRegistry.register(target);

        return target;
    };
}

/**
 * System 元数据配置
 * System metadata configuration
 */
export interface SystemMetadata {
    /**
     * 更新顺序（数值越小越先执行，默认0）
     * Update order (lower values execute first, default 0)
     */
    updateOrder?: number;

    /**
     * 是否默认启用（默认true）
     * Whether enabled by default (default true)
     */
    enabled?: boolean;
}

/**
 * 系统类型装饰器
 * System type decorator
 *
 * 用于为系统类指定固定的类型名称，避免在代码混淆后失效。
 * Assigns a stable type name to system classes that survives minification.
 *
 * @param typeName 系统类型名称 | System type name
 * @param metadata 系统元数据配置 | System metadata configuration
 * @example
 * ```typescript
 * @ECSSystem('Movement')
 * class MovementSystem extends EntitySystem {
 *     protected process(entities: Entity[]): void {
 *         // 系统逻辑
 *     }
 * }
 *
 * @ECSSystem('Physics', { updateOrder: 10 })
 * class PhysicsSystem extends EntitySystem {
 *     // ...
 * }
 * ```
 */
export function ECSSystem(typeName: string, metadata?: SystemMetadata) {
    return function <T extends new (...args: any[]) => EntitySystem>(target: T): T {
        if (!typeName || typeof typeName !== 'string') {
            throw new Error('ECSSystem装饰器必须提供有效的类型名称');
        }

        // 在构造函数上存储类型名称
        // Store type name on constructor
        (target as any)[SYSTEM_TYPE_NAME] = typeName;

        // 存储元数据
        // Store metadata
        if (metadata) {
            (target as any).__systemMetadata__ = metadata;
        }

        return target;
    };
}

/**
 * 获取 System 的元数据
 * Get System metadata
 */
export function getSystemMetadata(systemType: new (...args: any[]) => EntitySystem): SystemMetadata | undefined {
    return (systemType as any).__systemMetadata__;
}

/**
 * 获取系统类型的名称，优先使用装饰器指定的名称
 * Get system type name, preferring decorator-specified name
 *
 * @param systemType 系统构造函数 | System constructor
 * @returns 系统类型名称 | System type name
 */
export function getSystemTypeName<T extends EntitySystem>(
    systemType: new (...args: any[]) => T
): string {
    const decoratorName = (systemType as any)[SYSTEM_TYPE_NAME];
    if (decoratorName) {
        return decoratorName;
    }
    return systemType.name || 'UnknownSystem';
}

/**
 * 从系统实例获取类型名称
 * Get type name from system instance
 *
 * @param system 系统实例 | System instance
 * @returns 系统类型名称 | System type name
 */
export function getSystemInstanceTypeName(system: EntitySystem): string {
    return getSystemTypeName(system.constructor as new (...args: any[]) => EntitySystem);
}
