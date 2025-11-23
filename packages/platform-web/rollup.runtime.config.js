import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/runtime.ts',
    output: {
        file: 'dist/runtime.browser.js',
        format: 'iife',
        name: 'ECSRuntime',
        sourcemap: true,
        globals: {},
        exports: 'default'  // Only export the default export
    },
    plugins: [
        resolve({
            browser: true,
            preferBuiltins: false
        }),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false,
            sourceMap: true
        })
    ]
};
