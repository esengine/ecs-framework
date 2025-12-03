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
     */
    registerComponents(module: UserCodeModule): void;

    /**
     * Register editor extensions from user module.
     * 从用户模块注册编辑器扩展。
     *
     * Automatically detects and registers:
     * 自动检测并注册：
     * - Component inspectors
     * - Gizmo providers
     * - Editor panels
     *
     * @param module - User code module | 用户代码模块
     */
    registerEditorExtensions(module: UserCodeModule): void;

    /**
     * Start watching for file changes (hot reload).
     * 开始监视文件变更（热更新）。
     *
     * @param projectPath - Project root path | 项目根路径
     * @param onReload - Callback when code is reloaded | 代码重新加载时的回调
     */
    watch(projectPath: string, onReload: (event: HotReloadEvent) => void): Promise<void>;

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

/**
 * Default scripts directory name.
 * 默认脚本目录名称。
 */
export const SCRIPTS_DIR = 'scripts';

/**
 * Editor scripts subdirectory name.
 * 编辑器脚本子目录名称。
 */
export const EDITOR_SCRIPTS_DIR = 'editor';

/**
 * Default output directory for compiled user code.
 * 编译后用户代码的默认输出目录。
 */
export const USER_CODE_OUTPUT_DIR = '.esengine/compiled';
