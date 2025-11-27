import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

// 自定义插件：将 CSS 内联到 JS 中
function inlineCSS(): any {
    return {
        name: 'inline-css',
        enforce: 'post' as const,
        // 在生成 bundle 时注入 CSS
        generateBundle(_options: any, bundle: any) {
            const bundleKeys = Object.keys(bundle);

            // 找到 CSS 文件
            const cssFile = bundleKeys.find(key => key.endsWith('.css'));
            if (!cssFile || !bundle[cssFile]) {
                return;
            }

            const cssContent = bundle[cssFile].source;
            if (!cssContent) return;

            // 找到包含编辑器代码的主要 JS 文件（带 hash 的 chunk）
            const mainJsFile = bundleKeys.find(key =>
                key.endsWith('.js') &&
                key.includes('index-') &&
                bundle[key].type === 'chunk' &&
                bundle[key].code
            );

            if (mainJsFile && bundle[mainJsFile]) {
                const injectCode = `
(function() {
    if (typeof document !== 'undefined') {
        var style = document.createElement('style');
        style.id = 'esengine-tilemap-styles';
        if (!document.getElementById(style.id)) {
            style.textContent = ${JSON.stringify(cssContent)};
            document.head.appendChild(style);
        }
    }
})();
`;
                bundle[mainJsFile].code = injectCode + bundle[mainJsFile].code;
            }

            // 删除独立的 CSS 文件（已内联）
            delete bundle[cssFile];
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
        inlineCSS()
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
                '@esengine/ecs-components',
                '@esengine/ecs-engine-bindgen',
                '@esengine/asset-system',
                '@esengine/editor-core',
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
