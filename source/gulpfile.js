'use strict';
const gulp = require('gulp');
const { series, parallel } = require('gulp');
const terser = require('gulp-terser');
const inject = require('gulp-inject-string');
const ts = require('gulp-typescript');
const merge = require('merge2');
const typescript = require('gulp-typescript');
const concat = require('gulp-concat');
const replace = require('gulp-string-replace');

// TypeScript项目配置
const tsProject = ts.createProject('tsconfig.json', {
    module: 'es2020',
    target: 'es2018'
});

function buildJs() {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(inject.replace('var es;', ''))
    .pipe(inject.prepend('window.es = {};\n'))
    .pipe(inject.replace('var __extends =', 'window.__extends ='))
    .pipe(terser())
    .pipe(gulp.dest('./bin'));
}

function buildDts() {
  return tsProject.src()
    .pipe(tsProject())
    // .dts.pipe(inject.append('import e = framework;'))
    .pipe(gulp.dest('./bin'));
}

// 构建ES模块版本
gulp.task('build-esm', function() {
    return gulp.src(['src/**/*.ts'])
        .pipe(tsProject())
        .pipe(concat('ecs-framework.esm.js'))
        .pipe(inject.prepend('// ECS Framework - ES Module Version\n'))
        .pipe(gulp.dest('bin/'));
});

// 构建UMD版本（兼容各种游戏引擎）
gulp.task('build-umd', function() {
    const umdProject = ts.createProject('tsconfig.json', {
        module: 'umd',
        target: 'es5'
    });
    
    return gulp.src(['src/**/*.ts'])
        .pipe(umdProject())
        .pipe(concat('ecs-framework.umd.js'))
        .pipe(inject.prepend(`// ECS Framework - UMD Version
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.ECS = {}));
}(this, (function (exports) { 'use strict';
`))
        .pipe(inject.append('\n})));'))
        .pipe(gulp.dest('bin/'));
});

// 构建Laya引擎专用版本
gulp.task('build-laya', function() {
    const layaProject = ts.createProject('tsconfig.json', {
        module: 'none',
        target: 'es5'
    });
    
    return gulp.src(['src/**/*.ts'])
        .pipe(layaProject())
        .pipe(concat('ecs-framework.laya.js'))
        .pipe(replace(/export\s+/g, ''))
        .pipe(inject.prepend(`// ECS Framework - Laya Engine Version
var ECS = ECS || {};
(function(ECS) {
`))
        .pipe(inject.append('\n})(ECS);'))
        .pipe(gulp.dest('bin/'));
});



// 构建Cocos引擎专用版本
gulp.task('build-cocos', function() {
    const cocosProject = ts.createProject('tsconfig.json', {
        module: 'es2020',
        target: 'es2018'
    });
    
    return gulp.src(['src/**/*.ts'])
        .pipe(cocosProject())
        .pipe(concat('ecs-framework.cocos.js'))
        .pipe(inject.prepend('// ECS Framework - Cocos Engine Version\n'))
        .pipe(gulp.dest('bin/'));
});

// 压缩所有构建文件
gulp.task('minify', function() {
    return gulp.src(['bin/*.js', '!bin/*.min.js'])
        .pipe(terser({
            compress: {
                drop_console: false, // 保留console用于调试
                drop_debugger: true,
                pure_funcs: ['console.log'] // 可选择性移除console.log
            },
            mangle: {
                keep_fnames: true // 保留函数名用于调试
            },
            format: {
                comments: false
            }
        }))
        .pipe(concat(function(file) {
            return file.basename.replace('.js', '.min.js');
        }))
        .pipe(gulp.dest('bin/'));
});

// 生成类型定义文件
gulp.task('build-types', function() {
    const dtsProject = ts.createProject('tsconfig.json', {
        declaration: true,
        emitDeclarationOnly: true
    });
    
    return gulp.src(['src/**/*.ts'])
        .pipe(dtsProject())
        .pipe(concat('ecs-framework.d.ts'))
        .pipe(gulp.dest('bin/'));
});

// 清理构建目录
gulp.task('clean', function() {
    const del = require('del');
    return del(['bin/**/*']);
});

// 开发构建（快速，包含源码映射）
gulp.task('build-dev', gulp.series('clean', 'build-esm', 'build-types'));

// 生产构建（完整，包含所有版本和压缩）
gulp.task('build', gulp.series(
    'clean',
    gulp.parallel('build-esm', 'build-umd', 'build-laya', 'build-cocos'),
    'build-types',
    'minify'
));

// 监听文件变化
gulp.task('watch', function() {
    gulp.watch('src/**/*.ts', gulp.series('build-dev'));
});

// 默认任务
gulp.task('default', gulp.series('build'));

exports.buildJs = buildJs;
exports.buildDts = buildDts;
exports.build = series(buildJs, buildDts);