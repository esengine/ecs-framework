'use strict';
const gulp = require('gulp');
const { series, parallel } = require('gulp');
const minify = require('gulp-minify');
const inject = require('gulp-inject-string');
const ts = require('gulp-typescript');
const merge = require('merge2');
const tsProject = ts.createProject('tsconfig.json');

function buildJs() {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(inject.replace('var es;', ''))
    .pipe(inject.prepend('window.es = {};\n'))
    .pipe(inject.replace('var __extends =', 'window.__extends ='))
    .pipe(minify({ ext: { min: ".min.js" } }))
    .pipe(gulp.dest('./bin'));
}

function buildDts() {
  return tsProject.src()
    .pipe(tsProject())
    // .dts.pipe(inject.append('import e = framework;'))
    .pipe(gulp.dest('./bin'));
}

exports.buildJs = buildJs;
exports.buildDts = buildDts;
exports.build = series(buildJs, buildDts);