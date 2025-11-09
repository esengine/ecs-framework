const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const dts = require('rollup-plugin-dts').default;

const external = [
    'react',
    'react/jsx-runtime',
    'zustand',
    'zustand/middleware',
    'lucide-react',
    '@esengine/ecs-framework',
    '@esengine/editor-core',
    '@esengine/behavior-tree',
    'tsyringe'
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
            commonjs()
        ],
        external,
        onwarn(warning, warn) {
            if (warning.code === 'CIRCULAR_DEPENDENCY') {
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
        external
    }
];
