const handlebars = require('handlebars');

module.exports = collection => `
	<ul>
	${collection.map(page => `
		<li><a href="/${page.path}">${page.title}</a></li>
	`).join('')}
	</ul>
`;
