var cmptInit = require('./cmpt');
var hljs = require('./highlight-js/index');

window.ambient = require('./required/ambient');
require('./required/ambient-width');
require('./required/_ambient-config');

cmptInit();

hljs.initHighlightingOnLoad();
