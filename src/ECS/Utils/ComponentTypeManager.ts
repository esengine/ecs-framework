import { Component } from '../Component';
import { Bits } from './Bits';

/**
 * 组件类型管理器
 * 负责管理组件类型的注册和ID分配
 */
export class ComponentTypeManager {
    private static _instance: ComponentTypeManager;
    private _componentTypes = new Map<Function, number>();
    private _typeNames = new Map<number, string>();
    private _nextTypeId = 0;

    /**
     * 获取单例实例
     */
    public static get instance(): ComponentTypeManager {
        if (!ComponentTypeManager._instance) {
            ComponentTypeManager._instance = new ComponentTypeManager();
        }
        return ComponentTypeManager._instance;
    }

    private constructor() {}

    /**
     * 获取组件类型的ID
     * @param componentType 组件类型构造函数
     * @returns 组件类型ID
     */
    public getTypeId<T extends Component>(componentType: new (...args: any[]) => T): number {
        let typeId = this._componentTypes.get(componentType);
        
        if (typeId === undefined) {
            typeId = this._nextTypeId++;
            this._componentTypes.set(componentType, typeId);
            this._typeNames.set(typeId, componentType.name);
        }
        
        return typeId;
    }

    /**
     * 获取组件类型名称
     * @param typeId 组件类型ID
     * @returns 组件类型名称
     */
    public getTypeName(typeId: number): string {
        return this._typeNames.get(typeId) || 'Unknown';
    }

    /**
     * 创建包含指定组件类型的Bits对象
     * @param componentTypes 组件类型构造函数数组
     * @returns Bits对象
     */
    public createBits(...componentTypes: (new (...args: any[]) => Component)[]): Bits {
        const bits = new Bits();
        
        for (const componentType of componentTypes) {
            const typeId = this.getTypeId(componentType);
            bits.set(typeId);
        }
        
        return bits;
    }

    /**
     * 获取实体的组件位掩码
     * @param components 组件数组
     * @returns Bits对象
     */
    public getEntityBits(components: Component[]): Bits {
        const bits = new Bits();
        
        for (const component of components) {
            const typeId = this.getTypeId(component.constructor as new (...args: any[]) => Component);
            bits.set(typeId);
        }
        
        return bits;
    }

    /**
     * 重置管理器（主要用于测试）
     */
    public reset(): void {
        this._componentTypes.clear();
        this._typeNames.clear();
        this._nextTypeId = 0;
    }

    /**
     * 获取已注册的组件类型数量
     */
    public get registeredTypeCount(): number {
        return this._componentTypes.size;
    }
} 