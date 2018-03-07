const gulp = require('gulp')
const deploy = require('gulp-gh-pages')

// Prep HTML to build
gulp.task('copyHTML', function() {
  return gulp
    .src([
      'index.html',
      'restaurant.html'
    ])
    .pipe(gulp.dest('build/'))
})

// Prep JS to build
gulp.task('copyJS', function() {
  return gulp
    .src([
      'js/**/*'
    ])
    .pipe(gulp.dest('build/js/'))
})

// Prep CSS to build
gulp.task('copyCSS', function() {
  return gulp
    .src([
      'css/**/*'
    ])
    .pipe(gulp.dest('build/css/'))
})

// Prep data to build
gulp.task('copyData', function() {
  return gulp
    .src([
      'data/**/*'
    ])
    .pipe(gulp.dest('build/data/'))
})

// Prep images to build
gulp.task('copyImg', function() {
  return gulp
    .src([
      'img/**/*'
    ])
    .pipe(gulp.dest('build/img/'))
})

gulp.task('deploy', ['copyHTML', 'copyJS', 'copyCSS', 'copyData', 'copyImg'], function() {
  return gulp.src(['./build/**/*']).pipe(deploy())
})

// Explicitly specify default task
gulp.task('default', ['copyHTML', 'copyJS', 'copyCSS', 'copyData', 'copyImg'])
