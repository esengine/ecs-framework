/**
 * 插件/模块类型定义
 * Plugin/Module type definitions
 *
 * 从 @esengine/engine-core 重新导出基础类型。
 * Re-export base types from @esengine/engine-core.
 */

// 从 engine-core 重新导出所有类型
export type {
    LoadingPhase,
    SystemContext,
    IRuntimeModule,
    IPlugin,
    ModuleManifest,
    ModuleCategory,
    ModulePlatform,
    ModuleExports
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
