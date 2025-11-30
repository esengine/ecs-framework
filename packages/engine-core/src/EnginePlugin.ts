/**
 * 插件系统核心类型定义
 * Plugin system core type definitions
 *
 * 这是插件类型的唯一定义源，editor-core 重新导出并扩展这些类型。
 * This is the single source of truth for plugin types. editor-core re-exports and extends them.
 */

import type { ComponentRegistry as ComponentRegistryType, IScene, ServiceContainer } from '@esengine/ecs-framework';
import { TransformComponent } from './TransformComponent';

// ============================================================================
// 基础类型 | Basic Types
// ============================================================================

/**
 * 插件类别
 * Plugin category
 */
export type PluginCategory =
    | 'core'        // 核心功能 | Core functionality
    | 'rendering'   // 渲染相关 | Rendering
    | 'ui'          // UI 系统 | UI System
    | 'ai'          // AI/行为树 | AI/Behavior
    | 'physics'     // 物理引擎 | Physics
    | 'audio'       // 音频系统 | Audio
    | 'networking'  // 网络功能 | Networking
    | 'tools'       // 工具/编辑器扩展 | Tools/Editor extensions
    | 'scripting'   // 脚本/蓝图 | Scripting/Blueprint
    | 'tilemap'     // 瓦片地图 | Tilemap
    | 'content';    // 内容/资源 | Content/Assets

/**
 * 加载阶段 - 控制插件模块的加载顺序
 * Loading phase - controls the loading order of plugin modules
 */
export type LoadingPhase =
    | 'earliest'      // 最早加载（核心模块） | Earliest (core modules)
    | 'preDefault'    // 默认之前 | Before default
    | 'default'       // 默认阶段 | Default phase
    | 'postDefault'   // 默认之后 | After default
    | 'postEngine';   // 引擎初始化后 | After engine init

/**
 * 模块类型
 * Module type
 */
export type ModuleType = 'runtime' | 'editor';

/**
 * 模块描述符
 * Module descriptor
 */
export interface ModuleDescriptor {
    /** 模块名称 | Module name */
    name: string;
    /** 模块类型 | Module type */
    type: ModuleType;
    /** 加载阶段 | Loading phase */
    loadingPhase?: LoadingPhase;
}

/**
 * 插件依赖
 * Plugin dependency
 */
export interface PluginDependency {
    /** 依赖的插件ID | Dependent plugin ID */
    id: string;
    /** 版本要求 | Version requirement */
    version?: string;
    /** 是否可选 | Optional */
    optional?: boolean;
}

// ============================================================================
// 插件描述符 | Plugin Descriptor
// ============================================================================

/**
 * 插件描述符
 * Plugin descriptor
 *
 * 所有字段都是可选的，PluginManager 会填充默认值。
 * All fields are optional, PluginManager will fill in defaults.
 */
export interface PluginDescriptor {
    /** 插件唯一标识符 | Unique plugin ID */
    id: string;
    /** 显示名称 | Display name */
    name: string;
    /** 版本号 | Version */
    version: string;
    /** 描述 | Description */
    description?: string;
    /** 插件类别 | Plugin category */
    category?: PluginCategory;
    /** 标签（用于搜索） | Tags (for search) */
    tags?: string[];
    /** 图标（Lucide 图标名） | Icon (Lucide icon name) */
    icon?: string;
    /** 是否默认启用 | Enabled by default */
    enabledByDefault?: boolean;
    /** 是否可以包含内容资产 | Can contain content assets */
    canContainContent?: boolean;
    /** 是否为引擎内置插件 | Is engine built-in plugin */
    isEnginePlugin?: boolean;
    /** 是否为核心插件（不可禁用） | Is core plugin (cannot be disabled) */
    isCore?: boolean;
    /** 模块列表 | Module list */
    modules?: ModuleDescriptor[];
    /** 依赖列表 | Dependency list */
    dependencies?: PluginDependency[];
    /** 平台要求 | Platform requirements */
    platforms?: ('web' | 'desktop' | 'mobile')[];
}

// ============================================================================
// 系统上下文 | System Context
// ============================================================================

/**
 * 系统创建上下文
 * System creation context
 */
export interface SystemContext {
    /** 是否为编辑器模式 | Is editor mode */
    isEditor: boolean;
    /** 引擎桥接（如有） | Engine bridge (if available) */
    engineBridge?: any;
    /** 渲染系统（如有） | Render system (if available) */
    renderSystem?: any;
    /** 其他已创建的系统引用 | Other created system references */
    [key: string]: any;
}

// ============================================================================
// 运行时模块 | Runtime Module
// ============================================================================

/**
 * 运行时模块接口
 * Runtime module interface
 */
export interface IRuntimeModule {
    /**
     * 注册组件到 ComponentRegistry
     * Register components to ComponentRegistry
     */
    registerComponents?(registry: typeof ComponentRegistryType): void;

    /**
     * 注册服务到 ServiceContainer
     * Register services to ServiceContainer
     */
    registerServices?(services: ServiceContainer): void;

    /**
     * 为场景创建系统
     * Create systems for scene
     */
    createSystems?(scene: IScene, context: SystemContext): void;

    /**
     * 所有系统创建完成后调用
     * Called after all systems are created
     */
    onSystemsCreated?(scene: IScene, context: SystemContext): void;

    /**
     * 模块初始化完成回调
     * Module initialization complete callback
     */
    onInitialize?(): Promise<void>;

    /**
     * 模块销毁回调
     * Module destroy callback
     */
    onDestroy?(): void;
}

// ============================================================================
// 插件接口 | Plugin Interface
// ============================================================================

/**
 * 插件接口
 * Plugin interface
 *
 * 这是所有插件包导出的统一类型。
 * This is the unified type that all plugin packages export.
 */
export interface IPlugin {
    /** 插件描述符 | Plugin descriptor */
    readonly descriptor: PluginDescriptor;
    /** 运行时模块（可选） | Runtime module (optional) */
    readonly runtimeModule?: IRuntimeModule;
    /** 编辑器模块（可选，类型为 any 以避免循环依赖） | Editor module (optional, typed as any to avoid circular deps) */
    readonly editorModule?: any;
}

// ============================================================================
// Engine Core 插件 | Engine Core Plugin
// ============================================================================

class EngineRuntimeModule implements IRuntimeModule {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(TransformComponent);
    }
}

const descriptor: PluginDescriptor = {
    id: '@esengine/engine-core',
    name: 'Engine Core',
    version: '1.0.0',
    description: 'Transform 等核心组件',
    category: 'core',
    enabledByDefault: true,
    isEnginePlugin: true,
    isCore: true
};

export const EnginePlugin: IPlugin = {
    descriptor,
    runtimeModule: new EngineRuntimeModule()
};
