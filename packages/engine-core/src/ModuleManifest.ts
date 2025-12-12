/**
 * Module Manifest Types.
 * 模块清单类型定义。
 *
 * This is the single source of truth for module/plugin configuration.
 * Each engine module should have a module.json file containing this information.
 * 这是模块/插件配置的唯一数据源。
 * 每个引擎模块应该有一个包含此信息的 module.json 文件。
 */

/**
 * Module category for organization in UI.
 * 用于 UI 组织的模块分类。
 */
export type ModuleCategory =
    | 'Core'
    | 'Rendering'
    | 'Physics'
    | 'AI'
    | 'Audio'
    | 'Networking'
    | 'Other';

/**
 * Platform requirements for the module.
 * 模块的平台要求。
 */
export type ModulePlatform = 'web' | 'desktop' | 'mobile';

/**
 * Module exports definition.
 * 模块导出定义。
 */
export interface ModuleExports {
    /** Exported component classes | 导出的组件类 */
    components?: string[];

    /** Exported system classes | 导出的系统类 */
    systems?: string[];

    /** Exported asset loaders | 导出的资源加载器 */
    loaders?: string[];

    /** Other exported items | 其他导出项 */
    other?: string[];
}

/**
 * Module manifest definition (Unified Plugin/Module config).
 * 模块清单定义（统一的插件/模块配置）。
 *
 * This interface matches the structure of module.json files.
 * 此接口匹配 module.json 文件的结构。
 */
export interface ModuleManifest {
    // ==================== Core Identifiers ====================

    /** Unique module identifier | 唯一模块标识符 */
    id: string;

    /** Package name (npm style) | 包名（npm 风格） */
    name: string;

    /** Display name for UI | UI 显示名称 */
    displayName: string;

    /** Module description | 模块描述 */
    description: string;

    /** Module version | 模块版本 */
    version: string;

    // ==================== Classification ====================

    /** Category for grouping in UI | UI 分组分类 */
    category: ModuleCategory;

    /** Tags for search and filtering | 用于搜索和过滤的标签 */
    tags?: string[];

    /** Icon name (Lucide icon) | 图标名（Lucide 图标） */
    icon?: string;

    // ==================== Lifecycle ====================

    /** Whether this is a core module (cannot be disabled) | 是否为核心模块（不能禁用） */
    isCore: boolean;

    /** Whether enabled by default in new projects | 新项目中是否默认启用 */
    defaultEnabled: boolean;

    /** Whether this is an engine built-in module | 是否为引擎内置模块 */
    isEngineModule?: boolean;

    // ==================== Content ====================

    /** Whether this module can contain content/assets | 是否可以包含内容/资源 */
    canContainContent?: boolean;

    /** Platform requirements | 平台要求 */
    platforms?: ModulePlatform[];

    // ==================== Dependencies ====================

    /** Module IDs this module depends on | 此模块依赖的模块 ID */
    dependencies: string[];

    /**
     * External package dependencies that need to be included in import map.
     * 需要包含在 import map 中的外部包依赖。
     *
     * These are runtime dependencies that are dynamically imported by the module.
     * 这些是模块动态导入的运行时依赖。
     *
     * Example: ["@esengine/rapier2d"]
     */
    externalDependencies?: string[];

    // ==================== Exports ====================

    /** Exported items for dependency checking | 导出项用于依赖检查 */
    exports: ModuleExports;

    // ==================== Asset Configuration ====================
    // ==================== 资产配置 ====================

    /**
     * Asset file extensions supported by this module.
     * 此模块支持的资产文件扩展名。
     *
     * Used by build pipeline to determine which files to copy and their types.
     * 构建管线使用此配置决定复制哪些文件及其类型。
     *
     * Example:
     * ```json
     * {
     *   "assetExtensions": {
     *     ".particle": "particle",
     *     ".particle.json": "particle",
     *     ".btree": "behavior-tree"
     *   }
     * }
     * ```
     */
    assetExtensions?: Record<string, string>;

    // ==================== Editor Integration ====================

    /**
     * Associated editor package name.
     * 关联的编辑器包名。
     * e.g., "@esengine/tilemap-editor" for "@esengine/tilemap"
     */
    editorPackage?: string;

    // ==================== Performance (auto-calculated at build time) ====================
    // ==================== 性能（构建时自动计算） ====================

    /** JS bundle size in bytes | JS 包大小（字节） */
    jsSize?: number;

    /** Whether this module requires WASM | 是否需要 WASM */
    requiresWasm?: boolean;

    /** WASM file size in bytes | WASM 文件大小（字节） */
    wasmSize?: number;

    /**
     * Unified WASM configuration for all WASM-related modules.
     * 统一的 WASM 配置，用于所有 WASM 相关模块。
     *
     * This replaces the legacy wasmPaths, runtimeWasmPath, and wasmBindings fields.
     * 此配置替代旧的 wasmPaths、runtimeWasmPath 和 wasmBindings 字段。
     */
    wasmConfig?: {
        /**
         * List of WASM files to copy during build.
         * 构建时需要复制的 WASM 文件列表。
         *
         * Each entry specifies source location and output destination.
         * 每个条目指定源位置和输出目标。
         */
        files: Array<{
            /**
             * Source file path relative to engine modules directory.
             * 源文件路径，相对于引擎模块目录。
             *
             * Supports multiple candidate paths (first existing one is used).
             * 支持多个候选路径（使用第一个存在的）。
             *
             * Example: ["rapier2d/pkg/rapier_wasm2d_bg.wasm", "rapier2d/rapier_wasm2d_bg.wasm"]
             */
            src: string | string[];

            /**
             * Destination path relative to build output directory.
             * 目标路径，相对于构建输出目录。
             *
             * Example: "wasm/rapier_wasm2d_bg.wasm" or "libs/es-engine/es_engine_bg.wasm"
             */
            dst: string;
        }>;

        /**
         * Runtime WASM path for dynamic loading (used by JS code at runtime).
         * 运行时 WASM 路径，用于动态加载（JS 代码在运行时使用）。
         *
         * This is the path that runtime code uses to fetch the WASM file.
         * 这是运行时代码用来获取 WASM 文件的路径。
         *
         * Example: "wasm/rapier_wasm2d_bg.wasm"
         */
        runtimePath?: string;

        /**
         * Whether this is the core engine WASM module.
         * 是否是核心引擎 WASM 模块。
         *
         * The core engine WASM (e.g., es_engine) must be initialized first
         * before the runtime can start. Only one module should have this flag.
         * 核心引擎 WASM（如 es_engine）必须在运行时启动前首先初始化。
         * 只有一个模块应该设置此标志。
         */
        isEngineCore?: boolean;
    };

    // ==================== Build Configuration ====================
    // ==================== 构建配置 ====================

    /**
     * Output path for the built module file.
     * 构建后模块文件的输出路径。
     *
     * Example: "dist/index.mjs"
     */
    outputPath?: string;

    /**
     * Plugin export name for dynamic loading.
     * 用于动态加载的插件导出名。
     *
     * Example: "SpritePlugin"
     */
    pluginExport?: string;

    /**
     * Additional files to include when copying module.
     * 复制模块时需要包含的额外文件。
     *
     * Glob patterns relative to the module's dist directory.
     * 相对于模块 dist 目录的 glob 模式。
     *
     * Example: ["chunk-*.js", "worker.js"]
     */
    includes?: string[];

    // ==================== Build Pipeline Configuration ====================
    // ==================== 构建管线配置 ====================

    /**
     * Core service exports that should be explicitly exported first.
     * 需要显式优先导出的核心服务。
     *
     * Used to avoid naming conflicts when re-exporting modules.
     * 用于避免重新导出模块时的命名冲突。
     *
     * Example: ["createServiceToken", "PluginServiceRegistry"]
     */
    coreServiceExports?: string[];

    /**
     * Whether this module is the runtime entry point (provides default export).
     * 此模块是否为运行时入口点（提供默认导出）。
     *
     * Only one module should have this set to true (typically platform-web).
     * 只有一个模块应该设置为 true（通常是 platform-web）。
     */
    isRuntimeEntry?: boolean;

    /**
     * Standard entry file names to search for user scripts.
     * 用于搜索用户脚本的标准入口文件名。
     *
     * Build pipeline will try these files in order.
     * 构建管线将按顺序尝试这些文件。
     *
     * Example: ["index.ts", "main.ts", "game.ts"]
     */
    userScriptEntries?: string[];

    /**
     * Additional external packages that user scripts might import.
     * 用户脚本可能导入的额外外部包。
     *
     * These packages will be marked as external during bundling.
     * 这些包在打包时将被标记为外部依赖。
     *
     * Example: ["@esengine/ecs-framework", "@esengine/core"]
     */
    userScriptExternals?: string[];
}
