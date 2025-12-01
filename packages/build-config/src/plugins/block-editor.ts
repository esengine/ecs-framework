/**
 * Block Editor Plugin
 * 阻止编辑器代码泄漏插件
 *
 * 在运行时构建中检测并阻止编辑器代码被打包
 * Detects and blocks editor code from being bundled in runtime builds
 */

import type { Plugin } from 'vite';

export interface BlockEditorOptions {
    /** 是否为运行时构建 */
    bIsRuntimeBuild: boolean;
    /** 要阻止的模块模式 */
    blockedPatterns?: (string | RegExp)[];
    /** 是否只警告而不报错 */
    bWarnOnly?: boolean;
}

const DEFAULT_BLOCKED_PATTERNS: (string | RegExp)[] = [
    // React 相关
    /^react$/,
    /^react-dom$/,
    /^react\/jsx-runtime$/,
    /^lucide-react$/,

    // 编辑器包
    /@esengine\/editor-core/,
    /@esengine\/node-editor/,

    // 编辑器子路径
    /\/editor$/,
    /\/editor\//,
];

/**
 * 创建阻止编辑器代码泄漏的插件
 *
 * @example
 * ```typescript
 * import { blockEditorPlugin } from '@esengine/build-config/plugins';
 *
 * // 在运行时构建中使用
 * export default defineConfig({
 *     plugins: [
 *         blockEditorPlugin({ bIsRuntimeBuild: true })
 *     ]
 * });
 * ```
 */
export function blockEditorPlugin(options: BlockEditorOptions): Plugin {
    const {
        bIsRuntimeBuild,
        blockedPatterns = DEFAULT_BLOCKED_PATTERNS,
        bWarnOnly = false
    } = options;

    if (!bIsRuntimeBuild) {
        // 非运行时构建不需要此插件
        return { name: 'esengine:block-editor-noop' };
    }

    const isBlocked = (source: string): boolean => {
        return blockedPatterns.some(pattern => {
            if (typeof pattern === 'string') {
                return source === pattern || source.startsWith(pattern + '/');
            }
            return pattern.test(source);
        });
    };

    return {
        name: 'esengine:block-editor',
        enforce: 'pre',

        resolveId(source: string, importer: string | undefined) {
            if (isBlocked(source)) {
                const message = `[block-editor] Editor dependency detected in runtime build:\n` +
                    `  Source: ${source}\n` +
                    `  Importer: ${importer || 'entry'}\n` +
                    `\n` +
                    `  This usually means:\n` +
                    `  1. A runtime module is importing from a non-/runtime path\n` +
                    `  2. An editor-only dependency leaked into the dependency chain\n` +
                    `\n` +
                    `  Fix: Change the import to use /runtime subpath, e.g.:\n` +
                    `    import { X } from '@esengine/ui/runtime'  // ✓\n` +
                    `    import { X } from '@esengine/ui'          // ✗`;

                if (bWarnOnly) {
                    console.warn('\x1b[33m' + message + '\x1b[0m');
                    return { id: source, external: true };
                } else {
                    throw new Error(message);
                }
            }
            return null;
        }
    };
}
