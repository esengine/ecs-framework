/**
 * Plugin API - 为插件提供简洁的访问接口
 * Plugin API - Provides simple access interface for plugins
 *
 * 使用方式 | Usage:
 * ```typescript
 * import { PluginAPI } from '@esengine/editor-runtime';
 *
 * const scene = PluginAPI.scene;
 * const entityStore = PluginAPI.entityStore;
 * const messageHub = PluginAPI.messageHub;
 *
 * // 使用 ServiceToken 获取服务（类型安全）| Get service with ServiceToken (type-safe)
 * import { AssetManagerToken } from '@esengine/asset-system';
 * const assetManager = PluginAPI.resolve(AssetManagerToken);
 * ```
 *
 * 这个 API 会自动从全局 __ESENGINE_SDK__ 获取正确的实例，
 * 避免模块实例不一致的问题。
 * This API automatically gets correct instances from global __ESENGINE_SDK__,
 * avoiding module instance inconsistency issues.
 */

import type { EntityStoreService, MessageHub } from '@esengine/editor-core';
import type { Scene, ServiceContainer, ServiceToken } from '@esengine/ecs-framework';

/**
 * 核心服务接口
 * Core service interface
 *
 * 定义内部 Core 提供的服务访问接口。
 * Defines service access interface provided by internal Core.
 */
interface ICoreServices {
    services: ServiceContainer;
}

/**
 * 内部 API 接口定义
 * Internal API interface definition
 *
 * 定义全局 __ESENGINE_SDK__.api 提供的方法。
 * Defines methods provided by global __ESENGINE_SDK__.api.
 */
interface IPluginAPIInternal {
    /** 获取当前场景 | Get current scene */
    getScene(): Scene | null;
    /** 获取实体存储服务 | Get entity store service */
    getEntityStore(): EntityStoreService;
    /** 获取消息总线 | Get message hub */
    getMessageHub(): MessageHub;
    /**
     * 解析服务（类型安全）
     * Resolve service (type-safe)
     * @param token 服务令牌 | Service token
     */
    resolveService<T>(token: ServiceToken<T>): T;
    /** 获取核心实例 | Get core instance */
    getCore(): ICoreServices;
}

// 声明全局类型
declare global {
    interface Window {
        __ESENGINE_SDK__?: {
            api?: IPluginAPIInternal;
            [key: string]: any;
        };
    }
}

/**
 * 获取内部 API
 */
function getInternalAPI(): IPluginAPIInternal {
    const api = window.__ESENGINE_SDK__?.api;
    if (!api) {
        throw new Error('[PluginAPI] 插件 API 未初始化，请确保编辑器已正确启动');
    }
    return api;
}

/**
 * 插件 API
 * 提供简洁的属性访问方式，避免模块实例不一致问题
 */
export const PluginAPI = {
    /**
     * 获取当前场景
     * @throws 如果场景未初始化
     */
    get scene(): Scene {
        const scene = getInternalAPI().getScene();
        if (!scene) {
            throw new Error('[PluginAPI] 场景未初始化，请先打开或创建一个场景');
        }
        return scene;
    },

    /**
     * 获取当前场景（可能为 null）
     */
    get sceneOrNull(): Scene | null {
        return getInternalAPI().getScene();
    },

    /**
     * 获取 EntityStoreService
     */
    get entityStore(): EntityStoreService {
        return getInternalAPI().getEntityStore();
    },

    /**
     * 获取 MessageHub
     */
    get messageHub(): MessageHub {
        return getInternalAPI().getMessageHub();
    },

    /**
     * 获取服务容器
     */
    get services(): ServiceContainer {
        return getInternalAPI().getCore().services;
    },

    /**
     * 解析服务（类型安全）
     * Resolve service (type-safe)
     *
     * 使用 ServiceToken 获取服务实例，提供完整的类型推断。
     * Use ServiceToken to get service instance with full type inference.
     *
     * @param token 服务令牌 | Service token
     * @returns 服务实例 | Service instance
     *
     * @example
     * ```typescript
     * import { AssetManagerToken } from '@esengine/asset-system';
     * const assetManager = PluginAPI.resolve(AssetManagerToken);
     * // assetManager 类型自动推断为 IAssetManager
     * ```
     */
    resolve<T>(token: ServiceToken<T>): T {
        return getInternalAPI().resolveService<T>(token);
    },

    /**
     * 检查 API 是否可用
     */
    get isAvailable(): boolean {
        return !!window.__ESENGINE_SDK__?.api;
    },
};
