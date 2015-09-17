// Import modules
    var concat = require('gulp-concat');
    var babel = require('gulp-babel');

// Import config
	var config = require('./_config');

// Html module
	module.exports = function(gulp) {
		gulp.task('example', function(){
	        return gulp.src(config.scripts)
	        	.pipe(babel())
	            .pipe(concat('at.concat.js'))
	            .pipe(gulp.dest('example/js'));
        });
		gulp.task('scripts', function(){
	        return gulp.src(config.scripts)
	        	.pipe(babel())
	            .pipe(concat('at.js'))
	            .pipe(gulp.dest('./'));
        });
    };