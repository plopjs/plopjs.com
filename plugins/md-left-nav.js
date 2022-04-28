export default function (config) {
	return function (files, metalsmith, done) {
		setImmediate(done);
		Object.keys(files).forEach(function(file){
			if (!file.endsWith('.html')) { return; }
			var data = files[file];
			var content = data.contents.toString();
			var re = /^<h([\d]) id="(.*)?".*?>(.*?)<\/h/gm;
			var match;
			var headers = [];
			while (match = re.exec(content)) {
				if (match[1] === '1') {
					headers.push({
						type: match[1],
						id: match[2],
						text: match[3].replace(/<.*?>/g, ''),
						children: []
					});
				} else if (match[1] === '2') {
					headers[headers.length - 1].children.push({
						type: match[1],
						id: match[2],
						text: match[3].replace(/<.*?>/g, '')
					});
				}
			}
			if (headers.length) {
				data.headers = headers;
			}
		});
	};
};
