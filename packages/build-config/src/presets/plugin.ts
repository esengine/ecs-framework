/**
 * Plugin Package Preset
 * 插件包预设
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

import { resolve } from 'path';
import { defineConfig, type UserConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { STANDARD_EXTERNALS, EDITOR_ONLY_EXTERNALS } from '../types';
import { cssInjectPlugin } from '../plugins/css-inject';

export interface PluginPackageOptions {
    /** 包根目录 (通常是 __dirname) */
    root: string;

    /** 入口点配置 */
    entries?: {
        /** 主入口 (默认: src/index.ts) */
        main?: string;
        /** 运行时入口 (默认: src/runtime.ts) */
        runtime?: string;
        /** 编辑器入口 (默认: src/editor/index.ts) */
        editor?: string;
    };

    /** 是否包含 CSS (默认: false) */
    hasCSS?: boolean;

    /** 是否生成 plugin.json 导出 (默认: true) */
    hasPluginJson?: boolean;

    /** 额外的外部依赖 */
    external?: (string | RegExp)[];

    /** 额外的 Vite 配置 */
    viteConfig?: Partial<UserConfig>;
}

/**
 * 创建插件包的 Vite 配置
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { pluginPreset } from '@esengine/build-config/presets';
 *
 * export default pluginPreset({
 *     root: __dirname,
 *     hasCSS: true
 * });
 * ```
 */
export function pluginPreset(options: PluginPackageOptions): UserConfig {
    const {
        root,
        entries = {},
        hasCSS = false,
        external = [],
        viteConfig = {}
    } = options;

    const mainEntry = entries.main ?? 'src/index.ts';
    const runtimeEntry = entries.runtime ?? 'src/runtime.ts';
    const editorEntry = entries.editor ?? 'src/editor/index.ts';

    // 构建入口点映射
    const entryPoints: Record<string, string> = {
        index: resolve(root, mainEntry),
        runtime: resolve(root, runtimeEntry),
        'editor/index': resolve(root, editorEntry)
    };

    const plugins: any[] = [
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: false
        })
    ];

    // CSS 注入插件
    if (hasCSS) {
        plugins.push(cssInjectPlugin());
    }

    return defineConfig({
        plugins,
        esbuild: {
            jsx: 'automatic',
        },
        build: {
            lib: {
                entry: entryPoints,
                formats: ['es'],
                fileName: (_format: string, entryName: string) => `${entryName}.js`
            },
            rollupOptions: {
                external: [
                    ...STANDARD_EXTERNALS,
                    ...external
                ],
                output: {
                    exports: 'named',
                    preserveModules: false,
                    // 禁用自动代码分割，所有共享代码内联到各入口
                    manualChunks: () => undefined
                }
            },
            target: 'es2020',
            minify: false,
            sourcemap: true
        },
        ...viteConfig
    });
}

/**
 * 创建独立运行时构建配置
 * 用于 platform-web 等需要生成独立 IIFE 运行时的场景
 *
 * @example
 * ```typescript
 * // rollup.runtime.config.js
 * import { standaloneRuntimeConfig } from '@esengine/build-config/presets';
 *
 * export default standaloneRuntimeConfig({
 *     root: __dirname,
 *     entry: 'src/runtime.ts',
 *     globalName: 'ECSRuntime'
 * });
 * ```
 */
export interface StandaloneRuntimeOptions {
    /** 包根目录 */
    root: string;
    /** 入口文件 */
    entry: string;
    /** 全局变量名 (IIFE 格式) */
    globalName: string;
    /** 额外的外部依赖 */
    external?: (string | RegExp)[];
}

export function standaloneRuntimeConfig(options: StandaloneRuntimeOptions) {
    const { root, entry, globalName, external = [] } = options;

    // 返回 Rollup 配置（而非 Vite，因为需要 IIFE 格式）
    return {
        input: resolve(root, entry),
        output: {
            file: 'dist/runtime.browser.js',
            format: 'iife' as const,
            name: globalName,
            sourcemap: true,
            exports: 'default' as const
        },
        external: [
            ...STANDARD_EXTERNALS,
            ...EDITOR_ONLY_EXTERNALS,
            ...external
        ],
        plugins: [
            // 需要在使用时传入 rollup 插件
        ]
    };
}
