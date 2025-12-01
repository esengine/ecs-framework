/**
 * Plugin Package Preset (tsup)
 * 插件包预设 - 基于 tsup/esbuild
 *
 * 用于同时包含运行时和编辑器模块的插件包
 * For plugin packages with both runtime and editor modules
 *
 * 生成三个入口点:
 * - index.js     - 完整导出（编辑器环境）
 * - runtime.js   - 纯运行时（游戏运行时环境，不含 React）
 * - editor/index.js - 编辑器模块
 *
 * Examples: ui, tilemap, behavior-tree, physics-rapier2d
 */

import type { Options } from 'tsup';
import { STANDARD_EXTERNALS } from '../types';

export interface PluginPackageOptions {
    /** 入口点配置 */
    entries?: {
        /** 主入口 (默认: src/index.ts) */
        main?: string;
        /** 运行时入口 (默认: src/runtime.ts) */
        runtime?: string;
        /** 编辑器入口 (默认: src/editor/index.ts) */
        editor?: string;
    };

    /** 额外的外部依赖 */
    external?: (string | RegExp)[];

    /** 额外的 tsup 配置 */
    tsupConfig?: Partial<Options>;
}

/**
 * 创建插件包的 tsup 配置
 *
 * @example
 * ```typescript
 * // tsup.config.ts
 * import { defineConfig } from 'tsup';
 * import { pluginPreset } from '@esengine/build-config/presets';
 *
 * export default defineConfig(pluginPreset());
 * ```
 */
export function pluginPreset(options: PluginPackageOptions = {}): Options {
    const {
        entries = {},
        external = [],
        tsupConfig = {}
    } = options;

    const mainEntry = entries.main ?? 'src/index.ts';
    const runtimeEntry = entries.runtime ?? 'src/runtime.ts';
    const editorEntry = entries.editor ?? 'src/editor/index.ts';

    // 合并外部依赖
    const allExternal = [
        ...STANDARD_EXTERNALS,
        ...external
    ];

    return {
        entry: {
            index: mainEntry,
            runtime: runtimeEntry,
            'editor/index': editorEntry
        },
        format: ['esm'],
        dts: true,
        splitting: false,  // 禁用代码分割
        sourcemap: true,
        clean: true,
        external: allExternal,
        esbuildOptions(options) {
            options.jsx = 'automatic';
        },
        ...tsupConfig
    };
}

/**
 * 创建纯运行时包的 tsup 配置
 */
export interface RuntimeOnlyOptions {
    /** 入口文件 (默认: src/index.ts) */
    entry?: string;
    /** 额外的外部依赖 */
    external?: (string | RegExp)[];
    /** 额外的 tsup 配置 */
    tsupConfig?: Partial<Options>;
}

export function runtimeOnlyPreset(options: RuntimeOnlyOptions = {}): Options {
    const {
        entry = 'src/index.ts',
        external = [],
        tsupConfig = {}
    } = options;

    return {
        entry: [entry],
        format: ['esm'],
        dts: true,
        splitting: false,
        sourcemap: true,
        clean: true,
        external: [
            ...STANDARD_EXTERNALS,
            ...external
        ],
        ...tsupConfig
    };
}

/**
 * 创建纯编辑器包的 tsup 配置
 */
export interface EditorOnlyOptions {
    /** 入口文件 (默认: src/index.ts) */
    entry?: string;
    /** 额外的外部依赖 */
    external?: (string | RegExp)[];
    /** 额外的 tsup 配置 */
    tsupConfig?: Partial<Options>;
}

export function editorOnlyPreset(options: EditorOnlyOptions = {}): Options {
    const {
        entry = 'src/index.ts',
        external = [],
        tsupConfig = {}
    } = options;

    return {
        entry: [entry],
        format: ['esm'],
        dts: true,
        splitting: false,
        sourcemap: true,
        clean: true,
        // 将 CSS 内联到 JS 中，运行时自动注入到 DOM
        // Inline CSS into JS, auto-inject to DOM at runtime
        injectStyle: true,
        external: [
            ...STANDARD_EXTERNALS,
            ...external
        ],
        esbuildOptions(options) {
            options.jsx = 'automatic';
        },
        ...tsupConfig
    };
}
