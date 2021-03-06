module.exports = (function () {

	window.ambient.prop['width'] = {

		getCurrentValue: function () {
			var w = window,
				d = document,
				b = d.body;

			return w.innerWidth || b.clientWidth;
		},

		getAllClasses: function (className, props) {
			var i, classes = [], max;

			props.min = props.min || 0;
			props.max = props.max || Infinity;
			props.bend = props.bend || 0;

			classes = classes.concat([
				className,
				className + '-gte',
				className + '-lte'
			]);

			if (props.bend) {
				max = (props.max === Infinity) ? 8192 : props.max;
				i = ~~((max-props.min) / props.bend);

				for (; i-- ;) {
					classes.push(className + '-' + (i+1));
				}
			}
			return classes;
		},
		getActiveClasses: function (winSize, className, props) {
			var i, aboveMin, belowOrEqMax,
				classes = [];

			aboveMin = winSize > props.min;
			belowOrEqMax = winSize <= props.max;

			if (aboveMin && belowOrEqMax) {
				classes.push(className);

				if (props.bend) {
					i = ~~((winSize-props.min) / props.bend);

					for (; i-- ;) {
						classes.push(className + '-' + (i+1));
					}
				}
			}

			if (aboveMin) { classes.push(className + '-gte'); }
			if (belowOrEqMax) { classes.push(className + '-lte'); }

			return classes;
		},
		watchEvent: 'resize'
	};
}());
