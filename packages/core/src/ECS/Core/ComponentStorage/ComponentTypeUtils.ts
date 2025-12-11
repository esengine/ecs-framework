/**
 * Component Type Utilities
 * 组件类型工具函数
 *
 * This module contains low-level utilities for component type handling.
 * It has NO dependencies on other ECS modules to avoid circular imports.
 *
 * 此模块包含组件类型处理的底层工具函数。
 * 它不依赖其他 ECS 模块，以避免循环导入。
 */

import type { Component } from '../../Component';

/**
 * 组件类型定义
 * Component type definition
 */
export type ComponentType<T extends Component = Component> = new (...args: any[]) => T;

/**
 * 存储组件类型名称的 Symbol 键
 * Symbol key for storing component type name
 */
export const COMPONENT_TYPE_NAME = Symbol('ComponentTypeName');

/**
 * 存储组件依赖的 Symbol 键
 * Symbol key for storing component dependencies
 */
export const COMPONENT_DEPENDENCIES = Symbol('ComponentDependencies');

/**
 * 存储组件编辑器选项的 Symbol 键
 * Symbol key for storing component editor options
 */
export const COMPONENT_EDITOR_OPTIONS = Symbol('ComponentEditorOptions');

/**
 * 组件编辑器选项
 * Component editor options
 */
export interface ComponentEditorOptions {
    /**
     * 是否在 Inspector 中隐藏此组件
     * Whether to hide this component in Inspector
     *
     * @default false
     */
    hideInInspector?: boolean;

    /**
     * 组件分类（用于 Inspector 中的分组显示）
     * Component category (for grouping in Inspector)
     */
    category?: string;

    /**
     * 组件图标（用于 Inspector 中的显示）
     * Component icon (for display in Inspector)
     */
    icon?: string;
}

/**
 * 检查组件是否使用了 @ECSComponent 装饰器
 * Check if component has @ECSComponent decorator
 *
 * @param componentType 组件构造函数
 * @returns 是否有装饰器
 */
export function hasECSComponentDecorator(componentType: ComponentType): boolean {
    return !!(componentType as any)[COMPONENT_TYPE_NAME];
}

/**
 * 获取组件类型的名称，优先使用装饰器指定的名称
 * Get component type name, preferring decorator-specified name
 *
 * @param componentType 组件构造函数
 * @returns 组件类型名称
 */
export function getComponentTypeName(componentType: ComponentType): string {
    // 优先使用装饰器指定的名称
    // Prefer decorator-specified name
    const decoratorName = (componentType as any)[COMPONENT_TYPE_NAME];
    if (decoratorName) {
        return decoratorName;
    }

    // 回退到 constructor.name
    // Fallback to constructor.name
    return componentType.name || 'UnknownComponent';
}

/**
 * 从组件实例获取类型名称
 * Get type name from component instance
 *
 * @param component 组件实例
 * @returns 组件类型名称
 */
export function getComponentInstanceTypeName(component: Component): string {
    return getComponentTypeName(component.constructor as ComponentType);
}

/**
 * 获取组件的依赖列表
 * Get component dependencies
 *
 * @param componentType 组件构造函数
 * @returns 依赖的组件名称列表
 */
export function getComponentDependencies(componentType: ComponentType): string[] | undefined {
    return (componentType as any)[COMPONENT_DEPENDENCIES];
}

/**
 * 获取组件的编辑器选项
 * Get component editor options
 *
 * @param componentType 组件构造函数
 * @returns 编辑器选项
 */
export function getComponentEditorOptions(componentType: ComponentType): ComponentEditorOptions | undefined {
    return (componentType as any)[COMPONENT_EDITOR_OPTIONS];
}

/**
 * 从组件实例获取编辑器选项
 * Get editor options from component instance
 *
 * @param component 组件实例
 * @returns 编辑器选项
 */
export function getComponentInstanceEditorOptions(component: Component): ComponentEditorOptions | undefined {
    return getComponentEditorOptions(component.constructor as ComponentType);
}

/**
 * 检查组件是否应该在 Inspector 中隐藏
 * Check if component should be hidden in Inspector
 *
 * @param componentType 组件构造函数
 * @returns 是否隐藏
 */
export function isComponentHiddenInInspector(componentType: ComponentType): boolean {
    const options = getComponentEditorOptions(componentType);
    return options?.hideInInspector ?? false;
}

/**
 * 从组件实例检查是否应该在 Inspector 中隐藏
 * Check if component instance should be hidden in Inspector
 *
 * @param component 组件实例
 * @returns 是否隐藏
 */
export function isComponentInstanceHiddenInInspector(component: Component): boolean {
    return isComponentHiddenInInspector(component.constructor as ComponentType);
}
