const https = require('https');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const cfg = {headers: {'user-agent': 'Mozilla/5.0'}};
Promise.all([
	fetch('https://raw.githubusercontent.com/plopjs/plop/master/README.md', cfg).then(res => res.text()),
	fetch('https://api.github.com/repos/plopjs/plop/releases/latest', cfg).then(res => res.json())
])
.then(([docsTxt, releaseJson]) => {
	const docsFromGhReadme = docsTxt.replace(/^[\s\S]*?# Getting Started/, '');
	fs.writeFileSync('./content/documentation.md', [
		'---',
		'title: Learning to Plop',
		'layout: documentation.hbs',
		'---',
		'# Getting Started',
		`\`${releaseJson.tag_name}\` *- [${releaseJson.name}](${releaseJson.html_url})*`,
		docsFromGhReadme
	].join('\n'))
})
.catch(err => console.log('ERROR!', err));
