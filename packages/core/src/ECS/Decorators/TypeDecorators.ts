import type {Component} from "../Component";
import type {EntitySystem} from "../Systems";
import {ComponentType} from "../../Types";

/**
 * 存储组件类型名称的Symbol键
 */
export const COMPONENT_TYPE_NAME = Symbol("ComponentTypeName");

/**
 * 存储系统类型名称的Symbol键
 */
export const SYSTEM_TYPE_NAME = Symbol("SystemTypeName");

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
        if (!typeName || typeof typeName !== "string") {
            throw new Error("ECSComponent装饰器必须提供有效的类型名称");
        }

        // 在构造函数上存储类型名称
        (target as any)[COMPONENT_TYPE_NAME] = typeName;

        return target;
    };
}

/**
 * System元数据配置
 */
export interface SystemMetadata {
    /**
     * 更新顺序（数值越小越先执行，默认0）
     */
    updateOrder?: number;

    /**
     * 是否默认启用（默认true）
     */
    enabled?: boolean;
}

/**
 * 系统类型装饰器
 * 用于为系统类指定固定的类型名称，避免在代码混淆后失效
 *
 * @param typeName 系统类型名称
 * @param metadata 系统元数据配置
 * @example
 * ```typescript
 * // 基本使用
 * @ECSSystem('Movement')
 * class MovementSystem extends EntitySystem {
 *     protected process(entities: Entity[]): void {
 *         // 系统逻辑
 *     }
 * }
 *
 * // 配置更新顺序
 * @Injectable()
 * @ECSSystem('Physics', { updateOrder: 10 })
 * class PhysicsSystem extends EntitySystem {
 *     constructor(@Inject(CollisionSystem) private collision: CollisionSystem) {
 *         super(Matcher.empty().all(Transform, RigidBody));
 *     }
 * }
 * ```
 */
export function ECSSystem(typeName: string, metadata?: SystemMetadata) {
    return function <T extends new (...args: any[]) => EntitySystem>(target: T): T {
        if (!typeName || typeof typeName !== "string") {
            throw new Error("ECSSystem装饰器必须提供有效的类型名称");
        }

        // 在构造函数上存储类型名称
        (target as any)[SYSTEM_TYPE_NAME] = typeName;

        // 存储元数据
        if (metadata) {
            (target as any).__systemMetadata__ = metadata;
        }

        return target;
    };
}

/**
 * 获取System的元数据
 */
export function getSystemMetadata(systemType: new (...args: any[]) => EntitySystem): SystemMetadata | undefined {
    return (systemType as any).__systemMetadata__;
}

/**
 * 获取组件类型的名称，优先使用装饰器指定的名称
 *
 * @param componentType 组件构造函数
 * @returns 组件类型名称
 */
export function getComponentTypeName(
    componentType: ComponentType
): string {
    // 优先使用装饰器指定的名称
    const decoratorName = (componentType as any)[COMPONENT_TYPE_NAME];
    if (decoratorName) {
        return decoratorName;
    }

    // 回退到constructor.name
    return componentType.name || "UnknownComponent";
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
    return systemType.name || "UnknownSystem";
}

/**
 * 从组件实例获取类型名称
 *
 * @param component 组件实例
 * @returns 组件类型名称
 */
export function getComponentInstanceTypeName(component: Component): string {
    return getComponentTypeName(component.constructor as ComponentType);
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

