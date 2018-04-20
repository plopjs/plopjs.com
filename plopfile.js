module.exports = function (plop) {

	// plop-new-component-slot
	plop.setGenerator('component', {
		description: 'New UI Component',
		prompts: [{
			type: 'input',
			name: 'name',
			message: 'component name'
		}],
		actions: [{
			type: 'addMany',
			templateFiles: ['plop-templates/cmpt/*'],
			base: 'plop-templates/cmpt',
			destination: 'scripts/cmpt/{{dashCase name}}'
		}, {
			type: 'append',
			path: 'scripts/cmpt.js',
			pattern: 'var cmpt = {',
			unique: true,
			separator: '\n',
			template: '\t\'{{dashCase name}}\': require(\'./cmpt/{{dashCase name}}/{{dashCase name}}\'),'
		}]
	});

};
