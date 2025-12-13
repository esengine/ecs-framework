/**
 * Plugin SDK Registry
 * 插件 SDK 注册器
 *
 * 将统一 SDK 暴露为全局变量，供插件和用户代码使用。
 * Exposes unified SDK as global variable for plugins and user code.
 *
 * 使用方式：
 * 1. 编辑器启动时调用 PluginSDKRegistry.initialize()
 * 2. 用户代码使用 import { ... } from '@esengine/sdk'
 * 3. 运行时通过 window.__ESENGINE_SDK__ 访问
 */

import { Core } from '@esengine/ecs-framework';
import type { ServiceToken } from '@esengine/ecs-framework';
import {
    EntityStoreService,
    MessageHub,
    EditorConfig
} from '@esengine/editor-core';

// 统一 SDK 导入
// Unified SDK import
import * as sdk from '@esengine/sdk';

// 存储服务实例引用（在初始化时设置）
// Service instance references (set during initialization)
let entityStoreInstance: EntityStoreService | null = null;
let messageHubInstance: MessageHub | null = null;

/**
 * 插件 API 接口
 * Plugin API interface
 *
 * 为插件提供统一的访问接口。
 * Provides unified access interface for plugins.
 */
export interface IPluginAPI {
    /** 获取当前场景 | Get current scene */
    getScene(): any;
    /** 获取 EntityStoreService | Get EntityStoreService */
    getEntityStore(): EntityStoreService;
    /** 获取 MessageHub | Get MessageHub */
    getMessageHub(): MessageHub;
    /**
     * 解析服务 | Resolve service
     *
     * 支持 ServiceToken<T>（推荐）或传统的 class/symbol。
     * Supports ServiceToken<T> (recommended) or legacy class/symbol.
     */
    resolveService<T>(serviceType: ServiceToken<T> | symbol | (new (...args: any[]) => T)): T;
    /** 获取 Core 实例 | Get Core instance */
    getCore(): typeof Core;
}

/**
 * 插件 SDK 注册器
 * Plugin SDK Registry
 *
 * 职责：
 * 1. 将统一 SDK 暴露到全局对象 window.__ESENGINE_SDK__
 * 2. 提供插件 API
 *
 * Responsibilities:
 * 1. Expose unified SDK to global object window.__ESENGINE_SDK__
 * 2. Provide plugin API
 */
export class PluginSDKRegistry {
    private static initialized = false;

    /**
     * 初始化 SDK 注册器
     * Initialize SDK registry
     *
     * 将统一 SDK 暴露到全局对象。
     * Exposes unified SDK to global object.
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

        // 创建增强的 SDK 全局对象，包含 API
        // Create enhanced SDK global object with API
        const sdkGlobal = {
            ...sdk,
            api: this.createPluginAPI(),
        };

        // 设置全局对象
        // Set global object
        const sdkGlobalName = EditorConfig.globals.sdk;
        (window as any)[sdkGlobalName] = sdkGlobal;

        this.initialized = true;

        console.log(`[PluginSDKRegistry] Initialized SDK at window.${sdkGlobalName}`);
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
            resolveService: <T>(serviceType: ServiceToken<T> | symbol | (new (...args: any[]) => T)): T => {
                // 检测是否是 ServiceToken（具有 id: symbol 属性）
                // Detect if this is a ServiceToken (has id: symbol property)
                if (serviceType && typeof serviceType === 'object' && 'id' in serviceType && typeof serviceType.id === 'symbol') {
                    return Core.services.resolve(serviceType.id) as T;
                }
                // 传统方式：直接使用 class 或 symbol
                // Legacy: use class or symbol directly
                return Core.services.resolve(serviceType as symbol) as T;
            },
            getCore: () => Core,
        };
    }

    /**
     * 检查是否已初始化
     * Check if initialized
     */
    static isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 获取 SDK 包名
     * Get SDK package name
     */
    static getSDKPackageName(): string {
        return '@esengine/sdk';
    }

    /**
     * 获取 SDK 全局变量名
     * Get SDK global variable name
     */
    static getSDKGlobalName(): string {
        return EditorConfig.globals.sdk;
    }
}
