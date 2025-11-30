import { defineConfig } from 'tsup';

// Physics-rapier2d keeps runtime entry for WASM loading
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        runtime: 'src/runtime.ts'
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    tsconfig: 'tsconfig.build.json',
    external: [
        'react',
        'react-dom',
        '@esengine/editor-core',
        '@esengine/ecs-framework',
        '@esengine/ecs-components'
    ],
    esbuildOptions(options) {
        options.jsx = 'automatic';
    }
});
