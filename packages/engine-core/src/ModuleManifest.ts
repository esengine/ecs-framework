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
     * WASM file paths relative to module's node_modules or package root.
     * WASM 文件路径，相对于模块的 node_modules 或包根目录。
     *
     * Can be glob patterns like "*.wasm" or specific paths.
     * 可以是 glob 模式如 "*.wasm" 或具体路径。
     *
     * Example: ["@dimforge/rapier2d-compat/*.wasm"]
     */
    wasmPaths?: string[];

    /**
     * Runtime WASM path relative to game output root.
     * 运行时 WASM 路径，相对于游戏输出根目录。
     *
     * Build pipeline copies WASM to this location.
     * 构建管线将 WASM 复制到此位置。
     *
     * Example: "wasm/rapier_wasm2d_bg.wasm"
     */
    runtimeWasmPath?: string;

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
}
