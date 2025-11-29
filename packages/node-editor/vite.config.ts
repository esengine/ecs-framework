import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

/**
 * Custom plugin: Convert CSS to self-executing style injection code
 * 自定义插件：将 CSS 转换为自执行的样式注入代码
 */
function injectCSSPlugin(): any {
    let cssCounter = 0;

    return {
        name: 'inject-css-plugin',
        enforce: 'post' as const,
        generateBundle(_options: any, bundle: any) {
            const bundleKeys = Object.keys(bundle);

            // Find all CSS files (找到所有 CSS 文件)
            const cssFiles = bundleKeys.filter(key => key.endsWith('.css'));

            for (const cssFile of cssFiles) {
                const cssChunk = bundle[cssFile];
                if (!cssChunk || !cssChunk.source) continue;

                const cssContent = cssChunk.source;
                const styleId = `esengine-node-editor-style-${cssCounter++}`;

                // Generate style injection code (生成样式注入代码)
                const injectCode = `(function(){if(typeof document!=='undefined'){var s=document.createElement('style');s.id='${styleId}';if(!document.getElementById(s.id)){s.textContent=${JSON.stringify(cssContent)};document.head.appendChild(s);}}})();`;

                // Inject into index.js (注入到 index.js)
                for (const jsKey of bundleKeys) {
                    if (!jsKey.endsWith('.js')) continue;
                    const jsChunk = bundle[jsKey];
                    if (!jsChunk || jsChunk.type !== 'chunk' || !jsChunk.code) continue;

                    if (jsKey === 'index.js') {
                        jsChunk.code = injectCode + '\n' + jsChunk.code;
                    }
                }

                // Remove standalone CSS file (删除独立的 CSS 文件)
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
                index: resolve(__dirname, 'src/index.ts')
            },
            formats: ['es'],
            fileName: (format, entryName) => `${entryName}.js`
        },
        rollupOptions: {
            external: [
                'react',
                'react/jsx-runtime',
                'zustand',
                /^@esengine\//
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
