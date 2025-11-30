/**
 * Build Configuration Types
 * 构建配置类型定义
 */

import type { UserConfig } from 'vite';

/**
 * 包类型
 * Package types for different build configurations
 */
export const enum EPackageType {
    /**
     * 纯运行时库 - 不含任何编辑器代码
     * Pure runtime library - no editor dependencies
     *
     * Examples: core, math, components, asset-system
     */
    RuntimeOnly = 'runtime-only',

    /**
     * 插件包 - 同时包含运行时和编辑器模块
     * Plugin package - contains both runtime and editor modules
     *
     * Examples: ui, tilemap, behavior-tree, physics-rapier2d
     */
    Plugin = 'plugin',

    /**
     * 纯编辑器包 - 仅用于编辑器
     * Editor-only package - only used in editor
     *
     * Examples: editor-core, node-editor
     */
    EditorOnly = 'editor-only',

    /**
     * 应用包 - 最终应用（不发布到 npm）
     * Application package - final app (not published)
     *
     * Examples: editor-app
     */
    Application = 'application'
}

/**
 * 包构建配置
 */
export interface PackageBuildConfig {
    /** 包名 */
    name: string;

    /** 包类型 */
    type: EPackageType;

    /** 入口点配置 */
    entries?: {
        /** 主入口 (默认: src/index.ts) */
        main?: string;
        /** 运行时入口 (仅 Plugin 类型) */
        runtime?: string;
        /** 编辑器入口 (Plugin 和 EditorOnly 类型) */
        editor?: string;
    };

    /** 额外的外部依赖 */
    external?: (string | RegExp)[];

    /** 是否包含 CSS */
    hasCSS?: boolean;

    /** 是否生成 plugin.json 导出 */
    hasPluginJson?: boolean;

    /** 额外的 Vite 配置 */
    viteConfig?: Partial<UserConfig>;
}

/**
 * 标准外部依赖列表
 * Standard external dependencies that should never be bundled
 */
export const STANDARD_EXTERNALS = [
    // React 生态
    'react',
    'react-dom',
    'react/jsx-runtime',
    'lucide-react',

    // 状态管理
    'zustand',
    'immer',

    // 所有 @esengine 包
    /^@esengine\//,
] as const;

/**
 * 编辑器专用依赖（运行时构建必须排除）
 * Editor-only dependencies that must be excluded from runtime builds
 */
export const EDITOR_ONLY_EXTERNALS = [
    '@esengine/editor-core',
    '@esengine/node-editor',
    /\/editor$/,
    /\/editor\//,
] as const;
