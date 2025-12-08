/**
 * Plugin SDK Registry
 * 插件 SDK 注册器
 *
 * 将编辑器核心模块暴露为全局变量，供插件使用。
 * 插件构建时将这些模块标记为 external，运行时从全局对象获取。
 *
 * 使用方式：
 * 1. 编辑器启动时调用 PluginSDKRegistry.initialize()
 * 2. 插件构建配置中设置 external: ['@esengine/editor-runtime', ...]
 * 3. 插件构建配置中设置 globals: { '@esengine/editor-runtime': '__ESENGINE__.editorRuntime' }
 */

import { Core } from '@esengine/esengine';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';

// 导入所有需要暴露给插件的模块
import * as editorRuntime from '@esengine/editor-runtime';
import * as ecsFramework from '@esengine/esengine';
import * as behaviorTree from '@esengine/behavior-tree';
import * as engineCore from '@esengine/engine-core';
import * as sprite from '@esengine/sprite';
import * as camera from '@esengine/camera';
import * as audio from '@esengine/audio';

// 存储服务实例引用（在初始化时设置）
let entityStoreInstance: EntityStoreService | null = null;
let messageHubInstance: MessageHub | null = null;

// SDK 模块映射
const SDK_MODULES = {
    '@esengine/editor-runtime': editorRuntime,
    '@esengine/esengine': ecsFramework,
    '@esengine/behavior-tree': behaviorTree,
    '@esengine/engine-core': engineCore,
    '@esengine/sprite': sprite,
    '@esengine/camera': camera,
    '@esengine/audio': audio,
} as const;

// 全局变量名称映射（用于插件构建配置）
export const SDK_GLOBALS = {
    '@esengine/editor-runtime': '__ESENGINE__.editorRuntime',
    '@esengine/esengine': '__ESENGINE__.ecsFramework',
    '@esengine/behavior-tree': '__ESENGINE__.behaviorTree',
    '@esengine/engine-core': '__ESENGINE__.engineCore',
    '@esengine/sprite': '__ESENGINE__.sprite',
    '@esengine/camera': '__ESENGINE__.camera',
    '@esengine/audio': '__ESENGINE__.audio',
} as const;

/**
 * 插件 API 接口
 * 为插件提供统一的访问接口，避免模块实例不一致的问题
 */
export interface IPluginAPI {
    /** 获取当前场景 */
    getScene(): any;
    /** 获取 EntityStoreService */
    getEntityStore(): EntityStoreService;
    /** 获取 MessageHub */
    getMessageHub(): MessageHub;
    /** 解析服务 */
    resolveService<T>(serviceType: any): T;
    /** 获取 Core 实例 */
    getCore(): typeof Core;
}

// 扩展 Window.__ESENGINE__ 类型（基础类型已在 PluginAPI.ts 中定义）
interface ESEngineGlobal {
    editorRuntime: typeof editorRuntime;
    ecsFramework: typeof ecsFramework;
    behaviorTree: typeof behaviorTree;
    engineCore: typeof engineCore;
    sprite: typeof sprite;
    camera: typeof camera;
    audio: typeof audio;
    require: (moduleName: string) => any;
    api: IPluginAPI;
}

/**
 * 插件 SDK 注册器
 */
export class PluginSDKRegistry {
    private static initialized = false;

    /**
     * 初始化 SDK 注册器
     * 将所有 SDK 模块暴露到全局对象
     */
    static initialize(): void {
        if (this.initialized) {
            return;
        }

        // 获取服务实例（使用编辑器内部的类型，确保类型匹配）
        entityStoreInstance = Core.services.resolve(EntityStoreService);
        messageHubInstance = Core.services.resolve(MessageHub);

        if (!entityStoreInstance) {
            console.error('[PluginSDKRegistry] EntityStoreService not registered yet!');
        }
        if (!messageHubInstance) {
            console.error('[PluginSDKRegistry] MessageHub not registered yet!');
        }

        // 创建插件 API - 直接返回实例引用，避免类型匹配问题
        const pluginAPI: IPluginAPI = {
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

        // 创建全局命名空间
        window.__ESENGINE__ = {
            editorRuntime,
            ecsFramework,
            behaviorTree,
            engineCore,
            sprite,
            camera,
            audio,
            require: this.requireModule.bind(this),
            api: pluginAPI,
        };

        this.initialized = true;
    }

    /**
     * 动态获取模块（用于 CommonJS 风格的插件）
     */
    private static requireModule(moduleName: string): any {
        const module = SDK_MODULES[moduleName as keyof typeof SDK_MODULES];
        if (!module) {
            throw new Error(`[PluginSDKRegistry] Unknown module: ${moduleName}`);
        }
        return module;
    }

    /**
     * 检查是否已初始化
     */
    static isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 获取所有可用的 SDK 模块名称
     */
    static getAvailableModules(): string[] {
        return Object.keys(SDK_MODULES);
    }

    /**
     * 获取全局变量映射（用于生成插件构建配置）
     */
    static getGlobalsConfig(): Record<string, string> {
        return { ...SDK_GLOBALS };
    }
}
