/**
 * Gizmo Registry
 * Gizmo 注册表
 *
 * Manages gizmo providers for different component types.
 * Uses registry pattern instead of prototype modification for cleaner architecture.
 * 管理不同组件类型的 gizmo 提供者。
 * 使用注册表模式替代原型修改，实现更清晰的架构。
 */

import type { Component, ComponentType, Entity } from '@esengine/ecs-framework';
import type { IGizmoProvider, IGizmoRenderData } from './IGizmoProvider';

/**
 * Gizmo provider function type
 * Gizmo 提供者函数类型
 *
 * A function that generates gizmo data for a specific component instance.
 * 为特定组件实例生成 gizmo 数据的函数。
 */
export type GizmoProviderFn<T extends Component = Component> = (
    component: T,
    entity: Entity,
    isSelected: boolean
) => IGizmoRenderData[];

/**
 * Gizmo Registry Service
 * Gizmo 注册表服务
 *
 * Centralized registry for component gizmo providers.
 * Allows plugins to register gizmo rendering for any component type
 * without modifying the component class itself.
 *
 * 组件 gizmo 提供者的中心化注册表。
 * 允许插件为任何组件类型注册 gizmo 渲染，
 * 而无需修改组件类本身。
 *
 * @example
 * ```typescript
 * // Register a gizmo provider for SpriteComponent
 * GizmoRegistry.register(SpriteComponent, (sprite, entity, isSelected) => {
 *     const transform = entity.getComponent(TransformComponent);
 *     return [{
 *         type: 'rect',
 *         x: transform.position.x,
 *         y: transform.position.y,
 *         width: sprite.width,
 *         height: sprite.height,
 *         // ...
 *     }];
 * });
 *
 * // Get gizmo data for a component
 * const gizmos = GizmoRegistry.getGizmoData(spriteComponent, entity, true);
 * ```
 */
export class GizmoRegistry {
    private static providers = new Map<ComponentType, GizmoProviderFn>();

    /**
     * Register a gizmo provider for a component type.
     * 为组件类型注册 gizmo 提供者。
     *
     * @param componentType - The component class to register for
     * @param provider - Function that generates gizmo data
     */
    static register<T extends Component>(
        componentType: ComponentType<T>,
        provider: GizmoProviderFn<T>
    ): void {
        this.providers.set(componentType, provider as GizmoProviderFn);
    }

    /**
     * Unregister a gizmo provider for a component type.
     * 取消注册组件类型的 gizmo 提供者。
     *
     * @param componentType - The component class to unregister
     */
    static unregister(componentType: ComponentType): void {
        this.providers.delete(componentType);
    }

    /**
     * Check if a component type has a registered gizmo provider.
     * 检查组件类型是否有注册的 gizmo 提供者。
     *
     * @param componentType - The component class to check
     */
    static hasProvider(componentType: ComponentType): boolean {
        return this.providers.has(componentType);
    }

    /**
     * Get the gizmo provider for a component type.
     * 获取组件类型的 gizmo 提供者。
     *
     * @param componentType - The component class
     * @returns The provider function or undefined
     */
    static getProvider(componentType: ComponentType): GizmoProviderFn | undefined {
        return this.providers.get(componentType);
    }

    /**
     * Get gizmo data for a component instance.
     * 获取组件实例的 gizmo 数据。
     *
     * @param component - The component instance
     * @param entity - The entity owning the component
     * @param isSelected - Whether the entity is selected
     * @returns Array of gizmo render data, or empty array if no provider
     */
    static getGizmoData(
        component: Component,
        entity: Entity,
        isSelected: boolean
    ): IGizmoRenderData[] {
        const componentType = component.constructor as ComponentType;
        const provider = this.providers.get(componentType);

        if (provider) {
            try {
                return provider(component, entity, isSelected);
            } catch (e) {
                // Silently ignore errors from gizmo providers
                // 静默忽略 gizmo 提供者的错误
                console.warn(`[GizmoRegistry] Error in gizmo provider for ${componentType.name}:`, e);
                return [];
            }
        }

        return [];
    }

    /**
     * Get all gizmo data for an entity (from all components with providers).
     * 获取实体的所有 gizmo 数据（来自所有有提供者的组件）。
     *
     * @param entity - The entity to get gizmos for
     * @param isSelected - Whether the entity is selected
     * @returns Array of all gizmo render data
     */
    static getAllGizmoDataForEntity(entity: Entity, isSelected: boolean): IGizmoRenderData[] {
        const allGizmos: IGizmoRenderData[] = [];

        for (const component of entity.components) {
            const gizmos = this.getGizmoData(component, entity, isSelected);
            allGizmos.push(...gizmos);
        }

        return allGizmos;
    }

    /**
     * Check if an entity has any components with gizmo providers.
     * 检查实体是否有任何带有 gizmo 提供者的组件。
     *
     * @param entity - The entity to check
     */
    static hasAnyGizmoProvider(entity: Entity): boolean {
        for (const component of entity.components) {
            const componentType = component.constructor as ComponentType;
            if (this.providers.has(componentType)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all registered component types.
     * 获取所有已注册的组件类型。
     */
    static getRegisteredTypes(): ComponentType[] {
        return Array.from(this.providers.keys());
    }

    /**
     * Clear all registered providers.
     * 清除所有已注册的提供者。
     */
    static clear(): void {
        this.providers.clear();
    }
}

/**
 * Adapter to make GizmoRegistry work with the IGizmoProvider interface.
 * 使 GizmoRegistry 与 IGizmoProvider 接口兼容的适配器。
 *
 * This allows components to optionally implement IGizmoProvider directly,
 * while also supporting the registry pattern.
 * 这允许组件可选地直接实现 IGizmoProvider，
 * 同时也支持注册表模式。
 */
export function isGizmoProviderRegistered(component: Component): boolean {
    const componentType = component.constructor as ComponentType;
    return GizmoRegistry.hasProvider(componentType);
}
