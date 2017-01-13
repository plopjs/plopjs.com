const https = require('https');
const fs = require('fs');
const path = require('path');

module.exports = function (config) {
	return function (files, metalsmith, done) {
		var meta = metalsmith.metadata();

		if (process.env.NODE_ENV !== 'production') {
			meta.contributors = require('./mock-contributors.json');
			console.log('MOCK contributors: ', meta.contributors.length);
			done(); return;
		}

		var requestConfig = {
			host: 'api.github.com',
			path: '/repos/amwmedia/plop/contributors',
			headers: {'user-agent': 'Mozilla/5.0'}
		};

		https.get(requestConfig, function(res) {
			var body = '';

			res.on('data', function (chunk) { body += chunk; });
			res.on('end', function () {
				meta.contributors = JSON.parse(body);
				meta.contributors.forEach(function (c) {
					var avatarFile = fs.createWriteStream(path.resolve(__dirname, '../content/images/avatars', c.login + '.jpg'));
					var request = https.get({
						host: 'avatars.githubusercontent.com',
						path: '/u/' + c.id + '?v=3',
						headers: {'user-agent': 'Mozilla/5.0'}
					}, function(response) { response.pipe(avatarFile); });
				});

				if (meta.contributors.length === 0) {
					console.log(body);
				} else {
					console.log('contributors: ', meta.contributors.length);
				}
				done();
			});
		}).on('error', function (err) {
			console.log(err);
			done();
		});
	};
};
