// Import modules
	var bump = require('gulp-bump');

// Bump module
	module.exports = function(gulp, bumpType){
		gulp.task('bump', function(){
			return gulp.src('./bower.json')
				.pipe(bump({type:bumpType}))
				.pipe(gulp.dest('./'));
		});
	};