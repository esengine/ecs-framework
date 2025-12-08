import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: false,
            tsconfigPath: './tsconfig.json'
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
            // 将 React 和核心 ECS 框架设为外部依赖
            // 这确保整个应用使用同一个 ComponentRegistry 实例
            external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                '@esengine/esengine',
                '@esengine/ecs-components',
                '@esengine/tilemap',
                '@esengine/ui',
                '@esengine/behavior-tree',
                '@esengine/platform-web',
                '@esengine/ecs-engine-bindgen',
                '@esengine/asset-system',
            ],
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
