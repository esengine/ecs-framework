import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    tsconfig: 'tsconfig.build.json',
    external: [
        '@esengine/ecs-framework'
    ]
});
