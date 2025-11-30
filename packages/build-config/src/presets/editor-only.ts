/**
 * Editor-Only Package Preset
 * 纯编辑器包预设
 *
 * 用于仅在编辑器环境使用的包
 * For packages only used in the editor environment
 *
 * Examples: editor-core, node-editor
 */

import { resolve } from 'path';
import { defineConfig, type UserConfig } from 'vite';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';
import { STANDARD_EXTERNALS } from '../types';
import { cssInjectPlugin } from '../plugins/css-inject';

export interface EditorOnlyOptions {
    /** 包根目录 (通常是 __dirname) */
    root: string;

    /** 入口文件 (默认: src/index.ts) */
    entry?: string;

    /** 是否包含 React 组件 (默认: true) */
    hasReact?: boolean;

    /** 是否包含 CSS (默认: false) */
    hasCSS?: boolean;

    /** 额外的外部依赖 */
    external?: (string | RegExp)[];

    /** 额外的 Vite 配置 */
    viteConfig?: Partial<UserConfig>;
}

/**
 * 创建纯编辑器包的 Vite 配置
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { editorOnlyPreset } from '@esengine/build-config/presets';
 *
 * export default editorOnlyPreset({
 *     root: __dirname,
 *     hasReact: true,
 *     hasCSS: true
 * });
 * ```
 */
export function editorOnlyPreset(options: EditorOnlyOptions): UserConfig {
    const {
        root,
        entry = 'src/index.ts',
        hasReact = true,
        hasCSS = false,
        external = [],
        viteConfig = {}
    } = options;

    const plugins: any[] = [];

    // React 支持
    if (hasReact) {
        plugins.push(react());
    }

    // DTS 生成
    plugins.push(
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: false
        })
    );

    // CSS 注入
    if (hasCSS) {
        plugins.push(cssInjectPlugin());
    }

    return defineConfig({
        plugins,
        esbuild: hasReact ? { jsx: 'automatic' } : undefined,
        build: {
            lib: {
                entry: resolve(root, entry),
                formats: ['es'],
                fileName: () => 'index.js'
            },
            rollupOptions: {
                external: [
                    ...STANDARD_EXTERNALS,
                    ...external
                ],
                output: {
                    exports: 'named',
                    preserveModules: false
                }
            },
            target: 'es2020',
            minify: false,
            sourcemap: true
        },
        ...viteConfig
    });
}
