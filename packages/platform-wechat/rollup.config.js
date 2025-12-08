import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const external = ['@esengine/ecs-framework', '@esengine/platform-common'];

export default [
    // ESM and CJS builds
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
    // Type declarations
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
