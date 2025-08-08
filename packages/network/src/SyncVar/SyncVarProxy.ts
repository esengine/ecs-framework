import { getSyncVarMetadata, isSyncVar } from './SyncVarDecorator';
import { SyncVarManager } from './SyncVarManager';
import { INetworkSyncable, SyncVarValue, TypeGuards } from '../types/NetworkTypes';
import { createLogger } from '@esengine/ecs-framework';

/**
 * SyncVar代理配置
 */
export interface SyncVarProxyOptions {
    /**
     * 是否启用调试日志
     */
    debugLog?: boolean;
    
    /**
     * 自定义属性过滤器
     */
    propertyFilter?: (propertyKey: string) => boolean;
}

/**
 * 创建SyncVar代理
 * 
 * 为组件实例创建Proxy，拦截SyncVar字段的读写操作，
 * 当字段值发生变化时自动触发同步逻辑
 * 
 * @param target - 目标组件实例
 * @param options - 代理配置选项
 * @returns 代理包装的组件实例
 */
export function createSyncVarProxy<T extends INetworkSyncable>(
    target: T, 
    options: SyncVarProxyOptions = {}
): T {
    const { debugLog = false, propertyFilter } = options;
    const syncVarManager = SyncVarManager.Instance;
    
    // 检查目标是否有SyncVar
    const metadata = getSyncVarMetadata(target.constructor);
    const logger = createLogger('SyncVarProxy');
    
    if (metadata.length === 0) {
        if (debugLog) {
            logger.debug(`对象 ${target.constructor.name} 没有SyncVar，返回原对象`);
        }
        return target;
    }
    
    // 初始化SyncVar管理器
    syncVarManager.initializeComponent(target);
    
    if (debugLog) {
        logger.debug(`为 ${target.constructor.name} 创建代理，SyncVar字段:`, 
            metadata.map(m => m.propertyKey));
    }
    
    // 存储原始值的副本，用于比较变化
    const originalValues = new Map<string, unknown>();
    
    // 初始化原始值
    for (const meta of metadata) {
        if (meta.propertyKey in target) {
            originalValues.set(meta.propertyKey, (target as Record<string, unknown>)[meta.propertyKey]);
        }
    }
    
    const proxy = new Proxy(target, {
        /**
         * 拦截属性读取
         */
        get(obj: T, prop: string | symbol): unknown {
            // 内部属性和方法直接返回
            if (typeof prop === 'symbol' || prop.startsWith('_') || prop.startsWith('$')) {
                return Reflect.get(obj, prop);
            }
            
            const propertyKey = prop as string;
            
            // 如果有自定义过滤器且不通过，直接返回
            if (propertyFilter && !propertyFilter(propertyKey)) {
                return Reflect.get(obj, prop);
            }
            
            const value = Reflect.get(obj, prop);
            
            if (debugLog && isSyncVar(obj, propertyKey)) {
                logger.debug(`GET ${obj.constructor.name}.${propertyKey} = ${value}`);
            }
            
            return value;
        },
        
        /**
         * 拦截属性设置
         */
        set(obj: T, prop: string | symbol, newValue: unknown): boolean {
            // 内部属性和方法直接设置
            if (typeof prop === 'symbol' || prop.startsWith('_') || prop.startsWith('$')) {
                return Reflect.set(obj, prop, newValue);
            }
            
            const propertyKey = prop as string;
            
            // 如果有自定义过滤器且不通过，直接设置
            if (propertyFilter && !propertyFilter(propertyKey)) {
                return Reflect.set(obj, prop, newValue);
            }
            
            // 检查是否被临时禁用（用于避免循环）
            if ((obj as any)._syncVarDisabled) {
                return Reflect.set(obj, prop, newValue);
            }
            
            // 检查是否为SyncVar
            if (!isSyncVar(obj, propertyKey)) {
                return Reflect.set(obj, prop, newValue);
            }
            
            // 获取旧值
            const oldValue = originalValues.get(propertyKey);
            
            if (debugLog) {
                logger.debug(`SET ${obj.constructor.name}.${propertyKey} = ${newValue} (was ${oldValue})`);
            }
            
            // 设置新值
            const result = Reflect.set(obj, prop, newValue);
            
            if (result) {
                // 更新原始值记录
                originalValues.set(propertyKey, newValue);
                
                // 记录变化到SyncVar管理器
                try {
                    if (TypeGuards.isSyncVarValue(oldValue) && TypeGuards.isSyncVarValue(newValue)) {
                        syncVarManager.recordChange(obj, propertyKey, oldValue, newValue);
                    }
                } catch (error) {
                    logger.error(`记录SyncVar变化失败:`, error);
                }
            }
            
            return result;
        },
        
        /**
         * 拦截属性删除
         */
        deleteProperty(obj: T, prop: string | symbol): boolean {
            const propertyKey = prop as string;
            
            if (typeof prop === 'string' && isSyncVar(obj, propertyKey)) {
                logger.warn(`尝试删除SyncVar属性 ${propertyKey}，这可能会导致同步问题`);
            }
            
            return Reflect.deleteProperty(obj, prop);
        },
        
        /**
         * 拦截属性枚举
         */
        ownKeys(obj: T): ArrayLike<string | symbol> {
            return Reflect.ownKeys(obj);
        },
        
        /**
         * 拦截属性描述符获取
         */
        getOwnPropertyDescriptor(obj: T, prop: string | symbol): PropertyDescriptor | undefined {
            return Reflect.getOwnPropertyDescriptor(obj, prop);
        },
        
        /**
         * 拦截in操作符
         */
        has(obj: T, prop: string | symbol): boolean {
            return Reflect.has(obj, prop);
        }
    });
    
    // 标记为已代理
    (proxy as T & { _syncVarProxied: boolean; _syncVarOptions: SyncVarProxyOptions })._syncVarProxied = true;
    (proxy as T & { _syncVarProxied: boolean; _syncVarOptions: SyncVarProxyOptions })._syncVarOptions = options;
    
    if (debugLog) {
        logger.debug(`${target.constructor.name} 代理创建完成`);
    }
    
    return proxy;
}

/**
 * 检查对象是否已经被SyncVar代理
 * 
 * @param obj - 要检查的对象
 * @returns 是否已被代理
 */
export function isSyncVarProxied(obj: unknown): obj is { _syncVarProxied: boolean } {
    return typeof obj === 'object' && obj !== null && '_syncVarProxied' in obj && (obj as any)._syncVarProxied === true;
}

/**
 * 获取代理对象的原始目标
 * 
 * @param proxy - 代理对象
 * @returns 原始目标对象，如果不是代理则返回原对象
 */
export function getSyncVarProxyTarget<T>(proxy: T): T {
    // 注意：JavaScript的Proxy没有直接方法获取target
    // 这里返回proxy本身，因为我们的代理是透明的
    return proxy;
}

/**
 * 销毁SyncVar代理
 * 
 * 清理代理相关的资源，但注意JavaScript的Proxy无法真正"销毁"
 * 这个函数主要是清理管理器中的相关数据
 * 
 * @param proxy - 代理对象
 */
export function destroySyncVarProxy(proxy: INetworkSyncable & { _syncVarProxied?: boolean; _syncVarDestroyed?: boolean }): void {
    if (!isSyncVarProxied(proxy)) {
        return;
    }
    
    // 清理SyncVar管理器中的数据
    const syncVarManager = SyncVarManager.Instance;
    syncVarManager.cleanupComponent(proxy);
    
    // 标记为已销毁（虽然代理仍然存在）
    proxy._syncVarProxied = false;
    proxy._syncVarDestroyed = true;
    
    const logger = createLogger('SyncVarProxy');
    logger.debug(`${proxy.constructor?.name || 'Unknown'} 代理已销毁`);
}

/**
 * 临时禁用SyncVar代理监听
 * 
 * 在回调函数执行期间禁用SyncVar变化监听，避免循环触发
 * 
 * @param proxy - 代理对象
 * @param callback - 要执行的回调函数
 * @returns 回调函数的返回值
 */
export function withSyncVarDisabled<TResult>(proxy: INetworkSyncable & { _syncVarDisabled?: boolean; _syncVarProxied?: boolean }, callback: () => TResult): TResult {
    if (!isSyncVarProxied(proxy)) {
        return callback();
    }
    
    const wasDisabled = proxy._syncVarDisabled;
    proxy._syncVarDisabled = true;
    
    try {
        return callback();
    } finally {
        proxy._syncVarDisabled = wasDisabled;
    }
}

/**
 * 批量更新SyncVar字段
 * 
 * 在批量更新期间暂时禁用同步，最后一次性触发变化检测
 * 
 * @param proxy - 代理对象
 * @param updates - 要更新的字段和值的映射
 */
export function batchUpdateSyncVar(proxy: INetworkSyncable & { _syncVarProxied?: boolean; _syncVarDisabled?: boolean }, updates: Record<string, unknown>): void {
    if (!isSyncVarProxied(proxy)) {
        // 如果不是代理对象，直接批量更新
        Object.assign(proxy, updates);
        return;
    }
    
    withSyncVarDisabled(proxy, () => {
        // 记录旧值
        const oldValues: Record<string, unknown> = {};
        for (const key of Object.keys(updates)) {
            if (isSyncVar(proxy, key)) {
                oldValues[key] = (proxy as unknown as Record<string, unknown>)[key];
            }
        }
        
        // 批量更新
        Object.assign(proxy, updates);
        
        const syncVarManager = SyncVarManager.Instance;
        for (const [key, newValue] of Object.entries(updates)) {
            if (isSyncVar(proxy, key)) {
                const oldValue = oldValues[key];
                if (TypeGuards.isSyncVarValue(oldValue) && TypeGuards.isSyncVarValue(newValue)) {
                    syncVarManager.recordChange(proxy, key, oldValue, newValue);
                }
            }
        }
    });
}