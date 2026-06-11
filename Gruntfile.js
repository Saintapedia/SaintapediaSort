'use strict';

module.exports = function ( grunt ) {
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-jsonlint' );
	grunt.loadNpmTasks( 'grunt-stylelint' );

	grunt.initConfig( {
		banana: {
			all: 'i18n/'
		},
		eslint: {
			options: { cache: true },
			all: [ 'modules/**/*.js', 'Gruntfile.js' ]
		},
		jsonlint: {
			all: [
				'*.json',
				'i18n/*.json',
				'!node_modules/**'
			]
		},
		stylelint: {
			all: [ 'modules/**/*.css' ]
		}
	} );

	grunt.registerTask( 'test', [ 'eslint', 'stylelint', 'banana', 'jsonlint' ] );
	grunt.registerTask( 'default', 'test' );
};
