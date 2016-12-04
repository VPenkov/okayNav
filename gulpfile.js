'use strict';

var Autoprefixer = require('gulp-autoprefixer');
var Browserify = require('browserify');
var BrowserSync = require('browser-sync');
var buffer = require('buffer');
var Eslint = require('eslint');
var Gulp = require('gulp');
var Plumber = require('plumber');
var Sass = require('gulp-sass');
var Sourcemaps = require('gulp-sourcemaps');
var Stylelint = require('stylelint');

var reload = BrowserSync.reload;
var autoPrefixOptions = {
    browsers: [
        '> 1%',
        'last 2 versions',
        'Firefox ESR'
    ]
};

var cssNanoSettings = {
    safe: true,
    autoprefixer: false // done before minification
};

var folders = {
    dev: {
        base: 'app',
        css: 'app/scss',
        js: 'app/js'
    },
    dist: {
        base: 'dist',
        css: 'dist/css',
        js: 'dist/js'
    }
};

Gulp.task('build:css', function() {
    return Gulp
        .src(`${folders.dev.css}/**/*.scss`)
        .pipe(Plumber())
        .pipe(Sourcemaps.init())
        .pipe(Sass().on('error', Sass.logError))
        .pipe(Autoprefixer(autoPrefixOptions))
        .pipe(Sourcemaps.write())
        .pipe(Gulp.dest(`${folders.dist.css}//**/*.scss`))
        .pipe(reload({stream: true}));
});

Gulp.task('build:js', function() {
    var APP_SOURCE = 'okayNav.js';

    var okayNav = Browserify({
        entries: `${folders.dev.js}/${APP_SOURCE}`
    });

    return function() {
        okayNav.bundle()
            .pipe(source(APP_SOURCE))
            .pipe(Plumber())
            .pipe(buffer())
            .pipe(Sourcemaps.init({loadMaps: true}))
            .pipe(Sourcemaps.write('.'))
            .pipe(Gulp.dest(`${folders.dist.js}`))
            .pipe(reload({stream: true}));
    };
});

Gulp.task('lint:css', function() {
    return Gulp
        .src(`${folders.dev.css}/**/*.scss`)
        .pipe(Stylelint({
            syntax: "scss",
            reporters: [{
                formatter: 'string',
                console: true
            }]
        }));
});

Gulp.task('lint:js', function() {
    return function() {
        Gulp.src(`${folders.dev.js}/**/*.js`)
            .pipe(reload({stream: true, once: true}))
            .pipe(Eslint())
            .pipe(Eslint.format())
            .pipe(Gulp.dest(`${folders.dev.js}`));
    };
});
