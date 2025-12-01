/**
 * CSS Inject Plugin
 * CSS 注入插件
 *
 * 将 CSS 内联到 JS 中，避免单独的 CSS 文件
 * Inlines CSS into JS to avoid separate CSS files
 */

import type { Plugin } from 'vite';
import type { OutputBundle, NormalizedOutputOptions, OutputAsset, OutputChunk } from 'rollup';

/**
 * 创建 CSS 注入插件
 *
 * @example
 * ```typescript
 * import { cssInjectPlugin } from '@esengine/build-config/plugins';
 *
 * export default defineConfig({
 *     plugins: [cssInjectPlugin()]
 * });
 * ```
 */
export function cssInjectPlugin(): Plugin {
    return {
        name: 'esengine:css-inject',
        apply: 'build',

        generateBundle(_options: NormalizedOutputOptions, bundle: OutputBundle) {
            // 收集所有 CSS 内容
            const cssChunks: string[] = [];
            const cssFileNames: string[] = [];

            for (const [fileName, chunk] of Object.entries(bundle)) {
                if (fileName.endsWith('.css') && chunk.type === 'asset') {
                    cssChunks.push(chunk.source as string);
                    cssFileNames.push(fileName);
                }
            }

            if (cssChunks.length === 0) return;

            // 合并所有 CSS
            const combinedCSS = cssChunks.join('\n');

            // 创建注入代码
            const injectCode = `
(function() {
    if (typeof document === 'undefined') return;
    var style = document.createElement('style');
    style.setAttribute('data-esengine', 'true');
    style.textContent = ${JSON.stringify(combinedCSS)};
    document.head.appendChild(style);
})();
`;

            // 找到主入口 JS 文件并注入
            for (const chunk of Object.values(bundle)) {
                if (chunk.type === 'chunk' && chunk.isEntry) {
                    chunk.code = injectCode + chunk.code;
                    break;
                }
            }

            // 删除独立的 CSS 文件
            for (const fileName of cssFileNames) {
                delete bundle[fileName];
            }
        }
    };
}
