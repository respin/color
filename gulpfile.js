'use strict';
// generated on 2014-09-26 using generator-gulp-webapp 0.1.0

var path = {
    app: 'app',
    dist: 'dist'
};

var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var wiredep = require('wiredep').stream;
var handleErrors = require('./gulp/handleErrors');

// load plugins
var $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'del', 'uglify-save-license', 'main-bower-files'],
    camelize: true
});

// load options
var bumpType = $.util.env.type || 'patch';

gulp.task('styles', function() {
    $.util.log('Rebuilding application styles');

    return gulp.src(path.app + '/scss/*.scss')
    .pipe($.plumber())
    .pipe($.sass({
        includePaths: [path.app + '/bower_components'],
        sourcemap: true,
        errLogToConsole: true,
        onError: browserSync.notify
    }))
    .pipe($.autoprefixer(['last 5 versions', '> 1%', 'ie 8', 'ie 7'], {
        cascade: true
    }))
    .pipe(gulp.dest(path.app + '/styles'))
    .pipe($.size({
        showFiles: true
    }))
    .pipe($.filter('**/*.css'))
    .pipe(reload({
        stream: true
    }))
    .pipe($.notify('CSS compiled and autoprefixed'));
});

gulp.task('scripts', function() {
    return gulp.src(path.app + '/scripts/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter(require('jshint-stylish')))
    .pipe($.size())
    .on('error', $.util.log)
    .pipe($.notify('JS hinted'));
});

gulp.task('html', ['styles', 'scripts'], function() {
    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');
    var assets = $.useref.assets();

    return gulp.src(path.app + '/index.html')
    .pipe(assets)
        // .pipe($.rev())
        .pipe(jsFilter)
        // .pipe($.ngAnnotate())
        .pipe($.uglify({
            preserveComments: $.uglifySaveLicense
        }))
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        // .pipe($.replace('bower_components/bootstrap-sass-official/vendor/assets/fonts/bootstrap','fonts'))
        .pipe($.csso())
        .pipe($.combineMediaQueries())
        .pipe(cssFilter.restore())
        .pipe(assets.restore())
        .pipe($.useref())
        // .pipe($.revReplace())
        .pipe(gulp.dest(path.dist))
        .pipe($.size())
        .pipe($.notify('CSS and JS concatted and minified'));
    });

gulp.task('images', function() {
    return gulp.src(path.app + '/images/**/*')
    .pipe($.cache($.imagemin({
        optimizationLevel: 3,
        progressive: true,
        interlaced: true
    })))
    .pipe(gulp.dest(path.dist + '/images'))
    .pipe($.size())
    .pipe($.notify('Images minified'));
});

gulp.task('fonts', function() {
    return gulp.src($.mainBowerFiles())
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest(path.dist + '/fonts'))
    .pipe($.size());
});

gulp.task('serve', function() {
    browserSync({
        server: {
            baseDir: path.app
        }
    });
});

gulp.task('watch', ['styles', 'serve'], function() {

    // watch for changes to reload
    gulp.watch([
        path.app + '/*.html',
        path.app + '/scripts/**/*.js',
        path.app + '/images/**/*'
        ], {}, reload);

    // watch to run tasks
    gulp.watch(path.app + '/scss/**/*.scss', ['styles']);
});

gulp.task('build', ['html', 'images', 'fonts']);

gulp.task('bower', function() {
    gulp.src(path.app + '/index.html')
    .pipe(wiredep({
        exclude: [
        'bower_components/bootstrap-sass/dist/js/bootstrap.js',
        'bower_components/bootstrap-sass/dist/css/bootstrap.css'
        ]
    }))
    .pipe(gulp.dest(path.app));
});

// Update bower, component, npm at once:
gulp.task('bump', function() {
    gulp.src(['./bower.json', './package.json'])
    .pipe($.bump({
        type: bumpType
    }))
    .pipe(gulp.dest('./'));
});
