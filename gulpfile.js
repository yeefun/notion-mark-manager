const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const autoprefixer = require('autoprefixer');
const gulpSequence = require('gulp-sequence');

const parseArgs = require('minimist');
const envOptions = {
  string: 'env',
  default: {
    env: 'dev',
  },
}
const options = parseArgs(process.argv.slice(2), envOptions);



gulp.task('clean', () => {
  return gulp.src('./dist', { read: false })
    .pipe($.clean());
});



gulp.task('pug', () => {
  return gulp.src('./src/**/*.pug')
    .pipe($.plumber())
    .pipe($.pug({
      // pretty: true
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('sass', () => {
  const plugins = [
    autoprefixer({
      browsers: ['last 1 version', 'not dead', '> 0.2%']
    })
  ];
  return gulp.src('./src/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    // CSS 編譯完成
    .pipe($.postcss(plugins))
    .pipe($.if(options.env === 'prod', $.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css'));
});



gulp.task('babel', () => {
  return gulp.src('./src/js/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.if(options.env === 'prod', $.uglify({
      compress: {
        drop_console: true,
      },
    })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'));
});



// 監聽檔案變動
gulp.task('watch', () => {
  gulp.watch('./src/**/*.pug', ['pug']);
  gulp.watch('./src/scss/**/*.scss', ['sass']);
  gulp.watch('./src/js/**/*.js', ['babel']);
});


// 開發流程
gulp.task('default', ['pug', 'sass', 'babel', 'watch']);

// 發布流程
gulp.task('build', gulpSequence('clean', 'pug', 'sass', 'babel'));