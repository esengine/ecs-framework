import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        react(),
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: false,
            tsconfigPath: './tsconfig.json'
        })
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
                '@esengine/editor-core',
                'react',
                'react/jsx-runtime',
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
