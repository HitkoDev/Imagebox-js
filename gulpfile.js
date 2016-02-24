var gulp = require('gulp');
var compass = require('gulp-compass');
var typescript = require('gulp-typescript');
var path = require('path');
var merge = require('merge2');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var cssBase64 = require('gulp-css-base64');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var fontcustom = require('gulp-fontcustom');
var urlAdjuster = require('gulp-css-url-adjuster');
var concat = require('gulp-concat');
var replace = require('gulp-replace');

gulp.task('default', [
    'compress'
], function () {

});

gulp.task('images', function () {
    gulp.src('./src/images/**/*')
        .pipe(imagemin({
            progressive: true,
            optimizationLevel: 7,
            multipass: true
        }))
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('style', [
    'images'
], function () {
    gulp.src('./src/sass/*.scss')
        .pipe(compass({
            css: 'src/css',
            sass: 'src/sass'
        }))
        .pipe(cssBase64({
            baseDir: "./dist"
        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('style:watch', function () {
    gulp.watch('./src/sass/**/*.scss', ['style']);
});

gulp.task('scripts', function () {
    var tsResult = gulp.src('./src/js/**.ts')
        .pipe(typescript({
            declaration: true,
            noExternalResolve: true,
            target: 'ES5',
            sourcemap: true
        }));

    return merge([
        tsResult.dts.pipe(gulp.dest('./dist/definitions')),
        tsResult.js.pipe(gulp.dest('./dist'))
    ]);
});

gulp.task('compress', [
    'scripts',
    'style'
], function () {
    gulp.src(['./dist/imagebox.js'])
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('./dist'));

    gulp.src(['./dist/imagebox.css'])
        .pipe(cssnano())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('icons', function () {
    gulp.src(['./src/icons/*.svg'])
        .pipe(fontcustom({
            font_name: 'Imagebox',
            'css-selector': '.ib-icon-{{glyph}}',
            templates: ['_icons.scss'],
            preprocessor_path: '/font'
        }))
        .pipe(gulp.dest('./dist/font'));
        
    gulp.src('./dist/font/*.scss')
        .pipe(replace('-{{glyph}}', ', [class^="ib-icon-"], [class*=" ib-icon-"]'))
        .pipe(concat('_icons.scss'))
        .pipe(gulp.dest('./src/sass/imagebox'));
});