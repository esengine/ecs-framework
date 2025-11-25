import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: true
        })
    ],
    define: {
        'process.env.NODE_ENV': JSON.stringify('production')
    },
    esbuild: {
        // 保留类名，用于跨包插件服务匹配
        keepNames: true,
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => 'editor-runtime.js'
        },
        rollupOptions: {
            // 将 React 设为外部依赖，使用主应用提供的 React
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                exports: 'named',
                inlineDynamicImports: true,
                // 映射外部依赖到全局变量
                globals: {
                    'react': 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'ReactJSXRuntime'
                }
            }
        },
        target: 'es2020',
        minify: false,
        sourcemap: true
    }
});
