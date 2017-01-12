var cmptInit = require('./cmpt');

var force = require('./required/force');
var hljs = require('./highlight-js/index');

window.ambient = require('./required/ambient');
require('./required/ambient-width');
require('./required/_ambient-config');

cmptInit();

force.bindHashes();
hljs.initHighlightingOnLoad();
