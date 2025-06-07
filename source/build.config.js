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
    
    // 游戏引擎特定配置
    engines: {
        laya: {
            // Laya引擎特定优化
            target: 'es5',
            polyfills: ['Promise', 'Object.assign'],
            globals: ['Laya']
        },

        cocos: {
            // Cocos引擎特定优化
            target: 'es6',
            polyfills: [],
            globals: ['cc']
        }
    },
    
    // 小游戏平台优化
    platforms: {
        wechat: {
            // 微信小游戏优化
            maxSize: '4MB',
            treeshaking: true,
            compression: 'gzip'
        },
        alipay: {
            // 支付宝小游戏优化
            maxSize: '4MB',
            treeshaking: true,
            compression: 'gzip'
        },
        bytedance: {
            // 字节跳动小游戏优化
            maxSize: '4MB',
            treeshaking: true,
            compression: 'gzip'
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
        inlineThreshold: 1024
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
    }
}; 