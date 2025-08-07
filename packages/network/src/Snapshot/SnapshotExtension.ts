import { Component, ComponentType } from '@esengine/ecs-framework';
import { ISnapshotable, SnapshotConfig } from './ISnapshotable';

/**
 * 快照扩展接口
 * 
 * 为Component基类提供快照功能的扩展接口
 */
export interface ISnapshotExtension {
    /** 快照配置 */
    snapshotConfig?: SnapshotConfig;
    
    /** 序列化方法 */
    serialize?(): any;
    
    /** 反序列化方法 */
    deserialize?(data: any): void;
    
    /** 变化检测方法 */
    hasChanged?(baseData: any): boolean;
}

/**
 * 快照装饰器
 * 
 * 用于标记组件属性为可序列化
 */
export function Serializable(config?: Partial<SnapshotConfig>) {
    return function <T extends Component>(target: T, propertyKey: keyof T) {
        const comp = target as T & { snapshotConfig?: SnapshotConfig; _serializableProperties?: Set<string> };
        
        // 确保组件有快照配置
        if (!comp.snapshotConfig) {
            comp.snapshotConfig = {
                includeInSnapshot: true,
                compressionLevel: 0,
                syncPriority: 5,
                enableIncremental: true
            };
        }
        
        // 标记属性为可序列化
        if (!comp._serializableProperties) {
            comp._serializableProperties = new Set<string>();
        }
        comp._serializableProperties.add(propertyKey as string);
        
        // 应用配置
        if (config) {
            Object.assign(comp.snapshotConfig, config);
        }
    };
}

/**
 * 快照配置装饰器
 * 
 * 用于配置组件的快照行为
 */
export function SnapshotConfigDecorator(config: SnapshotConfig) {
    return function <T extends ComponentType>(target: T) {
        target.prototype.snapshotConfig = config;
    };
}

/**
 * 快照扩展工具类
 */
export class SnapshotExtension {
    /**
     * 为组件添加快照支持
     * 
     * @param component - 目标组件
     * @param config - 快照配置
     */
    public static enableSnapshot<T extends Component>(component: T, config?: Partial<SnapshotConfig>): void {
        const defaultConfig: SnapshotConfig = {
            includeInSnapshot: true,
            compressionLevel: 0,
            syncPriority: 5,
            enableIncremental: true
        };
        
        (component as T & { snapshotConfig?: SnapshotConfig }).snapshotConfig = { ...defaultConfig, ...config };
    }

    /**
     * 禁用组件的快照功能
     * 
     * @param component - 目标组件
     */
    public static disableSnapshot<T extends Component>(component: T): void {
        const comp = component as T & { snapshotConfig?: SnapshotConfig };
        if (comp.snapshotConfig) {
            comp.snapshotConfig.includeInSnapshot = false;
        }
    }

    /**
     * 检查组件是否支持快照
     * 
     * @param component - 目标组件
     * @returns 是否支持快照
     */
    public static isSnapshotable<T extends Component>(component: T): component is T & ISnapshotExtension {
        const config = (component as T & { snapshotConfig?: SnapshotConfig }).snapshotConfig;
        return config?.includeInSnapshot === true;
    }

    /**
     * 获取组件的可序列化属性
     * 
     * @param component - 目标组件
     * @returns 可序列化属性列表
     */
    public static getSerializableProperties<T extends Component>(component: T): (keyof T)[] {
        const comp = component as T & { _serializableProperties?: Set<string> };
        if (comp._serializableProperties) {
            return Array.from(comp._serializableProperties) as (keyof T)[];
        }
        
        // 如果没有标记，返回所有公共属性
        const publicProperties: (keyof T)[] = [];
        for (const key in component) {
            if (component.hasOwnProperty(key) && 
                typeof component[key] !== 'function' && 
                key !== 'id' && 
                key !== 'entity' &&
                key !== '_enabled' &&
                key !== '_updateOrder') {
                publicProperties.push(key);
            }
        }
        
        return publicProperties;
    }

    /**
     * 创建组件的默认序列化方法
     * 
     * @param component - 目标组件
     * @returns 序列化数据
     */
    public static createDefaultSerializer<T extends Component>(component: T): () => Partial<T> {
        return function(): Partial<T> {
            const data = {} as Partial<T>;
            const properties = SnapshotExtension.getSerializableProperties(component);
            
            for (const prop of properties) {
                const value = component[prop];
                if (value !== undefined && value !== null) {
                    data[prop] = value;
                }
            }
            
            return data;
        };
    }

    /**
     * 创建组件的默认反序列化方法
     * 
     * @param component - 目标组件
     * @returns 反序列化函数
     */
    public static createDefaultDeserializer<T extends Component>(component: T): (data: Partial<T>) => void {
        return function(data: Partial<T>): void {
            const properties = SnapshotExtension.getSerializableProperties(component);
            
            for (const prop of properties) {
                if (data.hasOwnProperty(prop) && data[prop] !== undefined) {
                    component[prop] = data[prop]!;
                }
            }
        };
    }

    /**
     * 创建简单的变化检测方法
     * 
     * @param component - 目标组件
     * @returns 变化检测函数
     */
    public static createSimpleChangeDetector<T extends Component>(component: T): (baseData: Partial<T>) => boolean {
        return function(baseData: Partial<T>): boolean {
            const properties = SnapshotExtension.getSerializableProperties(component);
            
            for (const prop of properties) {
                const currentValue = component[prop];
                const baseValue = baseData[prop];
                
                if (currentValue !== baseValue) {
                    return true;
                }
            }
            
            return false;
        };
    }

    /**
     * 创建深度变化检测方法
     * 
     * @param component - 目标组件
     * @returns 变化检测函数
     */
    public static createDeepChangeDetector<T extends Component>(component: T): (baseData: Partial<T>) => boolean {
        return function(baseData: Partial<T>): boolean {
            const properties = SnapshotExtension.getSerializableProperties(component);
            
            for (const prop of properties) {
                const currentValue = component[prop];
                const baseValue = baseData[prop];
                
                if (SnapshotExtension.deepCompare(currentValue, baseValue)) {
                    return true;
                }
            }
            
            return false;
        };
    }

    /**
     * 深度比较两个值
     */
    private static deepCompare(value1: unknown, value2: unknown): boolean {
        if (value1 === value2) return false;
        
        if (typeof value1 !== typeof value2) return true;
        
        if (value1 === null || value2 === null) return value1 !== value2;
        
        if (typeof value1 !== 'object' || typeof value2 !== 'object') return value1 !== value2;
        
        if (Array.isArray(value1) !== Array.isArray(value2)) return true;
        
        if (Array.isArray(value1) && Array.isArray(value2)) {
            if (value1.length !== value2.length) return true;
            for (let i = 0; i < value1.length; i++) {
                if (this.deepCompare(value1[i], value2[i])) return true;
            }
            return false;
        }
        
        if (!value1 || !value2) return true;
        
        const keys1 = Object.keys(value1);
        const keys2 = Object.keys(value2);
        
        if (keys1.length !== keys2.length) return true;
        
        for (const key of keys1) {
            if (!keys2.includes(key)) return true;
            if (this.deepCompare((value1 as Record<string, unknown>)[key], (value2 as Record<string, unknown>)[key])) return true;
        }
        
        return false;
    }
} 