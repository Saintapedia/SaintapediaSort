'use strict';

module.exports = function ( grunt ) {
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-jsonlint' );

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
		}
	} );

	// CSS linting runs via the stylelint CLI (npm run lint:css); stylelint 17+
	// is pure ESM and cannot be loaded by grunt-stylelint's CJS require().
	grunt.registerTask( 'test', [ 'eslint', 'banana', 'jsonlint' ] );
	grunt.registerTask( 'default', 'test' );
};
