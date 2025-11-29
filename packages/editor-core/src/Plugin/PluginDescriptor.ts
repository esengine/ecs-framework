/**
 * 插件系统类型定义
 * Plugin system type definitions
 */

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
 * 模块描述符 - 描述插件内的一个模块
 * Module descriptor - describes a module within a plugin
 */
export interface ModuleDescriptor {
    /** 模块名称 | Module name */
    name: string;

    /** 模块类型 | Module type */
    type: ModuleType;

    /** 加载阶段 | Loading phase */
    loadingPhase?: LoadingPhase;

    /** 模块入口文件（相对路径） | Module entry file (relative path) */
    entry?: string;

    // ===== 运行时模块配置 | Runtime module config =====

    /** 导出的组件类名列表 | Exported component class names */
    components?: string[];

    /** 导出的系统类名列表 | Exported system class names */
    systems?: string[];

    /** 导出的服务类名列表 | Exported service class names */
    services?: string[];

    // ===== 编辑器模块配置 | Editor module config =====

    /** 注册的面板ID列表 | Registered panel IDs */
    panels?: string[];

    /** 注册的检视器类型列表 | Registered inspector types */
    inspectors?: string[];

    /** 注册的 Gizmo 提供者列表 | Registered Gizmo providers */
    gizmoProviders?: string[];

    /** 注册的编译器列表 | Registered compilers */
    compilers?: string[];

    /** 注册的文件处理器扩展名 | Registered file handler extensions */
    fileHandlers?: string[];
}

/**
 * 插件依赖
 * Plugin dependency
 */
export interface PluginDependency {
    /** 依赖的插件ID | Dependent plugin ID */
    id: string;

    /** 版本要求（semver） | Version requirement (semver) */
    version?: string;

    /** 是否可选 | Optional */
    optional?: boolean;
}

/**
 * 插件描述符 - 对应 plugin.json 文件
 * Plugin descriptor - corresponds to plugin.json
 */
export interface PluginDescriptor {
    /** 插件唯一标识符，如 "@esengine/tilemap" | Unique plugin ID */
    id: string;

    /** 显示名称 | Display name */
    name: string;

    /** 版本号 | Version */
    version: string;

    /** 描述 | Description */
    description?: string;

    /** 作者 | Author */
    author?: string;

    /** 许可证 | License */
    license?: string;

    /** 插件类别 | Plugin category */
    category: PluginCategory;

    /** 标签（用于搜索） | Tags (for search) */
    tags?: string[];

    /** 图标（Lucide 图标名） | Icon (Lucide icon name) */
    icon?: string;

    /** 是否默认启用 | Enabled by default */
    enabledByDefault: boolean;

    /** 是否可以包含内容资产 | Can contain content assets */
    canContainContent: boolean;

    /** 是否为引擎内置插件 | Is engine built-in plugin */
    isEnginePlugin: boolean;

    /** 是否为核心插件（不可禁用） | Is core plugin (cannot be disabled) */
    isCore?: boolean;

    /** 模块列表 | Module list */
    modules: ModuleDescriptor[];

    /** 依赖列表 | Dependency list */
    dependencies?: PluginDependency[];

    /** 平台要求 | Platform requirements */
    platforms?: ('web' | 'desktop' | 'mobile')[];
}

/**
 * 插件状态
 * Plugin state
 */
export type PluginState =
    | 'unloaded'    // 未加载 | Not loaded
    | 'loading'     // 加载中 | Loading
    | 'loaded'      // 已加载 | Loaded
    | 'active'      // 已激活 | Active
    | 'error'       // 错误 | Error
    | 'disabled';   // 已禁用 | Disabled
