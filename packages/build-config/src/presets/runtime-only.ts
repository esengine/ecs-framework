/**
 * Runtime-Only Package Preset
 * 纯运行时包预设
 *
 * 用于不包含任何编辑器代码的基础库
 * For basic libraries without any editor code
 *
 * Examples: core, math, components, asset-system
 */

import { resolve } from 'path';
import { defineConfig, type UserConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { STANDARD_EXTERNALS } from '../types';

export interface RuntimeOnlyOptions {
    /** 包根目录 (通常是 __dirname) */
    root: string;
    /** 入口文件 (默认: src/index.ts) */
    entry?: string;
    /** 额外的外部依赖 */
    external?: (string | RegExp)[];
    /** 额外的 Vite 配置 */
    viteConfig?: Partial<UserConfig>;
}

/**
 * 创建纯运行时包的 Vite 配置
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { runtimeOnlyPreset } from '@esengine/build-config/presets';
 *
 * export default runtimeOnlyPreset({
 *     root: __dirname
 * });
 * ```
 */
export function runtimeOnlyPreset(options: RuntimeOnlyOptions): UserConfig {
    const {
        root,
        entry = 'src/index.ts',
        external = [],
        viteConfig = {}
    } = options;

    return defineConfig({
        plugins: [
            dts({
                include: ['src'],
                outDir: 'dist',
                rollupTypes: false
            })
        ],
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
