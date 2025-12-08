/**
 * Plugin API - 为插件提供简洁的访问接口
 *
 * 使用方式：
 * ```typescript
 * import { PluginAPI } from '@esengine/editor-runtime';
 *
 * const scene = PluginAPI.scene;
 * const entityStore = PluginAPI.entityStore;
 * const messageHub = PluginAPI.messageHub;
 * ```
 *
 * 这个 API 会自动从全局 __ESENGINE__ 获取正确的实例，
 * 避免模块实例不一致的问题。
 */

import type { EntityStoreService, MessageHub } from '@esengine/editor-core';
import type { Scene, ServiceContainer } from '@esengine/ecs-framework';

// 内部 API 接口定义
interface IPluginAPIInternal {
    getScene(): Scene | null;
    getEntityStore(): EntityStoreService;
    getMessageHub(): MessageHub;
    resolveService<T>(serviceType: any): T;
    getCore(): any;
}

// 声明全局类型
declare global {
    interface Window {
        __ESENGINE__?: {
            api?: IPluginAPIInternal;
            [key: string]: any;
        };
    }
}

/**
 * 获取内部 API
 */
function getInternalAPI(): IPluginAPIInternal {
    const api = window.__ESENGINE__?.api;
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
     * 解析服务
     * @param serviceType 服务类型
     */
    resolve<T>(serviceType: any): T {
        return getInternalAPI().resolveService<T>(serviceType);
    },

    /**
     * 检查 API 是否可用
     */
    get isAvailable(): boolean {
        return !!window.__ESENGINE__?.api;
    },
};
