module.exports = (function () {

	var timeout, config,
		toDelay = 0,
		initialized = false,
		props = {},
		allClasses = [],
		activeClasses = [],
		currentClasses = [],
		activeEvents = {},
		handlers = {},
		events = {},
		w = window,
		d = document,
		b = d.body,
		rAF = window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function( callback ){
				window.setTimeout(callback, 1000 / 60);
			};

	function rafDoUpdate() { rAF(doUpdate); }
	// executed on every resize event (debounced to 100ms)
	function doUpdate () {
		var cls, propName, prop, e, changePossible,
			propVals = {},
			classes, propClasses;

		activeClasses = [];

		for (cls in config) {
			// skip if in prototype
			if (!config.hasOwnProperty(cls)) { continue; }

			classes = [];
			config[cls].__updated__ = false;
			changePossible = false;

			// if we have activeEvents, we should check
			// if any of them apply to this class
			if (Object.keys(activeEvents).length) {
				// check each of our activeEvents
				for (e in activeEvents) {
					// if it's on prototype, bail out
					if (!activeEvents.hasOwnProperty(e)) { continue; }
					// check the class config's registered events
					changePossible = !!config[cls].__events__[e];
					// if we find that one of our active events could
					// affect this class, there's no reason to check the rest
					if(changePossible) { break; }
				}
			} else {
				// no active events, that means we're initing
				changePossible = true;
			}

			// spin over each plugin used by this class
			for (propName in config[cls]) {
				// skip if in prototype
				if (!config[cls].hasOwnProperty(propName)) { continue; }

				// skip if we don't have a prop to handle this property
				if (!props[propName]) { continue; }

				prop = props[propName];

				if (changePossible) {
					// have we not seen this prop yet?
					if (propVals[propName] == null) {
						// better go get its current value
						propVals[propName] = prop.getCurrentValue();

						// has it changed since last time?
						if (propVals[propName] !== prop.currentValue) {
							// update the cache
							prop.currentValue = propVals[propName];

							// this prop has changed, we'll need to go get
							// __updated__ active classes for anything that uses it
							prop.__updated__ = true;
						} else {
							// no change, we can pull values from cache
							prop.__updated__ = false;
						}
					}

					// if this prop has __updated__, then so will the classes
					config[cls].__updated__ = config[cls].__updated__ || prop.__updated__;
				}

				// has this value changed?
				if (prop.__updated__ && changePossible || !prop.cache[cls].activeClasses) {
					// calculate active classes
					propClasses = prop.getActiveClasses(prop.currentValue, cls, config[cls][propName]);

					// update cached classes value
					prop.cache[cls].activeClasses = propClasses;
				} else {
					// cached value is the same as new
					// use the cached values
					propClasses = prop.cache[cls].activeClasses;
				}

				// if this property is invalid, the whole class is
				// not active, kill classes and go to the next class
				if (!propClasses.length) {
					classes = [];
					break;
				} else {
					// add the active classes to the list
					classes = classes.concat(propClasses);
				}
			}

			activeClasses = activeClasses.concat(classes);
		}

		// reset active events
		activeEvents = {};

		// de-duplicate classes
		activeClasses = activeClasses.filter(function (val, idx, arr) {
			return arr.indexOf(val) === idx;
		});

		// push the changes to the page
		updateBodyClasses();

		// clear the timeout value so it can be set again
		timeout = null;
	}

	function updateBodyClasses() {
		var i, cls,
		bodyClasses = b.className;

		// update currentClasses with active body classes
		currentClasses = bodyClasses.split(' ').filter(function (val, idx) {
			// filter out anything we're not in charge of
			return allClasses.indexOf(val) !== -1;
		});

		// search for classes that are not currently active,
		// but should be, and add them
		i = activeClasses.length;
		for (; i-- ;) {
			cls = activeClasses[i];
			// check if the point is not longer active and the class is on body
			if (currentClasses.indexOf(cls) === -1) {
				// add the class to body
				bodyClasses += ' ' + cls;
				// fire any handlers attached to this event
				if (config[cls]) {
					fire('enter', cls, getPropValues(cls));
				}
			}

			if (config[cls]) {
				fire('update', cls, getPropValues(cls));
			}
		}

		// search for classes that are active,
		// but shouldn't be, and remove them
		i = currentClasses.length;
		for (; i-- ;) {
			cls = currentClasses[i];
			// check if the point is not longer active and the class is on body
			if (activeClasses.indexOf(cls) === -1) {
				// remove the class from body
				bodyClasses = bodyClasses.replace(new RegExp('(^|\\s)' + cls + '($|\\s)', 'g'), ' ');
				// fire any handlers attached to this event
				if (config[cls]) {
					fire('leave', cls, getPropValues(cls));
				}
			}
		}

		// push the new classes to body... and filter out extra spaces
		b.className = bodyClasses.split(' ').filter(function(e){return e;}).join(' ');
	}

	// grabs all the property values that apply to a given class
	function getPropValues (cls) {
		var values = {}, p;
		for (p in config[cls]) {
			if (!config[cls].hasOwnProperty(p) || !props[p]) { continue; }
			values[p] = getPropValue(p);
		}
		return values;
	}

	// resize debouncing, will execute resize code no more
	// than once every 100ms
	function debounceUpdate(eventName) {
		return function (e) {
			// queue this event in the bus
			activeEvents[eventName] = e;

			if (!timeout) {
				if (!toDelay) {
					// no delay, schdedule a rAF for updating
					rafDoUpdate();
				} else {
					// delay execution and then schedule an
					// update during an animationFrame
					timeout = setTimeout(rafDoUpdate, toDelay);
				}
			}
		};
	}

	// initializes confg and attaches to events
	// ---------------------------------- //
	function init(configure, delay) {
		var cls, prop, propName, classes, wE, watchEvent, onAction,
			registeredEvents = {};

		// only init once
		if (initialized) { return; }

		config = configure || {};
		allClasses = [];

		// spin over each class (cls) and check out the
		// condition properties for each
		for (cls in config) {
			// skip if in prototype
			if (!config.hasOwnProperty(cls)) { continue; }

			config[cls].__events__ = {};

			for (propName in config[cls]) {
				// skip if in prototype
				if (!config[cls].hasOwnProperty(propName)) { continue; }

				// skip if we don't have a prop to handle this property
				if (!props[propName]) { continue; }

				prop = props[propName];

				// setup any handlers that the plugin defines
				if (prop.on) {
					for (onAction in prop.on) {
						if (!prop.on.hasOwnProperty(onAction)) { continue; }
						on(onAction, cls, prop.on[onAction]);
					}
				}

				// setup the object for storing cached values
				prop.cache = prop.cache || {};
				prop.cache[cls] = prop.cache[cls] || {};

				// default to window
				prop.watchElement = prop.watchElement || w;

				// convert the watch events to an array
				if (typeof prop.watchEvent === 'string') { prop.watchEvent = prop.watchEvent.split(' '); }

				classes = prop.getAllClasses ? prop.getAllClasses(cls, config[cls][propName]) : [cls];
				allClasses = allClasses.concat(classes);

				wE = prop.watchEvent.length;
				for (; wE-- ;) {
					watchEvent = prop.watchEvent[wE];

					// attach the watched events to the class config so we can
					// track what events could affect this class
					config[cls].__events__[watchEvent] = true;

					if (!events[watchEvent]) { events[watchEvent] = []; }
					events[watchEvent].push(propName);

					// initialize the watchEvent once only
					if (!registeredEvents[watchEvent] || registeredEvents[watchEvent].indexOf(prop.watchElement) === -1) {

						// setup the resize handlers
						if (prop.watchElement.addEventListener) {
							prop.watchElement.addEventListener(watchEvent, debounceUpdate(watchEvent), false);
						} else {
							prop.watchElement.attachEvent('on' + watchEvent, debounceUpdate(watchEvent));
						}

						// Add this event to the list of hooks so it doesn't
						// get added again by another property
						registeredEvents[watchEvent] = registeredEvents[watchEvent] || [];
						registeredEvents[watchEvent].push(prop.watchElement);
					}
				}

			}
		}

		if (typeof delay === 'number') { toDelay = delay; }

		initialized = true;

		// do the initial resize logic to kick things off
		doUpdate();
	}

	// ================================== //
	// Event Bus API methods
	// ================================== //

	function on(action, cls, handler) {
		var actionArr = action.split(' '),
			i, a;
		handlers[cls] = handlers[cls] || {};

		i = actionArr.length;
		for (; i-- ;) {
			a = actionArr[i];
			handlers[cls][a] = handlers[cls][a] || [];
			handlers[cls][a].push(handler);
		}
	}

	function off(action, cls, handler) {
		var actionArr = action.split(' '),
			i, j, a;

		j = actionArr.length;
		for (; j-- ;) {
			a = actionArr[j];
			if (handlers[cls] && handlers[cls][a] && handlers[cls][a].length) {
				i = handlers[cls][a].length;
				for (; i-- ;) {
					if (handlers[cls][a][i] === handler) {
						handlers[cls][a].splice(i, 1);
					}
				}
			}
		}
	}

	function fire(action, cls, values) {
		var len, i = 0;

		if (!config[cls].__updated__) { return; }

		if (handlers[cls] && handlers[cls][action] && handlers[cls][action].length) {
			for (len = handlers[cls][action].length; i < len; i++) {
				handlers[cls][action][i](action, cls, values, config[cls]);
			}
		}
	}

	// ================================== //
	// Javascript API Helpers
	// ================================== //

	function getPropValue(propName) {
		// get the latest value from cache if available
		return props[propName].currentValue || props[propName].getCurrentValue();
	}

	function styleIsActive(cls) {
		return activeClasses.indexOf(cls) !== -1;
	}

	return {
		init: init,
		on: on,
		off: off,
		prop: props,
		getPluginValue: getPropValue,
		isActive: styleIsActive
	};
}());
