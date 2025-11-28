import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

/**
 * 自定义插件：将 CSS 转换为自执行的样式注入代码
 * Custom plugin: Convert CSS to self-executing style injection code
 *
 * 当用户写 `import './styles.css'` 时，这个插件会：
 * 1. 在构建时将 CSS 内容转换为 JS 代码
 * 2. JS 代码在模块导入时自动执行，将样式注入到 DOM
 * 3. 使用唯一 ID 防止重复注入
 */
function injectCSSPlugin(): any {
    const cssIdMap = new Map<string, string>();
    let cssCounter = 0;

    return {
        name: 'inject-css-plugin',
        enforce: 'post' as const,
        generateBundle(_options: any, bundle: any) {
            const bundleKeys = Object.keys(bundle);

            // 找到所有 CSS 文件
            const cssFiles = bundleKeys.filter(key => key.endsWith('.css'));

            for (const cssFile of cssFiles) {
                const cssChunk = bundle[cssFile];
                if (!cssChunk || !cssChunk.source) continue;

                const cssContent = cssChunk.source;
                const styleId = `esengine-behavior-tree-style-${cssCounter++}`;
                cssIdMap.set(cssFile, styleId);

                // 生成样式注入代码
                const injectCode = `(function(){if(typeof document!=='undefined'){var s=document.createElement('style');s.id='${styleId}';if(!document.getElementById(s.id)){s.textContent=${JSON.stringify(cssContent)};document.head.appendChild(s);}}})();`;

                // 注入到 editor/index.js 或共享 chunk
                for (const jsKey of bundleKeys) {
                    if (!jsKey.endsWith('.js')) continue;
                    const jsChunk = bundle[jsKey];
                    if (!jsChunk || jsChunk.type !== 'chunk' || !jsChunk.code) continue;

                    if (jsKey === 'editor/index.js' || jsKey.match(/^index-[^/]+\.js$/)) {
                        jsChunk.code = injectCode + '\n' + jsChunk.code;
                    }
                }

                // 删除独立的 CSS 文件
                delete bundle[cssFile];
            }
        }
    };
}

export default defineConfig({
    plugins: [
        react(),
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: false
        }),
        injectCSSPlugin()
    ],
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                runtime: resolve(__dirname, 'src/runtime.ts'),
                'editor/index': resolve(__dirname, 'src/editor/index.ts')
            },
            formats: ['es'],
            fileName: (format, entryName) => `${entryName}.js`
        },
        rollupOptions: {
            external: [
                '@esengine/ecs-framework',
                '@esengine/editor-runtime',
                'react',
                'react/jsx-runtime',
                'lucide-react',
                'zustand',
                /^@esengine\//,
                /^@tauri-apps\//
            ],
            output: {
                exports: 'named',
                preserveModules: false
            }
        },
        target: 'es2020',
        minify: false,
        sourcemap: true
    }
});
