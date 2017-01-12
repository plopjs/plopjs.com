var str = require('./required/_string-helper');

/////
// All Components
//
var cmpt = {
	'typing': require('./cmpt/typing/typing'),
	'enhanced-md': require('./cmpt/enhanced-md/enhanced-md')
};

module.exports = function () {
	Object.keys(cmpt).forEach(function (moduleName) {
		var m = cmpt[moduleName];
		var className = 'cmpt-' + moduleName;
		var elems = document.querySelectorAll('[' + className + ']');
		var i, j, elem, attr, attrs, classArr;

		i = elems.length;
		for (; i-- ;) {
			elem = elems[i];
			classArr = elem.className.split(' ');

			if (classArr.indexOf(className) === -1) {
				elem.className += ' ' + className;
			}

			attrs = {};
			j = elem.attributes.length;
			for (; j-- ;) {
				attr = elem.attributes[j];
				attrs[str.toCamelCase(attr.name)] = attr.value;
			}
			m(elem, attrs);
		}
	});
};
