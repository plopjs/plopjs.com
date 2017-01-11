module.exports = {

	toDashCase: function (txt) {
		return splitWords(txt).join('-');
	},

	toCamelCase: function (txt) {
		return splitWords(txt)
			.map(function (v,i) {
				if (i === 0) { return v; }
				return v.charAt(0).toUpperCase() + v.substr(1);
			})
			.join('');
	},

	toProperCase: function (txt) {
		return splitWords(txt)
			.map(function (v,i) {
				return v.charAt(0).toUpperCase() + v.substr(1);
			})
			.join('');
	}

};

function splitWords(txt) {
	return txt.toString()
		.replace(/[\s_-]/g, '{!}')
		.replace(/([A-Z])/g, '{!}$1')
		.toLowerCase()
		.split('{!}')
		.filter(function (v) { return !!v.length; });
}
