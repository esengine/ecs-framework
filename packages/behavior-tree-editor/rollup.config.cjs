const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const dts = require('rollup-plugin-dts').default;
const postcss = require('rollup-plugin-postcss');

const external = [
    '@esengine/editor-runtime',
    '@esengine/behavior-tree',
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
            replace({
                preventAssignment: true,
                'process.env.NODE_ENV': JSON.stringify('production')
            }),
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
            /\.css$/,
            // 排除 React 相关类型，避免 rollup-plugin-dts 解析问题
            'react',
            'react-dom',
            /^@types\//,
            /^@esengine\//
        ]
    }
];
