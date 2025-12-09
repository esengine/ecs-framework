/**
 * Plugin SDK Registry
 * 插件 SDK 注册器
 *
 * 将编辑器核心模块暴露为全局变量，供插件使用。
 * 插件构建时将这些模块标记为 external，运行时从全局对象获取。
 *
 * Exposes editor core modules as global variables for plugin use.
 * Plugins mark these modules as external during build, and access them from global object at runtime.
 *
 * 使用方式：
 * 1. 编辑器启动时调用 PluginSDKRegistry.initialize()
 * 2. 插件构建配置中设置 external: getSDKPackageNames()
 * 3. 插件构建配置中设置 globals: getSDKGlobalsMapping()
 */

import { Core } from '@esengine/ecs-framework';
import {
    EntityStoreService,
    MessageHub,
    EditorConfig,
    getSDKGlobalsMapping,
    getSDKPackageNames,
    getEnabledSDKModules,
    type ISDKModuleConfig
} from '@esengine/editor-core';

// 动态导入所有 SDK 模块
// Dynamic import all SDK modules
import * as ecsFramework from '@esengine/ecs-framework';
import * as editorRuntime from '@esengine/editor-runtime';
import * as behaviorTree from '@esengine/behavior-tree';
import * as engineCore from '@esengine/engine-core';
import * as sprite from '@esengine/sprite';
import * as camera from '@esengine/camera';
import * as audio from '@esengine/audio';

/**
 * 模块实例映射
 * Module instance mapping
 *
 * 由于 ES 模块的静态导入限制，我们需要维护一个包名到模块的映射。
 * Due to ES module static import limitations, we need to maintain a mapping from package name to module.
 */
const MODULE_INSTANCES: Record<string, any> = {
    '@esengine/ecs-framework': ecsFramework,
    '@esengine/editor-runtime': editorRuntime,
    '@esengine/behavior-tree': behaviorTree,
    '@esengine/engine-core': engineCore,
    '@esengine/sprite': sprite,
    '@esengine/camera': camera,
    '@esengine/audio': audio,
};

// 存储服务实例引用（在初始化时设置）
// Service instance references (set during initialization)
let entityStoreInstance: EntityStoreService | null = null;
let messageHubInstance: MessageHub | null = null;

/**
 * 插件 API 接口
 * Plugin API interface
 *
 * 为插件提供统一的访问接口，避免模块实例不一致的问题。
 * Provides unified access interface for plugins, avoiding module instance inconsistency issues.
 */
export interface IPluginAPI {
    /** 获取当前场景 | Get current scene */
    getScene(): any;
    /** 获取 EntityStoreService | Get EntityStoreService */
    getEntityStore(): EntityStoreService;
    /** 获取 MessageHub | Get MessageHub */
    getMessageHub(): MessageHub;
    /** 解析服务 | Resolve service */
    resolveService<T>(serviceType: any): T;
    /** 获取 Core 实例 | Get Core instance */
    getCore(): typeof Core;
}

/**
 * SDK 全局对象类型
 * SDK global object type
 */
export interface ISDKGlobal {
    /** 动态模块加载 | Dynamic module loading */
    require: (moduleName: string) => any;
    /** 插件 API | Plugin API */
    api: IPluginAPI;
    /** 其他动态注册的模块 | Other dynamically registered modules */
    [key: string]: any;
}

/**
 * 插件 SDK 注册器
 * Plugin SDK Registry
 *
 * 职责：
 * 1. 将 SDK 模块暴露到全局对象
 * 2. 提供插件 API
 * 3. 支持动态模块加载
 *
 * Responsibilities:
 * 1. Expose SDK modules to global object
 * 2. Provide plugin API
 * 3. Support dynamic module loading
 */
export class PluginSDKRegistry {
    private static initialized = false;

    /**
     * 初始化 SDK 注册器
     * Initialize SDK registry
     *
     * 将所有配置的 SDK 模块暴露到全局对象。
     * Exposes all configured SDK modules to global object.
     */
    static initialize(): void {
        if (this.initialized) {
            return;
        }

        // 获取服务实例
        // Get service instances
        entityStoreInstance = Core.services.resolve(EntityStoreService);
        messageHubInstance = Core.services.resolve(MessageHub);

        if (!entityStoreInstance) {
            console.error('[PluginSDKRegistry] EntityStoreService not registered yet!');
        }
        if (!messageHubInstance) {
            console.error('[PluginSDKRegistry] MessageHub not registered yet!');
        }

        // 创建 SDK 全局对象
        // Create SDK global object
        const sdkGlobal: ISDKGlobal = {
            require: this.requireModule.bind(this),
            api: this.createPluginAPI(),
        };

        // 从配置自动注册所有启用的模块
        // Auto-register all enabled modules from config
        const enabledModules = getEnabledSDKModules();
        for (const config of enabledModules) {
            const moduleInstance = MODULE_INSTANCES[config.packageName];
            if (moduleInstance) {
                sdkGlobal[config.globalKey] = moduleInstance;
            } else {
                console.warn(
                    `[PluginSDKRegistry] Module "${config.packageName}" configured but not imported. ` +
                    `Please add import statement for this module.`
                );
            }
        }

        // 设置全局对象
        // Set global object
        const sdkGlobalName = EditorConfig.globals.sdk;
        (window as any)[sdkGlobalName] = sdkGlobal;

        this.initialized = true;

        console.log(
            `[PluginSDKRegistry] Initialized with ${enabledModules.length} modules:`,
            enabledModules.map(m => m.globalKey)
        );
    }

    /**
     * 创建插件 API
     * Create plugin API
     */
    private static createPluginAPI(): IPluginAPI {
        return {
            getScene: () => Core.scene,
            getEntityStore: () => {
                if (!entityStoreInstance) {
                    throw new Error('[PluginAPI] EntityStoreService not initialized');
                }
                return entityStoreInstance;
            },
            getMessageHub: () => {
                if (!messageHubInstance) {
                    throw new Error('[PluginAPI] MessageHub not initialized');
                }
                return messageHubInstance;
            },
            resolveService: <T>(serviceType: any): T => Core.services.resolve(serviceType) as T,
            getCore: () => Core,
        };
    }

    /**
     * 动态获取模块（用于 CommonJS 风格的插件）
     * Dynamic module loading (for CommonJS style plugins)
     *
     * @param moduleName 模块包名 | Module package name
     */
    private static requireModule(moduleName: string): any {
        const module = MODULE_INSTANCES[moduleName];
        if (!module) {
            const availableModules = Object.keys(MODULE_INSTANCES).join(', ');
            throw new Error(
                `[PluginSDKRegistry] Unknown module: "${moduleName}". ` +
                `Available modules: ${availableModules}`
            );
        }
        return module;
    }

    /**
     * 检查是否已初始化
     * Check if initialized
     */
    static isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 获取所有可用的 SDK 模块名称
     * Get all available SDK module names
     *
     * @deprecated 使用 getSDKPackageNames() 代替 | Use getSDKPackageNames() instead
     */
    static getAvailableModules(): string[] {
        return getSDKPackageNames();
    }

    /**
     * 获取全局变量映射（用于生成插件构建配置）
     * Get globals config (for generating plugin build config)
     *
     * @deprecated 使用 getSDKGlobalsMapping() 代替 | Use getSDKGlobalsMapping() instead
     */
    static getGlobalsConfig(): Record<string, string> {
        return getSDKGlobalsMapping();
    }
}

// 重新导出辅助函数，方便插件构建工具使用
// Re-export helper functions for plugin build tools
export { getSDKGlobalsMapping, getSDKPackageNames, getEnabledSDKModules };
