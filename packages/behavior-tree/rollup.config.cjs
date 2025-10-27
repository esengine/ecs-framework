const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const babel = require('@rollup/plugin-babel');
const dts = require('rollup-plugin-dts').default;
const { readFileSync } = require('fs');

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner = `/**
 * @esengine/behavior-tree v${pkg.version}
 * 完全ECS化的行为树系统
 *
 * @author ${pkg.author}
 * @license ${pkg.license}
 */`;

const external = ['@esengine/ecs-framework'];

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

  // UMD构建
  {
    input: 'bin/index.js',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'BehaviorTree',
      banner,
      sourcemap: true,
      exports: 'named',
      globals: {
        '@esengine/ecs-framework': 'ECS'
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

  // ES5兼容构建
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
 * @esengine/behavior-tree v${pkg.version}
 * TypeScript definitions
 */`
    },
    plugins: [
      dts({
        respectExternal: true
      })
    ],
    external: ['@esengine/ecs-framework']
  }
];
