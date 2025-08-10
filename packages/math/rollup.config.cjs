const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const dts = require('rollup-plugin-dts').default;

const pkg = require('./package.json');

const input = 'bin/index.js';
const external = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.peerDependencies || {}));

module.exports = [
  // ES Module build
  {
    input,
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      terser()
    ]
  },
  // CommonJS build
  {
    input,
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      terser()
    ]
  },
  // TypeScript declarations
  {
    input: 'bin/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    plugins: [dts()]
  }
];