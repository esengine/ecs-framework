/**
 * ECS框架构建配置
 * 针对Laya、Cocos等游戏引擎优化
 */

const path = require('path');

module.exports = {
    // 输入配置
    input: {
        entry: './src/index.ts',
        tsconfig: './tsconfig.json'
    },
    
    // 输出配置
    output: {
        dir: './bin',
        formats: ['es', 'cjs', 'umd'], // ES模块、CommonJS、UMD
        filename: {
            es: 'ecs-framework.esm.js',
            cjs: 'ecs-framework.cjs.js',
            umd: 'ecs-framework.umd.js'
        },
        minify: true,
        sourcemap: true
    },
    
    // WebAssembly支持配置
    wasm: {
        enabled: false, // 暂时禁用，未来启用
        modules: {
            // 计划迁移到WebAssembly的模块
            core: {
                entry: './src/wasm/core.ts',
                output: 'ecs-core.wasm',
                features: ['query-system', 'math-utils']
            },
            physics: {
                entry: './src/wasm/physics.ts', 
                output: 'ecs-physics.wasm',
                features: ['collision-detection', 'spatial-hash']
            }
        },
        // AssemblyScript配置
        assemblyscript: {
            target: 'wasm32',
            optimize: true,
            runtime: 'minimal'
        }
    },
    
    // 游戏引擎特定配置
    engines: {
        laya: {
            // Laya引擎特定优化
            target: 'es5',
            polyfills: ['Promise', 'Object.assign'],
            globals: ['Laya'],
            wasm: {
                // Laya环境下的WebAssembly配置
                loader: 'laya-wasm-loader',
                fallback: true // 支持降级到JavaScript
            }
        },

        cocos: {
            // Cocos引擎特定优化
            target: 'es6',
            polyfills: [],
            globals: ['cc'],
            wasm: {
                // Cocos环境下的WebAssembly配置
                loader: 'cocos-wasm-loader',
                fallback: true
            }
        }
    },
    
    // 小游戏平台优化
    platforms: {
        wechat: {
            // 微信小游戏优化
            maxSize: '4MB',
            treeshaking: true,
            compression: 'gzip',
            wasm: {
                // 微信小游戏WebAssembly支持
                enabled: true,
                maxWasmSize: '2MB', // WebAssembly模块大小限制
                preload: ['ecs-core.wasm'] // 预加载核心模块
            }
        },
        alipay: {
            // 支付宝小游戏优化
            maxSize: '4MB',
            treeshaking: true,
            compression: 'gzip',
            wasm: {
                enabled: true,
                maxWasmSize: '2MB'
            }
        },
        bytedance: {
            // 字节跳动小游戏优化
            maxSize: '4MB',
            treeshaking: true,
            compression: 'gzip',
            wasm: {
                enabled: true,
                maxWasmSize: '2MB'
            }
        }
    },
    
    // 性能优化配置
    optimization: {
        // 启用Tree Shaking
        treeshaking: true,
        // 代码分割
        codeSplitting: false, // 小游戏通常不需要代码分割
        // 压缩配置
        minify: {
            removeComments: true,
            removeConsole: false, // 保留console用于调试
            removeDebugger: true
        },
        // 内联小文件
        inlineThreshold: 1024,
        // WebAssembly优化
        wasm: {
            // 启用WebAssembly优化
            optimize: true,
            // 内存配置
            memory: {
                initial: 1, // 初始内存页数 (64KB per page)
                maximum: 16, // 最大内存页数
                shared: false // 是否共享内存
            },
            // 导出配置
            exports: {
                memory: true,
                table: false
            }
        }
    },
    
    // 开发配置
    development: {
        sourcemap: true,
        hotReload: false, // 小游戏不支持热重载
        debugMode: true
    },
    
    // 生产配置
    production: {
        sourcemap: false,
        minify: true,
        optimization: true,
        bundleAnalyzer: true
    },
    
    // 实验性功能
    experimental: {
        // 混合架构支持
        hybrid: {
            enabled: true,
            // 自动检测WebAssembly支持
            autoDetect: true,
            // 性能基准测试
            benchmark: true,
            // 降级策略
            fallback: {
                strategy: 'graceful', // 优雅降级
                modules: ['core', 'physics'] // 支持降级的模块
            }
        }
    }
}; 