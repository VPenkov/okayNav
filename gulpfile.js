var Autoprefixer = require('gulp-autoprefixer');
var BrowserSync = require('browser-sync');
var Eslint = require('eslint');
var Gulp = require('gulp');
var Header = require('gulp-header');
var PackageInfo = require('./package.json');
var Sass = require('gulp-sass');
var Sourcemaps = require('gulp-sourcemaps');
var Stylelint = require('stylelint');
var Useref = require('gulp-useref');

var autoPrefixOptions = {
    browsers: [
        '> 1%',
        'last 2 versions',
        'Firefox ESR'
    ]
};

var folders = {
    dev: {
        base: './app',
        css: './app/scss',
        js: './app/js'
    },
    dist: {
        base: './dist',
        css: './dist/css',
        js: './dist/js'
    }
};

var creditsBanner = [
    '/**!\n' +
    ' * okayNav <%= package.version %>\n' +
    ' * @see <%= package.homepage %>\n' +
    ' * @author <%= package.author %>\n' +
    ' * @copyright ' + new Date().getFullYear() + '. <%= package.license %> licensed.\n' +
    ' */',
    '\n'
].join('');

Gulp.task('build:css', function() {
    return Gulp.src(`${folders.dev.css}/**/*.scss`)
        .pipe(Sourcemaps.init())
        .pipe(Sass().on('error', Sass.logError))
        .pipe(Autoprefixer(autoPrefixOptions))
        .pipe(Header(creditsBanner, { package: PackageInfo }))
        .pipe(Sourcemaps.write())
        .pipe(Gulp.dest(folders.dist.css));
});

Gulp.task('build:js', function() {
    return Gulp.src(`${folders.dev.js}/okayNav.js`)
        .pipe(Useref())
        .pipe(Gulp.dest(folders.dist.js));
});

Gulp.task('build:html', function() {
    return Gulp.src(`${folders.dev.base}/*.html`)
        .pipe(Gulp.dest(folders.dist.base));
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
            .pipe(Eslint())
            .pipe(Eslint.format())
            .pipe(Gulp.dest(`${folders.dev.js}`));
    };
});

Gulp.task('dev', ['build:js', 'build:css', 'build:html'], function() {
    BrowserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: [folders.dist.base],
            index: 'demo-unstyled.html'
        },
        ui: false
    });

    Gulp.watch([
        `${folders.dev.base}/*.html`,
        `${folders.dev.css}/**/*`,
        `${folders.dev.js}/**/*`
    ]).on('change', BrowserSync.reload);

    Gulp.watch(`${folders.dev.base}/*.html`, ['build:html']);
    Gulp.watch(`${folders.dev.css}/**/*.scss`, ['build:css']);
    Gulp.watch(`${folders.dev.js}/**/*.js`, ['build:js']);
});
