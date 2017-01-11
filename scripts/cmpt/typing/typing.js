module.exports = function (elem, attrs) {
	var words = (attrs.cmptTyping || '').split(',');
	loopWords(elem, words);
};

function loopWords(elem, words) {
	writeWords(elem, words.slice(), function () {
		window.setTimeout(function () {
			loopWords(elem, words);
		}, 2000);
	});
}

function writeWords(elem, words, done) {
	if (done == null) { done = function () {}; }
	if (words.length === 0) { done(); return; }
	var word = words.shift();
	writeWord(elem, word, function () {
		window.setTimeout(function () {
			writeWords(elem, words, done);
		}, 1000);
	});
}

function writeWord(elem, word, done, amount) {
	var part = elem.innerText;
	var delay = 100;
	if (word === part) { done(word); return; }
	if (word.indexOf(part) !== 0 && part !== '') {
		elem.innerText = part.substr(0, part.length - 1);
		delay = 50;
	} else {
		if (part === '') { amount = 1; }
		elem.innerText = word.substr(0, amount);
	}
	window.setTimeout(function () {
		writeWord(elem, word, done, ++amount);
	}, delay);
}
