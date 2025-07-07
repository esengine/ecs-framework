import { Component } from '../../ECS/Component';
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
    return function (target: any, propertyKey: string) {
        // 确保组件有快照配置
        if (!target.snapshotConfig) {
            target.snapshotConfig = {
                includeInSnapshot: true,
                compressionLevel: 0,
                syncPriority: 5,
                enableIncremental: true
            };
        }
        
        // 标记属性为可序列化
        if (!target._serializableProperties) {
            target._serializableProperties = new Set<string>();
        }
        target._serializableProperties.add(propertyKey);
        
        // 应用配置
        if (config) {
            Object.assign(target.snapshotConfig, config);
        }
    };
}

/**
 * 快照配置装饰器
 * 
 * 用于配置组件的快照行为
 */
export function SnapshotConfigDecorator(config: SnapshotConfig) {
    return function (target: any) {
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
    public static enableSnapshot(component: Component, config?: Partial<SnapshotConfig>): void {
        const defaultConfig: SnapshotConfig = {
            includeInSnapshot: true,
            compressionLevel: 0,
            syncPriority: 5,
            enableIncremental: true
        };
        
        (component as any).snapshotConfig = { ...defaultConfig, ...config };
    }

    /**
     * 禁用组件的快照功能
     * 
     * @param component - 目标组件
     */
    public static disableSnapshot(component: Component): void {
        if ((component as any).snapshotConfig) {
            (component as any).snapshotConfig.includeInSnapshot = false;
        }
    }

    /**
     * 检查组件是否支持快照
     * 
     * @param component - 目标组件
     * @returns 是否支持快照
     */
    public static isSnapshotable(component: Component): boolean {
        const config = (component as any).snapshotConfig;
        return config && config.includeInSnapshot;
    }

    /**
     * 获取组件的可序列化属性
     * 
     * @param component - 目标组件
     * @returns 可序列化属性列表
     */
    public static getSerializableProperties(component: Component): string[] {
        const properties = (component as any)._serializableProperties;
        if (properties) {
            return Array.from(properties);
        }
        
        // 如果没有标记，返回所有公共属性
        const publicProperties: string[] = [];
        for (const key in component) {
            if (component.hasOwnProperty(key) && 
                typeof (component as any)[key] !== 'function' && 
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
    public static createDefaultSerializer(component: Component): () => any {
        return function() {
            const data: any = {};
            const properties = SnapshotExtension.getSerializableProperties(component);
            
            for (const prop of properties) {
                const value = (component as any)[prop];
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
    public static createDefaultDeserializer(component: Component): (data: any) => void {
        return function(data: any) {
            const properties = SnapshotExtension.getSerializableProperties(component);
            
            for (const prop of properties) {
                if (data.hasOwnProperty(prop)) {
                    (component as any)[prop] = data[prop];
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
    public static createSimpleChangeDetector(component: Component): (baseData: any) => boolean {
        return function(baseData: any) {
            const properties = SnapshotExtension.getSerializableProperties(component);
            
            for (const prop of properties) {
                const currentValue = (component as any)[prop];
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
    public static createDeepChangeDetector(component: Component): (baseData: any) => boolean {
        return function(baseData: any) {
            const properties = SnapshotExtension.getSerializableProperties(component);
            
            for (const prop of properties) {
                const currentValue = (component as any)[prop];
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
    private static deepCompare(value1: any, value2: any): boolean {
        if (value1 === value2) return false;
        
        if (typeof value1 !== typeof value2) return true;
        
        if (value1 === null || value2 === null) return value1 !== value2;
        
        if (typeof value1 !== 'object') return value1 !== value2;
        
        if (Array.isArray(value1) !== Array.isArray(value2)) return true;
        
        if (Array.isArray(value1)) {
            if (value1.length !== value2.length) return true;
            for (let i = 0; i < value1.length; i++) {
                if (this.deepCompare(value1[i], value2[i])) return true;
            }
            return false;
        }
        
        const keys1 = Object.keys(value1);
        const keys2 = Object.keys(value2);
        
        if (keys1.length !== keys2.length) return true;
        
        for (const key of keys1) {
            if (!keys2.includes(key)) return true;
            if (this.deepCompare(value1[key], value2[key])) return true;
        }
        
        return false;
    }
} 