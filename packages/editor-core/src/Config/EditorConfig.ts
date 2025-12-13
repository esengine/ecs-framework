/**
 * 编辑器配置
 *
 * 集中管理所有编辑器相关的路径、文件名、全局变量等配置。
 * 避免硬编码分散在各处，提高可维护性和可配置性。
 *
 * Editor configuration.
 * Centralized management of all editor-related paths, filenames, and global variables.
 * Avoids scattered hardcoding, improving maintainability and configurability.
 */

/**
 * 路径配置
 * Path configuration
 */
export interface IPathConfig {
    /** 用户脚本目录 | User scripts directory */
    readonly scripts: string;
    /** 编辑器脚本子目录 | Editor scripts subdirectory */
    readonly editorScripts: string;
    /** 编译输出目录 | Compiled output directory */
    readonly compiled: string;
    /** 插件目录 | Plugins directory */
    readonly plugins: string;
    /** 资源目录 | Assets directory */
    readonly assets: string;
    /** 引擎模块目录 | Engine modules directory */
    readonly engineModules: string;
}

/**
 * 输出文件配置
 * Output file configuration
 */
export interface IOutputConfig {
    /** 运行时代码包 | Runtime bundle filename */
    readonly runtimeBundle: string;
    /** 编辑器代码包 | Editor bundle filename */
    readonly editorBundle: string;
}

/**
 * 全局变量名配置
 * Global variable names configuration
 */
export interface IGlobalsConfig {
    /** SDK 全局对象名 | SDK global object name */
    readonly sdk: string;
    /** 插件容器全局对象名 | Plugins container global object name */
    readonly plugins: string;
    /** 用户运行时导出全局变量名 | User runtime exports global variable name */
    readonly userRuntimeExports: string;
    /** 用户编辑器导出全局变量名 | User editor exports global variable name */
    readonly userEditorExports: string;
}

/**
 * 项目配置文件名
 * Project configuration filenames
 */
export interface IProjectFilesConfig {
    /** 项目配置文件 | Project configuration file */
    readonly projectConfig: string;
    /** 模块索引文件 | Module index file */
    readonly moduleIndex: string;
    /** 模块清单文件 | Module manifest file */
    readonly moduleManifest: string;
}

/**
 * 包名配置
 * Package name configuration
 */
export interface IPackageConfig {
    /** 包作用域 | Package scope */
    readonly scope: string;
    /** 核心框架包名 | Core framework package name */
    readonly coreFramework: string;
}

/**
 * 类型标记配置
 * Type marker configuration
 *
 * 用于标记用户代码相关的运行时属性。
 * 注意：组件和系统的类型检测使用 @ECSComponent/@ECSSystem 装饰器的 Symbol 键。
 *
 * Used for marking user code related runtime properties.
 * Note: Component and System type detection uses Symbol keys from @ECSComponent/@ECSSystem decorators.
 */
export interface ITypeMarkersConfig {
    /** 用户系统标记 | User system marker */
    readonly userSystem: string;
    /** 用户系统名称属性 | User system name property */
    readonly userSystemName: string;
}

/**
 * SDK 模块类型
 * SDK module type
 */
export type SDKModuleType = 'core' | 'runtime' | 'editor';

/**
 * SDK 模块配置
 * SDK module configuration
 *
 * 定义暴露给插件和用户代码的 SDK 模块。
 * Defines SDK modules exposed to plugins and user code.
 */
export interface ISDKModuleConfig {
    /**
     * 包名
     * Package name
     * @example '@esengine/ecs-framework'
     */
    readonly packageName: string;

    /**
     * 全局变量键名（已废弃，现使用统一 SDK）
     * Global variable key name (deprecated, now using unified SDK)
     * @deprecated 使用 @esengine/sdk 代替 | Use @esengine/sdk instead
     */
    readonly globalKey: string;

    /**
     * 模块类型
     * Module type
     * - core: 核心模块，必须加载
     * - runtime: 运行时模块，游戏运行时可用
     * - editor: 编辑器模块，仅编辑器环境可用
     */
    readonly type: SDKModuleType;

    /**
     * 是否启用（默认 true）
     * Whether enabled (default true)
     */
    readonly enabled?: boolean;
}

/**
 * 编辑器配置接口
 * Editor configuration interface
 */
export interface IEditorConfig {
    readonly paths: IPathConfig;
    readonly output: IOutputConfig;
    readonly globals: IGlobalsConfig;
    readonly projectFiles: IProjectFilesConfig;
    readonly package: IPackageConfig;
    readonly typeMarkers: ITypeMarkersConfig;
    readonly sdkModules: readonly ISDKModuleConfig[];
}

/**
 * 默认编辑器配置
 * Default editor configuration
 */
export const EditorConfig: IEditorConfig = {
    paths: {
        scripts: 'scripts',
        editorScripts: 'editor',
        compiled: '.esengine/compiled',
        plugins: 'plugins',
        assets: 'assets',
        engineModules: 'engine',
    },

    output: {
        runtimeBundle: 'user-runtime.js',
        editorBundle: 'user-editor.js',
    },

    globals: {
        sdk: '__ESENGINE_SDK__',
        plugins: '__ESENGINE_PLUGINS__',
        userRuntimeExports: '__USER_RUNTIME_EXPORTS__',
        userEditorExports: '__USER_EDITOR_EXPORTS__',
    },

    projectFiles: {
        projectConfig: 'esengine.project.json',
        moduleIndex: 'index.json',
        moduleManifest: 'module.json',
    },

    package: {
        scope: '@esengine',
        coreFramework: '@esengine/ecs-framework',
    },

    typeMarkers: {
        userSystem: '__isUserSystem__',
        userSystemName: '__userSystemName__',
    },

    sdkModules: [
        // 统一 SDK 入口 - 用户代码唯一入口
        // Unified SDK entry - the only entry point for user code
        { packageName: '@esengine/sdk', globalKey: 'sdk', type: 'core' },
    ],
} as const;

/**
 * 获取完整的脚本目录路径
 * Get full scripts directory path
 *
 * @param projectPath 项目根路径 | Project root path
 */
export function getScriptsPath(projectPath: string): string {
    return `${projectPath}/${EditorConfig.paths.scripts}`;
}

/**
 * 获取编辑器脚本目录路径
 * Get editor scripts directory path
 *
 * @param projectPath 项目根路径 | Project root path
 */
export function getEditorScriptsPath(projectPath: string): string {
    return `${projectPath}/${EditorConfig.paths.scripts}/${EditorConfig.paths.editorScripts}`;
}

/**
 * 获取编译输出目录路径
 * Get compiled output directory path
 *
 * @param projectPath 项目根路径 | Project root path
 */
export function getCompiledPath(projectPath: string): string {
    return `${projectPath}/${EditorConfig.paths.compiled}`;
}

/**
 * 获取运行时包输出路径
 * Get runtime bundle output path
 *
 * @param projectPath 项目根路径 | Project root path
 */
export function getRuntimeBundlePath(projectPath: string): string {
    return `${getCompiledPath(projectPath)}/${EditorConfig.output.runtimeBundle}`;
}

/**
 * 获取编辑器包输出路径
 * Get editor bundle output path
 *
 * @param projectPath 项目根路径 | Project root path
 */
export function getEditorBundlePath(projectPath: string): string {
    return `${getCompiledPath(projectPath)}/${EditorConfig.output.editorBundle}`;
}

/**
 * 获取插件目录路径
 * Get plugins directory path
 *
 * @param projectPath 项目根路径 | Project root path
 */
export function getPluginsPath(projectPath: string): string {
    return `${projectPath}/${EditorConfig.paths.plugins}`;
}

/**
 * 获取项目配置文件路径
 * Get project configuration file path
 *
 * @param projectPath 项目根路径 | Project root path
 */
export function getProjectConfigPath(projectPath: string): string {
    return `${projectPath}/${EditorConfig.projectFiles.projectConfig}`;
}

/**
 * 获取引擎模块目录路径
 * Get engine modules directory path
 *
 * @param projectPath 项目根路径 | Project root path
 */
export function getEngineModulesPath(projectPath: string): string {
    return `${projectPath}/${EditorConfig.paths.engineModules}`;
}

/**
 * 规范化依赖 ID
 * Normalize dependency ID
 *
 * @param depId 依赖 ID | Dependency ID
 * @returns 完整的包名 | Full package name
 */
export function normalizeDependencyId(depId: string): string {
    if (depId.startsWith('@')) {
        return depId;
    }
    return `${EditorConfig.package.scope}/${depId}`;
}

/**
 * 获取短依赖 ID（移除作用域）
 * Get short dependency ID (remove scope)
 *
 * @param depId 依赖 ID | Dependency ID
 * @returns 短 ID | Short ID
 */
export function getShortDependencyId(depId: string): string {
    const prefix = `${EditorConfig.package.scope}/`;
    if (depId.startsWith(prefix)) {
        return depId.substring(prefix.length);
    }
    return depId;
}

/**
 * 检查是否为引擎内置包
 * Check if package is engine built-in
 *
 * @param packageName 包名 | Package name
 */
export function isEnginePackage(packageName: string): boolean {
    return packageName.startsWith(EditorConfig.package.scope);
}

// ==================== SDK 模块辅助函数 ====================
// SDK module helper functions

/**
 * 获取所有 SDK 模块配置
 * Get all SDK module configurations
 */
export function getSDKModules(): readonly ISDKModuleConfig[] {
    return EditorConfig.sdkModules;
}

/**
 * 获取启用的 SDK 模块
 * Get enabled SDK modules
 *
 * @param type 可选的模块类型过滤 | Optional module type filter
 */
export function getEnabledSDKModules(type?: SDKModuleType): readonly ISDKModuleConfig[] {
    return EditorConfig.sdkModules.filter(m =>
        m.enabled !== false && (type === undefined || m.type === type)
    );
}

/**
 * 获取 SDK 全局变量映射
 * Get SDK global variable mapping
 *
 * 用于生成插件构建配置的 globals 选项。
 * Used for generating plugins build config globals option.
 *
 * @returns 包名到全局变量的映射 | Mapping from package name to global variable
 * @example
 * {
 *   '@esengine/sdk': '__ESENGINE_SDK__',
 * }
 */
export function getSDKGlobalsMapping(): Record<string, string> {
    return {
        '@esengine/sdk': EditorConfig.globals.sdk
    };
}

/**
 * 获取 SDK 包名
 * Get SDK package name
 *
 * 用于生成插件构建配置的 external 选项。
 * Used for generating plugins build config external option.
 */
export function getSDKPackageNames(): string[] {
    return ['@esengine/sdk'];
}
