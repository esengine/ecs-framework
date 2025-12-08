/**
 * 插件服务注册表
 * Plugin Service Registry
 *
 * 这个文件重新定义（不是 re-export）ServiceToken 和 PluginServiceRegistry，
 * 以确保 tsup/rollup-plugin-dts 生成的类型声明使用 engine-core 作为类型来源，
 * 而不是追踪到 plugin-types（会导致跨包类型不兼容）。
 *
 * This file re-defines (not re-exports) ServiceToken and PluginServiceRegistry,
 * to ensure tsup/rollup-plugin-dts generated type declarations use engine-core
 * as the type source, instead of tracing back to plugin-types (which causes
 * cross-package type incompatibility).
 *
 * 设计原则 | Design principles:
 * 1. 类型安全 - 使用 ServiceToken 携带类型信息
 * 2. 显式依赖 - 通过导入 token 明确表达依赖关系
 * 3. 可选依赖 - get 返回 undefined，require 抛异常
 * 4. 单一职责 - 只负责服务注册和查询，不涉及生命周期管理
 * 5. 谁定义接口，谁导出 Token - 各模块定义自己的接口和 Token
 * 6. 单一类型来源 - 所有包从 engine-core 导入类型，不直接使用 plugin-types
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
 * @param name 令牌名称 | Token name
 * @returns 服务令牌 | Service token
 */
export function createServiceToken<T>(name: string): ServiceToken<T> {
    // __phantom 仅用于类型推断，运行时不需要实际值
    // __phantom is only for type inference, no actual value needed at runtime
    return {
        id: Symbol(name),
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
}

// ============================================================================
// engine-core 内部 Token | engine-core Internal Tokens
// ============================================================================

/**
 * Transform 组件类型 | Transform component type
 *
 * 使用 any 类型以允许各模块使用自己的 ITransformComponent 接口定义。
 * Using any type to allow modules to use their own ITransformComponent interface definition.
 *
 * 这是 engine-core 自己定义的 Token，因为 TransformComponent 在此模块中定义。
 * This is a Token defined by engine-core itself, as TransformComponent is defined in this module.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TransformTypeToken = createServiceToken<new (...args: any[]) => any>('transformType');
