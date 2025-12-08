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

const modernPlugins = [
  resolve({
    browser: true,
    preferBuiltins: false
  }),
  commonjs({
    include: /node_modules/
  })
];

const legacyPlugins = [
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
      ...modernPlugins,
      terser({
        format: {
          comments: /^!/
        }
      })
    ],
    external,
    onwarn(warning, warn) {
      // 忽略 msgpack-lite 的循环依赖警告
      if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids && warning.ids.some(id => id.includes('msgpack-lite'))) {
        return;
      }
      warn(warning);
    },
    treeshake: {
      moduleSideEffects: (id) => id.includes('reflect-metadata'),
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
      ...modernPlugins,
      terser({
        format: {
          comments: /^!/
        }
      })
    ],
    external,
    onwarn(warning, warn) {
      if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids && warning.ids.some(id => id.includes('msgpack-lite'))) {
        return;
      }
      warn(warning);
    },
    treeshake: {
      moduleSideEffects: (id) => id.includes('reflect-metadata')
    }
  },

  // UMD构建
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
      ...legacyPlugins,
      terser({
        format: {
          comments: /^!/
        }
      })
    ],
    external: [],
    onwarn(warning, warn) {
      if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids && warning.ids.some(id => id.includes('msgpack-lite'))) {
        return;
      }
      warn(warning);
    },
    treeshake: {
      moduleSideEffects: (id) => id.includes('reflect-metadata')
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
    onwarn(warning, warn) {
      if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids && warning.ids.some(id => id.includes('msgpack-lite'))) {
        return;
      }
      warn(warning);
    },
    treeshake: {
      moduleSideEffects: (id) => id.includes('reflect-metadata')
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