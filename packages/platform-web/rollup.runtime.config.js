import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

export default {
    input: 'src/runtime.ts',
    output: {
        file: 'dist/runtime.browser.js',
        format: 'iife',
        name: 'ECSRuntime',
        sourcemap: true,
        globals: {},
        exports: 'default'
    },
    // Exclude editor-only packages that contain React
    external: [
        'react',
        'react-dom',
        '@esengine/editor-core'
    ],
    plugins: [
        // Replace process.env.NODE_ENV for browser
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        resolve({
            browser: true,
            preferBuiltins: false,
            // Only resolve main/module fields, not source
            mainFields: ['module', 'main']
        }),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false,
            sourceMap: true
        })
    ],
    onwarn(warning, warn) {
        // Suppress "Unresolved dependencies" warnings for external packages
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
    }
};
