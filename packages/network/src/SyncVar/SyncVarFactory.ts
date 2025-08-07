import { createSyncVarProxy } from './SyncVarProxy';
import { getSyncVarMetadata } from './SyncVarDecorator';
import { INetworkSyncable } from '../types/NetworkTypes';

/**
 * SyncVar工厂函数
 * 
 * 为NetworkComponent创建带有SyncVar代理的实例
 * 这是必需的，因为TypeScript类构造函数不能直接返回代理对象
 */

/**
 * 创建带SyncVar支持的NetworkComponent实例
 * 
 * @param ComponentClass - 组件类构造函数
 * @param args - 构造函数参数
 * @returns 带代理的组件实例
 */
export function createNetworkComponent<T extends INetworkSyncable>(
    ComponentClass: new (...args: any[]) => T,
    ...args: any[]
): T {
    // 创建组件实例
    const instance = new ComponentClass(...args);
    
    // 检查是否有SyncVar字段
    const metadata = getSyncVarMetadata(ComponentClass);
    
    if (metadata.length === 0) {
        // 没有SyncVar，直接返回原实例
        return instance;
    }
    
    // 创建代理包装实例
    const proxy = createSyncVarProxy(instance, {
        debugLog: false // 可以根据需要启用调试
    });
    
    console.log(`[SyncVarFactory] 为 ${ComponentClass.name} 创建了SyncVar代理，包含 ${metadata.length} 个同步字段`);
    
    return proxy;
}

/**
 * SyncVar组件装饰器
 * 
 * 装饰器版本的工厂函数，自动为类添加SyncVar支持
 * 注意：由于TypeScript装饰器的限制，这个方法有一些局限性
 * 
 * @param options - 配置选项
 */
export function NetworkComponentWithSyncVar(options: { debugLog?: boolean } = {}) {
    return function <T extends new (...args: any[]) => INetworkSyncable>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                
                // 检查是否需要创建代理
                const metadata = getSyncVarMetadata(constructor);
                if (metadata.length > 0) {
                    // 返回代理实例
                    return createSyncVarProxy(this as INetworkSyncable, {
                        debugLog: options.debugLog || false
                    }) as this;
                }
                
                return this;
            }
        } as T;
    };
}

/**
 * 便捷方法：检查实例是否使用了SyncVar工厂创建
 * 
 * @param instance - 组件实例
 * @returns 是否使用了SyncVar工厂
 */
export function isNetworkComponentWithSyncVar(instance: any): boolean {
    return instance && (instance._syncVarProxied === true || instance.hasSyncVars?.() === true);
}