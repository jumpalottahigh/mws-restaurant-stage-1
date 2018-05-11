const gulp = require('gulp');
const babel = require('gulp-babel');
const deploy = require('gulp-gh-pages');
const browserSync = require('browser-sync');
const clean = require('gulp-clean');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const pump = require('pump');

// Prep HTML to build
gulp.task('html', function() {
  return gulp.src(['index.html', 'restaurant.html']).pipe(gulp.dest('build/'));
});

gulp.task('js', function() {
  return (
    gulp
      .src(['js/**/*.js'])
      // .pipe(
      //   babel({
      //     presets: ['env']
      //   })
      // )
      // .pipe(uglify())
      .pipe(gulp.dest('build/js/'))
      .pipe(
        browserSync.reload({
          stream: true
        })
      )
  );
});

// Prep CSS to build
gulp.task('css', function() {
  return gulp
    .src(['css/**/*'])
    .pipe(cleanCSS())
    .pipe(gulp.dest('build/css/'));
});

// Prep images to build
gulp.task('images', function() {
  return gulp.src(['img/**/*']).pipe(gulp.dest('build/img/'));
});

gulp.task('favicon', function() {
  return gulp.src(['./favicon.ico']).pipe(gulp.dest('build/'));
});

// PWA assets: SW
gulp.task('sw', function() {
  return gulp.src(['./sw.js']).pipe(gulp.dest('build/'));
});

// Manifest
gulp.task('manifest', function() {
  return gulp.src(['./manifest.webmanifest']).pipe(gulp.dest('build/'));
});

// Deploy to gh-pages
gulp.task('deploy', ['build'], function() {
  return gulp.src(['./build/**/*']).pipe(deploy());
});

// Clean build directory
gulp.task('clean', function() {
  return gulp.src('build', { read: false }).pipe(clean());
});

// Build
gulp.task('build', [
  // 'clean',
  'html',
  'js',
  'css',
  'images',
  'sw',
  'manifest',
  'favicon'
]);

// Serve
gulp.task('serve', ['build'], function() {
  browserSync.init({
    server: {
      baseDir: 'build/'
    },
    ui: {
      port: 5500
    },
    port: 5500
  });
});

gulp.task('dev', ['serve'], function() {
  gulp.watch('js/**/*.js', ['js']);
  gulp.watch('css/**/*.css', ['css']);
  gulp.watch(['index.html', 'restaurant.html'], ['html']);
});

// Explicitly specify default task
gulp.task('default', ['dev']);
