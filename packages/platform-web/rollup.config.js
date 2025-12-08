import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

/**
 * Platform-web Rollup Configuration
 *
 * Builds:
 * 1. ESM + CJS bundles for editor usage
 * 2. TypeScript declarations
 *
 * All @esengine/* packages are external to avoid bundling.
 * Game builds use import maps to resolve modules at runtime.
 */

const external = [
    '@esengine/ecs-framework',
    '@esengine/runtime-core',
    '@esengine/platform-common',
    '@esengine/asset-system',
    '@esengine/ecs-components',
    '@esengine/ecs-engine-bindgen',
    '@esengine/tilemap',
    '@esengine/ui',
    '@esengine/behavior-tree',
    // Editor packages (should never be in runtime)
    '@esengine/editor-core',
    '@esengine/ui-editor',
    '@esengine/tilemap-editor',
    '@esengine/behavior-tree-editor',
    '@esengine/blueprint-editor',
    '@esengine/physics-rapier2d-editor',
    // React (editor only)
    'react',
    'react-dom',
];

export default [
    // Main bundle (ESM + CJS)
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.mjs',
                format: 'esm',
                sourcemap: true
            },
            {
                file: 'dist/index.js',
                format: 'cjs',
                sourcemap: true
            }
        ],
        external,
        plugins: [
            resolve({
                browser: true,
                preferBuiltins: false
            }),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false
            })
        ]
    },
    // TypeScript declarations
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'esm'
        },
        external,
        plugins: [dts()]
    }
];
