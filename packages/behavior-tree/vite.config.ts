import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => 'behavior-tree.js'
        },
        rollupOptions: {
            output: {
                exports: 'named',
                inlineDynamicImports: true
            }
        },
        outDir: 'dist',
        target: 'es2020',
        minify: false,
        sourcemap: true
    }
});
