/**
 * 预制体实例组件 - 用于追踪预制体实例
 * Prefab instance component - for tracking prefab instances
 *
 * 当实体从预制体实例化时，会自动添加此组件以追踪其源预制体。
 * When an entity is instantiated from a prefab, this component is automatically added to track its source.
 */

import { Component } from '../Component';
import { ECSComponent } from '../Decorators';
import { Serializable, Serialize } from '../Serialization/SerializationDecorators';

/**
 * 预制体实例组件
 * Prefab instance component
 *
 * 标记实体为预制体实例，并存储与源预制体的关联信息。
 * Marks an entity as a prefab instance and stores association with source prefab.
 *
 * @example
 * ```typescript
 * // 检查实体是否为预制体实例 | Check if entity is a prefab instance
 * const prefabComp = entity.getComponent(PrefabInstanceComponent);
 * if (prefabComp) {
 *     console.log(`Instance of prefab: ${prefabComp.sourcePrefabGuid}`);
 * }
 * ```
 */
@ECSComponent('PrefabInstance', { editor: { hideInInspector: true } })
@Serializable({ version: 1, typeId: 'PrefabInstance' })
export class PrefabInstanceComponent extends Component {
    /**
     * 源预制体的资产 GUID
     * Source prefab asset GUID
     */
    @Serialize()
    public sourcePrefabGuid: string = '';

    /**
     * 源预制体的资产路径（用于显示和调试）
     * Source prefab asset path (for display and debugging)
     */
    @Serialize()
    public sourcePrefabPath: string = '';

    /**
     * 是否为预制体层级的根实体
     * Whether this is the root entity of the prefab hierarchy
     */
    @Serialize()
    public isRoot: boolean = false;

    /**
     * 根预制体实例的实体 ID（用于子实体追溯到根实例）
     * Entity ID of the root prefab instance (for child entities to trace back to root)
     */
    @Serialize()
    public rootInstanceEntityId: number | null = null;

    /**
     * 属性覆盖记录
     * Property override records
     *
     * 记录哪些属性被用户修改过，格式：componentType.propertyPath
     * Records which properties have been modified by user, format: componentType.propertyPath
     */
    @Serialize()
    public modifiedProperties: string[] = [];

    /**
     * 实例化时间戳
     * Instantiation timestamp
     */
    @Serialize()
    public instantiatedAt: number = 0;

    /**
     * 属性原始值存储
     * Original property values storage
     *
     * 存储被修改属性的原始值，用于还原操作。
     * Stores original values of modified properties for revert operations.
     * 格式：{ "ComponentType.propertyPath": originalValue }
     * Format: { "ComponentType.propertyPath": originalValue }
     */
    @Serialize()
    public originalValues: Record<string, unknown> = {};

    constructor(
        sourcePrefabGuid: string = '',
        sourcePrefabPath: string = '',
        isRoot: boolean = false
    ) {
        super();
        this.sourcePrefabGuid = sourcePrefabGuid;
        this.sourcePrefabPath = sourcePrefabPath;
        this.isRoot = isRoot;
        this.instantiatedAt = Date.now();
    }

    /**
     * 标记属性为已修改
     * Mark a property as modified
     *
     * @param componentType - 组件类型名称 | Component type name
     * @param propertyPath - 属性路径 | Property path
     */
    public markPropertyModified(componentType: string, propertyPath: string): void {
        const key = `${componentType}.${propertyPath}`;
        if (!this.modifiedProperties.includes(key)) {
            this.modifiedProperties.push(key);
        }
    }

    /**
     * 检查属性是否已被修改
     * Check if a property has been modified
     *
     * @param componentType - 组件类型名称 | Component type name
     * @param propertyPath - 属性路径 | Property path
     * @returns 是否已修改 | Whether it has been modified
     */
    public isPropertyModified(componentType: string, propertyPath: string): boolean {
        const key = `${componentType}.${propertyPath}`;
        return this.modifiedProperties.includes(key);
    }

    /**
     * 清除属性修改标记
     * Clear property modification mark
     *
     * @param componentType - 组件类型名称 | Component type name
     * @param propertyPath - 属性路径 | Property path
     */
    public clearPropertyModified(componentType: string, propertyPath: string): void {
        const key = `${componentType}.${propertyPath}`;
        const index = this.modifiedProperties.indexOf(key);
        if (index !== -1) {
            this.modifiedProperties.splice(index, 1);
        }
    }

    /**
     * 清除所有属性修改标记
     * Clear all property modification marks
     */
    public clearAllModifications(): void {
        this.modifiedProperties = [];
        this.originalValues = {};
    }

    /**
     * 存储属性的原始值
     * Store original value of a property
     *
     * 只有在第一次修改时才存储，后续修改不覆盖。
     * Only stores on first modification, subsequent modifications don't overwrite.
     *
     * @param componentType - 组件类型名称 | Component type name
     * @param propertyPath - 属性路径 | Property path
     * @param value - 原始值 | Original value
     */
    public storeOriginalValue(componentType: string, propertyPath: string, value: unknown): void {
        const key = `${componentType}.${propertyPath}`;
        // 只在第一次修改时存储原始值 | Only store on first modification
        if (!(key in this.originalValues)) {
            // 深拷贝值以防止引用问题 | Deep clone to prevent reference issues
            this.originalValues[key] = this.deepClone(value);
        }
    }

    /**
     * 获取属性的原始值
     * Get original value of a property
     *
     * @param key - 属性键（格式：componentType.propertyPath）| Property key (format: componentType.propertyPath)
     * @returns 原始值，如果不存在则返回 undefined | Original value or undefined if not found
     */
    public getOriginalValue(key: string): unknown {
        return this.originalValues[key];
    }

    /**
     * 检查是否有属性的原始值
     * Check if original value exists for a property
     *
     * @param componentType - 组件类型名称 | Component type name
     * @param propertyPath - 属性路径 | Property path
     * @returns 是否存在原始值 | Whether original value exists
     */
    public hasOriginalValue(componentType: string, propertyPath: string): boolean {
        const key = `${componentType}.${propertyPath}`;
        return key in this.originalValues;
    }

    /**
     * 深拷贝值
     * Deep clone value
     */
    private deepClone(value: unknown): unknown {
        if (value === null || value === undefined) return value;
        if (typeof value === 'object') {
            try {
                return JSON.parse(JSON.stringify(value));
            } catch {
                return value;
            }
        }
        return value;
    }
}
