/**
 * 全局组件类型注册表
 *
 * 用于序列化系统的组件类型查找和管理
 */

import { Component } from '../Component';
import { ComponentType } from '../Core/ComponentStorage';
import { getComponentTypeName } from '../Decorators';

/**
 * 全局组件类型注册表
 *
 * 维护组件类型名称到构造函数的映射，用于序列化/反序列化
 */
export class ComponentTypeRegistry {
    /**
     * 组件类型映射表
     * Map<类型名称, 构造函数>
     */
    private static registry = new Map<string, ComponentType>();

    /**
     * 注册组件类型
     *
     * @param componentClass 组件构造函数
     * @param typeName 组件类型名称（可选，默认使用类名或@ECSComponent装饰器指定的名称）
     *
     * @example
     * ```typescript
     * @ECSComponent('Player')
     * @Serializable({ version: 1 })
     * class PlayerComponent extends Component {
     *     @Serialize() name: string = '';
     * }
     *
     * // 注册组件
     * ComponentTypeRegistry.register(PlayerComponent);
     * ```
     */
    public static register(componentClass: ComponentType, typeName?: string): void {
        const name = typeName || getComponentTypeName(componentClass);

        if (this.registry.has(name)) {
            console.warn(`Component type "${name}" is already registered, overwriting...`);
        }

        this.registry.set(name, componentClass);
    }

    /**
     * 批量注册组件类型
     *
     * @param componentClasses 组件构造函数数组
     *
     * @example
     * ```typescript
     * ComponentTypeRegistry.registerMany([
     *     PlayerComponent,
     *     PositionComponent,
     *     VelocityComponent
     * ]);
     * ```
     */
    public static registerMany(componentClasses: ComponentType[]): void {
        for (const componentClass of componentClasses) {
            this.register(componentClass);
        }
    }

    /**
     * 获取组件类型
     *
     * @param typeName 组件类型名称
     * @returns 组件构造函数，如果未找到则返回undefined
     */
    public static get(typeName: string): ComponentType | undefined {
        return this.registry.get(typeName);
    }

    /**
     * 检查组件类型是否已注册
     *
     * @param typeName 组件类型名称
     * @returns 如果已注册返回true
     */
    public static has(typeName: string): boolean {
        return this.registry.has(typeName);
    }

    /**
     * 取消注册组件类型
     *
     * @param typeName 组件类型名称
     * @returns 如果成功取消注册返回true
     */
    public static unregister(typeName: string): boolean {
        return this.registry.delete(typeName);
    }

    /**
     * 清空注册表
     */
    public static clear(): void {
        this.registry.clear();
    }

    /**
     * 获取所有已注册的组件类型名称
     *
     * @returns 组件类型名称数组
     */
    public static getAllTypeNames(): string[] {
        return Array.from(this.registry.keys());
    }

    /**
     * 获取所有已注册的组件类型
     *
     * @returns 组件构造函数数组
     */
    public static getAllTypes(): ComponentType[] {
        return Array.from(this.registry.values());
    }

    /**
     * 获取注册表的Map副本
     *
     * @returns 组件类型注册表的副本
     */
    public static getRegistry(): Map<string, ComponentType> {
        return new Map(this.registry);
    }

    /**
     * 获取注册的组件数量
     *
     * @returns 已注册的组件类型数量
     */
    public static get size(): number {
        return this.registry.size;
    }

    /**
     * 从组件实例获取类型名称
     *
     * @param component 组件实例
     * @returns 组件类型名称
     */
    public static getTypeName(component: Component): string {
        return getComponentTypeName(component.constructor as ComponentType);
    }

    /**
     * 根据组件类查找已注册的类型名称
     *
     * @param componentClass 组件构造函数
     * @returns 类型名称，如果未注册则返回undefined
     */
    public static findTypeName(componentClass: ComponentType): string | undefined {
        const typeName = getComponentTypeName(componentClass);

        // 检查是否已注册
        if (this.registry.get(typeName) === componentClass) {
            return typeName;
        }

        // 遍历查找
        for (const [name, cls] of this.registry) {
            if (cls === componentClass) {
                return name;
            }
        }

        return undefined;
    }

    /**
     * 自动发现并注册所有装饰的组件
     *
     * 注意：此方法需要组件类已经被加载到内存中
     *
     * @param components 组件类数组
     */
    public static autoRegister(components: ComponentType[]): void {
        for (const component of components) {
            try {
                this.register(component);
            } catch (error) {
                console.error(`Failed to auto-register component ${component.name}:`, error);
            }
        }
    }
}
