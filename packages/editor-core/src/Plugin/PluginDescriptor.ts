/**
 * 插件描述符类型
 * Plugin descriptor types
 *
 * 从 @esengine/engine-core 重新导出基础类型，并添加编辑器专用类型。
 * Re-export base types from @esengine/engine-core, and add editor-specific types.
 */

// 从 engine-core 重新导出所有插件相关类型
export type {
    PluginCategory,
    LoadingPhase,
    ModuleType,
    ModuleDescriptor,
    PluginDependency,
    PluginDescriptor,
    SystemContext,
    IRuntimeModule,
    IPlugin
} from '@esengine/engine-core';

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
