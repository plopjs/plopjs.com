var cmpt = require('./cmpt');

var force = require('./required/force');
var hljs = require('./highlight-js/index');

window.ambient = require('./required/ambient');
require('./required/ambient-width');
require('./required/_ambient-config');

cmpt('typing');
cmpt('header-nav');

force.bindHashes();
hljs.initHighlightingOnLoad();
