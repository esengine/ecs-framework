import { Component } from '../../Component';
import { BitMask64Utils, BitMask64Data } from '../../Utils/BigIntCompatibility';
import { createLogger } from '../../../Utils/Logger';
import { getComponentTypeName } from '../../Decorators';

/**
 * 组件类型定义
 */
export type ComponentType<T extends Component = Component> = new (...args: any[]) => T;

/**
 * 组件注册表
 * 管理组件类型的位掩码分配
 */
export class ComponentRegistry {
    protected static readonly _logger = createLogger('ComponentStorage');
    private static componentTypes = new Map<Function, number>();
    private static bitIndexToType = new Map<number, Function>();
    private static componentNameToType = new Map<string, Function>();
    private static componentNameToId = new Map<string, number>();
    private static maskCache = new Map<string, BitMask64Data>();
    private static nextBitIndex = 0;

    /**
     * 热更新模式标志，默认禁用
     * Hot reload mode flag, disabled by default
     * 编辑器环境应启用此选项以支持脚本热更新
     * Editor environment should enable this to support script hot reload
     */
    private static hotReloadEnabled = false;

    /**
     * 注册组件类型并分配位掩码
     * @param componentType 组件类型
     * @returns 分配的位索引
     */
    public static register<T extends Component>(componentType: ComponentType<T>): number {
        const typeName = getComponentTypeName(componentType);

        if (this.componentTypes.has(componentType)) {
            const existingIndex = this.componentTypes.get(componentType)!;
            return existingIndex;
        }

        // 检查是否有同名但不同类的组件已注册（热更新场景）
        // Check if a component with the same name but different class is registered (hot reload scenario)
        if (this.hotReloadEnabled && this.componentNameToType.has(typeName)) {
            const existingType = this.componentNameToType.get(typeName);
            if (existingType !== componentType) {
                // 热更新：替换旧的类为新的类，复用相同的 bitIndex
                // Hot reload: replace old class with new class, reuse the same bitIndex
                const existingIndex = this.componentTypes.get(existingType!)!;

                // 移除旧类的映射
                // Remove old class mapping
                this.componentTypes.delete(existingType!);

                // 用新类更新映射
                // Update mappings with new class
                this.componentTypes.set(componentType, existingIndex);
                this.bitIndexToType.set(existingIndex, componentType);
                this.componentNameToType.set(typeName, componentType);

                console.log(`[ComponentRegistry] Hot reload: replaced component "${typeName}"`);
                return existingIndex;
            }
        }

        const bitIndex = this.nextBitIndex++;
        this.componentTypes.set(componentType, bitIndex);
        this.bitIndexToType.set(bitIndex, componentType);
        this.componentNameToType.set(typeName, componentType);
        this.componentNameToId.set(typeName, bitIndex);

        return bitIndex;
    }

    /**
     * 获取组件类型的位掩码
     * @param componentType 组件类型
     * @returns 位掩码
     */
    public static getBitMask<T extends Component>(componentType: ComponentType<T>): BitMask64Data {
        const bitIndex = this.componentTypes.get(componentType);
        if (bitIndex === undefined) {
            const typeName = getComponentTypeName(componentType);
            throw new Error(`Component type ${typeName} is not registered`);
        }
        return BitMask64Utils.create(bitIndex);
    }

    /**
     * 获取组件类型的位索引
     * @param componentType 组件类型
     * @returns 位索引
     */
    public static getBitIndex<T extends Component>(componentType: ComponentType<T>): number {
        const bitIndex = this.componentTypes.get(componentType);
        if (bitIndex === undefined) {
            const typeName = getComponentTypeName(componentType);
            throw new Error(`Component type ${typeName} is not registered`);
        }
        return bitIndex;
    }

    /**
     * 检查组件类型是否已注册
     * @param componentType 组件类型
     * @returns 是否已注册
     */
    public static isRegistered<T extends Component>(componentType: ComponentType<T>): boolean {
        return this.componentTypes.has(componentType);
    }

    /**
     * 通过位索引获取组件类型
     * @param bitIndex 位索引
     * @returns 组件类型构造函数或null
     */
    public static getTypeByBitIndex(bitIndex: number): ComponentType | null {
        return (this.bitIndexToType.get(bitIndex) as ComponentType) || null;
    }

    /**
     * 获取当前已注册的组件类型数量
     * @returns 已注册数量
     */
    public static getRegisteredCount(): number {
        return this.nextBitIndex;
    }

    /**
     * 通过名称获取组件类型
     * @param componentName 组件名称
     * @returns 组件类型构造函数
     */
    public static getComponentType(componentName: string): Function | null {
        return this.componentNameToType.get(componentName) || null;
    }

    /**
     * 获取所有已注册的组件类型
     * @returns 组件类型映射
     */
    public static getAllRegisteredTypes(): Map<Function, number> {
        return new Map(this.componentTypes);
    }

    /**
     * 获取所有组件名称到类型的映射
     * @returns 名称到类型的映射
     */
    public static getAllComponentNames(): Map<string, Function> {
        return new Map(this.componentNameToType);
    }

    /**
     * 通过名称获取组件类型ID
     * @param componentName 组件名称
     * @returns 组件类型ID
     */
    public static getComponentId(componentName: string): number | undefined {
        return this.componentNameToId.get(componentName);
    }

    /**
     * 注册组件类型（通过名称）
     * @param componentName 组件名称
     * @returns 分配的组件ID
     */
    public static registerComponentByName(componentName: string): number {
        if (this.componentNameToId.has(componentName)) {
            return this.componentNameToId.get(componentName)!;
        }

        const bitIndex = this.nextBitIndex++;
        this.componentNameToId.set(componentName, bitIndex);
        return bitIndex;
    }

    /**
     * 创建单个组件的掩码
     * @param componentName 组件名称
     * @returns 组件掩码
     */
    public static createSingleComponentMask(componentName: string): BitMask64Data {
        const cacheKey = `single:${componentName}`;

        if (this.maskCache.has(cacheKey)) {
            return this.maskCache.get(cacheKey)!;
        }

        const componentId = this.getComponentId(componentName);
        if (componentId === undefined) {
            throw new Error(`Component type ${componentName} is not registered`);
        }

        const mask = BitMask64Utils.create(componentId);
        this.maskCache.set(cacheKey, mask);
        return mask;
    }

    /**
     * 创建多个组件的掩码
     * @param componentNames 组件名称数组
     * @returns 组合掩码
     */
    public static createComponentMask(componentNames: string[]): BitMask64Data {
        const sortedNames = [...componentNames].sort();
        const cacheKey = `multi:${sortedNames.join(',')}`;

        if (this.maskCache.has(cacheKey)) {
            return this.maskCache.get(cacheKey)!;
        }

        const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
        for (const name of componentNames) {
            const componentId = this.getComponentId(name);
            if (componentId !== undefined) {
                const componentMask = BitMask64Utils.create(componentId);
                BitMask64Utils.orInPlace(mask, componentMask);
            }
        }

        this.maskCache.set(cacheKey, mask);
        return mask;
    }

    /**
     * 清除掩码缓存
     */
    public static clearMaskCache(): void {
        this.maskCache.clear();
    }

    /**
     * 启用热更新模式
     * Enable hot reload mode
     * 在编辑器环境中调用以支持脚本热更新
     * Call in editor environment to support script hot reload
     */
    public static enableHotReload(): void {
        this.hotReloadEnabled = true;
    }

    /**
     * 禁用热更新模式
     * Disable hot reload mode
     */
    public static disableHotReload(): void {
        this.hotReloadEnabled = false;
    }

    /**
     * 检查热更新模式是否启用
     * Check if hot reload mode is enabled
     */
    public static isHotReloadEnabled(): boolean {
        return this.hotReloadEnabled;
    }

    /**
     * 重置注册表（用于测试）
     */
    public static reset(): void {
        this.componentTypes.clear();
        this.bitIndexToType.clear();
        this.componentNameToType.clear();
        this.componentNameToId.clear();
        this.maskCache.clear();
        this.nextBitIndex = 0;
        this.hotReloadEnabled = false;
    }
}
