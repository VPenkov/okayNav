var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var del = require('del');
var cssnano = require('gulp-cssnano');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('less', function() {
  return gulp.src(['app/less/okayNav-base.less', 'app/less/okayNav-theme.less']) // Get source files with gulp.src
    .pipe(less())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }))
});

gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: 'app'
    },
  })
});

gulp.task('useref', ['less'], function(){
  return gulp.src('app/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify({
        preserveComments: 'license'
    })))
    .pipe(gulpIf('*.css', cssnano({autoprefixer: false})))
    .pipe(gulp.dest('dist'))
});

gulp.task('clean:dist', function() {
  return del.sync('dist');
});

gulp.task('watch', ['browserSync', 'less'], function(){
  gulp.watch('app/less/**/*.less', ['less', browserSync.reload]);
  gulp.watch('app/js/**/*.js', browserSync.reload);
  gulp.watch('app/*.html', browserSync.reload);
});

gulp.task('build', ['clean:dist'], function (){
  gulp.start('useref');
  console.log('Building files');
});

// Default task
gulp.task('default', function() {
  gulp.start('build');
});
