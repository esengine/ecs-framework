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
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => 'index.js'
        },
        rollupOptions: {
            external: [
                '@esengine/ecs-framework',
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
