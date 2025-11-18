const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const dts = require('rollup-plugin-dts').default;
const postcss = require('rollup-plugin-postcss');

const external = [
    'react',
    'react/jsx-runtime',
    'zustand',
    'zustand/middleware',
    'lucide-react',
    '@esengine/ecs-framework',
    '@esengine/editor-core',
    '@esengine/behavior-tree',
    'tsyringe',
    '@tauri-apps/api/core',
    '@tauri-apps/plugin-dialog'
];

module.exports = [
    {
        input: 'bin/index.js',
        output: {
            file: 'dist/index.esm.js',
            format: 'es',
            sourcemap: true,
            exports: 'named',
            inlineDynamicImports: true
        },
        plugins: [
            resolve({
                extensions: ['.js', '.jsx']
            }),
            postcss({
                inject: true,
                minimize: false
            }),
            commonjs()
        ],
        external,
        onwarn(warning, warn) {
            if (warning.code === 'CIRCULAR_DEPENDENCY' || warning.code === 'THIS_IS_UNDEFINED') {
                return;
            }
            warn(warning);
        }
    },

    // 类型定义构建
    {
        input: 'bin/index.d.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es'
        },
        plugins: [
            dts({
                respectExternal: true
            })
        ],
        external: [
            ...external,
            /\.css$/
        ]
    }
];
