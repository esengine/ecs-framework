/**
 * User Code Service Interface.
 * 用户代码服务接口。
 *
 * Provides compilation and loading for user-written game logic code.
 * 提供用户编写的游戏逻辑代码的编译和加载功能。
 *
 * Directory convention:
 * 目录约定：
 * - scripts/         -> Runtime code (components, systems, etc.)
 * - scripts/editor/  -> Editor-only code (inspectors, gizmos, panels)
 */

import type { IHotReloadOptions } from './HotReloadCoordinator';

/**
 * User code target environment.
 * 用户代码目标环境。
 */
export enum UserCodeTarget {
    /** Runtime code - runs in game | 运行时代码 - 在游戏中运行 */
    Runtime = 'runtime',
    /** Editor code - runs only in editor | 编辑器代码 - 仅在编辑器中运行 */
    Editor = 'editor'
}

/**
 * User script file information.
 * 用户脚本文件信息。
 */
export interface UserScriptInfo {
    /** Absolute file path | 文件绝对路径 */
    path: string;
    /** Relative path from scripts directory | 相对于 scripts 目录的路径 */
    relativePath: string;
    /** Target environment | 目标环境 */
    target: UserCodeTarget;
    /** Exported names (classes, functions) | 导出的名称（类、函数） */
    exports: string[];
    /** Last modified timestamp | 最后修改时间戳 */
    lastModified: number;
}

/**
 * SDK module info for shim generation.
 * 用于生成 shim 的 SDK 模块信息。
 */
export interface SDKModuleInfo {
    /** Module ID (e.g., "particle", "engine-core") | 模块 ID */
    id: string;
    /** Full package name (e.g., "@esengine/particle") | 完整包名 */
    name: string;
    /** Whether module has runtime code | 模块是否有运行时代码 */
    hasRuntime?: boolean;
    /** Global key for window.__ESENGINE__ (optional, defaults to camelCase of id) | 全局键名 */
    globalKey?: string;
}

/**
 * User code compilation options.
 * 用户代码编译选项。
 */
export interface UserCodeCompileOptions {
    /** Project root directory | 项目根目录 */
    projectPath: string;
    /** Target environment | 目标环境 */
    target: UserCodeTarget;
    /** Output directory | 输出目录 */
    outputDir?: string;
    /** Whether to generate source maps | 是否生成 source map */
    sourceMap?: boolean;
    /** Whether to minify output | 是否压缩输出 */
    minify?: boolean;
    /** Output format | 输出格式 */
    format?: 'esm' | 'iife';
    /**
     * SDK modules for shim generation.
     * 用于生成 shim 的 SDK 模块列表。
     *
     * If provided, shims will be created for these modules.
     * Typically obtained from RuntimeResolver.getAvailableModules().
     * 如果提供，将为这些模块创建 shim。
     * 通常从 RuntimeResolver.getAvailableModules() 获取。
     */
    sdkModules?: SDKModuleInfo[];
}

/**
 * User code compilation result.
 * 用户代码编译结果。
 */
export interface UserCodeCompileResult {
    /** Whether compilation succeeded | 是否编译成功 */
    success: boolean;
    /** Output file path | 输出文件路径 */
    outputPath?: string;
    /** Compilation errors | 编译错误 */
    errors: CompileError[];
    /** Compilation warnings | 编译警告 */
    warnings: CompileError[];
    /** Compilation duration in ms | 编译耗时（毫秒） */
    duration: number;
}

/**
 * Compilation error/warning.
 * 编译错误/警告。
 */
export interface CompileError {
    /** Error message | 错误信息 */
    message: string;
    /** Source file path | 源文件路径 */
    file?: string;
    /** Line number | 行号 */
    line?: number;
    /** Column number | 列号 */
    column?: number;
}

/**
 * Loaded user code module.
 * 加载后的用户代码模块。
 */
export interface UserCodeModule {
    /** Module ID | 模块 ID */
    id: string;
    /** Target environment | 目标环境 */
    target: UserCodeTarget;
    /** All exported members | 所有导出的成员 */
    exports: Record<string, any>;
    /** Module version (hash of source) | 模块版本（源码哈希） */
    version: string;
    /** Load timestamp | 加载时间戳 */
    loadedAt: number;
}

/**
 * Hot reload event.
 * 热更新事件。
 */
export interface HotReloadEvent {
    /** Target environment | 目标环境 */
    target: UserCodeTarget;
    /** Changed source files | 变更的源文件 */
    changedFiles: string[];
    /** Previous module (if any) | 之前的模块（如果有） */
    previousModule?: UserCodeModule;
    /** New module | 新模块 */
    newModule: UserCodeModule;
}

/**
 * Hot reloadable component/system interface.
 * 可热更新的组件/系统接口。
 *
 * Implement this interface in user components or systems to preserve state
 * during hot reload. Without this interface, hot reload only updates the
 * prototype chain; with it, you can save and restore custom state.
 *
 * 在用户组件或系统中实现此接口以在热更新时保留状态。
 * 如果不实现此接口，热更新只会更新原型链；实现后，可以保存和恢复自定义状态。
 *
 * @example
 * ```typescript
 * @ECSComponent('MyComponent')
 * class MyComponent extends Component implements IHotReloadable {
 *     private _cachedData: Map<string, any> = new Map();
 *
 *     onBeforeHotReload(): Record<string, unknown> {
 *         // Save state that needs to survive hot reload
 *         return {
 *             cachedData: Array.from(this._cachedData.entries())
 *         };
 *     }
 *
 *     onAfterHotReload(state: Record<string, unknown>): void {
 *         // Restore state after hot reload
 *         const entries = state.cachedData as [string, any][];
 *         this._cachedData = new Map(entries);
 *     }
 * }
 * ```
 */
export interface IHotReloadable {
    /**
     * Called before hot reload to save state.
     * 在热更新前调用以保存状态。
     *
     * Return an object containing any state that needs to survive the hot reload.
     * The returned object will be passed to onAfterHotReload after the prototype is updated.
     *
     * 返回包含需要保留的状态的对象。
     * 返回的对象将在原型更新后传递给 onAfterHotReload。
     *
     * @returns State object to preserve | 需要保留的状态对象
     */
    onBeforeHotReload?(): Record<string, unknown>;

    /**
     * Called after hot reload to restore state.
     * 在热更新后调用以恢复状态。
     *
     * @param state - State saved by onBeforeHotReload | onBeforeHotReload 保存的状态
     */
    onAfterHotReload?(state: Record<string, unknown>): void;
}

/**
 * User Code Service interface.
 * 用户代码服务接口。
 *
 * Handles scanning, compilation, loading, and hot-reload of user scripts.
 * 处理用户脚本的扫描、编译、加载和热更新。
 *
 * @example
 * ```typescript
 * const userCodeService = services.resolve(UserCodeService);
 *
 * // Scan for user scripts | 扫描用户脚本
 * const scripts = await userCodeService.scan(projectPath);
 *
 * // Compile runtime code | 编译运行时代码
 * const result = await userCodeService.compile({
 *     projectPath,
 *     target: UserCodeTarget.Runtime
 * });
 *
 * // Load compiled module | 加载编译后的模块
 * if (result.success && result.outputPath) {
 *     const module = await userCodeService.load(result.outputPath, UserCodeTarget.Runtime);
 *     userCodeService.registerComponents(module);
 * }
 *
 * // Start hot reload | 启动热更新
 * await userCodeService.watch(projectPath, (event) => {
 *     console.log('Code reloaded:', event.changedFiles);
 * });
 * ```
 */
export interface IUserCodeService {
    /**
     * Scan project for user scripts.
     * 扫描项目中的用户脚本。
     *
     * Looks for:
     * 查找：
     * - scripts/*.ts -> Runtime code | 运行时代码
     * - scripts/editor/*.tsx -> Editor code | 编辑器代码
     *
     * @param projectPath - Project root path | 项目根路径
     * @returns Discovered script files | 发现的脚本文件
     */
    scan(projectPath: string): Promise<UserScriptInfo[]>;

    /**
     * Compile user scripts.
     * 编译用户脚本。
     *
     * @param options - Compilation options | 编译选项
     * @returns Compilation result | 编译结果
     */
    compile(options: UserCodeCompileOptions): Promise<UserCodeCompileResult>;

    /**
     * Load compiled user code module.
     * 加载编译后的用户代码模块。
     *
     * @param modulePath - Path to compiled JS file | 编译后的 JS 文件路径
     * @param target - Target environment | 目标环境
     * @returns Loaded module | 加载的模块
     */
    load(modulePath: string, target: UserCodeTarget): Promise<UserCodeModule>;

    /**
     * Unload user code module.
     * 卸载用户代码模块。
     *
     * @param target - Target environment to unload | 要卸载的目标环境
     */
    unload(target: UserCodeTarget): Promise<void>;

    /**
     * Get currently loaded module.
     * 获取当前加载的模块。
     *
     * @param target - Target environment | 目标环境
     * @returns Loaded module or undefined | 加载的模块或 undefined
     */
    getModule(target: UserCodeTarget): UserCodeModule | undefined;

    /**
     * Register runtime components/systems from user module.
     * 从用户模块注册运行时组件/系统。
     *
     * Automatically detects and registers:
     * 自动检测并注册：
     * - Classes extending Component
     * - Classes extending System
     *
     * @param module - User code module | 用户代码模块
     * @param componentRegistry - Optional ComponentRegistry to register components | 可选的 ComponentRegistry 用于注册组件
     */
    registerComponents(module: UserCodeModule, componentRegistry?: any): void;

    /**
     * Register user systems to scene.
     * 注册用户系统到场景。
     *
     * Automatically detects and instantiates System subclasses from user module,
     * then adds them to the scene.
     * 自动检测用户模块中的 System 子类并实例化，然后添加到场景。
     *
     * @param module - User code module | 用户代码模块
     * @param scene - Scene to add systems | 要添加系统的场景
     * @returns Array of registered system instances | 注册的系统实例数组
     */
    registerSystems(module: UserCodeModule, scene: any): any[];

    /**
     * Unregister user systems from scene.
     * 从场景注销用户系统。
     *
     * Removes previously registered user systems from the scene.
     * 从场景移除之前注册的用户系统。
     *
     * @param scene - Scene to remove systems | 要移除系统的场景
     */
    unregisterSystems(scene: any): void;

    /**
     * Get registered user systems.
     * 获取已注册的用户系统。
     *
     * @returns Array of registered system instances | 注册的系统实例数组
     */
    getRegisteredSystems(): any[];

    /**
     * Register editor extensions from user module.
     * 从用户模块注册编辑器扩展。
     *
     * Automatically detects and registers:
     * 自动检测并注册：
     * - Component inspectors
     * - Gizmo providers
     *
     * @param module - User code module | 用户代码模块
     * @param inspectorRegistry - Component inspector registry | 组件检查器注册表
     */
    registerEditorExtensions(module: UserCodeModule, inspectorRegistry?: any): void;

    /**
     * Unregister editor extensions.
     * 注销编辑器扩展。
     *
     * @param inspectorRegistry - Component inspector registry | 组件检查器注册表
     */
    unregisterEditorExtensions(inspectorRegistry?: any): void;

    /**
     * Start watching for file changes (hot reload).
     * 开始监视文件变更（热更新）。
     *
     * @param projectPath - Project root path | 项目根路径
     * @param onReload - Callback when code is reloaded | 代码重新加载时的回调
     * @param options - Hot reload options | 热更新选项
     */
    watch(
        projectPath: string,
        onReload: (event: HotReloadEvent) => void,
        options?: IHotReloadOptions
    ): Promise<void>;

    /**
     * Stop watching for file changes.
     * 停止监视文件变更。
     */
    stopWatch(): Promise<void>;

    /**
     * Check if watching is active.
     * 检查是否正在监视。
     */
    isWatching(): boolean;
}

import { EditorConfig } from '../../Config';

/**
 * Default scripts directory name.
 * 默认脚本目录名称。
 *
 * @deprecated Use EditorConfig.paths.scripts instead
 */
export const SCRIPTS_DIR = EditorConfig.paths.scripts;

/**
 * Editor scripts subdirectory name.
 * 编辑器脚本子目录名称。
 *
 * @deprecated Use EditorConfig.paths.editorScripts instead
 */
export const EDITOR_SCRIPTS_DIR = EditorConfig.paths.editorScripts;

/**
 * Default output directory for compiled user code.
 * 编译后用户代码的默认输出目录。
 *
 * @deprecated Use EditorConfig.paths.compiled instead
 */
export const USER_CODE_OUTPUT_DIR = EditorConfig.paths.compiled;

// Re-export hot reload coordinator types
// 重新导出热更新协调器类型
export {
    EHotReloadPhase,
    type IHotReloadStatus,
    type IHotReloadOptions
} from './HotReloadCoordinator';
