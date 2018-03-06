var gulp = require('gulp');
// var copy = require('gulp-contrib-copy');

var ghPages = require('gulp-gh-pages');

gulp.task('deploy', function() {
  return gulp.src('./build/**/*').pipe(ghPages());
});

// gulp.task('default', copy);
