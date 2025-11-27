import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

// 所有 @esengine/* 包设为 external，避免多实例问题
const external = [
    '@esengine/platform-common',
    '@esengine/ecs-framework',
    '@esengine/ecs-components',
    '@esengine/tilemap',
    '@esengine/ui',
    '@esengine/behavior-tree',
    '@esengine/ecs-engine-bindgen',
    '@esengine/asset-system',
];

export default [
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
            resolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false
            })
        ]
    },
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
