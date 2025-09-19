module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.svg'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/,
		/^http:\/\/localhost:5173\//
	]
};