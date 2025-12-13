/**
 * 插件服务注册表
 * Plugin Service Registry
 *
 * 基于 ServiceToken 的类型安全服务注册表。
 * Type-safe service registry based on ServiceToken.
 *
 * 设计原则 | Design principles:
 * 1. 类型安全 - 使用 ServiceToken 携带类型信息
 * 2. 显式依赖 - 通过导入 token 明确表达依赖关系
 * 3. 可选依赖 - get 返回 undefined，require 抛异常
 * 4. 单一职责 - 只负责服务注册和查询，不涉及生命周期管理
 * 5. 谁定义接口，谁导出 Token - 各模块定义自己的接口和 Token
 */

// ============================================================================
// 服务令牌 | Service Token
// ============================================================================

/**
 * 服务令牌接口
 * Service token interface
 *
 * 用于类型安全的服务注册和获取。
 * For type-safe service registration and retrieval.
 *
 * 注意：__phantom 是必需属性，确保 TypeScript 在跨包类型解析时保留泛型类型信息。
 * Note: __phantom is a required property to ensure TypeScript preserves generic
 * type information across packages.
 */
export interface ServiceToken<T> {
    readonly id: symbol;
    readonly name: string;
    /**
     * Phantom type 标记（强制类型推断）
     * Phantom type marker (enforces type inference)
     */
    readonly __phantom: T;
}

/**
 * 创建服务令牌
 * Create a service token
 *
 * 使用 Symbol.for() 确保相同名称的令牌在不同模块中引用同一个 Symbol。
 * Uses Symbol.for() to ensure tokens with the same name reference the same Symbol across modules.
 *
 * 这解决了跨包场景下服务注册和获取使用不同 Symbol 的问题。
 * This fixes the issue where service registration and retrieval use different Symbols across packages.
 *
 * @param name 令牌名称 | Token name
 * @returns 服务令牌 | Service token
 */
export function createServiceToken<T>(name: string): ServiceToken<T> {
    // 使用 Symbol.for() 从全局 Symbol 注册表获取或创建 Symbol
    // 这确保相同名称在任何地方都返回同一个 Symbol
    // Use Symbol.for() to get or create Symbol from global Symbol registry
    // This ensures the same name returns the same Symbol everywhere
    const tokenKey = `@esengine/service:${name}`;
    return {
        id: Symbol.for(tokenKey),
        name
    } as ServiceToken<T>;
}

// ============================================================================
// 插件服务注册表 | Plugin Service Registry
// ============================================================================

/**
 * 插件服务注册表
 * Plugin service registry
 *
 * 用于跨插件共享服务的类型安全注册表。
 * Type-safe registry for sharing services between plugins.
 */
export class PluginServiceRegistry {
    private _services = new Map<symbol, unknown>();

    /**
     * 注册服务
     * Register a service
     */
    register<T>(token: ServiceToken<T>, service: T): void {
        this._services.set(token.id, service);
    }

    /**
     * 获取服务（可选）
     * Get a service (optional)
     */
    get<T>(token: ServiceToken<T>): T | undefined {
        return this._services.get(token.id) as T | undefined;
    }

    /**
     * 获取服务（必需）
     * Get a service (required)
     *
     * @throws 如果服务未注册 | If service is not registered
     */
    require<T>(token: ServiceToken<T>): T {
        const service = this._services.get(token.id);
        if (service === undefined) {
            throw new Error(`Service not found: ${token.name}`);
        }
        return service as T;
    }

    /**
     * 检查服务是否已注册
     * Check if a service is registered
     */
    has<T>(token: ServiceToken<T>): boolean {
        return this._services.has(token.id);
    }

    /**
     * 注销服务
     * Unregister a service
     */
    unregister<T>(token: ServiceToken<T>): boolean {
        return this._services.delete(token.id);
    }

    /**
     * 清空所有服务
     * Clear all services
     */
    clear(): void {
        this._services.clear();
    }

    /**
     * 释放资源
     * Dispose resources
     *
     * 实现 IService 接口，在服务容器清理时调用。
     * Implements IService interface, called when service container is cleaned up.
     */
    dispose(): void {
        this.clear();
    }
}
