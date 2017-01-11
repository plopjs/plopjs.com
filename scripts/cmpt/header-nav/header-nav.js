module.exports = function (elem, attrs) {
	if (attrs.cmptHeaderNav == null || attrs.cmptHeaderNav.length === 0) { return; }
	var findWithinEl = document.getElementsByClassName(attrs.cmptHeaderNav)[0];
	var h1NodeList = findWithinEl.querySelectorAll('h1,h2');
	var h1Arr = [];

	var len = h1NodeList.length, i, h;
	for(i = 0; i < len; i++) {
		h = h1NodeList[i];
		if (h.tagName === 'H1') {
			h1Arr.push({
				title: h.innerText,
				id: h.getAttribute('id'),
				children: []
			});
		} else {
			h1Arr[h1Arr.length - 1].children.push({
				title: h.innerText,
				id: h.getAttribute('id')
			});
		}
	}

	elem.innerHTML = h1Arr.map(function (el) {
		var html = '<h4><a href="#' + el.id + '">' + el.title + '</a></h4>';
		if (el.children.length > 0) {
			html += '<ul>' + el.children.map(function (subEl) {
				return '<li><a href="#' + subEl.id + '">' + subEl.title + '</a></li>';
			}).join('') + '</ul>';
		}
		return html;
	}).join('');
};
