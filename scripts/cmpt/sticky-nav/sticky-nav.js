module.exports = function (elem, attrs) {
	var nodeList = elem.querySelectorAll('[id]');
	var i = nodeList.length, n, link;
	for(; i-- ;) {
		n = nodeList[i];
		n.innerHTML = '<span class="header-text">' + n.innerHTML + '</span>';
		link = document.createElement('a');
		link.setAttribute('href', '#' + n.getAttribute('id'));
		link.setAttribute('class', 'anchor-link');
		link.innerHTML = '<svg class="icon icon-link"><use xlink:href="#icon-link"></use></svg>';
		n.appendChild(link);
	}
};
