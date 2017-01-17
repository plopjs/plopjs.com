const https = require('https');
const fs = require('fs');
const path = require('path');
const repos = ['plop', 'node-plop'];

module.exports = function (config) {
	return function (files, metalsmith, done) {
		var meta = metalsmith.metadata();
		var contributorData = {};

		if (process.env.NODE_ENV !== 'production') {
			meta.contributors = require('./mock-contributors.json');
			console.log('MOCK contributors: ', meta.contributors.length);
			done(); return;
		}


		repos.forEach(function (repoName) {
			const requestConfig = {
				host: 'api.github.com',
				path: `/repos/amwmedia/${repoName}/contributors`,
				headers: {'user-agent': 'Mozilla/5.0'}
			};

			https.get(requestConfig, function(res) {
				var body = '';

				res.on('data', function (chunk) { body += chunk; });
				res.on('end', function () {
					contributorData[repoName] = JSON.parse(body);
					processWhenDone(contributorData);
				});
			}).on('error', function (err) {
				console.log('ERROR!', err);
				done();
			});
		});

		function processWhenDone(data) {
			var contributors;
			if (Object.keys(data).sort().join('|') !== repos.sort().join('|')) {
				return;
			}

			repos.forEach(function (repo) {
				if (contributors == null) {
					contributors = data[repo];
				} else {
					data[repo].forEach(function (contributor) {
						const existingC = contributors.find(c => c.login === contributor.login);
						if (existingC == null) {
							contributors.push(contributor);
						} else {
							existingC.contributions += contributor.contributions;
						}
					});
				}
			});

			contributors.sort(function (a, b) {
				const aVal = a.contributions;
				const bVal = b.contributions;
				if (bVal < aVal) { return -1; }
				if (aVal > bVal) { return 1; }
				return 0;
			});

			meta.contributors = contributors;

			// go update the avatar images
			const host = 'avatars.githubusercontent.com';
			const headers = {'user-agent': 'Mozilla/5.0'};
			var avatarCount = contributors.length;
			contributors.forEach(function (c) {
				var avatarFile = fs.createWriteStream(path.resolve(__dirname, '../content/images/avatars', c.login + '.jpg'));
				avatarFile.on('finish', () => (--avatarCount === 0 ? done() : null));
				var request = https.get(
					{host, headers, path:`/u/${c.id}?v=3`},
					response => response.pipe(avatarFile)
				);
			});
		}
	};
};
