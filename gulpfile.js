const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync');
const eslint = require('gulp-eslint');
const gulp = require('gulp');
const header = require('gulp-header');
const mocha = require('gulp-mocha');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const stylelint = require('stylelint');
const uglify = require('gulp-uglify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');

const packageInfo = require('./package.json');

const autoPrefixOptions = {
    browsers: [
        '> 1%',
        'last 2 versions',
        'Firefox ESR'
    ]
};

const folders = {
    test: {
        base: './test'
    },
    dev: {
        base: './app',
        css: './app/scss',
        js: './app/js',
    },
    dist: {
        base: './dist',
        css: './dist/css',
        js: './dist/js'
    }
};

const creditsBanner = [
    '/*!\n' +
    ' * okayNav <%= package.version %>\n' +
    ' * @see <%= package.homepage %>\n' +
    ' * @author <%= package.author %>\n' +
    ' * @copyright ' + new Date().getFullYear() + '. <%= package.license %> licensed.\n' +
    ' */',
    '\n'
].join('');

gulp.task('build:css', () => {
    return gulp.src(`${folders.dev.css}/**/*.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer(autoPrefixOptions))
        .pipe(header(creditsBanner, { package: packageInfo }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(folders.dist.css));
});

gulp.task('build:js', () => {
    browserify(`${folders.dev.js}/okayNav.js`)
        .transform('babelify', {
            presets: ['es2015']
        })
        .bundle()
        .pipe(source('okayNav.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(header(creditsBanner, { package: packageInfo }))
        .pipe(gulp.dest(folders.dist.js));
});

gulp.task('build:html', () => {
    return gulp.src(`${folders.dev.base}/*.html`)
        .pipe(gulp.dest(folders.dist.base));
});

gulp.task('lint:css', () => {
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

gulp.task('lint:js', () => {
    return gulp.src(`${folders.dev.js}/**/*.js`)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', () => {
    function handleError(err) {
        console.log(err.toString());
        this.emit('end');
    }

    return gulp
        .src([`${folders.test.base}/**/*.js`], {read: false})
        .pipe(mocha({reporter: 'spec'}))
        .on('error', handleError);
});

gulp.task('dev', ['build:js', 'build:css', 'build:html'], () => {
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
