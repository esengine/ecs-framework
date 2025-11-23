import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const external = ['@esengine/ecs-framework'];

export default [
    // ESM and CJS builds
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js',
                format: 'cjs',
                sourcemap: true,
                exports: 'named'
            },
            {
                file: 'dist/index.mjs',
                format: 'es',
                sourcemap: true
            }
        ],
        external,
        plugins: [
            resolve({
                preferBuiltins: false,
                browser: true
            }),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
                declarationMap: false
            })
        ]
    },
    // Type definitions
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es'
        },
        external,
        plugins: [dts()]
    }
];