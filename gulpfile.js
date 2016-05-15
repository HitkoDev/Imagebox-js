var gulp = require('gulp');
var typescript = require('gulp-typescript');
var merge = require('merge2');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var cssBase64 = require('gulp-css-base64');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var fontcustom = require('gulp-fontcustom');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var bourbon = require('bourbon');
var sass = require('gulp-sass');

gulp.task('default', [
    'compress'
], function() {

});

gulp.task('images', function() {
    return gulp.src('./src/images/**/*')
        .pipe(imagemin({
            progressive: true,
            optimizationLevel: 7,
            multipass: true
        }))
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('style', [
    'images'
], function() {
    return gulp.src('./src/sass/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: [
                bourbon.includePaths
            ],
            outputStyle: 'expanded'
        }))
        .pipe(cssBase64({
            baseDir: "./dist"
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('scripts', function() {
    var tsResult = gulp.src('./src/js/**.ts')
        .pipe(sourcemaps.init())
        .pipe(typescript({
            declaration: true,
            noExternalResolve: true,
            target: 'ES5'
        }));

    return merge([
        tsResult.dts.pipe(gulp.dest('./dist/definitions')),
        tsResult.js
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('./dist'))
    ]);
});

gulp.task('compress', [
    'scripts',
    'style'
], function() {
    return merge([

        gulp.src(['./dist/imagebox.js'])
            .pipe(uglify())
            .pipe(rename({
                suffix: '.min'
            }))
            .pipe(gulp.dest('./dist')),

        gulp.src(['./dist/imagebox.css'])
            .pipe(cssnano())
            .pipe(rename({
                suffix: '.min'
            }))
            .pipe(gulp.dest('./dist'))

    ]);
});

gulp.task('icons', function() {
    return merge([
        
        gulp.src(['./src/icons/*.svg'])
            .pipe(fontcustom({
                font_name: 'Imagebox',
                'css-selector': '.ib-icon-{{glyph}}',
                templates: ['_icons.scss'],
                preprocessor_path: '/font'
            }))
            .pipe(gulp.dest('./dist/font')),

        gulp.src('./dist/font/*.scss')
            .pipe(replace('-{{glyph}}', ', [class^="ib-icon-"], [class*=" ib-icon-"]'))
            .pipe(concat('_icons.scss'))
            .pipe(gulp.dest('./src/sass/imagebox'))
    ]);
});