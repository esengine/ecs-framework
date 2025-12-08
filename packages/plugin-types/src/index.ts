/**
 * 插件系统基础类型定义
 * Plugin system base type definitions
 *
 * 这个包只提供用于打破循环依赖的基础接口。
 * 完整的类型定义在 engine-core 中。
 *
 * This package only provides base interfaces to break circular dependencies.
 * Complete type definitions are in engine-core.
 *
 * 导出内容 | Exports:
 * - ServiceToken / createServiceToken / PluginServiceRegistry: 服务令牌系统
 * - IEditorModuleBase: 编辑器模块基础接口（用于 IPlugin.editorModule 类型）
 *
 * 不导出（在 engine-core 中定义）| Not exported (defined in engine-core):
 * - IPlugin, IRuntimeModule, SystemContext: 完整的插件类型
 * - ModuleManifest: 完整的模块清单类型
 * - LoadingPhase: 加载阶段类型
 */

import type { ServiceContainer } from '@esengine/ecs-framework';

// ============================================================================
// 服务令牌 | Service Token
// ============================================================================

/**
 * 服务令牌接口
 * Service token interface
 *
 * 用于类型安全的服务注册和获取。
 * For type-safe service registration and retrieval.
 */
export interface ServiceToken<T> {
    readonly id: symbol;
    readonly name: string;
    /** 类型标记（仅用于类型推断）| Type marker (for type inference only) */
    readonly _type?: T;
}

/**
 * 创建服务令牌
 * Create a service token
 *
 * @param name 令牌名称 | Token name
 * @returns 服务令牌 | Service token
 */
export function createServiceToken<T>(name: string): ServiceToken<T> {
    return {
        id: Symbol(name),
        name
    };
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
// 编辑器模块基础接口 | Editor Module Base Interface
// ============================================================================

/**
 * 编辑器模块基础接口
 * Base editor module interface
 *
 * 定义编辑器模块的核心生命周期方法。
 * 这个接口用于 IPlugin.editorModule 的类型定义，避免 engine-core 依赖 editor-core。
 * 完整的 IEditorModuleLoader 接口在 editor-core 中扩展此接口。
 *
 * Defines core lifecycle methods for editor modules.
 * This interface is used for IPlugin.editorModule type to avoid engine-core depending on editor-core.
 * Full IEditorModuleLoader interface extends this in editor-core.
 */
export interface IEditorModuleBase {
    /**
     * 安装编辑器模块
     * Install editor module
     */
    install(services: ServiceContainer): Promise<void>;

    /**
     * 卸载编辑器模块
     * Uninstall editor module
     */
    uninstall?(): Promise<void>;

    /**
     * 编辑器就绪回调
     * Editor ready callback
     */
    onEditorReady?(): void | Promise<void>;

    /**
     * 项目打开回调
     * Project open callback
     */
    onProjectOpen?(projectPath: string): void | Promise<void>;

    /**
     * 项目关闭回调
     * Project close callback
     */
    onProjectClose?(): void | Promise<void>;

    /**
     * 场景加载回调
     * Scene loaded callback
     */
    onSceneLoaded?(scenePath: string): void;

    /**
     * 场景保存前回调
     * Before scene save callback
     */
    onSceneSaving?(scenePath: string): boolean | void;

    /**
     * 设置语言
     * Set locale
     */
    setLocale?(locale: string): void;
}
