'use strict';
const gulp = require("gulp");
const minify = require('gulp-minify');
const inject = require("gulp-inject-string");
const ts = require('gulp-typescript');
const merge = require('merge2');
const tsProject = ts.createProject('tsconfig.json');

gulp.task('buildJs', () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(inject.replace('var es;', ''))
        .pipe(inject.prepend('window.es = {};\n'))
        .pipe(inject.replace('var __extends =', 'window.__extends ='))
        .pipe(minify({ ext: { min: ".min.js" } }))
        .pipe(gulp.dest('./bin'));
});

gulp.task("buildDts", ["buildJs"], () => {
    return tsProject.src()
        .pipe(tsProject())
        // .dts.pipe(inject.append('import e = framework;'))
        .pipe(gulp.dest('./bin'));
});

gulp.task("copy", ["buildDts"], () => {
    return gulp.src('bin/**/*');
});

gulp.task('build', ['copy'], () => {
    return merge([
        gulp.src('bin/*.js'),
        gulp.src('bin/*.ts'),
        gulp.src('bin/framework.d.ts')
    ])
});