'use strict';
const gulp = require('gulp');
const { series, parallel } = require('gulp');
const terser = require('gulp-terser');
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
    .pipe(terser())
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