var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var eslint = require('eslint');
var gulp = require('gulp');
var header = require('gulp-header');
var packageInfo = require('./package.json');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var stylelint = require('stylelint');
var uglify = require('gulp-uglify');
var pump = require('pump');

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
    '/*!\n' +
    ' * okayNav <%= package.version %>\n' +
    ' * @see <%= package.homepage %>\n' +
    ' * @author <%= package.author %>\n' +
    ' * @copyright ' + new Date().getFullYear() + '. <%= package.license %> licensed.\n' +
    ' */',
    '\n'
].join('');

gulp.task('build:css', function() {
    return gulp.src(`${folders.dev.css}/**/*.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer(autoPrefixOptions))
        .pipe(header(creditsBanner, { package: packageInfo }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(folders.dist.css));
});

gulp.task('build:js', function(done) {
    pump([
        gulp.src(`${folders.dev.js}/okayNav.js`),
        uglify({preserveComments: 'license'}),
        header(creditsBanner, { package: packageInfo }),
        gulp.dest(folders.dist.js)
    ], done);
});

gulp.task('build:html', function() {
    return gulp.src(`${folders.dev.base}/*.html`)
        .pipe(gulp.dest(folders.dist.base));
});

gulp.task('lint:css', function() {
    return gulp
        .src(`${folders.dev.css}/**/*.scss`)
        .pipe(stylelint({
            syntax: "scss",
            reporters: [{
                formatter: 'string',
                console: true
            }]
        }));
});

gulp.task('lint:js', function() {
    return function() {
        gulp.src(`${folders.dev.js}/**/*.js`)
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(gulp.dest(`${folders.dev.js}`));
    };
});

gulp.task('dev', ['build:js', 'build:css', 'build:html'], function() {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: [folders.dist.base],
            index: 'demo-unstyled.html'
        },
        ui: false
    });

    gulp.watch([
        `${folders.dev.base}/*.html`,
        `${folders.dev.css}/**/*`,
        `${folders.dev.js}/**/*`
    ]).on('change', browserSync.reload);

    gulp.watch(`${folders.dev.base}/*.html`, ['build:html']);
    gulp.watch(`${folders.dev.css}/**/*.scss`, ['build:css']);
    gulp.watch(`${folders.dev.js}/**/*.js`, ['build:js']);
});
