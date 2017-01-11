const markdown = require('metalsmith-markdown');
const registerHelpers = require('metalsmith-register-helpers');
const permalinks = require('metalsmith-permalinks');
const layouts = require('metalsmith-layouts');
const browserify = require('metalsmith-browserify-alt');
const stylus = require('metalsmith-stylus');
const browserSync = require('metalsmith-browser-sync');
const collections = require('metalsmith-collections');
const nib = require('nib');

const metalsmith = require('metalsmith');

metalsmith(__dirname)
	.source('./content')
	.destination('./build')
	.clean(true)
	.use((files, metalsmith, done) => {
		setImmediate(done);
		metalsmith.metadata({
			name: 'PLOP',
			title: 'Consistency made simple.'
		});
	})
	// .use(collections({
	// 	docsBasic: {
	// 		pattern: 'documentation/*.md',
	// 		sortBy: 'sort'
	// 	}
	// }))
	.use(markdown())
	.use(permalinks({ relative: false }))
	.use(registerHelpers())
	.use(layouts({
		engine: 'handlebars',
		partials: 'partials'
	}))
	.use(stylus({
		compress: true,
		sourcemap: true,
		paths: ['./styles'],
		use: [nib()]
	}))
	.use(browserify({
		defaults: {
			cache: {},
			packageCache: {},
			transform: ['uglifyify'],
			plugin: process.env.NODE_ENV === 'development' ? ['watchify'] : [],
			debug: process.env.NODE_ENV === 'development'
		}
		// dest: 'js/main.js',
		// args: [ 'scripts/index.js' ]
	}))
	.use(browserSync({
		ui: false,
		files: [
			'content/**',
			'styles/**',
			'scripts/**',
			'layouts/**',
			'partials/**',
			'helpers/**'
		],
		server: 'build',
		port: 5000,
		ghostMode: false,
		open: false
	}))
	.build(function(err) {
		if (err) throw err;
	});
