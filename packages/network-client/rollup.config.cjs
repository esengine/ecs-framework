const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const dts = require('rollup-plugin-dts').default;
const { readFileSync } = require('fs');

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner = `/**
 * @esengine/ecs-framework-network-client v${pkg.version}
 * ECS Framework 网络库 - 客户端实现
 * 
 * @author ${pkg.author}
 * @license ${pkg.license}
 */`;

const external = [
  'ws', 
  '@esengine/ecs-framework',
  '@esengine/ecs-framework-network-shared'
];

const commonPlugins = [
  resolve({
    browser: true,
    preferBuiltins: false
  }),
  commonjs({
    include: /node_modules/
  })
];

module.exports = [
  // ES模块构建
  {
    input: 'bin/index.js',
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      ...commonPlugins,
      terser({
        format: {
          comments: /^!/
        }
      })
    ],
    external,
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false
    }
  },
  
  // CommonJS构建
  {
    input: 'bin/index.js',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      ...commonPlugins,
      terser({
        format: {
          comments: /^!/
        }
      })
    ],
    external,
    treeshake: {
      moduleSideEffects: false
    }
  },

  // UMD构建
  {
    input: 'bin/index.js',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'ECSNetworkClient',
      banner,
      sourcemap: true,
      exports: 'named',
      globals: {
        'ws': 'WebSocket',
        'uuid': 'uuid',
        '@esengine/ecs-framework': 'ECS',
        '@esengine/ecs-framework-network-shared': 'ECSNetworkShared'
      }
    },
    plugins: [
      ...commonPlugins,
      terser({
        format: {
          comments: /^!/
        }
      })
    ],
    external,
    treeshake: {
      moduleSideEffects: false
    }
  },
  
  // 类型定义构建
  {
    input: 'bin/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
      banner: `/**
 * @esengine/ecs-framework-network-client v${pkg.version}
 * TypeScript definitions
 */`
    },
    plugins: [
      dts({
        respectExternal: true
      })
    ],
    external
  }
];