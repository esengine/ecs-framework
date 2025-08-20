import { SyncMode, AuthorityType, NetworkScope } from '../types/NetworkTypes';

/**
 * SyncVar支持的值类型
 */
export type SyncVarValue = string | number | boolean | object | null | undefined;

/**
 * SyncVar配置选项
 */
export interface SyncVarOptions<T = SyncVarValue> {
    /** 同步模式 */
    mode?: SyncMode;
    /** 同步频率(毫秒) */
    syncRate?: number;
    /** 权限类型 */
    authority?: AuthorityType;
    /** 网络作用域 */
    scope?: NetworkScope;
    /** 变化阈值，用于数值类型 */
    threshold?: number;
    /** 是否启用压缩 */
    compression?: boolean;
    /** 优先级(0-10，数值越高优先级越高) */
    priority?: number;
    /** 是否启用插值 */
    interpolation?: boolean;
    /** 自定义序列化函数 */
    customSerializer?: (value: T) => unknown;
    /** 自定义反序列化函数 */
    customDeserializer?: (value: unknown) => T;
    /** 变化回调函数 */
    onChanged?: (oldValue: T, newValue: T) => void;
}

/**
 * SyncVar元数据
 */
export interface SyncVarMetadata<T = SyncVarValue> {
    propertyKey: string | symbol;
    options: Required<SyncVarOptions<T>>;
    originalDescriptor?: PropertyDescriptor;
    lastValue?: T;
    lastSyncTime: number;
    isDirty: boolean;
    syncCount: number;
}

/**
 * 存储SyncVar元数据的Symbol键
 */
export const SYNCVAR_METADATA_KEY = Symbol('SyncVarMetadata');

/**
 * 默认SyncVar配置
 */
export const DEFAULT_SYNCVAR_OPTIONS: Required<SyncVarOptions<SyncVarValue>> = {
    mode: SyncMode.All,
    syncRate: 100,
    authority: AuthorityType.Server,
    scope: NetworkScope.Global,
    threshold: 0.001,
    compression: true,
    priority: 5,
    interpolation: false,
    customSerializer: (value: SyncVarValue) => value,
    customDeserializer: (value: unknown) => value as SyncVarValue,
    onChanged: () => {}
};

/**
 * SyncVar装饰器
 * 用于标记需要网络同步的属性
 */
export function SyncVar<T extends SyncVarValue = SyncVarValue>(options: SyncVarOptions<T> = {}) {
    return function (target: object, propertyKey: string | symbol) {
        const fullOptions = { ...DEFAULT_SYNCVAR_OPTIONS, ...options } as Required<SyncVarOptions<T>>;
        
        // 获取或创建元数据存储
        if (!(target.constructor as any)[SYNCVAR_METADATA_KEY]) {
            (target.constructor as any)[SYNCVAR_METADATA_KEY] = new Map();
        }
        
        const metadataMap = (target.constructor as any)[SYNCVAR_METADATA_KEY] as Map<string | symbol, SyncVarMetadata<T>>;
        
        // 创建元数据
        const metadata: SyncVarMetadata<T> = {
            propertyKey,
            options: fullOptions,
            lastSyncTime: 0,
            isDirty: false,
            syncCount: 0
        };
        
        metadataMap.set(propertyKey, metadata);
        
        // 获取原始属性描述符
        const originalDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {
            writable: true,
            enumerable: true,
            configurable: true
        };
        
        metadata.originalDescriptor = originalDescriptor;
        
        // 创建内部存储属性名
        const internalPropertyKey = Symbol(`_syncVar_${String(propertyKey)}`);
        
        // 重新定义属性，添加变化检测
        Object.defineProperty(target, propertyKey, {
            get: function() {
                return (this as any)[internalPropertyKey];
            },
            set: function(newValue: T) {
                const oldValue = (this as any)[internalPropertyKey];
                
                // 检查是否真的发生了变化
                if (!hasValueChanged(oldValue, newValue, fullOptions.threshold)) {
                    return;
                }
                
                // 更新值
                (this as any)[internalPropertyKey] = newValue;
                
                // 标记为脏数据
                markAsDirty(this, propertyKey);
                
                // 触发变化回调
                if (fullOptions.onChanged) {
                    fullOptions.onChanged(oldValue, newValue);
                }
                
                // 如果启用了自动同步，立即同步
                if (fullOptions.syncRate === 0) {
                    requestImmediateSync(this, propertyKey);
                }
            },
            enumerable: originalDescriptor.enumerable,
            configurable: originalDescriptor.configurable
        });
        
        // 设置初始值
        if (originalDescriptor.value !== undefined) {
            (target as any)[internalPropertyKey] = originalDescriptor.value;
        }
    };
}

/**
 * 检查值是否发生了变化
 */
function hasValueChanged(oldValue: SyncVarValue, newValue: SyncVarValue, threshold: number): boolean {
    // 严格相等检查
    if (oldValue === newValue) {
        return false;
    }
    
    // null/undefined 检查
    if (oldValue == null || newValue == null) {
        return oldValue !== newValue;
    }
    
    // 数值类型的阈值检查
    if (typeof oldValue === 'number' && typeof newValue === 'number') {
        return Math.abs(oldValue - newValue) > threshold;
    }
    
    // 对象类型的深度比较
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
        return !deepEqual(oldValue, newValue);
    }
    
    return true;
}

/**
 * 深度比较两个对象是否相等
 */
function deepEqual(obj1: SyncVarValue, obj2: SyncVarValue): boolean {
    if (obj1 === obj2) {
        return true;
    }
    
    if (obj1 == null || obj2 == null) {
        return obj1 === obj2;
    }
    
    if (typeof obj1 !== typeof obj2) {
        return false;
    }
    
    if (typeof obj1 !== 'object') {
        return obj1 === obj2;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
        return false;
    }
    
    for (const key of keys1) {
        if (!keys2.includes(key)) {
            return false;
        }
        
        if (!deepEqual((obj1 as any)[key], (obj2 as any)[key])) {
            return false;
        }
    }
    
    return true;
}

/**
 * 标记属性为脏数据
 */
function markAsDirty(instance: object, propertyKey: string | symbol): void {
    const metadataMap = (instance.constructor as any)[SYNCVAR_METADATA_KEY] as Map<string | symbol, SyncVarMetadata>;
    const metadata = metadataMap?.get(propertyKey);
    
    if (metadata) {
        metadata.isDirty = true;
        metadata.lastValue = (instance as any)[propertyKey];
    }
    
    // 通知SyncVar管理器
    if (typeof window !== 'undefined' && (window as any).SyncVarManager) {
        (window as any).SyncVarManager.markInstanceDirty(instance);
    }
}

/**
 * 请求立即同步
 */
function requestImmediateSync(instance: object, propertyKey: string | symbol): void {
    // 通知SyncVar管理器立即同步
    if (typeof window !== 'undefined' && (window as any).SyncVarManager) {
        (window as any).SyncVarManager.requestImmediateSync(instance, propertyKey);
    }
}

/**
 * 获取对象的所有SyncVar元数据
 */
export function getSyncVarMetadata(target: object): Map<string | symbol, SyncVarMetadata> {
    if (!target || !target.constructor) {
        return new Map();
    }
    
    return (target.constructor as any)[SYNCVAR_METADATA_KEY] || new Map();
}

/**
 * 获取特定属性的SyncVar元数据
 */
export function getSyncVarPropertyMetadata(target: object, propertyKey: string | symbol): SyncVarMetadata | undefined {
    const metadataMap = getSyncVarMetadata(target);
    return metadataMap.get(propertyKey);
}

/**
 * 检查对象是否有SyncVar属性
 */
export function hasSyncVars(target: object): boolean {
    const metadataMap = getSyncVarMetadata(target);
    return metadataMap.size > 0;
}

/**
 * 获取对象的所有脏SyncVar属性
 */
export function getDirtySyncVars(target: object): Map<string | symbol, SyncVarMetadata> {
    const metadataMap = getSyncVarMetadata(target);
    const dirtyVars = new Map<string | symbol, SyncVarMetadata>();
    
    for (const [key, metadata] of metadataMap) {
        if (metadata.isDirty) {
            dirtyVars.set(key, metadata);
        }
    }
    
    return dirtyVars;
}

/**
 * 清理所有脏标记
 */
export function clearDirtyFlags(target: object): void {
    const metadataMap = getSyncVarMetadata(target);
    
    for (const metadata of metadataMap.values()) {
        metadata.isDirty = false;
        metadata.lastSyncTime = Date.now();
        metadata.syncCount++;
    }
}

/**
 * 重置SyncVar统计信息
 */
export function resetSyncVarStats(target: object): void {
    const metadataMap = getSyncVarMetadata(target);
    
    for (const metadata of metadataMap.values()) {
        metadata.syncCount = 0;
        metadata.lastSyncTime = 0;
    }
}

/**
 * 获取SyncVar统计信息
 */
export function getSyncVarStats(target: object): { [key: string]: { syncCount: number; lastSyncTime: number; isDirty: boolean } } {
    const metadataMap = getSyncVarMetadata(target);
    const stats: { [key: string]: { syncCount: number; lastSyncTime: number; isDirty: boolean } } = {};
    
    for (const [key, metadata] of metadataMap) {
        stats[String(key)] = {
            syncCount: metadata.syncCount,
            lastSyncTime: metadata.lastSyncTime,
            isDirty: metadata.isDirty
        };
    }
    
    return stats;
}