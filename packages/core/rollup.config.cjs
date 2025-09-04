const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const babel = require('@rollup/plugin-babel');
const dts = require('rollup-plugin-dts').default;
const { readFileSync } = require('fs');

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner = `/**
 * @esengine/ecs-framework v${pkg.version}
 * 高性能ECS框架 - 适用于Cocos Creator和Laya等JavaScript游戏引擎
 * 
 * @author ${pkg.author}
 * @license ${pkg.license}
 */`;

const external = [];

const commonPlugins = [
  resolve({
    browser: true,
    preferBuiltins: false
  }),
  commonjs({
    include: /node_modules/
  }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    extensions: ['.js', '.ts']
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

  // UMD构建 - 用于CDN和浏览器直接使用
  {
    input: 'bin/index.js',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'ECS',
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
    external: [],
    treeshake: {
      moduleSideEffects: false
    }
  },

  // ES5兼容构建 - 适用于只支持ES5语法的JavaScript环境
  {
    input: 'bin/index.js',
    output: {
      file: 'dist/index.es5.js',
      format: 'cjs',
      banner: banner + '\n// ES5 Compatible Build for legacy JavaScript environments',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs({
        include: /node_modules/
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts'],
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['ie >= 9', 'chrome >= 30', 'firefox >= 30', 'safari >= 8']
            },
            modules: false,
            loose: true,
            forceAllTransforms: true
          }]
        ],
        plugins: [
          '@babel/plugin-transform-optional-chaining',
          '@babel/plugin-transform-nullish-coalescing-operator'
        ]
      }),
      terser({
        ecma: 5,
        format: {
          comments: /^!/
        },
        compress: {
          drop_console: false,
          drop_debugger: false
        }
      })
    ],
    external: [],
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
 * @esengine/ecs-framework v${pkg.version}
 * TypeScript definitions
 */`
    },
    plugins: [
      dts({
        respectExternal: true
      })
    ],
    external: []
  }
]; 