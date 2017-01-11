module.exports = function (path) {
	return path.substring(
		path.lastIndexOf('/') + 1,
		path.lastIndexOf('.')
	);
}
