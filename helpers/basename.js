const {basename} = require('path');

module.exports = function (path) {
	return basename(path).split('.')[0];
}
