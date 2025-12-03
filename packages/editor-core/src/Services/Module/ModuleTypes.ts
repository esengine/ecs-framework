/**
 * Module System Types.
 * 模块系统类型定义。
 *
 * Re-exports core types from engine-core and defines editor-specific types.
 * 从 engine-core 重新导出核心类型，并定义编辑器专用类型。
 */

import type {
    ModuleCategory,
    ModulePlatform,
    ModuleManifest,
    ModuleExports
} from '@esengine/engine-core';

// Re-export core module types
export type { ModuleCategory, ModulePlatform, ModuleManifest, ModuleExports };

/**
 * Module state in a project.
 * 项目中的模块状态。
 */
export interface ModuleState {
    /** Module ID | 模块 ID */
    id: string;

    /** Whether enabled in this project | 在此项目中是否启用 */
    enabled: boolean;

    /** Version being used | 使用的版本 */
    version: string;
}

/**
 * Result of validating a module disable operation.
 * 验证禁用模块操作的结果。
 */
export interface ModuleDisableValidation {
    /** Whether the module can be disabled | 是否可以禁用 */
    canDisable: boolean;

    /** Reason why it cannot be disabled | 不能禁用的原因 */
    reason?: 'core' | 'dependency' | 'scene-usage' | 'script-usage';

    /** Detailed message | 详细消息 */
    message?: string;

    /** Scene files that use this module | 使用此模块的场景文件 */
    sceneUsages?: SceneModuleUsage[];

    /** Script files that import this module | 导入此模块的脚本文件 */
    scriptUsages?: ScriptModuleUsage[];

    /** Other modules that depend on this | 依赖此模块的其他模块 */
    dependentModules?: string[];
}

/**
 * Scene usage of a module.
 * 场景对模块的使用。
 */
export interface SceneModuleUsage {
    /** Scene file path | 场景文件路径 */
    scenePath: string;

    /** Components used from the module | 使用的模块组件 */
    components: {
        /** Component type name | 组件类型名 */
        type: string;
        /** Number of instances | 实例数量 */
        count: number;
    }[];
}

/**
 * Script usage of a module.
 * 脚本对模块的使用。
 */
export interface ScriptModuleUsage {
    /** Script file path | 脚本文件路径 */
    scriptPath: string;

    /** Line number of import | 导入的行号 */
    line: number;

    /** Import statement | 导入语句 */
    importStatement: string;
}

/**
 * Project module configuration.
 * 项目模块配置。
 */
export interface ProjectModuleConfig {
    /** Enabled module IDs | 启用的模块 ID */
    enabled: string[];
}

/**
 * Module registry entry with computed properties.
 * 带计算属性的模块注册表条目。
 */
export interface ModuleRegistryEntry extends ModuleManifest {
    /** Full path to module directory | 模块目录完整路径 */
    path: string;

    /** Whether module is currently enabled in project | 模块当前是否在项目中启用 */
    isEnabled: boolean;

    /** Modules that depend on this module | 依赖此模块的模块 */
    dependents: string[];

    /** Whether all dependencies are satisfied | 是否满足所有依赖 */
    dependenciesSatisfied: boolean;
}
