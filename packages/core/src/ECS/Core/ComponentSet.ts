import { Component } from '../Component';
import { ComponentType, ComponentRegistry } from './ComponentStorage';
import { BigIntFactory, IBigIntLike } from '../Utils/BigIntCompatibility';
import { createLogger } from '../../Utils/Logger';
import { getComponentTypeName, getComponentInstanceTypeName } from '../Decorators';

/**
 * 组件集合 - 管理实体的组件数组、索引映射和位掩码
 * 
 * 提供高效的组件管理能力。
 */
export class ComponentSet {
    private static readonly _logger = createLogger('ComponentSet');

    /**
     * 组件列表 (私有，通过 getter 提供只读访问)
     */
    private _components: Component[] = [];

    /**
     * 组件类型到数组索引的映射 (用于快速查找)
     */
    private _componentTypeToIndex = new Map<ComponentType, number>();

    /**
     * 组件位掩码 (用于快速类型检查)
     */
    private _componentMask: IBigIntLike = BigIntFactory.zero();

    /**
     * 索引映射是否需要重建标志
     */
    private _indexDirty: boolean = false;

    /**
     * 获取组件数组的只读视图
     */
    public get components(): readonly Component[] {
        return this._components;
    }

    /**
     * 获取组件数量
     */
    public get size(): number {
        return this._components.length;
    }

    /**
     * 获取组件位掩码
     */
    public get componentMask(): IBigIntLike {
        return this._componentMask;
    }

    /**
     * 检查是否包含指定类型的组件
     */
    public hasComponent<T extends Component>(type: ComponentType<T>): boolean {
        // 快速位掩码检查
        if (!ComponentRegistry.isRegistered(type)) {
            return false;
        }

        const componentMask = ComponentRegistry.getBitMask(type);
        return !this._componentMask.and(componentMask).isZero();
    }

    /**
     * 获取指定类型的组件
     */
    public getComponent<T extends Component>(type: ComponentType<T>): T | null {
        // 快速位掩码检查
        if (!ComponentRegistry.isRegistered(type)) {
            return null;
        }

        const componentMask = ComponentRegistry.getBitMask(type);
        if (this._componentMask.and(componentMask).isZero()) {
            return null;
        }

        // 确保索引映射是最新的
        this.ensureIndexUpToDate();
        
        // 尝试从索引映射获取（O(1)）
        const index = this._componentTypeToIndex.get(type);
        if (index !== undefined && index < this._components.length) {
            const component = this._components[index];
            if (component && component.constructor === type) {
                return component as T;
            }
        }

        // 回退到线性搜索并更新单个索引（O(n)，但n很小且很少发生）
        for (let i = 0; i < this._components.length; i++) {
            const component = this._components[i];
            if (component.constructor === type) {
                // 使用高效的单组件索引更新
                this.updateSingleComponentIndex(component, i);
                return component as T;
            }
        }

        return null;
    }

    /**
     * 获取所有指定类型的组件
     */
    public getComponents<T extends Component>(type: ComponentType<T>): T[] {
        // 使用位掩码提前剪枝：如果位掩码显示该组件类型不存在，直接返回空数组
        if (!ComponentRegistry.isRegistered(type)) {
            return [];
        }
        
        const componentMask = ComponentRegistry.getBitMask(type);
        if (this._componentMask.and(componentMask).isZero()) {
            return [];
        }
        
        // 位掩码确认存在，进行实际遍历
        const result: T[] = [];
        for (const component of this._components) {
            if (component.constructor === type) {
                result.push(component as T);
            }
        }
        
        return result;
    }

    /**
     * 添加组件
     */
    public addComponent<T extends Component>(component: T): T {
        const componentType = component.constructor as ComponentType<T>;

        // 检查是否已有此类型的组件
        if (this.hasComponent(componentType)) {
            throw new Error(`ComponentSet already has component ${getComponentTypeName(componentType)}`);
        }

        // 注册组件类型（如果尚未注册）
        if (!ComponentRegistry.isRegistered(componentType)) {
            ComponentRegistry.register(componentType);
        }

        // 添加到组件列表并建立索引映射
        const index = this._components.length;
        this._components.push(component);
        this.updateSingleComponentIndex(component, index);

        // 更新位掩码
        const componentMask = ComponentRegistry.getBitMask(componentType);
        this._componentMask = this._componentMask.or(componentMask);

        return component;
    }

    /**
     * 移除组件
     */
    public removeComponent<T extends Component>(component: T): T | null {
        const componentType = component.constructor as ComponentType<T>;
        const index = this._components.indexOf(component);
        
        if (index === -1) {
            return null;
        }

        // 使用 swap-remove 策略移除组件
        const removedComponent = this.swapRemoveComponentAt(index);
        
        // 更新位掩码
        const componentMask = ComponentRegistry.getBitMask(componentType);
        this._componentMask = this._componentMask.and(componentMask.not());

        return removedComponent as T;
    }

    /**
     * 移除指定类型的组件
     */
    public removeComponentByType<T extends Component>(type: ComponentType<T>): T | null {
        const component = this.getComponent(type);
        if (component) {
            return this.removeComponent(component) as T;
        }
        return null;
    }

    /**
     * 批量添加组件
     */
    public addComponents<T extends Component>(
        components: T[], 
        options: {
            allowDuplicateTypes?: boolean;
        } = {}
    ): T[] {
        if (components.length === 0) {
            return [];
        }

        const addedComponents: T[] = [];
        const componentTypes = new Set<ComponentType>();
        
        // 第一阶段：验证和预处理
        for (const component of components) {
            const componentType = component.constructor as ComponentType<T>;
            
            // 检查重复组件
            if (this.hasComponent(componentType)) {
                if (!options.allowDuplicateTypes) {
                    ComponentSet._logger.warn(`ComponentSet already has component ${getComponentTypeName(componentType)}, skipping`);
                    continue;
                }
            }
            
            // 检查组件是否已在本批次中
            if (componentTypes.has(componentType)) {
                ComponentSet._logger.warn(`Duplicate component type ${getComponentTypeName(componentType)} in batch, skipping duplicate`);
                continue;
            }
            
            componentTypes.add(componentType);
            addedComponents.push(component);
        }

        if (addedComponents.length === 0) {
            return [];
        }

        // 第二阶段：批量注册组件类型
        for (const componentType of componentTypes) {
            if (!ComponentRegistry.isRegistered(componentType)) {
                ComponentRegistry.register(componentType);
            }
        }

        // 第三阶段：批量添加组件到内部数据结构
        let combinedMask = this._componentMask;
        for (const component of addedComponents) {
            const componentType = component.constructor as ComponentType;
            
            // 添加到组件列表并建立索引映射
            const index = this._components.length;
            this._components.push(component);
            this.updateSingleComponentIndex(component, index);
            
            // 内联计算并合并位掩码
            combinedMask = combinedMask.or(ComponentRegistry.getBitMask(componentType));
        }
        
        // 一次性更新位掩码
        this._componentMask = combinedMask;

        return addedComponents;
    }

    /**
     * 移除所有组件
     */
    public removeAllComponents(): Component[] {
        const removedComponents = [...this._components];
        
        // 清空索引和位掩码
        this._componentTypeToIndex.clear();
        this._componentMask = BigIntFactory.zero();
        this._components.length = 0;
        this._indexDirty = false;

        return removedComponents;
    }

    /**
     * 批量移除组件
     */
    public removeComponentsBatch(
        components: Component[],
        options: {
            suppressErrors?: boolean;
        } = {}
    ): Component[] {
        if (components.length === 0) {
            return [];
        }

        const removedComponents: Component[] = [];
        const componentTypes: ComponentType[] = [];
        
        // 第一阶段：验证并收集有效的组件
        for (const component of components) {
            const index = this._components.indexOf(component);
            if (index !== -1) {
                removedComponents.push(component);
                componentTypes.push(component.constructor as ComponentType);
            } else if (!options.suppressErrors) {
                ComponentSet._logger.warn(`Component not found in ComponentSet: ${getComponentInstanceTypeName(component)}`);
            }
        }

        if (removedComponents.length === 0) {
            return [];
        }

        // 第二阶段：批量移除组件
        let combinedMask = this._componentMask;
        for (let i = 0; i < removedComponents.length; i++) {
            const component = removedComponents[i];
            const componentType = componentTypes[i];
            const index = this._components.indexOf(component);
            
            if (index !== -1) {
                // 使用 swap-remove 移除组件
                this.swapRemoveComponentAt(index);
                
                // 更新位掩码
                const componentMask = ComponentRegistry.getBitMask(componentType);
                combinedMask = combinedMask.and(componentMask.not());
            }
        }
        
        // 一次性更新位掩码
        this._componentMask = combinedMask;

        return removedComponents;
    }

    /**
     * 清空组件集合
     */
    public clear(): void {
        this._components.length = 0;
        this._componentTypeToIndex.clear();
        this._componentMask = BigIntFactory.zero();
        this._indexDirty = false;
    }

    /**
     * 遍历所有组件
     */
    public forEach(callback: (component: Component, index: number) => void): void {
        this._components.forEach(callback);
    }

    /**
     * 使用 swap-remove 策略移除组件 (O(1) 性能)
     */
    private swapRemoveComponentAt(removeIndex: number): Component {
        const componentsLength = this._components.length;
        
        if (removeIndex < 0 || removeIndex >= componentsLength) {
            throw new Error(`Invalid component index: ${removeIndex}`);
        }

        const removedComponent = this._components[removeIndex];
        const removedComponentType = removedComponent.constructor as ComponentType;

        if (componentsLength === 1) {
            // 只有一个组件，直接移除
            this._components.pop();
            this._componentTypeToIndex.delete(removedComponentType);
        } else if (removeIndex === componentsLength - 1) {
            // 要移除的就是最后一个元素，直接 pop
            this._components.pop();
            this._componentTypeToIndex.delete(removedComponentType);
        } else {
            // swap-remove: 用最后一个元素替换要移除的元素
            const lastComponent = this._components[componentsLength - 1];
            const lastComponentType = lastComponent.constructor as ComponentType;
            
            // 交换位置
            this._components[removeIndex] = lastComponent;
            this._components.pop();
            
            // 更新索引映射
            this._componentTypeToIndex.set(lastComponentType, removeIndex);
            this._componentTypeToIndex.delete(removedComponentType);
        }

        return removedComponent;
    }

    /**
     * 标记索引映射为脏状态，在下次访问时重建
     */
    public markIndexDirty(): void {
        this._indexDirty = true;
    }

    /**
     * 重建组件索引映射（仅在必要时调用）
     */
    private rebuildComponentIndex(): void {
        this._componentTypeToIndex.clear();
        
        for (let i = 0; i < this._components.length; i++) {
            const component = this._components[i];
            const componentType = component.constructor as ComponentType;
            this._componentTypeToIndex.set(componentType, i);
        }
        
        this._indexDirty = false;
    }

    /**
     * 确保索引映射是最新的（按需重建）
     */
    private ensureIndexUpToDate(): void {
        if (this._indexDirty) {
            this.rebuildComponentIndex();
        }
    }

    /**
     * 高效的单组件索引更新方法
     */
    private updateSingleComponentIndex(component: Component, index: number): void {
        const componentType = component.constructor as ComponentType;
        this._componentTypeToIndex.set(componentType, index);
    }

    /**
     * 获取调试信息
     */
    public getDebugInfo(): {
        componentCount: number;
        componentTypes: string[];
        componentMask: {
            binary: string;
            hex: string;
            decimal: string;
            registeredComponents: Record<string, boolean>;
        };
        indexMappingSize: number;
    } {
        return {
            componentCount: this._components.length,
            componentTypes: this._components.map(c => getComponentInstanceTypeName(c)),
            componentMask: this.getComponentMaskDebugInfo(),
            indexMappingSize: this._componentTypeToIndex.size
        };
    }

    /**
     * 获取组件掩码的调试信息
     */
    private getComponentMaskDebugInfo(): {
        binary: string;
        hex: string;
        decimal: string;
        registeredComponents: Record<string, boolean>;
    } {
        const maskValue = this._componentMask;
        const binaryStr = maskValue.toString(2);
        const hexStr = maskValue.toString(16).toUpperCase();
        const decimalStr = maskValue.toString(10);
        
        // 获取所有已注册组件类型的状态
        const registeredComponents: Record<string, boolean> = {};
        
        // 遍历当前实体的所有组件类型
        for (const component of this._components) {
            const typeName = getComponentInstanceTypeName(component);
            registeredComponents[typeName] = true;
        }
        
        return {
            binary: this.formatBinaryMask(binaryStr),
            hex: `0x${hexStr}`,
            decimal: decimalStr,
            registeredComponents
        };
    }

    /**
     * 格式化二进制掩码，按4位分组显示
     */
    private formatBinaryMask(binaryStr: string): string {
        // 按4位分组，便于阅读
        const groups = [];
        let str = binaryStr;
        
        // 从右往左按4位分组
        while (str.length > 0) {
            if (str.length >= 4) {
                groups.unshift(str.slice(-4));
                str = str.slice(0, -4);
            } else {
                groups.unshift(str);
                str = '';
            }
        }
        
        return groups.join('_');
    }
}