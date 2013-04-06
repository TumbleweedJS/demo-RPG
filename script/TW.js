/**
 * TumbleweedJS 0.3 Copyright (c) 2013, Tumbleweed Studio All Rights Reserved.
 * Available via the new BSD license.
 * see: https://github.com/TumbleweedJS/TumbleweedJS for details
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.TW = factory();
  }
}(this, function() {

/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

/**
 * @module Collision
 * @namespace Collision
 */

var TW = TW || {};
define('Collision/CollisionBox',[], function() {

	TW.Collision = TW.Collision || {};


	/**
	 * The CollisionBox class allow you to declare a bounding box to test collisions between
	 * other collisions boxes and collisions circles.
	 *
	 * @class CollisionBox
	 * @constructor
	 * @param {Number} x the x coordinate of the collision box
	 * @param {Number} y the y coordinate of the collision box
	 * @param {Number} w the width of the collision box
	 * @param {Number} h the height of the collision box
	 */
	function CollisionBox(x, y, w, h) {

		/**
		 * type of Collision object
		 *
		 * @property {String} type
		 * @readonly
		 */
		this.type = "CollisionBox";

		/**
		 * @property {Number} x
		 */
		this.x = x;

		/**
		 * @property {Number} y
		 */
		this.y = y;

		/**
		 * @property {Number} width
		 */
		this.width = w;

		/**
		 * @property {Number} height
		 */
		this.height = h;
	}


	/**
	 * The isPointInside method allow you to test if a point is inside the bouncing box.
	 *
	 * @method isPointInside
	 * @param {Number} px the x coordinate of the point
	 * @param {Number} py the y coordinate of the point
	 * @return {boolean} true if the point is inside the box, else return false.
	 */
	CollisionBox.prototype.isPointInside = function(px, py) {
		return px >= this.x && px <= this.x + this.width &&
		       py >= this.y && py <= this.y + this.height;
	};

	/**
	 * The isSegmentCollidingCircle method allow you to test if a segment is colliding a circle
	 *
	 * @method isSegmentCollidingCircle
	 * @param {Number} ax the x coordinate of the first point of the segment
	 * @param {Number} ay the y coordinate of the first point of the segment
	 * @param {Number} bx the x coordinate of the second point of the segment
	 * @param {Number} by the y coordinate of the second point of the segment
	 * @param {CollisionCircle} circle the CollisionCircle object to test collision with the segment
	 * @return {boolean} return true if circle and the segment are colliding, else return false.
	 */
	CollisionBox.prototype.isSegmentCollidingCircle = function(ax, ay, bx, by, circle) {
		var vx = bx - ax;
		var vy = by - ay;
		var radius = circle.radius;
		ax -= circle.x;
		ay -= circle.y;
		var delta = (((2 * ax * vx) + (2 * ay * vy)) * ((2 * ax * vx) + (2 * ay * vy))) -
		            (4 * ((vx * vx) + (vy * vy)) * ((ax * ax) + (ay * ay) - (radius * radius)));
		if (delta >= 0) {
			if ((((2 * ax * vx + 2 * ay * vy) * -1) + (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) <
			    1.0 &&
			    (((2 * ax * vx + 2 * ay * vy) * -1) + (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) >
			    0.0) {
				return true;
			}
			if ((((2 * ax * vx + 2 * ay * vy) * -1) - (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) <
			    1.0 &&
			    (((2 * ax * vx + 2 * ay * vy) * -1) - (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) >
			    0.0) {
				return true;
			}
		}
		return false;
	};

	/**
	 * The isCollidingCircle method allow you to test if the current CollisionBox
	 * is colliding the CollisionCircle object.
	 *
	 * @method isCollidingCircle
	 * @param {CollisionCircle} circle the CollisionCircle object to test the collision with.
	 * @return {boolean} if the current CollisionBox is colliding the CollisionCircle object,
	 *  then the isCollidingCircle function will return true otherwise it will return false.
	 */
	CollisionBox.prototype.isCollidingCircle = function(circle) {
		var radius = circle.radius;

		//On check si la boite englobante du cercle rentre en collision avec this
		if (circle.x + radius < this.x) {
			return false;
		}
		if (circle.x - radius > this.x + this.width) {
			return false;
		}
		if (circle.y + radius < this.y) {
			return false;
		}
		if (circle.y - radius > this.y + this.height) {
			return false;
		}
		//On check si un des segments de la box rentre en collision avec le cercle
		if (this.isSegmentCollidingCircle(this.x, this.y, this.x + this.width, this.y, circle)) {
			return true;
		}
		if (this.isSegmentCollidingCircle(this.x + this.width, this.y, this.x + this.width, this.y + this.height,
		                                  circle)) {
			return true;
		}
		if (this.isSegmentCollidingCircle(this.x + this.width, this.y + this.height, this.x, this.y + this.height,
		                                  circle)) {
			return true;
		}
		if (this.isSegmentCollidingCircle(this.x, this.y + this.height, this.x, this.y, circle)) {
			return true;
		}
		//On check si le centre du cercle est dans la box.
		if (circle.x > this.x && circle.x < this.x + this.width && circle.y > this.y &&
		    circle.y < this.y + this.height) {
			return true;
		}
		//on check si les sommets de la box sont a une distance plus petite que le rayon du cercle
		if (Math.sqrt(((this.x - circle.x) * (this.x - circle.x)) +
		              ((this.y - circle.y) * (this.y - circle.y))) < radius) {
			return true;
		}
		if (Math.sqrt(((this.x + this.width - circle.x) * (this.x + this.width - circle.x)) +
		              ((this.y - circle.y) * (this.y - circle.y))) < radius) {
			return true;
		}
		if (Math.sqrt(((this.x + this.width - circle.x) * (this.x + this.width - circle.x)) +
		              ((this.y + this.height - circle.y) * (this.y + this.height - circle.y))) < radius) {
			return true;
		}
		if (Math.sqrt(((this.x - circle.x) * (this.x - circle.x)) +
		              ((this.y + this.height - circle.y) * (this.y + this.height - circle.y))) < radius) {
			return true;
		}
		return false;
	};

	/**
	 * The isCollidingBox method allow you to test if the current CollisionBox object is colliding
	 * the CollisionBox object given in parameter.
	 *
	 * @method isCollidingBox
	 * @param {CollisionBox} box the CollisionBox object to test the collision with
	 * @return {Boolean} return true if the box object is colliding the this object.
	 */
	CollisionBox.prototype.isCollidingBox = function(box) {
		if (this.x + this.width < box.x) {
			return false;
		}
		if (this.x > box.x + box.width) {
			return false;
		}
		if (this.y + this.height < box.y) {
			return false;
		}
		return this.y <= box.y + box.height;

	};

	TW.Collision.CollisionBox = CollisionBox;
	return CollisionBox;
});

/**
 @module Collision
 @namespace Collision
 */

var TW = TW || {};
define('Collision/CollisionCircle',[], function() {

	TW.Collision = TW.Collision || {};


	/**
	 * The CollisionCircle class allow you to create a CollisionCircle to test intersections
	 * with other collision objects like circles, segments or boxes.
	 *
	 * @class CollisionCircle
	 * @constructor
	 * @param {Number} x the x coordinate of the CollisionCircle
	 * @param {Number} y the y coordinate of the CollisionCircle
	 * @param {Number} radius the radius of the CollisionCircle
	 */
	function CollisionCircle(x, y, radius) {

		/**
		 * type of Collision object
		 *
		 * @property {String} type
		 * @readonly
		 */
		this.type = "CollisionCircle";

		/**
		 * @property {Number} x
		 */
		this.x = x;

		/**
		 * @property {Number} y
		 */
		this.y = y;

		/**
		 * @property {Number} radius
		 */
		this.radius = radius;
	}


	/**
	 * The method is CollidingCircle allow you to test if two circles are Colliding. Let's see an example :
	 *
	 *      var circle = new CollisionCircle(x, y, radius);
	 *      var circle2 = new CollisionCircle(x2, y2, radius2);
	 *      var result = circle.isCollidingCircle(circle2);
	 *
	 * If result is true, so the circle object is colliding the circle2 object.
	 * If result if false, so the circle object is not colliding the circle2 object.
	 *
	 * @method isCollidingCircle
	 * @param {CollisionCircle} circle the CollisionCircle to test collision with.
	 * @return {boolean} return true if the two circles are colliding, otherwise return false.
	 */
	CollisionCircle.prototype.isCollidingCircle = function(circle) {
		var dist = Math.sqrt(((circle.x - this.x) * (circle.x - this.x)) +
		                     ((circle.y - this.y) * (circle.y - this.y)));

		return dist < (this.radius + circle.radius);
	};

	/**
	 * The isCollidingSegment method allow you to test if the CollisionCircle is Colliding a segment
	 *
	 * @method isCollidingSegment
	 * @param {Number} ax the x coordinate of the first point of the segment to test intersection with.
	 * @param {Number} ay the y coordinate of the first point of the segment to test intersection with.
	 * @param {Number} bx the x coordinate of the second point of the segment to test intersection with.
	 * @param {Number} by the y coordinate of the second point of the segment to test intersection with.
	 * @return {Boolean} returns `true` if the current CollisionCircle is colliding the segment.
	 *  Otherwise return `false`.
	 */
	CollisionCircle.prototype.isCollidingSegment = function(ax, ay, bx, by) {
		var vx = bx - ax;
		var vy = by - ay;
		var circle = this;
		var radius = circle.radius;
		ax -= circle.x;
		ay -= circle.y;
		var delta = (((2 * ax * vx) + (2 * ay * vy)) * ((2 * ax * vx) + (2 * ay * vy))) -
		            (4 * ((vx * vx) + (vy * vy)) * ((ax * ax) + (ay * ay) - (radius * radius)));
		if (delta >= 0) {
			if ((((2 * ax * vx + 2 * ay * vy) * -1) + (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) <
			    1.0 &&
			    (((2 * ax * vx + 2 * ay * vy) * -1) + (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) >
			    0.0) {
				return true;
			}
			if ((((2 * ax * vx + 2 * ay * vy) * -1) - (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) <
			    1.0 &&
			    (((2 * ax * vx + 2 * ay * vy) * -1) - (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) >
			    0.0) {
				return true;
			}
		}
		return false;
	};


	/**
	 * The isPointInside method allow you to test if a point is inside the current circle
	 *
	 * @method isPointInside
	 * @param {Number} px the x coordinate of the point
	 * @param {Number} py the y coordinate of the point
	 * @return {Boolean} return true if the point is inside the Circle, otherwise it returns false.
	 */
	CollisionCircle.prototype.isPointInside = function(px, py) {
		px -= this.x;
		py -= this.y;
		return Math.sqrt((px * px) + (py * py)) <= this.radius;
	};

	/**
	 * The isCollidingBox method allow you to test if the current CollisionCircle
	 * is colliding the CollidingBox in parameter.
	 *
	 * @method isCollidingBox
	 * @param {CollisionBox} box the CollidingBox to test collision with.
	 * @return {boolean} returns true if the current CollisionCircle is colliding the box;
	 *  otherwise, it returns false
	 */
	CollisionCircle.prototype.isCollidingBox = function(box) {
		//On check si la boite englobante du cercle rentre en collision avec this
		if (this.x + this.radius < box.x) {
			return false;
		}
		if (this.x - this.radius > box.x + box.width) {
			return false;
		}
		if (this.y + this.radius < box.y) {
			return false;
		}
		if (this.y - this.radius > box.y + box.height) {
			return false;
		}
		//On check si les segments de la boite rentrent en collision avec le cercle
		if (this.isCollidingSegment(box.x, box.y, box.x + box.width, box.y)) {
			return true;
		}
		if (this.isCollidingSegment(box.x + box.width, box.y, box.x + box.width, box.y + box.height)) {
			return true;
		}
		if (this.isCollidingSegment(box.x + box.width, box.y + box.height, box.x, box.y + box.height)) {
			return true;
		}
		if (this.isCollidingSegment(box.x, box.y + box.height, box.x, box.y)) {
			return true;
		}
		//On check si le centre du cercle est dans la box.
		if (this.x > box.x && this.x < box.x + box.width && this.y > box.y &&
		    this.y < box.y + box.height) {
			return true;
		}
		//on check si les sommets de la box sont a une distance plus petite que le rayon du cercle
		if (Math.sqrt(((box.x - this.x) * (box.x - this.x)) +
		              ((box.y - this.y) * (box.y - this.y))) < this.radius) {
			return true;
		}
		if (Math.sqrt(((box.x + box.width - this.x) * (box.x + box.width - this.x)) +
		              ((box.y - this.y) * (box.y - this.y))) < this.radius) {
			return true;
		}
		if (Math.sqrt(((box.x + box.width - this.x) * (box.x + box.width - this.x)) +
		              ((box.y + box.height - this.y) * (box.y + box.height - this.y))) <
		    this.radius) {
			return true;
		}
		if (Math.sqrt(((box.x - this.x) * (box.x - this.x)) +
		              ((box.y + box.height - this.y) * (box.y + box.height - this.y))) <
		    this.radius) {
			return true;
		}
		return false;
	};

	TW.Collision.CollisionCircle = CollisionCircle;
	return CollisionCircle;
});

/**
 * @module Math
 * @namespace Math
 */

var TW = TW || {};
define('Math/Vector2D',[], function() {

	TW.Math = TW.Math || {};


	/**
	 * The Vector2D class allow you to create a vector2D object
	 *
	 * For a more simplier use, most of methods which take `Vector2D` in parameter
	 * can also take a basic object instead:
	 *
	 *     vector.add({ x: 20, y: 20 });
	 *     vector.dotProduct({ x: 10, y: 10 });
	 *
	 * This inclues `add`, `sub`, `dotProduct` and `crossProduct`.
	 * Warning: `getAngleBetween` need a full `Vector2D` object.
	 * 
	 * @class Vector2D
	 * @constructor
	 * @param {Number} x the x coordinate of the Vector2D
	 * @param {Number} y the y coordinate of the Vector2D
	 */
	function Vector2D(x, y) {

		/**
		 * x coordinate
		 * @property {Number} x
		 */
		this.x = x;

		/**
		 * y coordinate
		 * @property {Number} y
		 */
		this.y = y;
	}

	/**
	 * The add method allow you to add two vectors.
	 *
	 * @method add
	 * @param {Vector2D} vector the Vector2D to add with the current Vector2D object.
	 * @chainable
	 */
	Vector2D.prototype.add = function(vector) {
		this.x += vector.x;
		this.y += vector.y;
		return this;
	};

	/**
	 * The sub method allow you to sub two vectors.
	 *
	 * @method sub
	 * @param {Vector2D} vector the Vector2D to subtract to the current Vector2D object.
	 * @chainable
	 */
	Vector2D.prototype.sub = function(vector) {
		this.x -= vector.x;
		this.y -= vector.y;
		return this;
	};

	/**
	 * The mult method allow you to mult the current Vector2D by a scalar.
	 *
	 * @method mult
	 * @param {Number} scalar the scalar who multiply the current Vector2D
	 * @chainable
	 */
	Vector2D.prototype.mult = function(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	};

	/**
	 * The div method allow you to div the current Vector2D by a scalar.
	 *
	 * @method div
	 * @param {Number} scalar
	 * @chainable
	 */
	Vector2D.prototype.div = function(scalar) {
		this.x /= scalar;
		this.y /= scalar;
		return this;
	};

	/**
	 * normalize the current Vector2D
	 *
	 * @method normalize
	 */
	Vector2D.prototype.normalize = function() {
		var length = Math.sqrt((this.x * this.x) + (this.y * this.y));
		this.x /= length;
		this.y /= length;
	};

	/**
	 * get the length of the Vector2D
	 *
	 * @method getLength
	 * @return {Number} returns the length of the Vector2D.
	 */
	Vector2D.prototype.getLength = function() {
		return Math.sqrt((this.x * this.x) + (this.y * this.y));
	};

	/**
	 * set the length of the current Vector2D
	 *
	 * @method setLength
	 * @param {Number} length the length to apply to the current Vector2D
	 */
	Vector2D.prototype.setLength = function(length) {
		this.normalize();
		this.x *= length;
		this.y *= length;
	};

	/**
	 * get the angle of the current Vector2D
	 *
	 * @method getAngle
	 * @return {Number} returns the angle of the current Vector2D (expressed in degree).
	 */
	Vector2D.prototype.getAngle = function() {
		if (this.x === 0) {
			if (this.y > 0) {
				return 90;
			}
			if (this.y < 0) {
				return -90;
			}
			if (this.y === 0) {
				return 0;
			}
		}
		var tmpX = this.x / this.getLength();
		var tmpY = this.y / this.getLength();
		return Math.atan(tmpY / tmpX) * 180.0 / Math.PI + ( tmpX < 0 ? 180 : 0);
	};


	/**
	 * set the angle of the current Vector2D
	 *
	 * @method setAngle
	 * @param {Number} angle the angle to apply to the current Vector2D (angle is expressed in degree)
	 */
	Vector2D.prototype.setAngle = function(angle) {
		var length = this.getLength();
		this.x = Math.cos(angle / 180.0 * Math.PI) * length;
		this.y = Math.sin(angle / 180.0 * Math.PI) * length;
	};

	/**
	 * compute the dot product of the current Vector2D
	 *
	 * @method dotProduct
	 * @param {Vector2D} vector2 the second vector to compute the dot product
	 * @return {Number} returns the dot product between the current Vector2D and vector2.
	 */
	Vector2D.prototype.dotProduct = function(vector2) {
		return ((this.x * vector2.x) + (this.y * vector2.y));
	};

	/**
	 * compute the angle between the current Vector2D and vector2
	 *
	 * @method getAngleBetween
	 * @param {Vector2D} vector2 the second vector to compute the angle between.
	 *  **Note that `vector2` must be a full `Vector2D` object.**
	 * @return {Number} returns the angle between the current Vector2D and vector2 (expressed in degree).
	 */
	Vector2D.prototype.getAngleBetween = function(vector2) {
		var dotProd = this.dotProduct(vector2);
		var cos = dotProd / (this.getLength() * vector2.getLength());
		return Math.acos(cos) * 180.0 / Math.PI;
	};

	/**
	 * compute the cross product of the current Vector2D and vector2
	 *
	 * @method crossProduct
	 * @param {Vector2D} vector2 the second vector to use to compute the cross product
	 * @return {Number} returns the cross product between the current Vector2D and vector2
	 */
	Vector2D.prototype.crossProduct = function(vector2) {
		return ((this.x * vector2.y) - (this.y * vector2.x));
	};

	/**
	 * get the squared length of this vector
	 *
	 * @method getSquaredLength
	 * @return {Number} squared length
	 */
	Vector2D.prototype.getSquaredLength = function() {
		return this.x * this.x + this.y * this.y;
	};

	/**
	 * give a data representation of Vector2D
	 *
	 * @method toString
	 * @return {String} data representation of Vector2D
	 */
	Vector2D.prototype.toString = function() {
		return "[x=" + this.x + "; y=" + this.y + "]";
	};

	TW.Math.Vector2D = Vector2D;
	return Vector2D;
});

/**
 @module Collision
 @namespace Collision
 */

var TW = TW || {};
define('Collision/CollisionSegment',['../Math/Vector2D'], function(Vector2D) {

	TW.Collision = TW.Collision || {};


	/**
	 * The CollisionSegment class allow you to define a segment to test
	 * collision width other segments and collision circles.
	 *
	 * @class CollisionSegment
	 * @constructor
	 * @param {Number} x1 the x coordinate of the first point of the segment
	 * @param {Number} y1 the y coordinate of the first point of the segment
	 * @param {Number} x2 the x coordinate of the second point of the segment
	 * @param {Number} y2 the y coordinate of the second point of the segment
	 */
	function CollisionSegment(x1, y1, x2, y2) {

		/**
		 * the x coordinate of the first point of the CollisionSegment
		 *
		 * @property {Number} px
		 */
		this.px = x1;

		/**
		 * the y coordinate of the first point of the CollisionSegment
		 *
		 * @property {Number} py
		 */
		this.py = y1;

		/**
		 * vector representing the segment (from x1;y2 to x2;y2)
		 *
		 * @property {Vector2D} vector
		 */
		this.vector = new Vector2D(x2 - x1, y2 - y1);
	}

	/**
	 * The isCollidingSegment method allow you to test if the current segment is colliding another segment.
	 * @method isCollidingSegment
	 * @param {CollisionSegment} segment the CollisionSegment to test
	 * if is colliding the current collision segment object.
	 * @return {boolean} return true if segment is colliding the current CollisionSegment.
	 */
	CollisionSegment.prototype.isCollidingSegment = function(segment) {
		var ax = this.px;
		var ay = this.py;
		var cx = segment.px;
		var cy = segment.py;
		var vectorI = this.vector;
		var vectorJ = segment.vector;
		var k;
		var m;
		var denominateur = (vectorI.x * vectorJ.y) - (vectorI.y * vectorJ.x);

		if (denominateur === 0) {
			return false;
		}
		m = -((-vectorI.x * ay) + (vectorI.x * cy) + (vectorI.y * ax) - (vectorI.y * cx)) /
		    denominateur;
		k = -((ax * vectorJ.y) - (cx * vectorJ.y) - (vectorJ.x * ay) + (vectorJ.x * cy)) /
		    denominateur;
		return (0 <= m && m <= 1 && 0 <= k && k <= 1);
	};

	/**
	 * The isCollidingCircle method allow you to test the collision beetween the current object and the circle object
	 *
	 * @method isCollidingCircle
	 * @param {CollisionCircle} circle the CollisionCircle to test the interection with the CollisionSegment.
	 * @return {boolean} return true if circle is colliding the current CollisionSegment.
	 */
	CollisionSegment.prototype.isCollidingCircle = function(circle) {
		var ax = this.px;
		var ay = this.py;
		var bx = ax + this.vector.x;
		var by = ay + this.vector.y;
		var vx = bx - ax;
		var vy = by - ay;
		var radius = circle.radius;
		var delta;

		ax -= circle.x;
		ay -= circle.y;
		delta = (((2 * ax * vx) + (2 * ay * vy)) * ((2 * ax * vx) + (2 * ay * vy))) -
		        (4 * ((vx * vx) + (vy * vy)) * ((ax * ax) + (ay * ay) - (radius * radius)));
		if (delta >= 0) {
			if ((((2 * ax * vx + 2 * ay * vy) * -1) + (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) < 1.0 &&
			    (((2 * ax * vx + 2 * ay * vy) * -1) + (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) > 0.0) {
				return true;
			}
			if ((((2 * ax * vx + 2 * ay * vy) * -1) - (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) < 1.0 &&
			    (((2 * ax * vx + 2 * ay * vy) * -1) - (Math.sqrt(delta))) / (2 * ((vx * vx) + (vy * vy))) > 0.0) {
				return true;
			}
		}
		return false;
	};

	TW.Collision.CollisionSegment = CollisionSegment;
	return CollisionSegment;
});

/**
 * The aim of this module is to give you tools to test intersections between bounding boxes,
 * bouncing circles and segments.
 *
 * Three classes covers a large set of interaction for different shapes, and meet all standard requirements:
 * {{#crossLink "Collision.CollisionBox"}}CollisionBox{{/crossLink}} for Axis-aligned bounding box,
 * {{#crossLink "Collision.CollisionCircle"}}CollisionCircle{{/crossLink}} for bounding circle and
 * {{#crossLink "Collision.CollisionSegment"}}CollisionSegment{{/crossLink}} for all others possibilities.
 *
 * @module Collision
 * @main
 */


var TW = TW || {};

define('Collision',[
	       './Collision/CollisionBox',
	       './Collision/CollisionCircle',
	       './Collision/CollisionSegment'
       ], function() {
	return TW.Collision;
});


/**
 * @module Event
 * @namespace Event
 */

var TW = TW || {};
define('Event/EventProvider',[], function() {

	TW.Event = TW.Event || {};


	/**
	 * Abstract class representing an event provider.
	 * The class contains a list of variables with a certain state.
	 * When a variable change, all listeners are called.
	 *
	 * All inputs can be represented by a list of states (ex: mouse position, each key (pressed or released)).
	 *
	 * @class EventProvider
	 * @constructor
	 */
	function EventProvider() {
		/**
		 * List of all event variables name.
		 *
		 * @property {String[]} _states []
		 * @protected
		 */
		this._states = [];

		/**
		 * List of values for state variables.
		 * `this._states` and `this._values` share the same array index.
		 *
		 * @property {Array} _values
		 * @protected
		 */
		this._values = [];

		/**
		 * List of previous values for state variables.
		 * `this._states` and `this._oldValues` share the same array index.
		 *
		 * @property {Array}    _oldValues
		 * @protected
		 */
		this._oldValues = [];

		this._globalCallbacks = [];
		this._stateCallbacks = [];

		/* used for giving a unique id */
		this._nextId = 1;
	}

	/**
	 * return a const string representing the type of provider.
	 * All providers of the same type must return the same result.
	 *
	 * **Note:** All child class MUST implement this method.
	 *
	 * @method getType
	 * @return {String} name of Provider type.
	 */
	EventProvider.prototype.getType = function() {
		return null;
	};

	/**
	 * List all variables accessible by this provider
	 * Each variable can accept listeners.
	 *
	 * **Note:** return value is a reference. you should make a copy if you need to modify it.
	 * @method getStateList
	 * @return {String[]}   [] list of name variables.
	 */
	EventProvider.prototype.getStateList = function() {
		return this._states;
	};

	/**
	 *  Search the state of a state variable
	 *
	 * @method getState
	 * @param {String}  name
	 * @return {*}    value of corresponding variable
	 */
	EventProvider.prototype.getState = function(name) {
		var i, len;

		for (i = 0, len = this._states.length; i < len; ++i) {
			if (this._states[i] === name) {
				return this._values[i];
			}
		}
		throw new Error('EventProvider: Unknow state: ' + name);
	};

	/**
	 *  Search the previous state of a state variable.
	 *  The provider keep always one old state for each variable.
	 *  It's useful for compare the difference.
	 *
	 * @method getOldState
	 * @param {String}  name
	 * @return {*}    value of corresponding variable
	 */
	EventProvider.prototype.getOldState = function(name) {
		var i, len;

		for (i = 0, len = this._states.length; i < len; ++i) {
			if (this._states[i] === name) {
				return this._oldValues[i];
			}
		}
		throw new Error('EventProvider: Unknow state: ' + name);
	};

	/**
	 * add a listener.
	 *
	 * it can listen all events or only one event variable.
	 * The listener can choose to be called for all events associated to a variable,
	 * or only when the variable is in a certain state.
	 *
	 * @method addListener
	 * @param {String}   [event]    name of event variable. y default, all events are caught.
	 * @param {*}        [value]    value expected for call the callback. By default, any value call the callback.
	 * @param {Function} callback   callback function called with 3 parameters:
	 *      @param {String}         callback.event      event name
	 *      @param {*}              callback.value      new value
	 *      @param {EventProvider}  callback.provider   instance of provider
	 * @return {Number} listener id (used for remove it
	 * with {{#crossLink "Event.EventProvider/rmListener"}}rmListener{{/crossLink}})
	 *
	 * @example
	 *
	 *      //myCallback will be called for each events.
	 *      provider.addListener(myCallback);
	 *
	 *      //mySecondCallback will be called only when the "A" variable obtain the state KEY_PRESSED.
	 *      provider.addListener("A", provider.KEY_PRESSED, mySecondCallback);
	 */
	EventProvider.prototype.addListener = function(event, value, callback) {
		var i, len, id;

		if (callback === undefined) {
			callback = value;
			value = undefined;
		}
		if (callback === undefined) {
			callback = event;
			event = undefined;
		}

		id = this._nextId;
		this._nextId++;

		if (event === undefined) {
			this._globalCallbacks.push({
				                           id:       id,
				                           callback: callback
			                           });
			return id;
		} else {
			for (i = 0, len = this._states.length; i < len; ++i) {
				if (this._states[i] === event) {
					if (this._stateCallbacks[i] === undefined) {
						this._stateCallbacks[i] = [];
					}
					this._stateCallbacks[i].push({
						                             id:       id,
						                             filter:   value,
						                             callback: callback
					                             });
					return id;
				}
			}
			throw new Error('EventProvider: Unknow state: ' + event);
		}
	};

	/**
	 * Remove a listener.
	 *
	 * @method rmListener
	 * @param {Number} id id of the listener.
	 */
	EventProvider.prototype.rmListener = function(id) {
		var i, j, len, len2;

		for (i = 0, len = this._globalCallbacks.length; i < len; ++i) {
			if (this._globalCallbacks[i].id === id) {
				this._globalCallbacks.splice(i, 1);
				return;
			}
		}

		for (i = 0, len = this._stateCallbacks.length; i < len; ++i) {
			if (this._stateCallbacks[i] !== undefined) {
				for (j = 0, len2 = this._stateCallbacks[i].length; j < len2; ++j) {
					if (this._stateCallbacks[i][j].id === id) {
						this._stateCallbacks[i].splice(j, 1);
						return;
					}
				}
			}
		}
	};

	/**
	 * Apply a modification to an internal state variable
	 * and call listeners.
	 *
	 * @method _modifyState
	 * @param {String}  event       event name
	 * @param {*}       newValue   the new value.
	 * @protected
	 */
	EventProvider.prototype._modifyState = function(event, newValue) {
		var i, j, len, len2;

		for (i = 0, len = this._states.length; i < len; ++i) {
			if (this._states[i] === event) {
				this._oldValues[i] = this._values[i];
				this._values[i] = newValue;

				for (j = 0, len2 = this._globalCallbacks.length; j < len2; ++j) {
					this._globalCallbacks[j].callback(event, newValue, this);
				}
				if (this._stateCallbacks[i] !== undefined) {
					for (j = 0, len2 = this._stateCallbacks[i].length; j < len2; ++j) {
						if (this._stateCallbacks[i][j].filter === undefined ||
						    JSON.stringify(newValue) === JSON.stringify(this._stateCallbacks[i][j].filter)) {
							this._stateCallbacks[i][j].callback(event, newValue, this);
						}
					}
				}
				return;
			}
		}
		throw new Error('EventProvider: Unknow state: ' + event);
	};

	TW.Event.EventProvider = EventProvider;
	return EventProvider;
});

/**
 * @module Utils
 * @namespace Utils
 */

var TW = TW || {};
define('Utils/inherit',[], function() {

	TW.Utils = TW.Utils || {};


	/**
	 * Provide an useful way to use inheritance.
	 *
	 * *Note: `inherit` is not a class but a standalone function.*
	 *
	 * Internally, `inherit` use a intermediate dummy function as prototype.
	 * So, `inherit` doesn't call the parent constructor, unlike to the classic inheritance method.
	 *
	 *     // class Parent
	 *     function Parent(arg) {
	 *          do_some_stuff(arg);
	 *     }
	 *
	 *     Parent.prototype.foo = "Hello";
	 *
	 *     //class Child
	 *     function Child(arg, arg2) {
	 *          //Parent constructor call.
	 *          Parent.call(this, arg);
	 *
	 *          do_other_stuff(arg2);
	 *     }
	 *
	 *     inherit(Child, Parent);
	 *
	 *     var child = new Child(1, 2);
	 *
	 *     console.log(child instanceof Parent);    //true
	 *     console.log(child.foo);                  //"Hello"
	 *
	 * **Warning: this function rewrite the prototype of `child`. All change must be done after the call to `inherit`,
	 * otherwise they will be erased.**
	 *
	 * @class inherit
	 * @constructor
	 *
	 * @param child Child class
	 * @param parent Parent class
	 */
	TW.Utils.inherit = function(child, parent) {

		function Foo() {}

		Foo.prototype = parent.prototype;
		child.prototype = new Foo();
	};

	return TW.Utils.inherit;
});

/**
 * @module Utils
 * @namespace Utils
 */

define('Utils/Polyfills',[], function() {


	/**
	 * This module only contains polyfills; it's not a class.
	 *
	 * It's a way to use some polyfills if some features are not available for all browser.
	 * Actually, it contain only one polyfill:
	 *
	 *  - `Function.bind`
	 *
	 *    Mozilla implementation of the bind function.
	 *    See the documentation
	 *    [on the MDN](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind).
	 *
	 * **Usage example:**
	 *
	 *     define(['TW/Utils/Polyfills'], function() {
	 *         //Now i'm sure that `bind()` exist.
	 *         setTimeout(myFunc.bind(), 100);
	 *     });
	 *
	 * **Note: the module don't return anything.**
	 *
	 * @class Polyfill
	 */
	if (!Function.prototype.bind) {
		Function.prototype.bind = function(context) {
			var Func = function() {};
			var args, f2bind, fBound;

			if (typeof this !== "function") {
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}

			args = Array.prototype.slice.call(arguments, 1);
			f2bind = this;
			fBound = function() {
				return f2bind.apply(this instanceof Func && context ? this : context,
				                    args.concat(Array.prototype.slice.call(arguments)));
			};

			Func.prototype = this.prototype;
			fBound.prototype = new Func();

			return fBound;
		};
	}

});

/**
 * @module Event
 * @namespace Event
 */

var TW = TW || {};
define('Event/EventCombination',['./EventProvider', '../Utils/inherit', '../Utils/Polyfills'], function(EventProvider, inherit) {

	TW.Event = TW.Event || {};


	/**
	 *
	 * @class EventCombination
	 * @extends Event.EventProvider
	 * @constructor
	 */
	function EventCombination(input) {

		EventProvider.call(this);

		this._events = [];
		this._eventsBind = [];

		/**
		 * enable or disable this object.
		 *
		 * @property {Boolean} enable
		 */
		this.enable = true;

		/**
		 * @property {EventProvider} _input
		 * @private
		 */
		this._input = input;

		this._input.addListener(this._combinationEvent.bind(this));
	}

	inherit(EventCombination, EventProvider);

	/**
	 * return the EventProvider type.
	 *
	 * @method getType
	 * @return {String}     "COMBINATION"
	 */
	EventCombination.prototype.getType = function() {
		return "COMBINATION";
	};

	/**
	 * Bind a combinaison of remote events to a local event.
	 *
	 * @method bindEvent
	 * @param {String}  localEvent
	 * @param {String}  remoteEvents
	 */
	EventCombination.prototype.addCombination = function(localEvent, remoteEvents) {
		var i, n, len, values, oldValues;
		i = this._states.indexOf(localEvent);

		if (i !== -1 || remoteEvents.length === 0) {
			return false;
		}
		for (i = 0, len = remoteEvents.length; i < len; ++i) {
			if (this._input._states.indexOf(remoteEvents[i]) === -1) {
				return false;
			}
		}

		values = [];
		oldValues = [];

		for (i = 0, len = remoteEvents.length; i < len; ++i) {

			n = this._events.indexOf(remoteEvents[i]);

			if (n === -1) {
				this._events.push(remoteEvents[i]);
				this._eventsBind.push([localEvent]);
			}
			else {
				this._eventsBind[n].push(localEvent);
			}
			values.push({event: remoteEvents[i], value: this._input.getState(remoteEvents[i])});
			oldValues.push({event: remoteEvents[i], value: this._input.getOldState(remoteEvents[i])});
		}
		this._states.push(localEvent);
		this._values.push(values);
		this._oldValues.push(oldValues);

		return true;
	};

	/**
	 * Removing a local combinaison event.
	 *
	 * @method rmCombinaison
	 * @param {String}  name
	 * @return {Boolean} true if success, false if failure
	 */
	EventCombination.prototype.rmCombinaison = function(name) {
		var i, n, len;

		i = this._states.indexOf(name);

		if (i === -1) {
			return false;
		}
		this._states.splice(i, 1);
		this._values.splice(i, 1);
		this._oldValues.splice(i, 1);

		for (i = 0, len = this._eventsBind.length; i < len; ++i) {
			n = this._eventsBind[i].indexOf(name);

			if (n !== -1) {
				if (this._eventsBind[i].length === 1) {
					this._eventsBind.splice(i, 1);
					this._events.splice(i, 1);
					--i;
				}
				else {
					this._eventsBind[i].splice(n, 1);
				}
			}
		}
		return true;
	};

	/**
	 * Callback function who bind a local event with remote event.
	 *
	 * @method _combinationEvent
	 * @param {String}   event
	 * @param {Boolean|Object}   newValue
	 * @private
	 */
	EventCombination.prototype._combinationEvent = function(event, newValue) {
		var i, j, n, len, leng, localEvents, values, modified;

		if (this.enable) {
			i = this._events.indexOf(event);
			if (i === -1) {
				return;
			}

			localEvents = this._eventsBind[i];

			for (i = 0, len = localEvents.length; i < len; ++i) {

				n = this._states.indexOf(localEvents[i]);
				values = this._values[n];

				modified = false;

				for (j = 0, leng = values.length; j < leng; ++j) {

					if (values[j].event === event) {

						values[j].value = newValue;
						modified = true;
					}
				}
				this._modifyState(localEvents[i], values);
			}
		}
	};

	TW.Event.EventCombination = EventCombination;
	return EventCombination;
});

/**
 * @module Event
 * @namespace Event
 */

var TW = TW || {};
define('Event/KeyboardInput',['./EventProvider', '../Utils/inherit', '../Utils/Polyfills'], function(EventProvider, inherit) {

	TW.Event = TW.Event || {};


	/**
	 * EventProvider using the keyboard.
	 *
	 *
	 * Each event represent a key. each key has two _states: `KEY_PRESSED` or `KEY_RELEASED`
	 *
	 *
	 * ## List of keys:
	 *
	 * - KEY_A
	 * - KEY_B
	 * - KEY_C
	 * - KEY_D
	 * - KEY_E
	 * - KEY_F
	 * - KEY_G
	 * - KEY_H
	 * - KEY_I
	 * - KEY_J
	 * - KEY_K
	 * - KEY_L
	 * - KEY_M
	 * - KEY_N
	 * - KEY_O
	 * - KEY_P
	 * - KEY_Q
	 * - KEY_R
	 * - KEY_S
	 * - KEY_T
	 * - KEY_U
	 * - KEY_V
	 * - KEY_W
	 * - KEY_X
	 * - KEY_Y
	 * - KEY_Z
	 * - KEY_0
	 * - KEY_1
	 * - KEY_2
	 * - KEY_3
	 * - KEY_4
	 * - KEY_5
	 * - KEY_6
	 * - KEY_7
	 * - KEY_8
	 * - KEY_9
	 * - KEY_F1
	 * - KEY_F2
	 * - KEY_F3
	 * - KEY_F4
	 * - KEY_F5
	 * - KEY_F6
	 * - KEY_F7
	 * - KEY_F8
	 * - KEY_F9
	 * - KEY_F10
	 * - KEY_F11
	 * - KEY_F12
	 * - KEY_BACKSPACE
	 * - KEY_TAB
	 * - KEY_ENTER
	 * - KEY_SHIFT
	 * - KEY_ALT
	 * - KEY_PAUSE
	 * - KEY_CAPSLOCK
	 * - KEY_ESC
	 * - KEY_SPACE
	 * - KEY_PAGE_UP
	 * - KEY_PAGE_DOWN
	 * - KEY_END
	 * - KEY_HOME
	 * - KEY_LEFT
	 * - KEY_UP
	 * - KEY_RIGHT
	 * - KEY_DOWN
	 * - KEY_INSERT
	 * - KEY_DELETE
	 * - KEY_NUMLOCK
	 *
	 *
	 * <span>
	 * __Note:__
	 * This class use the `keyCode` attribute from KeyboardEvent object.
	 * The code list of [current W3C standard](http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html)
	 * is not implemented and there is differences between each browser.<br />
	 * The [next W3C standard](http://www.w3.org/TR/DOM-Level-3-Events/#keys-keyvalues)
	 * should improve compatibility.<br />
	 * __Currently, using Numeric key (from Keypad or not) with the Shift,
	 * CapsLock or NumLock keys is not possible.__<br />
	 * __Use exotic keys are strongly discouraged.__<br />
	 * <br />
	 * For example, using Chrome 22.0.1229.94 (under Linux) with a fr keyboard, key `&` (key `1` without `Shift`)
	 * are equally to key `7`.
	 * For more information about compatibility,[this document](http://unixpapa.com/js/key.html) provide
	 * a good summary of the situation.
	 *
	 * Usage of arrows keys, and usage of controls keys with alphabetic characters are supported.
	 *
	 *
	 *
	 * @example
	 *
	 *      var keyboard = new KeyboardInput();
	 *      keyboard.addListener("KEY_SPACE", KeyboardInput.KEY_PRESSED, function(event, value, provider) {
     *          if (provider.getState("KEY_CTRL") === KeyboardInput.KEY_PRESSED) {
     *              //CTRL+space is pressed !
     *          }
     *      });
	 *
	 * @class KeyboardInput
	 * @extends Event.EventProvider
	 * @param {HTMLElement} [target]      element to listen keypressed and keyup. default to `window.document`
	 * @constructor
	 */
	function KeyboardInput(target) {
		var i, len;

		EventProvider.call(this);


		if (target === undefined) {
			target = window.document;
		}

		this._states = [];

		//from KEY_A to KEY_Z
		for (i = 0; i < 26; i++) {
			this._states.push('KEY_' + String.fromCharCode('A'.charCodeAt(0) + i));      // charCode MAJ
		}
		//from KEY_F1 to KEY_F12
		for (i = 0; i < 12; i++) {
			this._states.push('KEY_F' + String.fromCharCode('1'.charCodeAt(0) + i)); //      112
		}
		// KEY_0 to KEY_9
		for (i = 0; i < 10; i++) {
			this._states.push('KEY_' + String.fromCharCode('0'.charCodeAt(0) + i));  //      48
		}

		this._states.push('KEY_BACKSPACE', 8);
		this._states.push('KEY_TAB', 9);
		this._states.push('KEY_ENTER', 13);
		this._states.push('KEY_SHIFT', 16);
		this._states.push('KEY_CTRL', 17);
		this._states.push('KEY_ALT', 18);
		this._states.push('KEY_PAUSE', 19);
		this._states.push('KEY_CAPSLOCK', 20);
		this._states.push('KEY_ESC', 27);
		this._states.push('KEY_SPACE', 32);
		this._states.push('KEY_PAGE_UP', 33);
		this._states.push('KEY_PAGE_DOWN', 34);
		this._states.push('KEY_END', 35);
		this._states.push('KEY_HOME', 36);
		this._states.push('KEY_LEFT', 37);
		this._states.push('KEY_UP', 38);
		this._states.push('KEY_RIGHT', 39);
		this._states.push('KEY_DOWN', 40);
		this._states.push('KEY_INSERT', 45);
		this._states.push('KEY_DELETE', 46);
		this._states.push('KEY_NUMLOCK', 144);

		for (i = 0, len = this._states.length; i < len; i++) {
			this._values[i] = KeyboardInput.KEY_RELEASED;
			this._oldValues[i] = KeyboardInput.KEY_RELEASED;
		}

		target.addEventListener("keydown", this._onKeyDown.bind(this), false);
		target.addEventListener("keyup", this._onKeyUp.bind(this), false);
	}

	inherit(KeyboardInput, EventProvider);

	/**
	 * Represent a key pressed state
	 * @property {Boolean} KEY_PRESSED
	 * @static
	 * @readonly
	 */
	KeyboardInput.KEY_PRESSED = true;

	/**
	 *Represent a key released state
	 * @property {Boolean} KEY_RELEASED
	 * @static
	 * @readonly
	 */
	KeyboardInput.KEY_RELEASED = false;


	/**
	 * return the EventProvider type.
	 *
	 * @method getType
	 * @return {String}     "KEYBOARD"
	 */
	KeyboardInput.prototype.getType = function() {
		return "KEYBOARD";
	};

	/**
	 * Called when a key is pressed.
	 *
	 * @method _onKeyDown
	 * @param {KeyboardEvent}  event
	 * @private
	 */
	KeyboardInput.prototype._onKeyDown = function(event) {
		this._modifyState(this._getAssociatedEvent(event), KeyboardInput.KEY_PRESSED);
	};

	/**
	 * Called when a key is released.
	 *
	 * @method _onKeyUp
	 * @param {KeyboardEvent}  event
	 * @private
	 */
	KeyboardInput.prototype._onKeyUp = function(event) {
		this._modifyState(this._getAssociatedEvent(event), KeyboardInput.KEY_RELEASED);
	};

	/**
	 * search a state corresponding to the event object
	 *
	 * @method _getAssociatedEvent
	 * @param {KeyboardEvent}   event
	 * @return {String|null}    name of state changed. null if no state is found.
	 * @private
	 */
	KeyboardInput.prototype._getAssociatedEvent = function(event) {
		if (event.keyCode >= 'A'.charCodeAt(0) && event.keyCode <= 'Z'.charCodeAt(0)) {
			return 'KEY_' + String.fromCharCode(event.keyCode);
		}

		if (event.keyCode >= '0'.charCodeAt(0) && event.keyCode <= '9'.charCodeAt(0)) {
			return 'KEY_' + String.fromCharCode(event.keyCode);
		}

		if (event.keyCode >= 112 && event.keyCode < 124) {
			return 'KEY_F' + String.fromCharCode(111 - event.keyCode);
		}

		switch (event.keyCode) {
			case 8:
				return 'KEY_BACKSPACE';
			case 9:
				return 'KEY_TAB';
			case 13:
				return 'KEY_ENTER';
			case 16:
				return 'KEY_SHIFT';
			case 17:
				return 'KEY_CTRL';
			case 18:
				return 'KEY_ALT';
			case 19:
				return 'KEY_PAUSE';
			case 20:
				return 'KEY_CAPSLOCK';
			case 27:
				return 'KEY_ESC';
			case 32:
				return 'KEY_SPACE';
			case 33:
				return 'KEY_PAGE_UP';
			case 34:
				return 'KEY_PAGE_DOWN';
			case 36:
				return 'KEY_HOME';
			case 37:
				return 'KEY_LEFT';
			case 38:
				return 'KEY_UP';
			case 39:
				return 'KEY_RIGHT';
			case 40:
				return 'KEY_DOWN';
			case 45:
				return 'KEY_INSERT';
			case 46:
				return 'KEY_DELETE';
			case 144:
				return 'KEY_NUMLOCK';
			default:
				return null;
		}
	};

	TW.Event.KeyboardInput = KeyboardInput;
	return KeyboardInput;
});

/**
 * @module Event
 * @namespace Event
 */

var TW = TW || {};
define('Event/MouseInput',['./EventProvider', '../Utils/inherit', '../Utils/Polyfills'], function(EventProvider, inherit) {

	TW.Event = TW.Event || {};

	/**
	 * EventProvider using the mouse.
	 *
	 * Four events are provided:
	 *
	 *  - `MOUSE_MOVE` (object containing `x` and `y` properties)
	 *  - `MOUSE_BUTTON_LEFT` (type boolean)
	 *  - `MOUSE_BUTTON_RIGHT` (type boolean)
	 *  - `MOUSE_BUTTON_MIDDLE` (type boolean)
	 *
	 * Each button is either `MOUSE_PRESSED` or `MOUSE_RELEASED` following the mouse state.<br />
	 * The `MOUSE_MOVE` state contain directly and object representing the position of the object.
	 * At each mouse movement, a new event is created, updating the values.
	 *
	 *
	 * @example
	 *
	 *      var mouse = new MouseInput();
	 *      mouse.addListener("MOUSE_BUTTON_LEFT", MouseInput.BUTTON_PRESSED, function(event, value, provider) {
     *      });
	 *
	 *
	 * @class MouseInput
	 * @extends Event.EventProvider
	 * @constructor
	 * @param {HTMLElement} [target] element listened. Only mouse events on target are considered.
	 *   default to window.document.
	 */
	function MouseInput(target) {
		var i, len;

		EventProvider.call(this);


		if (target === undefined) {
			target = window.document;
		}

		/**
		 * Enable or disable context menu display on right click.
		 *
		 * @property {Boolean} contextMenuActive
		 * @default true
		 */
		this.contextMenuActive = true;

		this._states.push('MOUSE_MOVE');
		this._states.push('MOUSE_BUTTON_LEFT');
		this._states.push('MOUSE_BUTTON_MIDDLE');
		this._states.push('MOUSE_BUTTON_RIGHT');

		for (i = 0, len = this._states.length; i < len; i++) {
			if (this._states[i] === 'MOUSE_MOVE') {
				this._values[i] = {x: undefined, y: undefined};
				this._oldValues[i] = {x: undefined, y: undefined};
			} else {
				this._values[i] = MouseInput.BUTTON_RELEASED;
				this._oldValues[i] = MouseInput.BUTTON_RELEASED;
			}
		}

		target.addEventListener("mousemove", this._onMouseMove.bind(this), false);
		target.addEventListener("mouseup", this._onMouseUp.bind(this), false);
		target.addEventListener("mousedown", this._onMouseDown.bind(this), false);
		target.addEventListener("contextmenu", this._showContextMenu.bind(this), false);
	}

	inherit(MouseInput, EventProvider);

	/**
	 * Represent a button pressed state
	 * @property {Boolean} BUTTON_PRESSED
	 * @static
	 * @readonly
	 */
	MouseInput.BUTTON_PRESSED = true;

	/**
	 *Represent a button released state
	 * @property {Boolean} BUTTON_RELEASED
	 * @static
	 * @readonly
	 */
	MouseInput.BUTTON_RELEASED = false;


	/**
	 * return the EventProvider type.
	 *
	 * @method getType
	 * @return {String}     "MOUSE"
	 */
	MouseInput.prototype.getType = function() {
		return "MOUSE";
	};

	/**
	 * Called when a mouse is moved.
	 *
	 * @method _onMouseMove
	 * @param {MouseEvent}  event
	 * @private
	 */
	MouseInput.prototype._onMouseMove = function(event) {
		this._modifyState('MOUSE_MOVE', {
			x: event.clientX - event.target.getBoundingClientRect().left,
			y: event.clientY - event.target.getBoundingClientRect().top
		});
	};

	/**
	 * Called when a mouse button is released.
	 *
	 * @method _onMouseUp
	 * @param {MouseEvent}  event
	 * @private
	 */
	MouseInput.prototype._onMouseUp = function(event) {
		this._modifyState(this._getAssociatedEvent(event), MouseInput.BUTTON_RELEASED);
	};

	/**
	 * Called when a mouse button is pressed.
	 *
	 * @method _onMouseDown
	 * @param {MouseEvent}  event
	 * @private
	 */
	MouseInput.prototype._onMouseDown = function(event) {
		this._modifyState(this._getAssociatedEvent(event), MouseInput.BUTTON_PRESSED);
	};

	/**
	 * search a state corresponding to the event object
	 *
	 * @method _getAssociatedEvent
	 * @param {MouseEvent}   event
	 * @return {String|null}    name of state changed. null if no state is found.
	 * @private
	 */
	MouseInput.prototype._getAssociatedEvent = function(event) {

		switch (event.button) {
			case 0:
				return 'MOUSE_BUTTON_LEFT';
			case 1:
				return 'MOUSE_BUTTON_MIDDLE';
			case 2:
				return 'MOUSE_BUTTON_RIGHT';
			default:
				return null;
		}
	};

	/**
	 * remove showing of context menu
	 *
	 * @method _showContextMenu
	 * @param {MouseEvent}   event
	 * @private
	 */
	MouseInput.prototype._showContextMenu = function(event) {

		if (this.contextMenuActive === false) {
			event.preventDefault();
		}
	};

	TW.Event.MouseInput = MouseInput;
	return MouseInput;
});

/**
 * @module Event
 * @namespace Event
 */

var TW = TW || {};
define('Event/InputMapper',['./EventProvider', '../Utils/inherit', '../Utils/Polyfills'], function(EventProvider, inherit) {

	TW.Event = TW.Event || {};


	/**
	 * InputMapper is a virtual event provider used to redirect event under an other event.
	 *
	 * It allow to create custom events (user-defined), following others eventProviders.
	 * Its role is to act as an interface, hiding real event which can be changed without the user noticing.
	 *
	 * A typical utilisation is the remapping is to let the choice of controls keyboard to the player.
	 *
	 *      var keyboardEvents = new KeyboardInput();
	 *      var inputMapper = new InputMapper();
	 *
	 *      inputMapper.addEvent("ATTACK");
	 *      inputMapper.bind("ATTACK", "KEY_Q", keyboardEvents);
	 *
	 *      inputMapper.addListener("ATTACK", KeyboardInput.KEY_PRESSED, function(event, value, provider) {
     *      });
	 *
	 * @class InputMapper
	 * @extends Event.EventProvider
	 * @constructor
	 */
	function InputMapper() {

		EventProvider.call(this);

		/**
		 * enable or disable this object.
		 *
		 * @property {Boolean} enable
		 */
		this.enable = true;

		this._binds = [];
	}

	inherit(InputMapper, EventProvider);

	/**
	 * return the EventProvider type.
	 *
	 * @method getType
	 * @return {String}     "MAPPER"
	 */
	InputMapper.prototype.getType = function() {
		return "MAPPER";
	};


	/**
	 * Getting the name of event bind with localEvent.
	 *
	 * @method getRealEvent
	 * @param {String}  localEvent
	 * @return {String} Name of the real event if it exist or null
	 */
	InputMapper.prototype.getRealEvent = function(localEvent) {
		var i;
		i = this._states.indexOf(localEvent);

		if (i === -1) {
			return null;
		}

		return this._binds[i] ? this._binds[i].event : null;
	};


	/**
	 * Getting a array of all no mapped local event.
	 *
	 * @method getNoMappedEvents
	 * @return {Array} Array with all local events who is not already bound
	 */
	InputMapper.prototype.getNoMappedEvents = function() {
		var i, len, arr;

		arr = [];
		for (i = 0, len = this._binds.length; i < len; ++i) {
			if (this._binds[i] === undefined) {
				arr.push(this._states[i]);
			}
		}
		return arr;
	};

	/**
	 * Adding a local event.
	 *
	 * @method addEvent
	 * @param {String}  name
	 * @return {Boolean} true if success, false if failure
	 */
	InputMapper.prototype.addEvent = function(name) {
		if (this._states.indexOf(name) !== -1) {
			return false;
		}

		this._states.push(name);
		this._binds.push(undefined);
		this._values.push(undefined);
		this._oldValues.push(undefined);

		return true;
	};

	/**
	 * Removing a local event.
	 *
	 * @method rmEvent
	 * @param {String}  name
	 * @return {Boolean} true if success, false if failure
	 */
	InputMapper.prototype.rmEvent = function(name) {
		var i;
		i = this._states.indexOf(name);

		if (i === -1) {
			return false;
		}
		this._states.splice(i, 1);
		this._binds.splice(i, 1);
		this._values.splice(i, 1);
		this._oldValues.splice(i, 1);

		return true;
	};

	/**
	 * Bind a remote event to a local event.
	 *
	 * @method bindEvent
	 * @param {String}  localEvent
	 * @param {String}  remoteEvent
	 * @param {EventProvider}  input
	 */
	InputMapper.prototype.bindEvent = function(localEvent, remoteEvent, input) {
		var i, id;
		i = this._states.indexOf(localEvent);

		if (i === -1 || input.getStateList().indexOf(remoteEvent) === -1) {
			return false;
		}

		if (this._binds[i] !== undefined) {
			this._binds[i].input.rmListener(this._binds[i].id);
		}

		id = input.addListener(remoteEvent, this._bindEvent.bind(this));
		this._binds[i] = {event: remoteEvent, input: input, id: id};
		return true;
	};


	/**
	 * Bind a remote event to a local event by listening to the next event of input.
	 *
	 * @method bindListen
	 * @param {String}  localEvent
	 * @param {EventProvider}  input
	 * @param {Function} callback
	 */
	InputMapper.prototype.bindListen = function(localEvent, input, callback) {
		var i, id;
		i = this._states.indexOf(localEvent);

		if (i === -1) {
			return false;
		}

		if (this._binds[i] !== undefined) {
			this._binds[i].input.rmListener(this._binds[i].id);
		}

		this.stopBindListen();

		id = input.addListener(this._bindListenEvent.bind(this));
		this._binds[i] = {event: undefined, input: input, id: id, callback: callback};
		return true;
	};


	/**
	 * Stop a listening of the function bindListen.
	 *
	 * @method stopBindListen
	 */
	InputMapper.prototype.stopBindListen = function() {
		var i, len;

		for (i = 0, len = this._binds.length; i < len; ++i) {
			if (this._binds[i] !== undefined && this._binds[i].event === undefined) {
				this._binds[i].input.rmListener(this._binds[i].id);
				this._binds.splice(i, 1);
				return;
			}
		}
	};

	/**
	 * Callback function who bind a local event with remote event.
	 *
	 * @method _bindEvent
	 * @param {String}   event
	 * @param {Boolean|Object}   newValue
	 * @param {EventProvider}   object
	 * @private
	 */
	InputMapper.prototype._bindEvent = function(event, newValue, object) {
		var i, len;
		if (this.enable) {
			for (i = 0, len = this._binds.length; i < len; ++i) {
				if (this._binds[i] !== undefined && this._binds[i].event === event &&
				    this._binds[i].input === object) {
					this._modifyState(this._states[i], newValue);
				}
			}
		}
	};

	/**
	 * Callback function who bind a local event with remote event when bindListen is run.
	 *
	 * @method _bindListenEvent
	 * @param {String}   event
	 * @param {Boolean|Object}   newValue
	 * @param {EventProvider}   object
	 * @private
	 */
	InputMapper.prototype._bindListenEvent = function(event, newValue, object) {
		var i, len;
		for (i = 0, len = this._binds.length; i < len; ++i) {
			if (this._binds[i] !== undefined && this._binds[i].event === undefined &&
			    this._binds[i].input === object) {

				this._binds[i].input.rmListener(this._binds[i].id);
				if (this._binds[i].callback !== undefined) {
					this._binds[i].callback(event);
				}
				this.bindEvent(this._states[i], event, object);
			}
		}
	};

	TW.Event.InputMapper = InputMapper;
	return InputMapper;
});

/**
 * The event module provide all tools for catching input events, manipulate them and generate custom events.
 *
 * All events represent a state changeling from
 * an {{#crossLink "Event.EventProvider"}}EventProvider{{/crossLink}}.<br />
 * Because an event is not useful without data, each event provider has a number of custom states,
 * defined in the documentation.
 *
 * Each time a state change, an event is detected and all callbacks listening this event are called.
 * Because all classes have a common format, it's possible to easy combine and manipulate many providers.
 *
 * ## Input provider
 *
 * Two eventProviders are defined, giving access to the two most used input:
 * {{#crossLink "Event.KeyboardInput"}}Keyboard{{/crossLink}}
 * and {{#crossLink "Event.MouseInput"}}MouseInput{{/crossLink}}.<br />
 * States available are mouse position, main mouse buttons, and all standard keyboard keys.
 *
 * ## Manipulate events
 *
 * The {{#crossLink "Event.InputMapper"}}InputMapper{{/crossLink}} class provide an easy way to hide real used event,
 * allowing you to easily change an event (like specific keyboard key) for an action given.
 *
 * {{#crossLink "Event.EventCombination"}}EventCombination{{/crossLink}} can group severals events,
 * for create new composed event (like a 'CTRL + X' shortcut, for example)
 *
 * @module Event
 * @main
 */

var TW = TW || {};

define('Event',[
	       './Event/EventProvider',
	       './Event/EventCombination',
	       './Event/KeyboardInput',
	       './Event/MouseInput',
	       './Event/InputMapper'
       ], function() {
	return TW.Event;
});


/**
 * @module GameLogic
 * @namespace GameLogic
 */


var TW = TW || {};
define('Gamelogic/Gameloop',['../Utils/Polyfills'], function() {

	TW.GameLogic = TW.GameLogic || {};


	var animFrame = window.requestAnimationFrame ||
	                window.webkitRequestAnimationFrame ||
	                window.mozRequestAnimationFrame ||
	                window.oRequestAnimationFrame ||
	                window.msRequestAnimationFrame ||
	                null;
	var cancelAnimFrame = window.cancelAnimationFrame ||
	                      window.webkitCancelAnimationFrame ||
	                      window.mozCancelAnimationFrame ||
	                      window.oCancelAnimationFrame ||
	                      window.msCancelAnimationFrame ||
	                      null;

	/**
	 * A class to manage the game logic and time.
	 * Provide the simplest way to use a regular loop, splitting draw and update.
	 * All elements added in `object` are updated and draw when te loop is started.
	 *
	 *
	 * Elements can be added with {{#crossLink "GameLogic.Gameloop/addObject"}}{{/crossLink}} and
	 * {{#crossLink "GameLogic.Gameloop/rmObject"}}{{/crossLink}}. All kind of elements are supported:
	 * if it's a function, it will be called during the update phase.
	 * If it's an object, the gameloop search `update` and `draw` method for call them.
	 *
	 * Note that you can safety call {{#crossLink "GameLogic.Gameloop/rmObject"}}{{/crossLink}}
	 * during an update or draw phase:
	 * the element will be deleted at the end of phase.
	 *
	 *     var gl = new Gameloop();
	 *     var win = new Window(canvasContext);
	 *
	 *     gl.add(win);
	 *
	 *     var nextRectTime = 5000;
	 *     gl.add(function(elapsedTime) {
	 *          nextRectTime -= elapsedTime;
	 *
	 *          //All 5sec, a rect is added.
	 *          if (nextRectTime < 0) {
	 *              var rect = new Rect({
	 *                  x: Math.random() * 200
	 *                  y: Math.random() * 200
	 *              });
	 *
	 *              //no need to add the rect to gl: gl will draw the window, which will draw the rects.
	 *              win.addChild(rect);
	 *              nextRectTime = 5000;
	 *          }
	 *     });
	 *
	 * Gameloop also provides some interesting method for measure performances with
	 * {{#crossLink "GameLogic.Gameloop/getRealFPS"}}{{/crossLink}} and
	 * {{#crossLink "GameLogic.Gameloop/getRealTPS"}}{{/crossLink}}.
	 *
	 * @class Gameloop
	 *
	 * @constructor
	 */
	function Gameloop() {
		this._lastId = 0;
		this._updateHandler = null;
		this._drawHandler = null;
		this._fpsObject = {
			fpsAmount:      0,
			dateRepository: new Date(),
			counter:         0
		};
		this._timeLastUpdate = new Date().getTime();
		this._tpsObject = {
			tpsAmount:      0,
			dateRepository: new Date(),
			counter:         0
		};
		this.objectToSuppress = [];

		/**
		 * a Date object which represents the instant when you called
		 * the start method of the gameloop. `null` if not started.
		 *
		 * @property {Date} startDate
		 * @readonly
		 */
		this.startDate = null;

		/**
		 The value that limits the maximum number of frames per second.
		 Used only if requestAnimationFrame is not found
		 .       Note: changes are effective only when gameloop is restarted.

		 @property {Number} fps
		 @default 30
		 */
		this.fps = 30;

		/**
		 The frequency of function calls update
		 Note: changes are effective only when gameloop is restarted.

		 @property {Number} tickPerSecond
		 @default 60
		 */
		this.tickPerSecond = 60;


		/**
		 * array which contains all games elements.
		 * You must add elements to `object` for updating
		 * and drawing these elements.
		 *
		 * If an element is a function, it's called during update phase.
		 * If it's an object, its draw function will be called during draw phase,
		 * an its update function during update phase.
		 * If a function does not exist, the gameloop will ignore it. update and draw functions are not mandatory.
		 *
		 * @property {Array} object
		 * @protected
		 */
		this.object = [];
	}

	/**
	 * this method returns the average fps off ten seconds.
	 *
	 * @method getRealFPS
	 * @return {Number} returns the average fps off ten seconds.
	 */
	Gameloop.prototype.getRealFPS = function() {
		return this._fpsObject.fpsAmount;
	};

	/**
	 * This method returns the average of TPS (average of update calls) in ten seconds.
	 *
	 * @method getRealTPS
	 * @return {Number} returns the average of tps in ten seconds.
	 */
	Gameloop.prototype.getRealTPS = function() {
		return this._tpsObject.tpsAmount;
	};

	/**
	 * This method allows you to add an object to the Gameloop.
	 * when the gameloop is refreshing itself it tries to call the update and draw function of each object which
	 * are in its list. You can add any kind of object. you should add draw and update method to these objects
	 * because the gameloop will call them each cycle.
	 *
	 * @method addObject
	 * @param {Object} object it is an object which will be added to the Gameloop's internal list.
	 */
	Gameloop.prototype.addObject = function(object) {
		this.object.push(object);
	};

	/**
	 * This method allows you to remove an object from the Gameloop's list.
	 *
	 * @method rmObject
	 * @param {Object} object a reference to the object that you want to suppress from the Gameloop's list.
	 */
	Gameloop.prototype.rmObject = function(object) {
		this.objectToSuppress.push(object);
	};

	/**
	 * start or unpause the gameloop.
	 * If gameloop is already stated, do nothing.
	 *
	 * @method start
	 */
	Gameloop.prototype.start = function() {
		this.startDate = new Date();
		if (this._updateHandler === null) {
			this._updateHandler = setInterval(this.update.bind(this),
			                                   1000 / this.tickPerSecond);
		}
		if (this._drawHandler === null) {
			if (animFrame !== null) {
				this._drawHandler = animFrame(this.draw.bind(this));
			} else {
				//Compatibility mode
				this._drawHandler = setInterval(this.draw.bind(this), 1000 / this.fps);
			}
		}
	};

	/**
	 * stop the update Gameloop
	 * Elements are still drawn, but not updated.
	 * You can resume the game with start
	 *
	 * @method pause
	 */
	Gameloop.prototype.pause = function() {
		if (this._updateHandler !== null) {
			clearInterval(this._updateHandler);
			this._updateHandler = null;
		}
	};

	/**
	 * stop the gameloop
	 * Both update and draw are stopped.
	 * The elements are not removed, so you can use start to resume play.
	 * If you need to keep the screen displayed, you should instead use pause.
	 *
	 * @method stop
	 */
	Gameloop.prototype.stop = function() {
		this.pause();
		if (this._drawHandler !== null) {
			if (animFrame !== null && cancelAnimFrame !== null) {
				cancelAnimFrame(this._drawHandler);
			} else {
				clearInterval(this._drawHandler);
			}
			this._drawHandler = null;
		}
	};

	/**
	 * indicate if the loop is active or not.
	 *
	 * @method isRunning
	 * @return {Boolean} `true` if loop is running; `false` if the loop is stopped or paused.
	 */
	Gameloop.prototype.isRunning = function() {
		return (this._updateHandler !== null);
	};


	/**
	 * update the logic one step.
	 * called automatically each step by start.
	 *
	 * @method update
	 */
	Gameloop.prototype.update = function() {
		var currentDate = new Date();
		var nbToSuppress = this.objectToSuppress.length;
		for (var indexObjectToSuppress = 0; indexObjectToSuppress < nbToSuppress; indexObjectToSuppress++) {
			for (var indexObject = 0; indexObject < this.object.length; indexObject++) {
				if (this.objectToSuppress[indexObjectToSuppress] === this.object[indexObject]) {
					this.object.splice(indexObject, 1);
					indexObject--;
				}
			}
		}
		this.objectToSuppress = [];

		for (var i = 0; i < this.object.length; i++) {
			if (typeof this.object[i] === "function") {
				this.object[i](currentDate.getTime() - this._timeLastUpdate);
			}
			if (typeof this.object[i] === "object") {
				if (typeof this.object[i].update !== "undefined") {
					this.object[i].update(currentDate.getTime() - this._timeLastUpdate);
				}
			}
		}
		this._tpsObject.counter++;
		var time;
		time = currentDate.getTime();
		if (time - this._tpsObject.dateRepository.getTime() >= 1000) {
			this._tpsObject.dateRepository = new Date();
			this._tpsObject.tpsAmount = this._tpsObject.counter;
			this._tpsObject.counter = 0;
		}
		this._timeLastUpdate = currentDate.getTime();
	};

	/**
	 * draw the content of gameloop.
	 * called automatically at the beginning of each step.
	 *
	 * @method draw
	 */
	Gameloop.prototype.draw = function() {
		for (var i = 0; i < this.object.length; i++) {
			if (typeof this.object[i] === "object" &&
			    typeof this.object[i].draw !== "undefined") {
				this.object[i].draw();
			}
		}
		if (animFrame !== null) {
			this._drawHandler = animFrame(this.draw.bind(this));
		}
		this._fpsObject.counter++;
		var time;
		time = new Date().getTime();
		if (time - this._fpsObject.dateRepository.getTime() >= 1000) {
			this._fpsObject.dateRepository = new Date();
			this._fpsObject.fpsAmount = this._fpsObject.counter;
			this._fpsObject.counter = 0;
		}
	};

	TW.GameLogic.Gameloop = Gameloop;
	return Gameloop;
});

/**
 * @module GameLogic
 * @namespace GameLogic
 */

var TW = TW || {};
define('Gamelogic/GameStateStack',[], function() {

	TW.GameLogic = TW.GameLogic || {};


	/**
	 * This class allows you to manipulate some GameStates. It is quite useful and widely used in Game Programming
	 * The default usage of this GameStateStack is to be added to a Gameloop which will call periodically the
	 * GameStateStack's update and draw methods.
	 * The GameStateStack class act like the Window class. When you create a GameStateStack object you must give
	 * it a canvas.
	 * You can add and suppress GameState objects from the GameStateStack.
	 * The main difference with the Window class is that the GameStateStack organize Layers in differents GameStates.
	 * And the focused GameState can change be change at runtime.
	 *
	 * Let's take an example, you want to do a little game which contains 2 states :
	 *
	 * - Paused
	 * - In Game
	 *
	 * Each state have to contains its own layers which represent it. But it is not the purpose of this Class.
	 * Refer to GameState class for more informations about that.
	 *
	 * You have to add the first State to the GameStateStack, in our case it is the "In Game" state.
	 * Then you can add the GameStateStack to the Gameloop.
	 * Then during updating process. Your "In Game" state will be updated. And during its update it can change the
	 * current state of the GameStateStack.
	 * For example, if the "In Game" state detect that you have pressed "space" to set the game in pause.
	 * Then a new State must be pushed to the GameStateStack which will be the "Paused" state.
	 *
	 * Then, the pause state will be the focused state. if it detects that the "space" key is pressed again. Then the
	 * current state of the GameStateStack must be poped.
	 * Then, the current state will be again the "In Game" state, and it will be resume where the "pause" state have
	 * been created.
	 * That's why this class is called a Stack, because internally, the GameStates are stacked and saved. It allows you
	 * to manage and save differents states.
	 * Like in the previous example you can save the current state of the game and set it in pause.
	 *
	 * Note that all the States are drawn on the canvas during draw procedure. Also note that only the last State which
	 * have been added to the GameState is updated.
	 * That's why all other states are paused. Because they are no more updated.
	 *
	 * @class GameStateStack
	 * @constructor
	 * @param {HTMLCanvasElement} canvas the canvas on which the States will be drawn.
	 */
	function GameStateStack(canvas) {
		this.viewStack = [];
		if (canvas) {
			this.localContext = canvas.getContext("2d");
		} else {
			this.localContext = null;
		}
	}

	/**
	 * This method allows you to add a State to the GameStateStack. Notice that when you push a GameState other states
	 * will be paused, It means that only the State that you've add to the GameStatePattern will be updated.
	 *
	 * @method push
	 * @param {GameState} gameState The gameState which will be the current GameState to be active.
	 */
	GameStateStack.prototype.push = function(gameState) {
		if (this.viewStack.length > 0) {
			this.viewStack[this.viewStack.length - 1].onSleep();
		}
		this.viewStack.push(gameState);
		gameState.setGameStateStack(this);
		gameState.onCreation();
	};

	/**
	 * This method allows you to destroy the current GameState. Notice that when you pop a GameState it will be
	 * destroyed and the previous state will be resume.
	 *
	 * @method pop
	 */
	GameStateStack.prototype.pop = function() {
		if (this.viewStack.length > 0) {
			var index = this.viewStack.length - 1;
			this.viewStack[index].onDelete();
			this.viewStack.splice(index, 1);
		}
		if (this.viewStack.length > 0) {
			this.viewStack[this.viewStack.length - 1].onWakeUp();
		}
	};

	/**
	 * This method try to find a State in the stack which has a specific name.
	 * It allows you to jump from a state to another.
	 *
	 * @method goToState
	 * @param {String} name this parameter specify the name of the state to find in the stack.
	 * @return {Boolean} returns true if a state with the specified name has been finded and set active on the stack.
	 * Otherwise it will return false.
	 */
	GameStateStack.prototype.goToState = function(name) {
		var length = this.viewStack.length;
		for (var i = length - 1; i >= 0; i--) {
			if (this.viewStack[i].name === name) {
				this.viewStack[length - 1].onSleep();
				for (var j = i + 1; j < length; j++) {
					this.viewStack[j].onDelete();
				}
				this.viewStack.splice(i + 1, length - i);
				this.viewStack[i].onWakeUp();
				return true;
			}
		}
		return false;
	};

	/**
	 * This method allows you to update the GameStateStack, notice that only the last GameState will be updated.
	 *
	 * @method update
	 * @param elapsedTime
	 */
	GameStateStack.prototype.update = function(elapsedTime) {
		if (this.viewStack.length > 0) {
			this.viewStack[this.viewStack.length - 1].update(elapsedTime);
		}
	};

	/**
	 * This method allows you to draw the GameStateStack, notice that all the GameState will be drawn. From the last
	 * GameState to the first.
	 *
	 * @method draw
	 */
	GameStateStack.prototype.draw = function() {
		if (this.localContext) {
			this.localContext.clearRect(0, 0, this.localContext.canvas.width, this.localContext.canvas.height);
			for (var i = 0; i < this.viewStack.length; i++) {
				this.viewStack[i].draw(this.localContext);
			}
		}
	};

	TW.GameLogic.GameStateStack = GameStateStack;
	return GameStateStack;
});

/**
 * @module Utils
 * @namespace Utils
 */

var TW = TW || {};
define('Utils/copyParam',[], function() {

	TW.Utils = TW.Utils || {};

	/**
	 * copy all allowed variables from `params` to `target`, using `defaultContext` for set default values.
	 *
	 * *Note: `inherit` is not a class but a standalone function.*
	 *
	 * `copyParam` is used principally for easily copy parameters from hash objects.
	 * All variables must be present in `defaultContext`,
	 * so adding an unespected variable will not override `target` object.
	 * All values in `defayultContext` are also copied as default values.
	 *
	 * If you want to allow some properties, but not to set default value,
	 * you can create the property and set it to undefined.
	 *
	 * @example:
	 *
	 *      var target = {};
	 *      var defaultContext = {
	 *          foo:    "default value",
	 *          bar:    33,
	 *          baz:    undefined           // baz is allowed, but has not default value.
	 *      };
	 *
	 *      Utils.copyParam(target, { foo: "some value", unknown: 3 }, defaultContext);
	 *      console.log(target);
	 *      // Object {foo: "some value", bar: 33}
	 *      //unknown is not copied because not allowed.
	 *
	 * @class copyParam
	 * @constructor
	 *
	 * @param {Object} target
	 * @param {Object} params
	 * @param {Object} defaultContext
	 */
	TW.Utils.copyParam = function(target, params, defaultContext) {
		for (var i in defaultContext) {
			if (defaultContext.hasOwnProperty(i)) {
				if (typeof params !== "undefined" && typeof params.hasOwnProperty === "function" &&
				    params.hasOwnProperty(i)) {
					target[i] = params[i];
				} else if (defaultContext[i] !== undefined) {
					target[i] = defaultContext[i];
				}
			}
		}
	};

	return TW.Utils.copyParam;
});

/**
 * @module GameLogic
 * @namespace GameLogic
 */

var TW = TW || {};
define('Gamelogic/GameState',['../Utils/copyParam'], function(copyParam) {

	TW.GameLogic = TW.GameLogic || {};


	/**
	 * The GameState class provides an object which handle severals methods which can be called by the GameStateStack.
	 * Each GameState object contains some methods :
	 *
	 * - onUpdate       this method is called when the GameState is updating.
	 * - onDraw         this method is called when the GameState is drawing
	 * - onCreation     this method is called when the GameState is added to a GameStateStack
	 * - onDelete       this method is called when the GameState is removed from a GameStateStack
	 * - onSleep        this method is called when the GameState looses the focus.
	 * - onWakeUp       this method is called when the GameState takes back the focus.
	 *
	 * There are two ways to define these methods:
	 *
	 * - If you have a lot of code for the state, you can inherit from `GameState` and override these methods.
	 *   Or more simply directly redefine a method of an instance :
	 *
	 *         var myGameState = new GameState();
	 *         myGameState.onUpdate = myOnUpdateFunc;
	 *         myGameState.onDraw = myOnDrawFunc;
	 *
	 * - For a little state, with just few code, methods can be passed in arguments:
	 *
	 *         new GameState({
	 *              onUpdate: function(elapsedTime) {
	 *                  //before update
	 *              },
	 *              onDraw() {
	 *                  //before draw
	 *              }
	 *         });
	 *
	 *
	 * You can also insert Layers into the GameState. You can sort them by their z-index in asc or desc order.
	 * Layers allows you to render something on the context of the GameStateStack.
	 *
	 * You can also insert Callbacks into the GameState some callbacks which will be executed when the
	 * GameState is updating.
	 * Notice that callbacks are executed after the onUpdate event.
	 * You can sort the callbacks by specifiying a priority order.
	 *
	 * Note that you can also interact with the GameStateStack which own the GameState object.
	 * You can :
	 * - push states
	 * - pop states
	 * - go to a special state in the stack
	 *
	 * Here is an example on which i show how you can push state, pop state and go to a special state :
	 *
	 *     this.getGameStateStack().push(newState);
	 *     this.getGameStateStack().pop();
	 *     this.getGameStateStack().goToState("state_name");
	 *
	 * @class GameState
	 * @constructor
	 * @param {Object} params this object should contain severals members
	 *   @param {String} [params.name] which is the name of the State.
	 *   @param {Boolean} [params.sortLayerAsc=true] which is a boolean.
	 *   It must be equal to true if you want to sort Layers by ascendant order.
	 *   Otherwise it must be equal to false. Default value equals true.
	 *   @param {Boolean} [params.sortCallbackAsc=true] which is a boolean. It must be equal to true if you
	 *   want to sort Callbacks by ascendant order. Otherwise it must be equal to false. default value equals true.
	 *   @param {Function} [params.onUpdate] called when the GameState is updating.
	 *   @param {Function} [params.onDraw] called when the GameState is drawing.
	 *   @param {Function} [params.onCreation] called when the GameState is added to a GameStateStack.
	 *   @param {Function} [params.onDelete] called when the GameState is removed from a GameStateStack.
	 *   @param {Function} [params.onSleep] called when the GameState looses the focus.
	 *   @param {Function} [params.onWakeUp] called when the GameState takes back the focus.
	 */
	function GameState(params) {
		this._gameStateStack = null;
		this._layerList = [];
		this._callbackList = [];

		copyParam(this, params, {

			/**
			 * the name which is associated to the current GameState
			 *
			 * @property {String} name
			 */
			name:            "",

			/**
			 * The setSortLayer order allows you to define the sort order of the Layers.
			 * Note that the Layers are ordered by their z-index values.
			 *
			 * If it is `true` the  layers will be sort by ascendant order.
			 * Otherwise, your layers will be sorted by descendant order.
			 *
			 * @property {Boolean} sortLayerAsc
			 */
			sortLayerAsc:    true,

			/**
			 * The setCallbackOrder order allows you to define the sort order of the Callbacks
			 * If it is `true` the layers will be sort by ascendant order.
			 * Otherwise, the layers will be sorted by descendant order.
			 *
			 * @property {Boolean} sortCallbackAsc
			 */
			sortCallbackAsc: true,

			/**
			 * method called before each update. Can be overridden or given as argument to the constructor.
			 *
			 * @method onUpdate
			 * @param {Number} elapsedTime represents the amount of milliseconds elapsed since the last update call.
			 */
			/* jshint unused:false */
			onUpdate:        function(elapsedTime) {
			},

			/**
			 * method called before each draw. Can be overridden or given as argument to the constructor.
			 *
			 * @method onDraw
			 */
			onDraw: function() {
			},

			/**
			 * method called when the state is created and placed on the stack.
			 * Can be overridden or given as argument to the constructor.
			 *
			 * @method onCreation
			 */
			onCreation: function() {
			},

			/**
			 * method called when the state is removed from the stack.
			 * Can be overridden or given as argument to the constructor.
			 *
			 * **Note:** The state object is not always really deleted, and can be reused later.
			 * This method should put the GameState as if it has never been used.
			 *
			 * @method onDelete
			 */
			onDelete: function() {
			},

			/**
			 * method called when the state becomes active.
			 * Can be overridden or given as argument to the constructor.
			 *
			 * @method onWakeUp
			 */
			onWakeUp: function() {
			},

			/**
			 * method called when the state is put to sleep (another state becomes active).
			 * Can be overridden or given as argument to the constructor.
			 *
			 * @method onSleep
			 */
			onSleep: function() {
			}
		});
	}


	/**
	 * The addLayer function allow you to add a Layer to the GameState.
	 * By default the addLayer method order Layers by ascendant order by their z-depth values.
	 *
	 * @method addLayer
	 * @param {TW.Graphic.Layer} layer the Layer which will have to be added to the GameState.
	 */
	GameState.prototype.addLayer = function(layer) {
		this._layerList.push(layer);
		this.sortLayers();
	};

	/**
	 * This method allows you to remove a layer from the GameState.
	 *
	 * @method removeLayer
	 * @param {TW.Graphic.Layer} refLayer a reference to the layer that you want to suppress from the GameState.
	 * @return {Boolean} if the refLayer have been successfully finded and suppressed from the GameState object it will
	 * returns true. Otherwise it will returns false.
	 */
	GameState.prototype.removeLayer = function(refLayer) {
		for (var i = 0; i < this._layerList.length; i++) {
			if (refLayer === this._layerList[i]) {
				this._layerList.splice(i, 1);
				return true;
			}
		}
		return false;
	};

	/**
	 * The addCallback function allow you to add a callback to the current GameState object.
	 *
	 * @method addCallback
	 * @param {Object} param This object must contain a number called 'priority' and a reference to the callback
	 * called 'callback'.
	 * @param {Number} [param.priority] represent the execution priority of the callback.
	 * @param {Function} [param.callback] represent the function to execute.
	 * @return {Boolean} return true if param contains a priority and a callback members. otherwise it will
	 * returns false.
	 */
	GameState.prototype.addCallback = function(param) {
		if (param.priority && param.callback) {
			this._callbackList.push(param);
			this.sortCallbacks();
			return true;
		} else {
			return false;
		}
	};

	/**
	 * This method allows you to remove a callback from the current GameState object.
	 *
	 * @method removeCallback
	 * @param {Function} refCallback a reference to the callback function to remove from the current GameState object.
	 * @return {Boolean} if the refCallback have been successfully finded and suppressed then the method will return
	 * true. Otherwise it will return false.
	 */
	GameState.prototype.removeCallback = function(refCallback) {
		for (var i = 0; i < this._callbackList.length; i++) {
			if (refCallback === this._callbackList[i]) {
				this._callbackList.splice(i, 1);
				return true;
			}
		}
		return false;
	};

	/**
	 * The sortLayers method allow you to sort layers by their z-order.
	 *
	 * @method sortLayers
	 */
	GameState.prototype.sortLayers = function() {
		if (this.sortLayerAsc === true) {
			this._layerList.sort(function(a, b) {
				return a.zIndex - b.zIndex;
			});
		} else {
			this._layerList.sort(function(a, b) {
				return b.zIndex - a.zIndex;
			});
		}
	};

	/**
	 * The sortCallbacks method allow you yo sort callbacks by their priority member.
	 *
	 * @method sortCallbacks
	 */
	GameState.prototype.sortCallbacks = function() {
		if (this.sortCallbackAsc === true) {
			this._callbackList.sort(function(a, b) {
				return a.priority - b.priority;
			});
		} else {
			this._callbackList.sort(function(a, b) {
				return b.priority - a.priority;
			});
		}
	};

	/**
	 * This method allows you to set the GameStateStack parent of the gameState. Note that this method
	 * is use internally
	 * by the GameStateStack implementation.
	 * You should not use it from your own.
	 *
	 * @private
	 * @method setGameStateStack
	 * @param {GameStateStack} gameStateStack represents the gameStateStack object which the GameState object
	 * belongs to.
	 */
	GameState.prototype.setGameStateStack = function(gameStateStack) {
		this._gameStateStack = gameStateStack;
	};

	/**
	 * This method allows you to get the GameStateStack pattern which the current gameState belongs to.
	 *
	 * @method getGameStateStack
	 * @return {GameStateStack} if the current GameState object have not already been linked with a GameStateStack
	 * it will return null.
	 */
	GameState.prototype.getGameStateStack = function() {
		return this._gameStateStack;
	};

	/**
	 * This method is private, you do not have to use it, it is used internally by the GameStateStack class.
	 *
	 * @method update
	 * @param {Number} elapsedTime time elapsed since last update call.
	 */
	GameState.prototype.update = function(elapsedTime) {
		this.onUpdate(elapsedTime);
		for (var i = 0; i < this._callbackList.length; i++) {
			this._callbackList[i]();
		}
	};

	/**
	 * This method is private, you do not have to use it, it is used internally by the GameStateStack class.
	 *
	 * @method draw
	 * @param {CanvasRenderingContext2D} canvasContext graphicalContext on which graphical contents will be drawn.
	 */
	GameState.prototype.draw = function(canvasContext) {
		this.onDraw();
		for (var i = 0; i < this._layerList.length; i++) {
			this._layerList[i].draw(canvasContext);
		}
	};

	TW.GameLogic.GameState = GameState;
	return GameState;
});

/**
 * This module contain all classes relating to time management and
 * scheduling actions by object or group objects.
 *
 * The {{#crossLink "GameLogic.Gameloop"}}Gameloop{{/crossLink}} class is the first brick for make a new game,
 * Playing and pausing the game easily.
 *
 * FOr more advanced usage, the {{#crossLink "GameLogic.GameState"}}GameState{{/crossLink}} and
 * {{#crossLink "GameLogic.GameStateStack"}}GameStateStack{{/crossLink}} classes provides an useful implementation
 * of the pattern GameState.
 *
 * @module GameLogic
 * @main
 */


var TW = TW || {};

define('Gamelogic',[
	       './Gamelogic/Gameloop',
	       './Gamelogic/GameStateStack',
	       './Gamelogic/GameState'
       ], function() {
	return TW.Gameloop;
});


/**
 * @module Math
 * @namespace Math
 */

var TW = TW || {};
define('Math/Matrix2D',['./Vector2D'], function(Vector2D) {

	TW.Math = TW.Math || {};


	/**
	 * Matrix2D class, represent a matrix object
	 * for perform geometric calculus.
	 * The default matrix is the identity matrix.
	 *
	 * @class Matrix2D
	 * @constructor
	 *
	 * @example
	 *`new Matrix2D()` generate this matrix:
	 *
	 *     [1 0 0]
	 *     [0 1 0]
	 *     [0 0 1]
	 */
	function Matrix2D() {

		/**
		 * Internal data that represent matrix.
		 *
		 * **Note that datas are given in column major order.**
		 *
		 * @property {Array} data
		 * @example
		 *
		 *     [[1, 0, 0],
		 *      [0, 1, 0],
		 *      [0, 0, 1]]
		 *
		 */
		this.data = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];
	}

	/**
	 * Check if the current matrix match the identity.
	 *
	 * @method isIdentity
	 * @return {Boolean} `true` if the current matrix is set to the identity, otherwise it returns `false`.
	 */
	Matrix2D.prototype.isIdentity = function() {
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				if (this.data[i][j] !== (i === j ? 1 : 0)) {
					return false;
				}
			}
		}
		return true;
	};


	/**
	 * Set the current matrix to the specified scalars (a, b, c, d, e, f).
	 * **Note that the parameters are given in column major order.**
	 *
	 * @method setTransform
	 * @param a represent the top-left scalar in the matrix
	 * @param b represent the middle-left scalar in the matrix
	 * @param c represent the top-center scalar in the matrix
	 * @param d represent the middle-middle scalar in the matrix
	 * @param e represent the top-left scalar in the matrix
	 * @param f represent the middle-right scalar in the matrix
	 * @chainable
	 *
	 * After a `setTransform` call, your matrix will look like :
	 *
	 *     [a c e]
	 *     [b d f]
	 *     [0 0 1]
	 */
	Matrix2D.prototype.setTransform = function(a, b, c, d, e, f) {
		this.data[0][0] = a;
		this.data[0][1] = b;
		this.data[1][0] = c;
		this.data[1][1] = d;
		this.data[2][0] = e;
		this.data[2][1] = f;
		return this;
	};

	/**
	 * Transform the current matrix by the scalars a,b,c,d,e,f.
	 * If C if our current matrix and B the matrix made by a,b,c,d,e,f scalars. Then, the transform will be :
	 *
	 *       C Matrix      B matrix
	 *     [Ca, Cc, Ce]   [a, c, e]
	 *     [Cb, Cd, Cf] X [b, d, f]
	 *     [0,  0,   1]   [0, 0, 1]
	 *
	 * @method transform
	 * @param a
	 * @param b
	 * @param c
	 * @param d
	 * @param e
	 * @param f
	 * @chainable
	 */
	Matrix2D.prototype.transform = function(a, b, c, d, e, f) {
		var matrix = new Matrix2D();
		matrix.setTransform(a, b, c, d, e, f);
		this.multiplyMatrix(matrix);
		return this;
	};

	/**
	 * Get a copy of the current state of the matrix by a 2d array of floats.
	 *
	 * **Note: if you want to modify the matrix, you can access directly to `matrix.data`**
	 *
	 * @method getData
	 * @return {Array} data return the internal data array of the matrix (In column-major order).
	 */
	Matrix2D.prototype.getData = function() {
		return [
			[this.data[0][0], this.data[0][1]],
			[this.data[1][0], this.data[1][1]],
			[this.data[2][0], this.data[2][1]]
		];
	};

	/**
	 * Set the current matrix to identity.
	 *
	 * @method identity
	 * @chainable
	 */
	Matrix2D.prototype.identity = function() {
		this.setTransform(1, 0, 0, 1, 0, 0);
		return this;
	};

	/**
	 * multiplies the current matrix by scale matrix
	 *
	 * @method scale
	 * @param {Number} x multiplier of abscissa
	 * @param {Number} y multiplier of ordinate
	 * @chainable
	 */
	Matrix2D.prototype.scale = function(x, y) {
		var tmpMatrix = new Matrix2D();
		tmpMatrix.setTransform(x, 0, 0, y, 0, 0);
		tmpMatrix.multiplyMatrix(this);
		this.data = tmpMatrix.data;
		return this;
	};

	/**
	 * Apply a rotation to this matrix.
	 *
	 * @method rotate
	 * @param {Number} angle in degrees
	 * @chainable
	 */
	Matrix2D.prototype.rotate = function(angle) {
		var tmpMatrix = new Matrix2D();
		var radAngle = angle / 180 * Math.PI;
		tmpMatrix.setTransform(Math.cos(radAngle), Math.sin(radAngle),
		                        -Math.sin(radAngle), Math.cos(radAngle),
		                        0, 0);
		tmpMatrix.multiplyMatrix(this);
		this.data = tmpMatrix.data;
		return this;
	};

	/**
	 * Apply a translation to this matrix.
	 *
	 * @method translate
	 * @param {Number} x translation in abscissa
	 * @param {Number} y translation in ordinate
	 * @chainable
	 */
	Matrix2D.prototype.translate = function(x, y) {
		var tmpMatrix = new Matrix2D();
		tmpMatrix.setTransform(1, 0, 0, 1, x, y);
		tmpMatrix.multiplyMatrix(this);
		this.data = tmpMatrix.data;
		return this;
	};

	/**
	 *Transform the current matrix to apply a skew.
	 *
	 * @method skew
	 * @param a the x skew factor
	 * @param b the y skew factor
	 * @return {Matrix2D} return the current matrix that have been transformed by the skew.
	 * @chainable
	 */
	Matrix2D.prototype.skew = function(a, b) {
		var tmpMatrix = new Matrix2D();
		tmpMatrix.setTransform(1, a, b, 1, 0, 0);
		tmpMatrix.multiplyMatrix(this);
		this.data = tmpMatrix.data;
		return this;
	};


	/**
	 * create a copy of the matrix.
	 *
	 * @method copyMatrix
	 * @return {Matrix2D} the new matrix
	 */
	Matrix2D.prototype.copy = function() {
		var matrix = new Matrix2D();
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				this.data[i][j] = matrix.data[i][j];
			}
		}
		return matrix;
	};

	/**
	 * Compute the product of two matrix
	 *
	 * @method multiply
	 * @param {Matrix2D} matrix the matrix to multiplies
	 * @chainable
	 */
	Matrix2D.prototype.multiplyMatrix = function(matrix) {
		if (!(matrix instanceof Matrix2D)) {
			throw new Error("bad type argument: matrix");
		}

		var tmpMatrix = new Matrix2D();
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				tmpMatrix.data[i][j] = this.data[i][0] * matrix.data[0][j] +
				                         this.data[i][1] * matrix.data[1][j] +
				                         this.data[i][2] * matrix.data[2][j];
			}
		}
		this.data = tmpMatrix.data;
		return this;
	};

	/**
	 * Multiplies the current matrix by a vector 2d.
	 *
	 * @method multiplyVector
	 * @param {Vector2D} vector
	 * @return {Vector2D} a new vector transformed by the current matrix
	 */
	Matrix2D.prototype.multiplyVector = function(vector) {
		var result = new Vector2D(0, 0);
		var vectorW;

		result.x = this.data[0][0] * vector.x + this.data[1][0] * vector.y + this.data[2][0];
		result.y = this.data[0][1] * vector.x + this.data[1][1] * vector.y + this.data[2][1];
		vectorW = this.data[0][2] * vector.x + this.data[1][2] * vector.y + this.data[2][2];
		result.div(vectorW);
		return result;
	};

	/**
	 * This method transform the context given in parameter by the current matrix.
	 *
	 * @method transformContext
	 * @param {CanvasRenderingContext2D} context it is the context to transform by the current matrix.
	 */
	Matrix2D.prototype.transformContext = function(context) {
		/* global CanvasRenderingContext2D:false */
		if (!(context instanceof CanvasRenderingContext2D)) {
			throw new Error("bad type argument: context");
		}
		context.transform(this.data[0][0], this.data[0][1], this.data[1][0],
		                  this.data[1][1], this.data[2][0], this.data[2][1]);
	};

	/**
	 * Compute the inverse matrix of this.
	 *
	 * @method inverse
	 * @return {Matrix2D} inverse of this matrix if it exist; Otherwise `null`
	 */
	Matrix2D.prototype.inverse = function() {
		var result = new Matrix2D();
		var m = this.data;

		result.data = [
			[ m[2][2] * m[1][1] - m[1][2] * m[2][1],
			  m[0][2] * m[2][1] - m[2][2] * m[0][1],
			  m[1][2] * m[0][1] - m[0][2] * m[1][1] ],
			[ m[1][2] * m[2][0] - m[2][2] * m[1][0],
			  m[2][2] * m[0][0] - m[0][2] * m[2][0],
			  m[0][2] * m[1][0] - m[1][2] * m[0][0] ],
			[ m[2][1] * m[1][0] - m[1][1] * m[2][0],
			  m[0][1] * m[2][0] - m[2][1] * m[0][0],
			  m[1][1] * m[0][0] - m[0][1] * m[1][0] ]
		];

		var det = (m[0][0] * (m[2][2] * m[1][1] - m[1][2] * m[2][1])) -
		          (m[0][1] * (m[2][2] * m[1][0] - m[1][2] * m[2][0])) -
		          (m[0][2] * (m[2][1] * m[1][0] - m[1][1] * m[2][0]));

		if (det === 0) {
			return null;
		}

		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				result.data[i][j] *= 1 / det;

			}
		}
		return result;
	};

	/**
	 * give a data representation of Matrix
	 *
	 * @method toString
	 * @return {String} data representation of Matrix
	 */
	Matrix2D.prototype.toString = function() {
		var result = "";

		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				result += this.data[j][i] + " ";
			}
			result += "\n";
		}
		return result;
	};

	/**
	 * This method returns an identity matrix.
	 *
	 * @method identity
	 * @static
	 * @return {Matrix2D} return an identity matrix object
	 */
	Matrix2D.identity = function() {
		var tmp = new Matrix2D();
		tmp.setTransform(1, 0, 0, 1, 0, 0);
		return tmp;
	};

	/**
	 * This method returns a rotation matrix
	 * **Note that the angle is expressed in degree**
	 *
	 * @method rotation
	 * @static
	 * @param angle a scalar expressed in degree who represent the angle of rotation of the matrix to generate.
	 * @return {Matrix2D} return a rotation matrix object
	 */
	Matrix2D.rotation = function(angle) {
		var tmp = new Matrix2D();
		var angleRad = angle / Math.PI * 180.0;
		tmp.setTransform(Math.cos(angleRad), Math.sin(angleRad), -Math.sin(angleRad), Math.cos(angleRad), 0, 0);
		return tmp;
	};

	/**
	 * This method return a translation matrix
	 *
	 * @method translation
	 * @static
	 * @param x the x translation to integrate in the matrix
	 * @param y the y translation to integrate in the matrix
	 * @return {Matrix2D}
	 */
	Matrix2D.translation = function(x, y) {
		var tmp = new Matrix2D();
		tmp.setTransform(1, 0, 0, 1, x, y);
		return tmp;
	};

	/**
	 * This method return a scale matrix
	 *
	 * @method scale
	 * @static
	 * @param x the abscissa scale factor to integrate in the matrix
	 * @param y the ordinate scale factor to integrate in the matrix
	 * @return {Matrix2D}
	 */
	Matrix2D.scale = function(x, y) {
		var tmp = new Matrix2D();
		tmp.setTransform(x, 0, 0, y, 0, 0);
		return tmp;
	};

	/**
	 * This method return a skew matrix
	 *
	 * @method skew
	 * @static
	 * @param a the factor of skew on the y axis
	 * @param b the factor of skew on the x axis
	 * @return {Matrix2D}
	 */
	Matrix2D.skew = function(a, b) {
		var tmp = new Matrix2D();
		tmp.setTransform(1, a, b, 1, 0, 0);
		return tmp;
	};

	TW.Math.Matrix2D = Matrix2D;
	return Matrix2D;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/Camera',['../Math/Matrix2D'], function(Matrix2D) {

	TW.Graphic = TW.Graphic || {};


	/**
	 * The Camera class allow you to create a camera who has the purpose to simulate a camera on some layers.
	 * Each {{#crossLink "Graphic.Layer" }}Layer{{/crossLink}} or {{#crossLink "Graphic.Window" }}Window{{/crossLink}}
	 * contain a camera for moving te point of view displayed.
	 *
	 * ### Manipulate the camera
	 *
	 * The movement of the camera is based on an internal matrix, representing the point of view
	 * of the camera.
	 * This class provide an useful way to moving in the space without using directly matrices.
	 * All manipulation methods matrix provided are applied in a fixed order:
	 *
	 *  - translation
	 *  - rotation
	 *  - skew
	 *  - scale
	 *
	 * the aim is to use each type of transformation separately, regardless of the order of method calls.
	 *
	 *
	 * It's also possible to directly use the matrix methods, but both methods are not compatible,
	 * because calling a method from the camera will overwrite the matrix.<br />
	 * __If you choose to directly manipulate the matrix, be careful to not use matrix transformations method
	 * provided by the Camera class.__
	 *
	 * ### Extending the class
	 *
	 * The Camera class provide only basic features and is destined to be extended.
	 * The two important methods are `prepare` and `update`
	 *
	 *  - `prepare` is called for preparing the graphic rendering (just applying matrix by default).<br />
	 *      {{#crossLink "Graphic.Camera/prepare" }}More information here{{/crossLink}}
	 *  - `update` is an optional method (and is not provided in this class) called regularly,
	 *  useful for adding a dynamic behavior.<br />
	 * Note that you can take advantage of Javascript by adding directly an `update` method on the Camera instance.
	 *
	 * @class Camera
	 * @constructor
	 */
	function Camera() {
		/**
		 * matrix used for define the view.
		 *
		 * Note that modify it don't automatically refresh the associated layer.
		 * You should refresh the Layer after this operation.
		 *
		 * Directly modifing the matrix is not compatible with other matrix Camera's method (`translate`, `rotate`,
		 * `skew` or `scale`).
		 * Calling one of these method will recreate the matrix and erasing your matrix.
		 * For applying transformations, you should modify directly the matrix.
		 *
		 * @property {Matrix2D} matrix
		 */
		this.matrix = new Matrix2D();

		this._translation = {x: 0, y: 0 };
		this._rotation = 0;
		this._scale = {x: 1, y: 1 };
		this._skew = {a: 0, b: 0 };
	}

	/**
	 * prepare is called before each draw on the canvas.
	 * The canvas 2D context must be completely reset.
	 *
	 * By default, context matrix are multiplied by internal matrix.
	 * save and restore operations are done by the caller.
	 *
	 * @method prepare
	 * @param {CanvasRenderingContext2D} context The canvas context which will be used to draw.
	 */
	Camera.prototype.prepare = function(context) {
		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		this.matrix.transformContext(context);
	};

	/**
	 * Apply a translation to the camera.
	 *
	 * @method translate
	 * @chainable
	 * @param x
	 * @param y
	 * @return {Camera}
	 */
	Camera.prototype.translate = function(x, y) {
		this._translation = {x: x, y: y};
		this._updateMatrix();
		return this;
	};

	/**
	 * Apply a rotation to the camera.
	 *
	 * @method rotate
	 * @chainable
	 * @param {Number} angle rotation angle in degrees.
	 * @return {Camera}
	 */
	Camera.prototype.rotate = function(angle) {
		this._rotation = angle;
		this._updateMatrix();
		return this;
	};
	/**
	 * Apply a scale transformation to the camera.
	 *
	 * @method scale
	 * @chainable
	 * @param {Number} x
	 * @param {Number} y
	 * @return {Camera}
	 */
	Camera.prototype.scale = function(x, y) {
		this._scale = {x: x, y: y };
		this._updateMatrix();
		return this;
	};

	/**
	 * Apply a skew transformation to the camera.
	 *
	 * @method skew
	 * @chainable
	 * @param {Number} a
	 * @param {Number} b
	 * @return {Camera}
	 */
	Camera.prototype.skew = function(a, b) {
		this._skew = {a: a, b: b};
		this._updateMatrix();
		return this;
	};

	/**
	 * Update the matrix after a transformation.
	 * @method _updateMatrix
	 * @protected
	 */
	Camera.prototype._updateMatrix = function() {
		this.matrix.identity()
			.translate(this._translation.x, this._translation.y)
			.rotate(this._rotation)
			.skew(this._skew.a, this._skew.b)
			.scale(this._scale.x, this._scale.y);
	};

	TW.Graphic.Camera = Camera;
	return Camera;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/GraphicObject',['../Math/Matrix2D', '../Utils/copyParam'], function(Matrix2D, copyParam) {

	TW.Graphic = TW.Graphic || {};


	/**
	 * GraphicObject represent an object that has a relationship with graphical context.
	 * It is the root class of every graphical component of the framework.
	 *
	 * ## General
	 *
	 * It provide many method for manipulate object in 2D space,
	 * keeping a internal matrix. It contain also dimensions, and a reference point
	 * for all transformations (center point).<br />
	 * Each object can have a parent, which is informed to any child modification, with the method `onChange()`.
	 *
	 * GraphicObject contain many properties which can be modified easily. **However, you should use `setAttr` instead
	 * of directly modifing properties, to regenerate the caches if necessary. Direct access don't invalidate caches.**
	 *
	 * ## extend this class
	 *
	 * All 2D graphical objects should inherit from this class.
	 * All inherited class should implement the {{#crossLink "Graphic.GraphicObject/draw"}}draw(){{/crossLink}} method,
	 * not implemented by default.<br />
	 * Inherited class must also inform the parent (if any) after each modification that influence the graphical
	 * render, by calling protected method
	 * {{#crossLink "Graphic.GraphicObject/notifyParentChange"}}notifyParentChange(){{/crossLink}}
	 *
	 *
	 * @class GraphicObject
	 * @param {Object} [params] it is an object that represent the parameters of the graphicalObject to set.
	 *  @param {Number} [params.x=0] position on X axis.
	 *  @param {Number} [params.y=0] position on Y axis.
	 *  @param {Number} [params.width=0] width of the element.
	 *  @param {Number} [params.height=0] height of the element.
	 *  @param {Object} [params.centerPoint] centerPoint of the current object
	 *   @param {Object} [params.centerPoint.x=0] x centerPoint value
	 *   @param {Object} [params.centerPoint.y=0] y centerPoint value
	 *  @param {Number} [params.zIndex=0] define display order with other graphic elements. default to 0.
	 *  @param {Number} [params.alpha=1.0] set the transparency, between 0 and 1. default to 1 (completely opaque).
	 *  @param {Matrix2D} [params.matrix] matrix to set to the object. default to identity matrix.
	 *  @param {Number} [params.parent=null] parent of the element.
	 * @constructor
	 */
	function GraphicObject(params) {
		copyParam(this, params, {
			/**
			 * position on X axis
			 *
			 * @property {Number} x
			 */
			x:            0,

			/**
			 * position on Y axis
			 *
			 * @property {Number} y
			 */
			y:            0,

			/**
			 * @property {Number} width
			 */
			width:        0,

			/**
			 * @property {Number} height
			 */
			height:       0,

			/**
			 * default center of all matrix transformations.
			 *
			 * values are exprimed depending on the size of the object.
			 * 0;0 is the up-left corner.
			 *
			 * @property {Object} centerPoint
			 *   @property {Object} centerPoint.x
			 *   @property {Object} centerPoint.y
			 */
			centerPoint: {
				x: 0,
			    y: 0
			},

			/**
			 * zIndex, used to determine the drawing order. Hight zIndex are drawn first.
			 *
			 * @property {Number} zIndex
			 */
			zIndex:       0,

			/**
			 * value of opacity, between 0.0 (fully transparent) and 1.0 (opaque)
			 *
			 * @property {Number} alpha
			 */
			alpha:        1.0,

			/**
			 * matrix applied to this object before draw.
			 *
			 * @property {Matrix} matrix
			 */
			matrix:       Matrix2D.identity(),

			/**
			 * parent containing this object.
			 *
			 * @property {Layer} parent
			 */
			parent:       null
		});
	}

	/**
	 * Setter availlable for updating attibuts and correctly clear the caches.
	 * You can set all attributes supported by this instance
	 * (see the GraphicObject constructor for common available properties)
	 *
	 * @example
	 *
	 *      object.setAttr({
	 *          width: 20,
	 *          height: 20
	 *      });
	 *
	 *      object.setAttr({
	 *          pos: {
	 *              x: 0,
	 *              y: 0
	 *          }
	 *      });
	 *
	 * @method setAttr
	 * @param {Object} attrs GraphicObject attributs. See the constructor for more details.
	 * @chainable
	 */
	GraphicObject.prototype.setAttr = function(attrs) {
		copyParam(this, attrs, this);
		this.notifyParentChange();
		return this;
	};

	/**
	 * This method is aimed to be overrides by the classes who extends GraphicObject class.
	 *
	 * @method draw
	 * @param {CanvasRenderingContext2D} context represent the context of the canvas to draw on.
	 */
	GraphicObject.prototype.draw = function(context) {

	};

	/**
	 * This method allow you to translate the GraphicalObject,
	 * Internally this method modify the GraphicObject's matrix.
	 *
	 * @method translate
	 * @param {Number} x this is the translation scalar of the x axis.
	 * @param {Number} y this is the translation scalar of the y axis.
	 * @chainable
	 */
	GraphicObject.prototype.translate = function(x, y) {
		this.matrix.translate(x, y);
		this.notifyParentChange();
		return this;
	};

	/**
	 * This method allow you to rotate the Graphical object around the center point of the GraphicalObject.
	 *
	 * @method rotate
	 * @param {Number} angle represent the angle of rotation, it's expressed in degree.
	 * @chainable
	 */
	GraphicObject.prototype.rotate = function(angle) {
		this.matrix.rotate(angle);
		this.notifyParentChange();
		return this;
	};

	/**
	 * this method allow you to do a scale on the GraphicObject.
	 *
	 * @method scale
	 * @param {Number} x this is the x scale factor
	 * @param {Number} y this is the y scale factor
	 * @chainable
	 */
	GraphicObject.prototype.scale = function(x, y) {
		this.matrix.scale(x, y);
		this.notifyParentChange();
		return this;
	};

	/**
	 * This method allow you to do a skew transform on the GraphicObject.
	 *
	 * @method skew
	 * @param {Number} a the factor of skew on the y axis
	 * @param {Number} b the factor of skew on the x axis
	 * @chainable
	 */
	GraphicObject.prototype.skew = function(a, b) {
		this.matrix.skew(a, b);
		this.notifyParentChange();
		return this;
	};

	/**
	 * This method notify the parent that a change has been done, and that it should clear his cache.
	 *
	 * @method notifyParentChange
	 * @protected
	 */
	GraphicObject.prototype.notifyParentChange = function() {
		if (this.parent) {
			this.parent.onChange(this);
		}
	};

	TW.Graphic.GraphicObject = GraphicObject;
	return GraphicObject;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/Shape',['./GraphicObject', '../Utils/inherit', '../Utils/copyParam'], function(GraphicObject, inherit, copyParam) {

	TW.Graphic = TW.Graphic || {};


	/**
	 * The Shape class is an abstract object who provides tool to draw some primitive Shapes.
	 * You should not use this class cause it is an abstract class who have the purpose to be extended
	 * to implements basic shape drawing.
	 * Note that the Shape class extends the GraphicObject class.
	 *
	 *
	 * ## color and Stroke Color
	 *
	 * Both `color` and `strokeColor` support many format:
	 *
	 *      myShape.setAttr({ color: "black" });
	 *      myShape.setAttr({ color: "#FF0000" });           // hexadecimal notation
	 *      myShape.setAttr({ color: "rgb(0, 255, 0)" });    // decimal RGB notation
	 *
	 * It's possible to get more complex effets using CanvasGradient or CanvasPattern objects. For more details, see
	 * [the canvas 2D context specs](http://www.w3.org/html/wg/drafts/2dcontext/html5_canvas/#dom-context-2d-fillstyle).
	 *
	 * @class Shape
	 * @extends Graphic.GraphicObject
	 * @constructor
	 * @param {Object} [params] set of parameters for configure this objects.
	 *   *params* is given to {{#crossLink "Graphic.GraphicObject"}}GraphicObject{{/crossLink}} constructor.
	 *   @param [params.color="black"] content color (in filled mode)
	 *   @param [params.strokeColor="black"] stroke color (in wired mode)
	 *   @param {"WIRED"|"FILLED"} [params.mode="WIRED"] display mode for shape.
	 */
	function Shape(params) {
		GraphicObject.call(this, params);
		copyParam(this, params, {
			/**
			 * fill color to draw this object.
			 *
			 * **Note: should be modified with `setAttr`**
			 *
			 * @property {*} color
			 */
			color:       "black",

			/**
			 * color to apply to the stroke mode
			 *
			 * **Note: should be modified with `setAttr`**
			 *
			 * @property {*} strokeColor
			 */
			strokeColor: "black",

			/**
			 * the draw mode of the current shape.
			 * Two modes are available "WIRED" and "FILLED".
			 *
			 * **Note: should be modified with `setAttr`**
			 *
			 * @property {"WIRED"|"FILLED"} mode
			 */
			mode:        "WIRED"
		});
	}

	inherit(Shape, GraphicObject);

	TW.Graphic.Shape = Shape;
	return Shape;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/Circle',['./Shape', '../Utils/inherit', '../Utils/copyParam'], function(Shape, inherit, copyParam) {

	TW.Graphic = TW.Graphic || {};


	/**
	 * This class extends the Shape class.
	 *
	 * When you create a Circle object like `var myCircle = new TW.Graphic.Circle();`
	 * the default radius of the object is 50pixels.
	 *
	 * **Note:** the `[x, y]` coordinates corresponds to the top left corner of the square which includes the circle.
	 * If you want to draw to circle from its origin, you should consider moving its centerPoint:
	 *
	 *     circle.setAttr({
	 *          centerPoint: {
	 *              x: radius,
	 *              y: radius
	 *          }
	 *      });
	 *
	 * @class Circle
	 * @extends Graphic.Shape
	 * @constructor
	 * @param {Object} [params] set of properties given to Circle.
	 *   `params` is given to {{#crossLink "Graphic.Shape"}}Shape{{/crossLink}} constructor.
	 *   @param {Number} [params.radius=50] radius of the circle.
	 */
	function Circle(params) {
		Shape.call(this, params);
		copyParam(this, params, {
			/**
			 *
			 * **Note: this property should be modified only with `setAttr`**
			 *
			 * @property {Number} radius
			 */
			radius: 50
		});
	}

	inherit(Circle, Shape);

	/**
	 * This overridden draw method allow the Circle class to draw a circle on the context given in parameter.
	 *
	 * @method draw
	 * @param {CanvasRenderingContext2D} context
	 */
	Circle.prototype.draw = function(context) {
		/* global CanvasRenderingContext2D */
		if (!(context instanceof CanvasRenderingContext2D)) {
			throw new Error("Bad argument: context");
		}
		context.save();
		context.translate(this.x, this.y);
		this.matrix.transformContext(context);
		context.translate(-this.centerPoint.x, -this.centerPoint.y);
		context.beginPath();
		context.arc(this.radius, this.radius, this.radius, Math.PI * 2, 0, true);
		if (this.mode === "WIRED") {
			context.strokeStyle = this.strokeColor;
			context.stroke();
		} else {
			context.fillStyle = this.color;
			context.fill();
		}
		context.closePath();
		context.restore();
	};

	TW.Graphic.Circle = Circle;
	return Circle;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/SpatialContainer',['../Math/Vector2D'], function(Vector2D) {

	TW.Graphic = TW.Graphic || {};

	/**
	 * A spatial container is a data structure used for storage of spatial 2D objects
	 * (generally {{#crossLink "Graphic.GraphicObject" }}GraphicObject{{/crossLink}}).
	 * It propose many method for manipulate these objects using theirs coordinates.
	 *
	 * This class provide a basic implementation of all methods,
	 * and also represent an interface to others spatial containers.
	 * Different containers provides different complexities, and for each situation,
	 * someone are more adapted than others.
	 *
	 * @class SpatialContainer
	 * @constructor
	 */
	function SpatialContainer() {
		this._containerList = [];
	}

	/**
	 * This method allow you to add a GraphicalObject to the SpatialContainer
	 *
	 * @method addElement
	 * @param {Object} element this object will be added to the internal list of the SpatialContainer.
	 *  element *SHOULD BE* a GraphicObject, otherwise the spatial container would have undetermined behavior.
	 */
	SpatialContainer.prototype.addElement = function(element) {
		this._containerList.push(element);
		this._containerList.sort(function(a, b) {
			return (a.zIndex - b.zIndex);
		});
	};

	/**
	 * This method allow you to remove a graphical element from the SpatialContainer
	 *
	 * @method removeElement
	 * @param {Object} element the reference to the object to remove from the SpatialContainer List.
	 * @return {Boolean} `true` if the element to remove from the list was found. Otherwise it returns `false`.
	 */
	SpatialContainer.prototype.removeElement = function(element) {
		for (var i = 0; i < this._containerList.length; i++) {
			if (element === this._containerList[i]) {
				this._containerList.splice(i, 1);
				return true;
			}
		}
		return false;
	};

	/**
	 * This method allow you to apply a callback for every GraphicObject contained in the SpatialContainer.
	 *
	 * The callback shouldn't remove directly an element until the end of `applyAll`.
	 * The behavior in this case is undefined.
	 *
	 * @method applyAll
	 * @param {Function} callback must be a callback function
	 *  @param {Object} callback.element element contained in spatial container.
	 *
	 * @example
	 *
	 *     container.applyAll(function(element) {
	 *          element.draw();
	 *     });
	 */
	SpatialContainer.prototype.applyAll = function(callback) {
		for (var i = 0; i < this._containerList.length; i++) {
			callback(this._containerList[i]);
		}
	};

	/**
	 * This method allow you to apply a callback to the GraphicObject who are at the specified position.
	 *
	 * @method applyToPoint
	 * @param {Number} x the x position where the GraphicObject must be to get the callback applied on them
	 * @param {Number} y the y position where the GraphicObject must be to get the callback applied on them.
	 * @param {Function} callback to apply to every GraphicObject which position match the x, y parameters.
	 */
	SpatialContainer.prototype.applyToPoint = function(x, y, callback) {
		var length = this._containerList.length;

		for (var i = 0; i < length; i++) {
			var target = this._containerList[i];

			var point = target.matrix.inverse().multiplyVector(new Vector2D(x - target.x, y - target.y));
			point.add(target.centerPoint);

			if (point.x >= 0 && point.x <= target.width &&
			    point.y >= 0 && point.y <= target.height) {
				callback(this._containerList[i]);
			}
		}
	};

	/**
	 * This method allow you to apply a callback only on the object that are inside of the polygon
	 * specified by the points.
	 *
	 * The goal is to process optimization to apply callback only if necessary, for improve speed. Objects that are not
	 * in the zone can be used: somes optimizations can be aproximate.
	 *
	 *
	 * The default method use directly `applyAll` and no optimization is done. (selecting good and bas objects
	 * whithout tree structure take more time than display them)
	 *
	 * @method applyToZone
	 *
	 * @param {Array} pointsArray array of points like `{{10,0},{0,10},{2,3}}
	 *  *Note that the polygon MUST BE composed at least of 3 points,
	 *  otherwise the method will throw an error.*
	 *
	 * @param {Function} callback function to be called on every GraphicObject that are inside of
	 *  the polygon specified by pointsArray.
	 */
	SpatialContainer.prototype.applyToZone = function(pointsArray, callback) {
		if (!(pointsArray && pointsArray.length >= 3)) {
			throw new Error("Bad params");
		}

		this.applyAll(callback);
	};

	TW.Graphic.SpatialContainer = SpatialContainer;
	return SpatialContainer;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/Layer',['./GraphicObject', './SpatialContainer', './Camera', '../Utils/inherit', '../Utils/Polyfills'],
       function(GraphicObject, SpatialContainer, Camera, inherit) {

	       TW.Graphic = TW.Graphic || {};


	       /**
	        * The Layer class can hold several GraphicObjects and it provides some transformations methods to move or
	        * scale all the GraphicalObjects that it contains. This is helpful when you want for example apply
	        * the same plane transformation to some GraphicalObjects.
	        *
	        * @class Layer
	        * @extends Graphic.GraphicObject
	        * @constructor
	        * @param {Object} params All properties given to
	        *   {{#crossLink "Graphic.GraphicObject"}}GraphicObject{{/crossLink}} are available.
	        *   @param {Camera} [params.camera] camera used be the layer. if not set, a new `Camera` is created.
	        *   @param {SpatialContainer} [params.spatialContainer]
	        *   @param {CanvasRenderingContext2D} [params.localContext] you can set directly
	        *   the graphic canvascontext used by the layer.
	        */
	       function Layer(params) {
		       GraphicObject.call(this, params);
		       params = params || {};

		       /**
		        * camera of the layer.
		        *
		        * **Note: this property should be modified only with `setAttr`.**
		        *
		        * @property {Camera} camera
		        */
		       this.camera = params.camera || new Camera();

		       /**
		        * **Note: this property should be modified only with `setAttr`.**
		        * @property {SpatialContainer} spatialContainer
		        */
		       this.spatialContainer = params.spatialContainer || new SpatialContainer();

		       /**
		        * All layers use a local 2D context canvas for rendering object.
		        * It is used as a cache layer, and redrawn only when needed.
		        *
		        * Directly set the cache context can be usefull for debug.
		        *
		        * **Note: this property should be modified only with `setAttr`.**
		        *
		        * @property {CanvasRenderingContext2D} localContext
		        */
		       this.localContext = params.localContext || document.createElement('canvas').getContext("2d");

		       this.localContext.canvas.width = this.width;
		       this.localContext.canvas.height = this.height;

		       /**
		        * indicate when the cache must be updated.
		        *
		        * @property {Boolean} _needToRedraw
		        * @private
		        */
		       this._needToRedraw = true;
	       }

	       inherit(Layer, GraphicObject);


	       /**
	        * Setter availlable for updating attibuts and correctly clear the caches.
	        * You can set all attributes supported by this instance
	        * (see the GraphicObject constructor for common available properties)
	        *
	        * @example
	        *
	        *      object.setAttr({
			*          width: 20,
	        *          height: 20
	        *      });
	        *
	        *      object.setAttr({
	        *          pos: {
	        *              x: 0,
	        *              y: 0
	        *          }
	        *      });
	        *
	        * @method setAttr
	        * @param {Object} attrs Layer attributs. See the constructor for more details.
	        * @chainable
	        */
	       Layer.prototype.setAttr = function(attrs) {
		       GraphicObject.setAttr(attrs);
		       this.localContext.canvas.width = this.width;
		       this.localContext.canvas.height = this.height;
	       };

	       /**
	        * This method allow the user to draw on the canvas's context.
	        * If nothing has changed in the childs of the layer, then a buffered layer is printed on the canvas.
	        * Otherwise all the canvas is redraw.
	        *
	        * @method draw
	        * @param {CanvasRenderingContext2D} context
	        */
	       Layer.prototype.draw = function(context) {
		       if (this._needToRedraw === true) {
			       this.localContext.save();
			       this.camera.prepare(this.localContext);
			       this.spatialContainer.applyToZone([
				                                         {x: 0, y: 0},
				                                         {x: 0, y: this.height},
				                                         {x: this.width, y: this.height},
				                                         {x: this.width, y: 0}
			                                         ], function(child) {
				       child.draw(this.localContext);
			       }.bind(this));
			       this.localContext.restore();
			       this._needToRedraw = false;
		       }
		       context.save();
		       context.translate(this.x, this.y);
		       this.matrix.transformContext(context);
		       context.drawImage(this.localContext.canvas, -this.centerPoint.x, -this.centerPoint.y, this.width,
		                         this.height);
		       context.restore();
	       };

	       /**
	        * This method will allow you to add a child to the current Layer.
	        *
	        * @method addChild
	        * @param {GraphicObject} graphicObject this parameter must be a valid GraphicObject, otherwise the method
	        * will have an undefined behavior.
	        */
	       Layer.prototype.addChild = function(graphicObject) {
		       if (!(graphicObject instanceof GraphicObject)) {
			       throw new Error("bad param");
		       }
		       this.spatialContainer.addElement(graphicObject);
		       graphicObject.parent = this;
		       this.onChange(graphicObject);
	       };

	       /**
	        * This method will allow you to remove a child from the current Layer.
	        *
	        * @method rmChild
	        * @param {GraphicObject} graphicObject this parameter is the GraphicObject that the method will try
	        * to find inside the child of the current layer.
	        */
	       Layer.prototype.rmChild = function(graphicObject) {
		       this.spatialContainer.removeElement(graphicObject);
		       this.onChange(null);
	       };

	       /**
	        * This method will allow you to update the layer and all the childs within the layer.
	        *
	        * @method update
	        */
	       Layer.prototype.update = function(elapsedTime) {
		       this.spatialContainer.applyAll(function(child) {
			       if (child.update) {
				       child.update(elapsedTime);
			       }
		       });
	       };

	       /**
	        * This method will be called when a child is changed.
	        * By using this method it will notice the current Layer to redraw the local canvas.
	        *
	        * This method is called automatically when a child object change.
	        * You can call this method for clear internal cache.
	        *
	        * @method onChange
	        * @param {GraphicObject} [child] this object represent the child who has been changed.
	        */
	       Layer.prototype.onChange = function(child) {
		       this._needToRedraw = true;
		       return this.notifyParentChange();
	       };

	       TW.Graphic.Layer = Layer;
	       return Layer;
       });

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/Rect',['./Shape', '../Utils/inherit'], function(Shape, inherit) {

	TW.Graphic = TW.Graphic || {};


	/**
	 * a Rect defined by it's `x`, `y`, `width` and `height` properties.
	 *
	 * @class Rect
	 * @extends Graphic.Shape
	 * @constructor
	 * @param {Object} [params]
	 *  `params` is given to {{#crossLink "Graphic.Shape"}}Shape{{/crossLink}} constructor.
	 */
	function Rect(params) {
		Shape.call(this, params);
	}

	inherit(Rect, Shape);

	/**
	 * This overridden draw method allow the Rect class to draw a rectangle on the context given in parameter.
	 *
	 * @method draw
	 * @param {CanvasRenderingContext2D} context
	 */
	Rect.prototype.draw = function(context) {
		/* global CanvasRenderingContext2D */
		if (!(context instanceof CanvasRenderingContext2D)) {
			throw new Error("Bad argument: context");
		}
		context.save();
		context.translate(this.x, this.y);
		this.matrix.transformContext(context);
		context.translate(-this.centerPoint.x, -this.centerPoint.y);
		if (this.mode === "WIRED") {
			context.strokeStyle = this.strokeColor;
			context.strokeRect(0, 0, this.width, this.height);
		} else {
			context.fillStyle = this.color;
			context.fillRect(0, 0, this.width, this.height);
		}
		context.restore();
	};

	TW.Graphic.Rect = Rect;
	return Rect;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/Sprite',['./GraphicObject', '../Utils/inherit', '../Utils/copyParam'], function(GraphicObject, inherit, copyParam) {

	TW.Graphic = TW.Graphic || {};


	/**
	 * The Sprite class provide methods to draw sprites on a context. the aim of the sprites object is to be added
	 * to a Layer or to be use directly with a graphical context by invoking the draw method of the Sprite.
	 *
	 * If many sprites with same image are added to te scene, they should use only one (shared) Image instance.
	 *
	 *
	 * A good way to reduce number of files, and so loading time, is to put many sprite images in one file.
	 * The `imageRect` property is a good way to display only a part of the image.
	 *
	 *
	 *      var mySprite = new TW.Graphic.Sprite({
	 *          image: myImage
	 *      });
	 *      mySprite.draw(canvasContext);
	 *
	 * @class Sprite
	 * @extends Graphic.GraphicObject
	 * @param {Object} [params]
	 *  *params* is given to {{#crossLink "Graphic.GraphicObject"}}GraphicObject{{/crossLink}} constructor.
	 *  @param {Image} [params.image] image source displayed
	 *  @param {Object} [params.imageRect]
	 *   @param {Number} [params.imageRect.x]
	 *   @param {Number} [params.imageRect.y]
	 *   @param {Number} [params.imageRect.width]
	 *   @param {Number} [params.imageRect.height]
	 * @constructor
	 */
	function Sprite(params) {
		GraphicObject.call(this, params);
		copyParam(this, params, {

			/**
			 * image to display.
			 *
			 * **Note: this property should be modified only with `setAttr`.**
			 *
			 * @property {Image} image
			 */
			image:     null,

			/**
			 * rectangle source from image to display.
			 *
			 * If you specify it you can used just a subImage of the current image to use.
			 * It is useful for the spritesheets for example where you only want to draw a specific area of the image.
			 *
			 * **Note: this property should be modified only with `setAttr`.**
			 *
			 * @property {Object} imageRect
			 *   @property {Number} imageRect.x
			 *   @property {Number} imageRect.y
			 *   @property {Number} imageRect.width
			 *   @property {Number} imageRect.height
			 */
			imageRect: null
		});
	}

	inherit(Sprite, GraphicObject);

	/**
	 * This method allow you to draw the sprite on a context.
	 *
	 * @method draw
	 * @param context this parameter must be a valid canvas context,
	 *  otherwise the behavior of the draw method is unspecified.
	 */
	Sprite.prototype.draw = function(context) {
		/* global CanvasRenderingContext2D */
		if (!(context instanceof CanvasRenderingContext2D)) {
			throw new Error("Bad argument: context");
		}
		if (!this.image) {
			throw new Error("no image to draw");
		}

		context.save();
		context.translate(this.x, this.y);
		this.matrix.transformContext(context);
		context.translate(-this.centerPoint.x, -this.centerPoint.x);
		if (this.imageRect === null) {
			context.drawImage(this.image, 0, 0, this.width, this.height);
		} else {
			context.drawImage(this.image, this.imageRect.x, this.imageRect.y,
			                  this.imageRect.w, this.imageRect.h, 0, 0,
			                  this.width, this.height);
		}
		context.restore();

	};

	TW.Graphic.Sprite = Sprite;
	return Sprite;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/Window',['./Layer', '../Utils/inherit', '../Utils/Polyfills'], function(Layer, inherit) {

	TW.Graphic = TW.Graphic || {};


	/**
	 * This class represent a window associated to a canvas element.
	 * It's the first class used in Graphic module, wrapping all graphic objects.
	 *
	 *
	 *     //From an existing canvas
	 *     var win = new Window(document.getElementById('myCanvas'));
	 *     win.draw();
	 *
	 *     //Creating a new canvas tag
	 *     var win = new Window();
	 *     document.body.appendChild(win.canvas);
	 *     win.draw();
	 *
	 * @class Window
	 * @extends Graphic.Layer
	 * @constructor
	 * @param {HTMLCanvasElement} [canvas] main canvas for the window. by default, a new canvas is created.
	 */
	function Window(canvas) {
		/**
		 * The HTML canvas element.
		 *
		 * By default, a new canvas is created (and can be displayed to screen).
		 *
		 * @property {HTMLCanvasElement} canvas
		 * @readonly
		 */
		this.canvas = canvas || document.createElement('canvas');
		Layer.call(this, {
			localContext: this.canvas.getContext("2d"),
			width:       this.canvas.width,
			height:      this.canvas.height
		});
	}

	inherit(Window, Layer);

	/**
	 * Draw all graphic elements on the associated canvas.
	 *
	 * @method draw
	 */
	Window.prototype.draw = function() {
		this.localContext.save();
		this.camera.prepare(this.localContext);
		this.spatialContainer.applyAll(function(child) {
			child.draw(this.localContext);
		}.bind(this));
		this.localContext.restore();
		this._needToRedraw = false;
	};

	TW.Graphic.Window = Window;
	return Window;
});

/**
 * @module Utils
 * @namespace Utils
 */

var TW = TW || {};
define('Utils/clone',[], function() {

	TW.Utils = TW.Utils || {};

	/**
	 * Copy an object and all its members recursively. Numbers and others non-objects values
	 * are simply copied.
	 *
	 * *Note: `inherit` is not a class but a standalone function.*
	 *
	 * Inherited members are also copied.
	 *
	 * *Warning:* if your object contains several references to the same object,
	 * this object will be copied several times.<br />
	 * In case of crossed references, this method will never terminate.
	 *
	 * @class clone
	 * @constructor
	 *
	 * @param {*} srcInstance
	 * @return {*} copy of `srcInstance`.
	 */
	TW.Utils.clone = function(srcInstance) {
		if (typeof(srcInstance) !== 'object' || srcInstance === null) {
			return srcInstance;
		}
		var newInstance = new srcInstance.constructor();

		/* jshint forin: false */
		for (var i in srcInstance) {
			newInstance[i] = TW.Utils.clone(srcInstance[i]);
		}
		return newInstance;
	};

	return TW.Utils.clone;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/SpriteSheet',['../Utils/clone'], function(clone) {

	TW.Graphic = TW.Graphic || {};


	/**
	 * The spritesheet class provides a model to describe animations from an image called spriteSheet.
	 *
	 * @class SpriteSheet
	 * @constructor
	 * @param {Image} image represents the image on which the SpriteSheet coordinate will be applied.
	 * @param {Object} config represents the object which provides the description of each animation.
	 *
	 *
	 *     var mySpriteSheet = new SpriteSheet(image, config);
	 *
	 *  config object represents the raw configuration of the spriteSheet.
	 *  Please see below the synthax of a spriteSheet :
	 *
	 *  The SpriteSheet in tumbleweed work on JSON objects.
	 *  Inside of these JSON objects, there is a description of all or just one animation.
	 *  In the previous example, config is a full description of the animation.
	 *  Here is how tumbleweed's spritesheets are configured :
	 *
	 *  First of all let's define the structure of our SpriteSheet object :
	 *
	 *     {}
	 *
	 *  As you can see it is only an empty JSON object.
	 *  This object can handle some informations about the animation.
	 *
	 * ### Setting default values
	 *
	 *     default : {}
	 *
	 *  The default object can handle default values. It is useful to make some constants in the spriteSheet.
	 *  For example if you want to define 5 constants (x = 10, y = 30, w = 50, h = 60, framerate = 25) You must
	 *  proceed like this :
	 *
	 *     default : {
     *          x : 10,
     *          y : 30,
     *          w : 50,
     *          h : 60,
     *          framerate : 25
     *     }
	 *
	 *
	 * ### Setting animations
	 *
	 *  Each animation is composed by frames and can also define a framerate value which override the framerate
	 *  from default values.
	 *  Here is an important tip, in some animations you may don't want to use the default values. Then you just
	 *  Have to redefine them inside of the animation.
	 *  To create an animation named 'walk' which have framerate set to 12 you must proceed like this :
	 *
	 *     walk : {
     *          framerate: 12,
     *          frames : []
     *     }
	 *
	 *  Note that there is an entry in you walk animation called frames. This entry must contain each frame of the
	 *  walk animation.
	 *
	 * ### Setting frames
	 *
	 *  Each animation contain some frames. It works like a flipbook, each frame are displayed one
	 *  after another, tumbleweed will wait 1/framerate seconds to display the next frame.
	 *  Let's imagine that your walk animation is made of three frames inside of your SpriteSheet.
	 *  The first one will have the coordinate : `x = 0, y = 0, w = 50, h = 50`
	 *  The second one will have the coordinate : `x = 50, y = 0, w = 50, h = 50`
	 *  And finally the third one will have the coordinate : `x = 0, y = 50, w = 50, h = 50`
	 *
	 *  Let's see below what will be the result of these frame inside of our walk animation object :
	 *
	 *     walk : {
     *          framerate: 12,
     *          frames : [
     *              { x: 0, y: 0, w: 50, h: 50 },
     *              { x: 50, y: 0, w: 50, h: 50 },
     *              { x: 0, y: 50, w: 50, h: 50 }
     *          ]
     *     }
	 *
	 * Let's wrap it inside of our config object :
	 *
	 *     var config = {
     *          default: {
     *              x: 0,
     *              y: 0,
     *              w: 50,
     *              h: 50,
     *              framerate: 25
     *          },
     *          walk: {
     *              framerate: 12,
     *              frames: [
     *                  {x:0, y:0, w: 50, h: 50},
     *                  {x:50, y:0, w:50, h:50},
     *                  {x:0, y:50, w:50, h:50}
     *              ]
     *          }
     *     };
	 *
	 * Now you have a walk animation which contain 3 frames which will be displayed with a framerate of 12.
	 * You have the basics to build your own animations.
	 * In the following parts i will describe how to make animation's reference and how you can do
	 * transformations on them.
	 *
	 * ### Animation's reference
	 *
	 *  Sometimes you can need to specify another animation which is a copy of another animation but with some
	 *  transformations on it, the typical case will be an animation of walking to right and another animation which
	 *  is walking to left.
	 *  Frames are the same except that they must be reverted horizontally.
	 *  To make it we will introduce a new entity which is the flip flags.
	 *  Flip flags allow you to flip images from an animation. You can either flip them by the x axis
	 *  (horizontal flip) or by the y axis (vertical flip).
	 *
	 *  To illustrate it we will improve our config object which contain the walk animation.
	 *  Now we want 2 walk animation (walk_left and walk_right).
	 *  Initially we will consider that our previous definition of the walk animation was equivalent to the
	 *  walk_left animation.
	 *
	 *  Now let's see now how looks like our config object :
	 *
	 *     var config = {
     *          default: {
     *              x: 0,
     *              y: 0,
     *              w: 50,
     *              h: 50,
     *              framerate: 25
     *          },
     *          walk_left: {
     *              framerate: 12,
     *              frames: [
     *                  {x:0, y:0, w: 50, h: 50 },
     *                  {x:50, y:0, w:50, h:50 },
     *                  {x:0, y:50, w:50, h:50 }
     *              ]
     *          },
     *          walk_right: {                           //This is our new animation entry : walk_right
     *              framerate: 12,                      //The framerate is the same than walk_left
     *              frames: [
     *                  {x:0, y:0, w:50, h:50},         //The frames are also the same than walk_left
     *                  {x:50, y:0, w:50, h:50},
     *                  {x:0, y:50, w:50, h:50}
     *              ],
     *              flipX: true,                       //Flip_x true indicate that all the frames must be
     *                                                  //horizontally flipped before being draw.
     *          }
     *     };
	 *
	 *  There's one annoying thing in the previous definition, as you can see, the frames of the walk_left animation
	 *  and the frames of the walk_right animation are duplicated.
	 *  There's one way to solve this problem : the alias flag.
	 *
	 * ### Alias flag
	 *
	 *  Alias flag allows you to define an animation by referencing another, it's quite useful when an animation has
	 *  the same frames than another. And we're actually in this case.
	 *  Using the alias flag, this is what will be your config object :
	 *
	 *     var config = {
     *          default: {
     *              x: 0,
     *              y: 0,
     *              w: 50,
     *              h: 50,
     *              framerate: 25
     *          },
     *          walk_left: {
     *              framerate: 12,
     *              frames: [
     *                  {x:0, y:0, w: 50, h: 50 },
     *                  {x:50, y:0, w:50, h:50 },
     *                  {x:0, y:50, w:50, h:50 }
     *              ]
     *          },
     *          walk_right: {               //This is our new animation entry : walk_right
     *              framerate: 12,          //The framerate is the same than walk_left
     *              alias: "walk_left",     //by declaring walk_left as alias,
     *                                      // walk_right will share it's frames with walk_left.
     *              flipX: true,           //Flip_x true indicate that all the frames must be
     *                                      //horizontally flipped before being draw.
     *          }
     *     };
	 *
	 * ## define frames more quickly
	 *
	 *  It's possible to define many frames in one line, if these frames follow or if they are identical.
	 *
	 *  If all frames are on the same line, or the same collumn, we can just specify the number of frames we want,
	 *  and the direction of repetition. No direction means we want to copy and repeat the frame.
	 *
	 *  Repeat a frame can be useful in some case.
	 *  For example if you want to wait more than one cycle to go on the next frame.
	 *
	 *  - `nbFrames` is the number of frames we want
	 *  - `way` is the direction we want to move for the next frames. If not defined, it's a repetition.
	 *    It can take 4 values :
	 *
	 *     - "LEFT",
	 *     - "RIGHT"
	 *     - "UP"
	 *     - "DOWN"
	 *
	 * Example :
	 *
	 *
	 *     var config = {
     *          default: {
     *              x: 0,
     *              y: 0,
     *              w: 50,
     *              h: 50,
     *              framerate: 25
     *          },
     *          walk_left: {
     *              framerate: 12,
     *              frames: [
     *                  {x:0, y:0, w: 50, h: 50 },
     *                  {x:50, y:0, w:50, h:50 },
     *                  {x:0, y:50, w:50, h:50, nbFrames: 5 }                  //This frame will be duplicated 5 times.
     *                  {x:0, y:100, w:50, h:50, nbFrames: 5, way: "RIGHT" }   //We take 5 frames, moving on the right.
     *              ]
     *          },
     *          walk_right: {
     *              framerate: 12,
     *              alias: "walk_left",
     *              flipX: true
     *          }
     *     };
	 *
	 *  Now let me introduce you the last feature which allows you to reverse the frames order of an animation.
	 *  There's some case where you will need to reverse the frames of an animation, especially when you animation
	 *  is an alias of another.
	 *  Let's took our previous example, now, i want to add two moonwalk animation (moonwalk_left, moonwalk_right).
	 *  To make them i will apply to them respectively an alias of the walk_left and walk_right, and then, i will apply
	 *  to moonwalk_right and moonwalk_right the reverse flag which will reverse the frames that the animation contains.
	 *
	 *     var config = {
     *          default: {
     *              x: 0,
     *              y: 0,
     *              w: 50,
     *              h: 50,
     *              framerate: 25
     *          },
     *          walk_left: {
     *              framerate: 12,
     *              frames: [
     *                  {x:0, y:0, w: 50, h: 50 },
     *                  {x:50, y:0, w:50, h:50 },
     *                  {x:0, y:50, w:50, h:50, nbFrames: 5 },                 //This frame will be duplicated 5 times.
     *                  {x:0, y:100, w:50, h:50, nbFrames: 5, way: "RIGHT" }   //We take 5 frames, moving on the right.
     *              ]
     *          },
     *          walk_right: {
     *              framerate: 12,
     *              alias: "walk_left",
     *              flipX: true
     *          },
     *          moonwalk_left: {
     *              framerate: 12,
     *              alias: "walk_right",
     *              reverse: true           //We set our moonwalk_left animation to be reversed.
     *          },
     *          moonwalk_right: {
     *              framerate: 12,
     *              alias: "walk_left",
     *              reverse: true           //We set out moonwalk_right animation to be reversed.
     *          }
     *     };
	 *
	 * ## Hotpoint
	 *
	 * As it's possible to define frames of any size, two frames in an animation can be of differents sizes.
	 * However, this fact hides a problem : if the element must change size, how to enlarge the sprite ?
	 * by the right or the left ? Up or bottom ?
	 *
	 * Usually, we can use the `centerPoint`. If it's defined in the up-left corner,
	 * the sprite will grow toward bottom and right. If it's defined on the center, the sprite will grow from all sides.
	 *
	 * But it's not always the best choice. So, you can redefine the centerPoint for the transition
	 * with the `hotpoint` param. It can take these following values :
	 *
	 *  - `TOP-LEFT`
	 *  - `TOP-CENTER`
	 *  - `TOP-RIGHT`
	 *  - `CENTER-LEFT`
	 *  - `CENTER-CENTER`
	 *  - `CENTER-RIGHT`
	 *  - `BOTTOM-LEFT`
	 *  - `BOTTOM-CENTER`
	 *  - `BOTTOM-RIGHT`
	 *
	 *
	 * Example:
	 *
	 *     grow_up: {
     *          framerate: 12,
     *          frames: [
     *              {x:0, y:0, w:50, h:50 },
     *              {x:50, y:0, w:50, h:150, hotpoint: "BOTTOM-CENTER" }
     *              //the height grow from 50 to 150
     *              //but the center bottom point will not move.
     *          ]
     *     }
	 *
	 */
	function SpriteSheet(image, config) {

		/**
		 * image used by the srpitesheet.
		 *
		 * @property {Image} image
		 */
		this.image = image;

		this.listAnimation = {};



		this.config = clone(config);

		for (var a in this.config) {
			if (a !== "default") {
				if (this.config[a].alias) {
					if (this.listAnimation[this.config[a].alias]) {
						this.config[a].frames = clone(this.listAnimation[this.config[a].alias].frames);
					}
				}
				this.developAnimationFrames(this.config[a]);
				if (this.config[a].reverse && this.config[a].reverse === true) {
					this.config[a].frames.reverse();
				}
			}
			this.listAnimation[a] = this.config[a];
		}
	}

	/**
	 * This function is used internally by the SpriteSheet class to apply the default values in the frames.
	 * @method applyDefaultValuesToFrames
	 * @param {Object} animation object which contains the description of the animation to apply default values.
	 * @private
	 */
	SpriteSheet.prototype.applyDefaultValuesToFrames = function(animation) {
		if (!this.config['default']) {
			return;
		}
		if (this.config['default'].framerate) {
			if (!animation.framerate) {
				animation.framerate = this.config['default'].framerate;
			}
		}
		if (this.config['default'].flipX) {
			if (!animation.flipX) {
				animation.flipX = this.config['default'].flipX;
			}
		}
		if (this.config['default'].flipY) {
			if (!animation.flipY) {
				animation.flipY = this.config['default'].flipY;
			}
		}
		if (this.config['default'].reverse) {
			if (!animation.reverse) {
				animation.reverse = this.config['default'].reverse;
			}
		}
		if (!animation.frames) {
			return;
		}
		for (var i = 0; i < animation.frames.length; i++) {
			if (this.config['default'].x) {
				if (!animation.frames[i].x) {
					animation.frames[i].x = this.config['default'].x;
				}
			}
			if (this.config['default'].y) {
				if (!animation.frames[i].y) {
					animation.frames[i].y = this.config['default'].y;
				}
			}
			if (this.config['default'].w) {
				if (!animation.frames[i].w) {
					animation.frames[i].w = this.config['default'].w;
				}
			}
			if (this.config['default'].h) {
				if (!animation.frames[i].h) {
					animation.frames[i].h = this.config['default'].h;
				}
			}
			if (this.config['default'].nbFrames) {
				if (!animation.frames[i].nbFrames) {
					animation.frames[i].nbFrames = this.config['default'].nbFrames;
				}
			}
		}
	};

	/**
	 * This function is private and have the aim to autoincrement each frame duplicated in order to generate animation.
	 * @param {Object} frame frame which will be transformed
	 * @method _applyFrameIncrementation
	 * @private
	 */
	SpriteSheet.prototype._applyFrameIncrementation = function(frame) {
		if (!frame.way) {
			return;
		}
		switch (frame.way) {
			case "LEFT" :
				frame.x -= frame.w;
				if (frame.x < 0) {
					frame.x = this.image.width - frame.w;
					frame.y += frame.h;
				}
				break;
			case "RIGHT" :
				frame.x += frame.w;
				if (frame.x + frame.w > this.image.width) {
					frame.x = 0;
					frame.y += frame.h;
				}
				break;
			case "UP" :
				frame.y -= frame.h;
				if (frame.y < 0) {
					frame.x += frame.w;
					frame.y = this.image.height - frame.h;
				}
				break;
			case "DOWN" :
				frame.y += frame.h;
				if (frame.y + frame.h > this.image.height) {
					frame.x += frame.w;
					frame.y = 0;
				}
				break;
		}
		//delete frame.way;
	};

	SpriteSheet.prototype._setLitteralHotPoint = function(frame, stringHotpoint) {
		var hotPoint = {
			x: 0,
			y: 0
		};

		switch (stringHotpoint) {
			case "LEFT-TOP":
				hotPoint.x = 0;
				hotPoint.y = 0;
				break;
			case "CENTER-TOP":
				hotPoint.x = frame.w / 2;
				hotPoint.y = 0;
				break;
			case "RIGHT-TOP":
				hotPoint.x = frame.w;
				hotPoint.y = 0;
				break;
			case "LEFT-CENTER":
				hotPoint.x = 0;
				hotPoint.y = frame.h / 2;
				break;
			case "CENTER-CENTER":
				hotPoint.x = frame.w / 2;
				hotPoint.y = frame.h / 2;
				break;
			case "RIGHT-CENTER":
				hotPoint.x = frame.w;
				hotPoint.y = frame.h / 2;
				break;
			case "LEFT-BOTTOM":
				hotPoint.x = 0;
				hotPoint.y = frame.h;
				break;
			case "CENTER-BOTTOM":
				hotPoint.x = frame.w / 2;
				hotPoint.y = frame.h;
				break;
			case "RIGHT-BOTTOM":
				hotPoint.x = frame.w;
				hotPoint.y = frame.h;
				break;
		}
		frame.hotpoint = hotPoint;
	};

	/**
	 * The _applyHotPoint is private and set some parameters about the hot points.
	 * @method _applyHotPoint
	 * @param animationEntry
	 * @param frames
	 * @private
	 */
	SpriteSheet.prototype._applyHotPoint = function(animationEntry, frames) {
		var xHotPoint;
		var yHotPoint;

		if (animationEntry.hotpoint) {
			for (var i = 0; i < frames.length; i++) {
				if (typeof animationEntry.hotpoint === "string") {
					this._setLitteralHotPoint(frames[i], animationEntry.hotpoint);
				} else {
					if (!animationEntry.hotpoint.x || !animationEntry.hotpoint.y ||
					    isNaN(animationEntry.hotpoint.x) || isNaN(animationEntry.hotpoint.y)) {
						return;
					}
					xHotPoint = animationEntry.hotpoint.x;
					yHotPoint = animationEntry.hotpoint.y;
					frames[i].hotpoint = {x: xHotPoint, y: yHotPoint};
				}
			}
		}
	};

	/**
	 * This function is private and have the aim to clone an animation entry.
	 * @private
	 * @method developAnimationFrames
	 * @param {Object} animationEntry
	 */
	SpriteSheet.prototype.developAnimationFrames = function(animationEntry) {
		var newFrames = [];
		var offset = 0;
		var frameClone;

		this.applyDefaultValuesToFrames(animationEntry);
		if (!animationEntry.frames) {
			return;
		}
		for (var i = 0; i < animationEntry.frames.length; i++) {
			if (animationEntry.frames[i].nbFrames && animationEntry.frames[i].nbFrames >= 1) {
				for (var j = 0; j < animationEntry.frames[i].nbFrames; j++) {
					if (j === 0) {
						frameClone = clone(animationEntry.frames[i]);
					} else {
						frameClone = clone(newFrames[offset - 1]);
					}
					if (j > 0) {
						this._applyFrameIncrementation(frameClone);
					}
					newFrames.push(frameClone);
					delete newFrames[offset].nbFrames;
					offset++;
				}
			} else {
				newFrames.push(clone(animationEntry.frames[i]));
			}
		}
		this._applyHotPoint(animationEntry, newFrames);
		animationEntry.frames = newFrames;
	};

	/**
	 * addAnimation method allows you to add an animation to the current SpriteSheet object.
	 * Note that if you add an animation with the same name than a previous one, the older will be overwritted.
	 *
	 * @method addAnimation
	 * @param {String} name it is the name of the animation
	 * @param {Object} config it is an object which contains the description of the name animation.
	 */
	SpriteSheet.prototype.addAnimation = function(name, config) {
		this.config[name] = clone(config);
		if (this.config[name].alias) {
			if (this.listAnimation[this.config[name].alias]) {
				this.config[name].frames = clone(this.listAnimation[this.config[name].alias].frames);
			}
		}
		this.developAnimationFrames(this.config[name]);
		this.listAnimation[name] = this.config[name];
	};

	/**
	 * rmAnimation method allows you to suppress an animation from the current SpriteSheet object.
	 *
	 * @method rmAnimation
	 * @param {String} name it is the name of the animation to delete
	 * @return {Boolean} the rmAnimation returns true if the name animation have been successfuly suppressed
	 * from the current SpriteSheet object.
	 */
	SpriteSheet.prototype.rmAnimation = function(name) {
		if (this.config[name] && this.listAnimation[name]) {
			delete this.config[name];
			delete this.listAnimation[name];
			return true;
		} else {
			return false;
		}
	};

	/**
	 * getAnimation method allows you to get a description of the name animation.
	 *
	 * @method getAnimation
	 * @param {String} name it is the name of the animation which you want to get the description
	 * @return {Object} the getAnimation method returns the description of the name animation on success.
	 * Otherwise it returns null
	 */
	SpriteSheet.prototype.getAnimation = function(name) {
		if (this.config[name]) {
			return clone(this.config[name]);
		} else {
			return null;
		}
	};


	/**
	 * setAnimation method allows you to set a new animation inside of the current SpriteSheet object.
	 *
	 * @method setAnimation
	 * @param {String} name it is the name of the new animation to be set.
	 * @param {Object} config it is the config object which describe the name animation.
	 */
	SpriteSheet.prototype.setAnimation = function(name, config) {
		this.addAnimation(name, config);
	};

	/**
	 * getListAnim method allows you to get the list of the animation contained inside of the
	 * current SpriteSheet object.
	 *
	 * @method getListAnim
	 * @return {Object} returns an object containing the animations of the SpriteSheet object.
	 */
	SpriteSheet.prototype.getListAnimation = function() {
		return this.config;
	};


	TW.Graphic.SpriteSheet = SpriteSheet;
	return SpriteSheet;
});

/**
 * @module Graphic
 * @namespace Graphic
 */

var TW = TW || {};
define('Graphic/AnimatedSprite',['./GraphicObject', '../Utils/inherit'], function(GraphicObject, inherit) {

	TW.Graphic = TW.Graphic || {};


	/**
	 * The AnimatedSprite allows you to create an object which can be animated using a
	 * {{#crossLink "Graphic.SpriteSheet"}}SpriteSheet{{/crossLink}}.
	 *
	 * When you instanciate a new AnimatedSprite instance, you have to pass it the SpriteSheet which it will
	 * have to use.
	 *
	 * The spritesheet represent the configuration of all animations and how to play them.
	 * An `AnimatedSprite` instance is an object which can be displayed, and can play animations.
	 * several AnimatedSprite with the same animation should use the same shared SpriteSheet.
	 *
	 * An animation can be started with `play()` and stopped with `stop()`. For managing animations,
	 * you can assign a callback when an animation is ended:
	 *
	 *     sprite.play("running", false, function(loop, anim, sprite, status) {
	 *         if (status == "END:STOP") {
	 *              console.log("Stop running, i'll walk.");
	 *              sprite.play("walking", true);
	 *         }
	 *     });
	 *
	 * @class AnimatedSprite
	 * @extends Graphic.GraphicObject
	 * @constructor
	 * @param {Object} params *params* is given to {{#crossLink "Graphic.GraphicObject"}}GraphicObject{{/crossLink}}
	 *   constructor.
	 *   @param {SpriteSheet} params.spriteSheet it is a SpriteSheet object which contains one or severals animation
	 *   which can be used by the current AnimatedSprite object.
	 */
	function AnimatedSprite(params) {
		GraphicObject.call(this, params);

		/**
		 * a SpriteSheet object which contains one or severals animation
		 * which can be used by the current AnimatedSprite object.
		 *
		 * @property {SpriteSheet} spriteSheet
		 */
		this.spriteSheet = params.spriteSheet || null;
		this._currentAnim = "";
		this._currentFrame = 0;
		this._loop = false;
		this._callback = null;
		this._status = "stop";
		this._sigmaElapsedTime = 0;
	}

	inherit(AnimatedSprite, GraphicObject);

	/**
	 * the play method allows you to start an animation (note that this animation must be defined inside of the
	 * SpriteSheet object currently used by the AnimatedSprite).
	 * @method play
	 * @param {String} name string parameter which represents the name of the animation to start
	 * @param {Boolean} loop boolean parameter which set looping the animation if set to true.
	 * Otherwise, looping is disabled.
	 * @param {Function} callback function which is called each time the animation reach it's end.
	 * Callback take one parameter which is an object which contains the following parameters :
	 * @param {Boolean} callback.loop a boolean which represent the loop status of the animation,
	 * if loop true then the animation will loop when its reach its end.
	 * @param {String} callback.anim a string which represent the name of the animation which reach end.
	 * @param {AnimatedSprite} callback.sprite a reference to the animated sprite which called the callback
	 * @param {String} callback.status a string which represent the status of the callback,
	 * status can have the following values :
	 *
	 * - `"END:LOOP"` the AnimatedSprite will loop
	 * - `"END:STOP"` the AnimatedSprite is now stopped,
	 * - `"PAUSE"` the AnimatedSprite is now paused
	 * - `"RESUME"` the animated sprite is now resumed
	 */
	AnimatedSprite.prototype.play = function(name, loop, callback) {
		this._currentAnim = name;
		this._loop = loop;
		this._currentFrame = 0;
		this._callback = callback;
		this._status = "play";
	};

	/**
	 * The pause method allows you to pause the current animation until the resume method is called.
	 * @method pause
	 */
	AnimatedSprite.prototype.pause = function() {
		this._status = "pause";
		if (typeof this._callback === "function") {
			this._callback({loop: this._loop, anim: this._currentAnim, sprite: this, status: "PAUSE"});
		}
	};

	/**
	 * The resume method allows you to resume the current animation if it has been pause before.
	 * @method resume
	 */
	AnimatedSprite.prototype.resume = function() {
		this._status = "play";
		if (typeof this._callback === "function") {
			this._callback({loop: this._loop, anim: this._currentAnim, sprite: this, status: "RESUME"});
		}
	};

	/**
	 * The stop method allows you to stop and then rewind the current animation.
	 * @method stop
	 */
	AnimatedSprite.prototype.stop = function() {
		var anim = this._currentAnim;
		var tmp = this.callback;
		this._status = "stop";
		this._currentAnim = "";
		this._callback = null;
		this._currentFrame = 0;
		if (typeof tmp === "function") {
			tmp({loop: this._loop, anim: anim, sprite: this, status: "END:STOP"});
		}
		this.notifyParentChange();
	};

	/**
	 * The isPlaying method allows you to test if the current AnimatedSprite object is playing or not an animation.
	 * @method isPlaying
	 * @return {Boolean} returns true if the current AnimatedSprite object is playing an animation,
	 * otherwise it returns false.
	 */
	AnimatedSprite.prototype.isPlaying = function() {
		return this._status === "play";
	};

	/**
	 * The getCurrentAnim returns the current animation which is currently played.
	 * @method getCurrentAnim
	 * @return {Object} returns the animation which is played. If there is no animations currently played then the
	 * getCurrentAnim method will returns null.
	 */
	AnimatedSprite.prototype.getCurrentAnim = function() {
		if (this.spriteSheet && this._currentAnim !== "") {
			return this.spriteSheet.getAnimation(this._currentAnim);
		}
		return null;
	};

	/**
	 * The update method is called each frame by the gameloop.
	 * @method update
	 * @return {Boolean} return true if the update function has been called successfully,
	 * otherwise false is returned.
	 */
	AnimatedSprite.prototype.update = function(deltaTime) {
		this._sigmaElapsedTime += deltaTime;
		if (this.spriteSheet === null || this._currentAnim === "") {
			return false;
		}
		var currentAnim = this.spriteSheet.getAnimation(this._currentAnim);
		if (!currentAnim.frames || !currentAnim.framerate) {
			return false;
		}
		if (this.isPlaying()) {
			if (this._sigmaElapsedTime >= 1000 / currentAnim.framerate) {
				this._currentFrame++;
				if (this._currentFrame >= currentAnim.frames.length) {
					if (this._loop === true) {
						this._currentFrame = 0;
						this.notifyParentChange();
					} else {
						this.stop();
					}
					if (typeof this._callback === "function") {
						this._callback({loop: this._loop, anim: this._currentAnim, sprite: this, status: "END:LOOP"});
					}
				} else {
					this.notifyParentChange();
				}
				this._sigmaElapsedTime = 0;
			}
		}
		return true;
	};

	/**
	 * This method is private and associate to the animated sprite the hotpoint
	 * @method _setCenterPointByHotPoint
	 * @param {Object} currentAnim current animation of the Animated Sprite.
	 * @private
	 */
	AnimatedSprite.prototype._setCenterPointByHotPoint = function(currentAnim) {
		if (currentAnim.frames[this._currentFrame].hotpoint) {
			this.centerPoint.x = currentAnim.frames[this._currentFrame].hotpoint.x;
			this.centerPoint.y = currentAnim.frames[this._currentFrame].hotpoint.y;
		}
	};

	/**
	 * This method allow you to draw an animated sprite on a context.
	 *
	 * @method draw
	 * @param context this parameter must be a valid canvas context,
	 *  otherwise the behavior of the draw method is unspecified.
	 * @return {Boolean} this methods return true if the context parameter is a valid object and if the sprite's
	 * image is also a validSpriteSheet.
	 */
	AnimatedSprite.prototype.draw = function(context) {
		if (!this.spriteSheet || this._currentAnim === "" || !context) {
			return false;
		}
		var currentAnim = this.spriteSheet.getAnimation(this._currentAnim);
		if (!currentAnim.frames || !currentAnim.framerate) {
			return false;
		}

		context.save();
		context.translate(this.x, this.y);
		this.matrix.transformContext(context);
		this._setCenterPointByHotPoint(currentAnim);
		context.translate(-this.centerPoint.x, -this.centerPoint.y);
		if (currentAnim.flipX) {
			context.scale(-1, 1);
			context.translate(-this.width, 0);
		}
		if (currentAnim.flipY) {
			context.scale(1, -1);
			context.translate(0, -this.height);
		}
		context.drawImage(this.spriteSheet.image,
		                  currentAnim.frames[this._currentFrame].x,
		                  currentAnim.frames[this._currentFrame].y,
		                  currentAnim.frames[this._currentFrame].w,
		                  currentAnim.frames[this._currentFrame].h,
		                  0, 0, this.width, this.height);
		context.restore();
		return true;
	};

	TW.Graphic.AnimatedSprite = AnimatedSprite;
	return AnimatedSprite;
});

/**
 * The graphic module contains a set of classes
 * extending HTML 2D canvas API.
 * It include matrix manipulation, graphic scope management, graphic cache and tools for improve performances.
 *
 * ### drawable objects
 *
 * All drawable object inherit from {{#crossLink "Graphic.GraphicObject"}}GraphicObject{{/crossLink}}.
 * This class contain some methods for manipulate Matrix and set general graphic properties.
 *
 * Tumbleweed provide two object categories: {{#crossLink "Graphic.Shape"}}Shape{{/crossLink}} and
 * {{#crossLink "Graphic.Sprite"}}Sprite{{/crossLink}}.<br />
 * Sprites are used for draw an image or a part of image.<br />
 * Shapes are dedicated to rendering forms like rectangles or Circles.
 *
 * For drawing animated image, the {{#crossLink "Graphic.AnimatedSprite"}}AnimatedSprite{{/crossLink}} class is
 * available, using {{#crossLink "Graphic.SpriteSheet"}}SpriteSheet{{/crossLink}}.
 *
 * ### graphic scope & matrix transformation
 *
 * Although it's possible to draw a GraphicObject directly by passing a canvas context, the most easy way is to
 * use {{#crossLink "Graphic.Window"}}Window{{/crossLink}} and {{#crossLink "Graphic.Layer"}}Layer{{/crossLink}}.<br />
 * A layer is a graphicalObject which can contain others graphical objects.
 * The interest is to add matrix transformations and share them to many objects.<br />
 * `Window` is a special layer keeping a reference from a HTML Canvas Element.
 *
 *
 * ### performance
 *
 * For improve graphic performances, two way are possible: draw less objects each time or draw less often.
 * The graphic module contain methods for reduce both number of redraw and useless draw.<br />
 * The first point is treated by the cache management, provided by {{#crossLink "Graphic.Layer"}}Layer{{/crossLink}}
 * and {{#crossLink "Graphic.Window"}}Window{{/crossLink}} classes. After a first draw, a canvas cache is kept in memory
 * for don't redraw until object has changed.<br />
 *
 * The second point is the purpose of the class {{#crossLink "Graphic.SpatialContainer"}}SpatialContainer{{/crossLink}},
 * used by {{#crossLink "Graphic.Layer"}}Layer{{/crossLink}}
 * and {{#crossLink "Graphic.Window"}}Window{{/crossLink}}.
 *
 * Each SpatialContainer check for draw only a part of all objects, and not try to draw objects
 * which are not in the screen.
 * Because different type of scenes exist, each container is adapted to specific context.
 *
 * @module Graphic
 * @main
 */


var TW = TW || {};


define('Graphic',[
	       './Graphic/Camera',
	       './Graphic/Circle',
	       './Graphic/GraphicObject',
	       './Graphic/Layer',
	       './Graphic/Rect',
	       './Graphic/Shape',
	       './Graphic/SpatialContainer',
	       './Graphic/Sprite',
	       './Graphic/Window',
	       './Graphic/SpriteSheet',
	       './Graphic/AnimatedSprite'
       ], function() {
	return TW.Graphic;
});



/**
 * This module contain useful class and method
 * for perform calcul with matrix or vector.
 *
 * @module Math
 * @main
 */


var TW = TW || {};


define('Math',[
	       './Math/Matrix2D',
	       './Math/Vector2D'
       ], function() {
	return TW.Math;
});




/**
 * @module Preload
 * @namespace Preload
 */

var TW = TW || {};
define('Preload/XHRLoader',['./Preload', '../Utils/Polyfills'], function() {

	TW.Preload = TW.Preload || {};


	/**
	 * @class XHRLoader
	 * @param file
	 * @constructor
	 */
	function XHRLoader(file) {
		/**
		 * Determine if this loader has completed already.
		 * @property loaded
		 * @type Boolean
		 * @default false
		 */
		this.loaded = false;

		/**
		 * The current load progress (percentage) for this item.
		 * @property progress
		 * @type Number
		 * @default 0
		 */
		this.progress = 0;

		// The manifest item we are loading
		this._item = file;

		//Callbacks
		/**
		 * The callback to fire when progress changes.
		 * @event onProgress
		 */
		this.onProgress = null;

		/**
		 * The callback to fire when a load starts.
		 * @event onLoadStart
		 */
		this.onLoadStart = null;

		/**
		 * The callback to fire when a file completes.
		 * @event onFileLoad
		 */
		this.onFileLoad = null;

		/**
		 * The callback to fire when a file progress changes.
		 * @event onFileProgress
		 */
		this.onFileProgress = null;

		/**
		 * The callback to fire when all loading is complete.
		 * @event onComplete
		 */
		this.onComplete = null;

		/**
		 * The callback to fire when the loader encounters an error. If the error was encountered
		 * by a file, the event will contain the required file data, but the target will be the loader.
		 * @event onError
		 */
		this.onError = null;

		this._createXHR(file);
	}

	/**
	 * Begin the load.
	 * @method load
	 */
	XHRLoader.prototype.load = function() {
		if (this._request === null) {
			this.handleError();
			return;
		}

		//Setup timeout if we're not using XHR2
		if (this._xhrLevel === 1) {
			this._loadTimeOutTimeout = setTimeout(this.handleTimeout.bind(this), TW.Preload.TIMEOUT_TIME);
		}

		//Events
		this._request.onloadstart = this.handleLoadStart.bind(this);
		this._request.onprogress = this.handleProgress.bind(this);
		this._request.onabort = this.handleAbort.bind(this);
		this._request.onerror = this.handleError.bind(this);
		this._request.ontimeout = this.handleTimeout.bind(this);

		//LM: Firefox does not get onload. Chrome gets both. Might need onload for other things.
		this._request.onload = this.handleLoad.bind(this);
		this._request.onreadystatechange = this.handleReadyStateChange.bind(this);

		try { // Sometimes we get back 404s immediately, particularly when there is a cross origin request.
			this._request.send();
		} catch (error) {
			this._sendError({source: error});
		}
	};

	/**
	 * Get a reference to the manifest item that is loaded by this loader.
	 *
	 * @method getItem
	 * @return {Object} The manifest item
	 */
	XHRLoader.prototype.getItem = function() {
		return this._item;
	};

	/**
	 * @method getResult
	 * @return {*}
	 */
	XHRLoader.prototype.getResult = function() {
		//[SB] When loading XML IE9 does not return .response, instead it returns responseXML.xml
		try {
			return this._request.responseText;
		} catch (error) {
		}
		return this._request.response;
	};

	/**
	 * Determine if a specific type should be loaded as a binary file
	 *
	 * @method isBinary
	 * @param type The type to check
	 * @private
	 */
	XHRLoader.prototype.isBinary = function(type) {
		switch (type) {
			case this.IMAGE:
			case this.SOUND:
				return true;
			default:
				return false;
		}
	};

	XHRLoader.prototype.handleProgress = function(event) {
		if (event.loaded > 0 && event.total === 0) {
			return; // Sometimes we get no "total", so just ignore the progress event.
		}
		this._sendProgress({loaded: event.loaded, total: event.total});
	};

	XHRLoader.prototype.handleLoadStart = function() {
		clearTimeout(this._loadTimeOutTimeout);
		this._sendLoadStart();
	};

	XHRLoader.prototype.handleAbort = function() {
		this._clean();
		this._sendError();
	};

	XHRLoader.prototype.handleError = function() {
		this._clean();
		this._sendError();
	};

	XHRLoader.prototype.handleReadyStateChange = function() {
		if (this._request.readyState === 4) {
			this.handleLoad();
		}
	};

	XHRLoader.prototype._checkError = function() {
		//LM: Probably need additional handlers here.
		var status = parseInt(this._request.status, 10);

		switch (status) {
			case 404:   // Not Found
			case 0:     // Not Loaded
				return false;
		}

		//wdg:: added check for this._hasTextResponse() ... Android  2.2 uses it.
		return this._hasResponse() || this._hasTextResponse() || this._hasXMLResponse();
	};

	/*
	 * Validate the response (we need to try/catch some of these, nicer to break them into functions.
	 */
	XHRLoader.prototype._hasResponse = function() {
		return this._request.response !== null;
	};

	XHRLoader.prototype._hasTextResponse = function() {
		try {
			return this._request.responseText !== null;
		} catch (e) {
			return false;
		}
	};

	XHRLoader.prototype._hasXMLResponse = function() {
		try {
			return this._request.responseXML !== null;
		} catch (e) {
			return false;
		}
	};

	XHRLoader.prototype.handleLoad = function() {
		if (this.loaded) {
			return;
		}
		this.loaded = true;

		if (!this._checkError()) {
			this.handleError();
			return;
		}

		this._clean();
		this._sendComplete();
	};

	XHRLoader.prototype.handleTimeout = function() {
		this._clean();
		this._sendError();
	};

	XHRLoader.prototype._createXHR = function(item) {
		this._xhrLevel = 1;

		if (window.ArrayBuffer) {
			this._xhrLevel = 2;
		}

		// Old IE versions use a different approach
		if (window.XMLHttpRequest) {
			this._request = new XMLHttpRequest();
		} else {
			try {
				/*global ActiveXObject */
				this._request = new ActiveXObject("MSXML2.XMLHTTP.3.0");
			} catch (ex) {
				return null;
			}
		}

		//IE9 doesn't support .overrideMimeType(), so we need to check for it.
		if (item.type === TW.Preload.TEXT && this._request.overrideMimeType) {
			this._request.overrideMimeType('text/plain; charset=x-user-defined');
		}

		this._request.open('GET', item.src, true);

		if (this.isBinary(item.type)) {
			this._request.responseType = 'arraybuffer';
		}
		return true;
	};

	XHRLoader.prototype._clean = function() {
		clearTimeout(this._loadTimeOutTimeout);

		var req = this._request;
		req.onloadstart = null;
		req.onprogress = null;
		req.onabort = null;
		req.onerror = null;
		req.onload = null;
		req.ontimeout = null;
		req.onloadend = null;
		req.onreadystatechange = null;

		clearInterval(this._checkLoadInterval);
	};

	//Callback proxies
	XHRLoader.prototype._sendLoadStart = function() {
		if (this.onLoadStart) {
			this.onLoadStart({target: this});
		}
	};

	XHRLoader.prototype._sendProgress = function(value) {
		var event;
		if (value instanceof Number) {
			this.progress = value;
			event = {loaded: this.progress, total: 1};
		} else {
			event = value;
			this.progress = value.loaded / value.total;
			if (isNaN(this.progress) || this.progress === Infinity) {
				this.progress = 0;
			}
		}
		event.target = this;
		if (this.onProgress) {
			this.onProgress(event);
		}
	};

	XHRLoader.prototype._sendFileProgress = function(event) {
		if (this.onFileProgress) {
			event.target = this;
			this.onFileProgress(event);
		}
	};

	XHRLoader.prototype._sendComplete = function() {
		if (this.onComplete) {
			this.onComplete({target: this});
		}
	};

	XHRLoader.prototype._sendFileComplete = function(event) {
		if (this.onFileLoad) {
			event.target = this;
			this.onFileLoad(event);
		}
	};

	XHRLoader.prototype._sendError = function(event) {
		if (this.onError) {
			if (event === null) {
				event = {};
			}
			event.target = this;
			this.onError(event);
		}
	};

	TW.Preload.XHRLoader = XHRLoader;
	return XHRLoader;
});

/**
 * @module Preload
 * @namespace Preload
 */


var TW = TW || {};
define('Preload/Preload',['./XHRLoader', '../Utils/Polyfills'], function(XHRLoader) {

	TW.Preload = TW.Preload || {};


	/**
	 * The preload type for image files, usually png, gif, or jpg/jpeg
	 * @property IMAGE
	 * @type String
	 * @default image
	 * @static
	 */
	TW.Preload.IMAGE = "image";

	/* The preload type for SVG files.
	 * @property SVG
	 * @type String
	 * @default svg
	 * @static
	 */
	TW.Preload.SVG = "svg";

	/**
	 * The preload type for sound files, usually mp3, ogg, or wav.
	 * @property SOUND
	 * @type String
	 * @default sound
	 * @static
	 */
	TW.Preload.SOUND = "sound";

	/**
	 * The preload type for json files, usually with the "json" file extension.
	 * @property JSON
	 * @type String
	 * @default json
	 * @static
	 */
	TW.Preload.JSON = "json";

	/**
	 * The preload type for css files.
	 * @property CSS
	 * @type String
	 * @default css
	 * @static
	 */
	TW.Preload.CSS = "css";

	/**
	 * The preload type for xml files.
	 * @property XML
	 * @type String
	 * @default xml
	 * @static
	 */
	TW.Preload.XML = "xml";

	/**
	 * The preload type for text files, which is also the default file type if the type can not be determined.
	 * @property TEXT
	 * @type String
	 * @default text
	 * @static
	 */
	TW.Preload.TEXT = "text";

	/**
	 * Time in millseconds to assume a load has failed.
	 * @property TIMEOUT_TIME
	 * @type Number
	 * @default 8000
	 * @static
	 */
	TW.Preload.TIMEOUT_TIME = 8000;


	/**
	 * Preload class is object utility for preload different file format.
	 *
	 * @class Preload
	 * @constructor
	 */
	function Preload() {

		/**
		 * The next preload queue to process when this one is complete.
		 * @property next
		 * @type Preload
		 * @default null
		 */
		this.next = null;

		//Protected properties
		this.typeHandlers = null;
		this.extensionHandlers = null;

		this._maxConnections = 1;

		this._numItems = 0;
		this._numItemsLoaded = 0;
		this._targetProgress = 0;
		this._paused = false;
		this._currentLoads = [];
		this._loadQueue = [];
		this._loadedItemsById = {};
		this._loadedItemsBySrc = {};
		this.typeHandlers = {};
		this.extensionHandlers = {};
		this._loadStartWasDispatched = false;

		/**
		 * Determine if this loader has completed already.
		 * @property loaded
		 * @type Boolean
		 * @default false
		 */
		this.loaded = false;

		/**
		 * The current load progress (percentage) for this item.
		 * @property progress
		 * @type Number
		 * @default 0
		 */
		this.progress = 0;

		//Callbacks
		/**
		 * The callback to fire when progress changes.
		 * @event onProgress
		 */
		this.onProgress = null;

		/**
		 * The callback to fire when a load starts.
		 * @event onLoadStart
		 */
		this.onLoadStart = null;

		/**
		 * The callback to fire when a file completes.
		 * @event onFileLoad
		 */
		this.onFileLoad = null;

		/**
		 * The callback to fire when a file progress changes.
		 * @event onFileProgress
		 */
		this.onFileProgress = null;

		/**
		 * The callback to fire when all loading is complete.
		 * @event onComplete
		 */
		this.onComplete = null;

		/**
		 * The callback to fire when the loader encounters an error. If the error was encountered
		 * by a file, the event will contain the required file data, but the target will be the loader.
		 * @event onError
		 */
		this.onError = null;
	}

	//Callback proxies
	Preload.prototype._sendLoadStart = function() {
		if (this.onLoadStart) {
			this.onLoadStart({target: this});
		}
	};

	Preload.prototype._sendProgress = function(value) {
		var event;
		if (value instanceof Number) {
			this.progress = value;
			event = {loaded: this.progress, total: 1};
		} else {
			event = value;
			this.progress = value.loaded / value.total;
			if (isNaN(this.progress) || this.progress === Infinity) {
				this.progress = 0;
			}
		}
		event.target = this;
		if (this.onProgress) {
			this.onProgress(event);
		}
	};

	Preload.prototype._sendFileProgress = function(event) {
		if (this.onFileProgress) {
			event.target = this;
			this.onFileProgress(event);
		}
	};

	Preload.prototype._sendComplete = function() {
		if (this.onComplete) {
			this.onComplete({target: this});
		}
	};

	Preload.prototype._sendFileComplete = function(event) {
		if (this.onFileLoad) {
			event.target = this;
			this.onFileLoad(event);
		}
	};

	Preload.prototype._sendError = function(event) {
		if (this.onError) {
			if (event === null) {
				event = {};
			}
			event.target = this;
			this.onError(event);
		}
	};

	/**
	 * Set the maximum number of concurrent connections.
	 *
	 * @method setMaxConnections
	 * @param {Number} value The number of concurrent loads to allow.
	 *  By default, only a single connection is open at any time.
	 * Note that browsers and servers may have a built-in maximum number of open connections
	 */
	Preload.prototype.setMaxConnections = function(value) {
		this._maxConnections = value;
		if (!this._paused) {
			this._loadNext();
		}
	};

	/**
	 * Load a single file. Note that calling loadFile appends to the current queue, so it can be used multiple times
	 * to add files. Use `loadManifest()` to add multiple files at onces.
	 * To clear the queue first use the `close()` method.
	 *
	 * @method loadFile
	 * @param {Object | String} file The file object or path to load. A file can be either
	 *
	 *  - a path to a resource (string). Note that this kind of load item will be
	 *     converted to an object (next item) in the background.
	 *  - OR an object that contains:
	 *      - src: The source of the file that is being loaded. This property is <b>required</b>.
	 *         The source can either be a string (recommended), or an HTML tag.
	 *      - type: The type of file that will be loaded (image, sound, json, etc).
	 *         Preload does auto-detection of types using the extension. Supported types are defined on Preload,
	 *         such as Preload.IMAGE. It is recommended that a type is specified when
	 *         a non-standard file URI (such as a php script) us used.
	 *      - id: A string identifier which can be used to reference the loaded object.
	 *      - data: An arbitrary data object, which is included with the loaded object
	 *
	 *
	 * @param {Boolean} [loadNow=true] Kick off an immediate load (true) or wait for a load call (false).
	 *  If the queue is paused, and this value is true, the queue will resume.
	 */
	Preload.prototype.loadFile = function(file, loadNow) {
		if (file === null) {
			this._sendError({text: "File is null."});
			return;
		}
		this._addItem(file);

		if (loadNow !== false) {
			this.setPaused(false);
		}
	};

	/**
	 * Load a manifest. This is a shortcut method to load a group of files.
	 * To load a single file, use the loadFile method.
	 * Note that calling loadManifest appends to the current queue, so it can be used multiple times to add files.
	 * To clear the queue first, use the <b>close()</b> method.
	 *
	 * @method loadManifest
	 * @param {Array} manifest The list of files to load. Each file can be either
	 *
	 *  - a path to a resource (string). Note that this kind of load item will be
	 *    converted to an object (next item) in the background.
	 *  - OR an object that contains:
	 *    - *src*: The source of the file that is being loaded. This property is **required**.
	 *      The source can either be a string (recommended), or an HTML tag.
	 *    - *type*: The type of file that will be loaded (image, sound, json, etc).
	 *      Preload does auto-detection of types using the extension. Supported types are defined on Preload,
	 *      such as Preload.IMAGE.
	 *      It is recommended that a type is specified when a non-standard file URI (such as a php script) us used.
	 *    - *id*: A string identifier which can be used to reference the loaded object.
	 *    - *data*: An arbitrary data object, which is included with the loaded object
	 *
	 * @param {Boolean} loadNow Kick off an immediate load (true) or wait for a load call (false).
	 *  The default value is true. If the queue is paused, and this value
	 *  is true, the queue will resume.
	 */
	Preload.prototype.loadManifest = function(manifest, loadNow) {
		var data;

		if (manifest instanceof Array) {
			if (manifest.length === 0) {
				this._sendError({text: "Manifest is empty."});
				return;
			}
			data = manifest;
		} else {
			if (manifest === null) {
				this._sendError({text: "Manifest is null."});
				return;
			}
			data = [manifest];
		}

		for (var i = 0, l = data.length; i < l; i++) {
			this._addItem(data[i], false);
		}

		if (loadNow !== false) {
			this._loadNext();
		}
	};

	/**
	 * Begin loading the queued items.
	 * @method load
	 */
	Preload.prototype.load = function() {
		this.setPaused(false);
	};

	/**
	 * Lookup a loaded item using either the "id" or "src" that was specified when loading it.
	 * @method getResult
	 *
	 * @param {String} value The "id" or "src" of the loaded item.
	 * @return {Object} A result object containing the contents of the object that was initially requested using
	 *  loadFile or loadManifest, including:
	 *
	 *   - `src`: The source of the file that was requested.
	 *   - type: The type of file that was loaded. If it was not specified,
	 *     this is auto-detected by Preload using the file extension.
	 *   - `id`: The id of the loaded object.
	 *     If it was not specified, the ID will be the same as the "src" property.
	 *   - data: Any arbitrary data that was specified, otherwise it will be undefined.
	 *   - `result`: The loaded object. Preload provides usable tag elements when possible:
	 *      - An HTMLImageElement tag (`<image/>`) for images
	 *      - An HTMLAudioElement tag (`<audio/>`) for audio
	 *      - A script tag for JavaScript (`<script></script>`)
	 *      - A style tag for CSS (`<style></style>`)
	 *      - Raw text for JSON or any other kind of loaded item
	 *
	 * This object is also returned via the "onFileLoad" callback, although a "target" will be included,
	 * which is a reference to the Preload instance.
	 */
	Preload.prototype.getResult = function(value) {
		return this._loadedItemsById[value] || this._loadedItemsBySrc[value];
	};

	/**
	 * Pause or resume the current load. The active item will not cancel, but the next
	 * items in the queue will not be processed.
	 *
	 * @method setPaused
	 * @param {Boolean} value Whether the queue should be paused or not.
	 */
	Preload.prototype.setPaused = function(value) {
		this._paused = value;
		if (!this._paused) {
			this._loadNext();
		}
	};

	/**
	 * Close the active queue. Closing a queue completely empties the queue,
	 * and prevents any remaining items from starting to
	 * download. Note that currently there any active loads will remain open, and events may be processed.
	 *
	 * To stop and restart a queue, use the `setPaused(true|false)` method instead.
	 *
	 * @method close
	 */
	Preload.prototype.close = function() {
		while (this._currentLoads.length) {
			this._currentLoads.pop().cancel();
		}
		this._currentLoads = [];
		this._scriptOrder = [];
		this._loadedScripts = [];
	};


	//Protected Methods
	Preload.prototype._addItem = function(item) {
		var loadItem = this._createLoadItem(item);
		if (loadItem !== null) {
			this._loadQueue.push(loadItem);

			this._numItems++;
			this._updateProgress();
		}
	};

	Preload.prototype._loadNext = function() {
		var loadItem;

		if (this._paused) {
			return;
		}

		if (!this._loadStartWasDispatched) {
			this._sendLoadStart();
			this._loadStartWasDispatched = true;
		}

		if (this._numItems === this._numItemsLoaded) {
			this.loaded = true;
			this._sendComplete();
			if (this.next && this.next.load) {
				//LM: Do we need to apply here?
				this.next.load.apply(this.next);
			}
		}

		while (this._loadQueue.length && this._currentLoads.length < this._maxConnections) {
			loadItem = this._loadQueue.shift();
			this._loadItem(loadItem);
		}
	};

	Preload.prototype._loadItem = function(item) {
		item.onProgress = this._handleProgress.bind(this);
		item.onComplete = this._handleFileComplete.bind(this);
		item.onError = this._handleFileError.bind(this);

		this._currentLoads.push(item);

		item.load();
	};

	Preload.prototype._handleFileError = function(event) {
		var loader = event.target;

		var resultData = this._createResultData(loader.getItem());
		this._numItemsLoaded++;
		this._updateProgress();

		this._sendError(resultData);

		if (!this.stopOnError) {
			this._removeLoadItem(loader);
			this._loadNext();
		}
	};

	Preload.prototype._createResultData = function(item) {
		var resultData = {id: item.id, result: null, data: item.data, type: item.type, src: item.src};
		this._loadedItemsById[item.id] = resultData;
		this._loadedItemsBySrc[item.src] = resultData;
		return resultData;
	};

	Preload.prototype._handleFileComplete = function(event) {
		var loader = event.target;
		var item = loader.getItem();
		var resultData = this._createResultData(item);

		this._removeLoadItem(loader);

		if (loader instanceof XHRLoader) {
			resultData.result = this._createResult(item, loader.getResult());
		}

		switch (item.type) {
			case TW.Preload.IMAGE: //LM: Consider moving this to XHRLoader
				if (loader instanceof XHRLoader) {
					var _this = this; // Use closure workaround to maintain reference to item/result
					resultData.result.onload = function() {
						_this._handleFileTagComplete(item, resultData);
					};
					return;
				}
				break;
			case TW.Preload.SVG:
			case TW.Preload.SOUND:
				break;
			default:
				break;
		}

		this._handleFileTagComplete(item, resultData);
	};

	Preload.prototype._handleFileTagComplete = function(item, resultData) {
		this._numItemsLoaded++;

		if (item.completeHandler) {
			item.completeHandler(resultData);
		}

		this._updateProgress();
		this._sendFileComplete(resultData);

		this._loadNext();
	};

	Preload.prototype._removeLoadItem = function(loader) {
		var l = this._currentLoads.length;
		for (var i = 0; i < l; i++) {
			if (this._currentLoads[i] === loader) {
				this._currentLoads.splice(i, 1);
				return;
			}
		}
	};

	Preload.prototype._createResult = function(item, data) {
		var tag = null;
		var resultData;
		switch (item.type) {
			case TW.Preload.IMAGE:
				tag = this._createImage();
				break;
			case TW.Preload.SOUND:
				tag = item.tag || this._createAudio();
				break;
			case TW.Preload.CSS:
				tag = this._createLink();
				break;
			case TW.Preload.SVG:
				tag = this._createSVG();
				tag.appendChild(this._createXML(data, "image/svg+xml"));
				break;
			case TW.Preload.XML:
				resultData = this._createXML(data, "text/xml");
				break;
			case TW.Preload.JSON:
			case TW.Preload.TEXT:
				resultData = data;
		}

		//LM: Might not need to do this with Audio.
		if (tag) {
			if (item.type === this.CSS) {
				tag.href = item.src;
			} else if (item.type !== this.SVG) {
				tag.src = item.src;
			}
			return tag;
		} else {
			return resultData;
		}
	};

	Preload.prototype._createXML = function(data, type) {
		var resultData;
		var parser;

		if (window.DOMParser) {
			/*global DOMParser */
			parser = new DOMParser();
			resultData = parser.parseFromString(data, type);
		} else { // Internet Explorer
			/*global ActiveXObject */
			parser = new ActiveXObject("Microsoft.XMLDOM");
			parser.async = false;
			parser.loadXML(data);
			resultData = parser;
		}

		return resultData;
	};

	// This is item progress!
	Preload.prototype._handleProgress = function(event) {
		var loader = event.target;
		var resultData = this._createResultData(loader.getItem());
		resultData.progress = loader.progress;
		this._sendFileProgress(resultData);
		this._updateProgress();
	};

	Preload.prototype._updateProgress = function() {
		var loaded = this._numItemsLoaded / this._numItems; // Fully Loaded Progress
		var remaining = this._numItems - this._numItemsLoaded;
		if (remaining > 0) {
			var chunk = 0;
			for (var i = 0, l = this._currentLoads.length; i < l; i++) {
				chunk += this._currentLoads[i].progress;
			}
			loaded += (chunk / remaining) * (remaining / this._numItems);
		}
		this._sendProgress({loaded: loaded, total: 1});
	};

	Preload.prototype._createLoadItem = function(loadItem) {
		var item = {};

		// Create/modify a load item
		switch (typeof(loadItem)) {
			case "string":
				item.src = loadItem;
				break;
			case "object":
				/*global HTMLAudioElement */
				if (loadItem instanceof HTMLAudioElement) {
					item.tag = loadItem;
					item.src = item.tag.src;
					item.type = TW.Preload.SOUND;
				} else {
					item = loadItem;
				}
				break;
			default:
				break;
		}

		// Get source extension
		item.ext = this._getNameAfter(item.src, ".");
		if (!item.type) {
			item.type = this.getType(item.ext);
		}
		//If there's no id, set one now.
		if (item.id === null || item.id === "") {
			//item.id = this._getNameAfter(item.src, "/");
			item.id = item.src; //[SB] Using the full src is more robust, and more useful from a user perspective.
		}

		// Give plugins a chance to modify the loadItem
		var customHandler = this.typeHandlers[item.type] || this.extensionHandlers[item.ext];
		if (customHandler) {
			var result = customHandler(item.src, item.type, item.id, item.data);
			//Plugin will handle the load, so just ignore it.
			if (result === false) {
				return null;

				// Load as normal
			} /* else if (result === true) {
			 // Do Nothing
			 // Result is a loader class
			 } */ else {
				if (result.src !== null) {
					item.src = result.src;
				}
				if (result.id !== null) {
					item.id = result.id;
				}
				if (result.tag !== null && result.tag.load instanceof Function) { //Item has what we need load
					item.tag = result.tag;
				}
			}

			// Update the extension in case the type changed
			item.ext = this._getNameAfter(item.src, ".");
		}

		return new XHRLoader(item);
	};

	Preload.prototype.getType = function(ext) {
		switch (ext) {
			case "jpeg":
			case "jpg":
			case "gif":
			case "png":
				return TW.Preload.IMAGE;
			case "ogg":
			case "mp3":
			case "wav":
				return TW.Preload.SOUND;
			case "json":
				return TW.Preload.JSON;
			case "xml":
				return TW.Preload.XML;
			case "css":
				return TW.Preload.CSS;
			case 'svg':
				return TW.Preload.SVG;
			default:
				return TW.Preload.TEXT;
		}
	};

	Preload.prototype._getNameAfter = function(path, token) {
		var dotIndex = path.lastIndexOf(token);
		var lastPiece = path.substr(dotIndex + 1);
		var endIndex = lastPiece.lastIndexOf(/[\b|\?|#|\s]/);
		return (endIndex === -1) ? lastPiece : lastPiece.substr(0, endIndex);
	};

	Preload.prototype._createImage = function() {
		return document.createElement("img");
	};

	Preload.prototype._createSVG = function() {
		var tag = document.createElement("object");
		tag.type = "image/svg+xml";
		return tag;
	};

	Preload.prototype._createAudio = function() {
		var tag = document.createElement("audio");
		tag.autoplay = false;
		tag.type = "audio/ogg";
		return tag;
	};

	Preload.prototype._createScript = function() {
		var tag = document.createElement("script");
		tag.type = "text/javascript";
		return tag;
	};

	Preload.prototype._createLink = function() {
		var tag = document.createElement("link");
		tag.type = "text/css";
		tag.rel = "stylesheet";
		return tag;
	};

	TW.Preload.Preload = Preload;
	return Preload;
});

/**
 *
 * @module Preload
 * @main
 */


var TW = TW || {};


define('Preload',[
	       './Preload/Preload',
	       './Preload/XHRLoader'
       ], function() {
	return TW.Preload;
});



/**
 * @module Audio
 * @namespace Audio
 */

var TW = TW || {};
define('Audio/Sound',['../Utils/Polyfills'], function() {

	TW.Audio = TW.Audio || {};


	TW.Audio.PLAY_SUCCEEDED = "playSucceeded";
	TW.Audio.PLAY_FINISHED = "playFinished";
	TW.Audio.PLAY_FAILED = "playFailed";

	TW.Audio.AUDIO_READY = "canplaythrough";
	TW.Audio.AUDIO_ENDED = "ended";
	TW.Audio.AUDIO_PLAYED = "play";

	/**
	 * Sound class is object represent html5 sound tag.
	 *
	 * @class Sound
	 * @constructor
	 * @param {String|String[]} src The sound source url. If an array is passed, the first supported source is used,
	 *  so provide the same sound in many formats is recommended.
	 */
	function Sound(src) {

		/**
		 * Audio play state.
		 *
		 * @property {String} playState
		 * @readonly
		 * @default null
		 */
		this.playState = null;


		/**
		 * Audio offset.
		 *
		 * @property {Number} offset
		 * @default 0
		 * @private
		 */
		this._offset = 0;

		/**
		 * Audio volume, between 0.0 and 1.0
		 *
		 * @property {Number} _volume
		 * @default 1.0
		 * @private
		 */
		this._volume = 1;

		/**
		 * Number of loop remaining to play.
		 *
		 * @property {Number} remainingLoops
		 * @default 0
		 */
		this.remainingLoops = 0;

		/**
		 * Mute state.
		 *
		 * @property {Boolean} _muted
		 * @default false
		 * @private
		 */
		this._muted = false;

		/**
		 * Pause state.
		 *
		 * @property {Boolean} paused
		 * @readonly
		 * @default false
		 */
		this.paused = false;

		/**
		 * Callback function when sound play is complete.
		 *
		 * @property {Function} onComplete
		 * @default null
		 */
		this.onComplete = null;

		/**
		 * Callback called when sound play restart loop.
		 *
		 * @property {Function} onLoop
		 * @default null
		 */
		this.onLoop = null;

		/**
		 * Callback called when sound is ready to play.
		 *
		 * @property {Function} onReady
		 * @default null
		 */
		this.onReady = null;

		/**
		 * Html5 tag audio.
		 *
		 * @property {Audio} audio
		 * @type Object
		 */
		this.audio = document.createElement("audio");

		/**
		 * Html5 tag audio capabilities.
		 * Indicates for each format if it is supported by the navigator.
		 *
		 * Supported format are mp3, ogg and wav.
		 *
		 * @property {Object} audio
		 * @readonly
		 * @example
		 *
		 *     { mp3: true, ogg: false, wav: true }
		 *
		 */
		this.capabilities = {
			mp3: ( this.audio.canPlayType("audio/mp3") !== "no" && this.audio.canPlayType("audio/mp3") !== "" ),
			ogg: ( this.audio.canPlayType("audio/ogg") !== "no" && this.audio.canPlayType("audio/ogg") !== "" ),
			wav: ( this.audio.canPlayType("audio/wav") !== "no" && this.audio.canPlayType("audio/wav") !== "" )
		};

		/**
		 * Audio source file, used by the audio element.
		 *
		 * Even if many paths are passed to constructor, `src` contain only that which is currently used.
		 *
		 * @property {String} src
		 * @readonly
		 */
		this.src = this._choosePath(src);
		if (src === null) {
			throw new Error("Unable to load sound: no supported sources.");
		}

		this.audio.src = this.src;
		this.endedHandler = this.handleSoundComplete.bind(this);
		this.readyHandler = this.handleSoundReady.bind(this);
	}

	/**
	 * choose a compatible source for audio tag.
	 *
	 * @method _choosePath
	 * @param {String|String[]} sources url or array of urls for source audio file.
	 * @return {String} the first copmpatible url if any; `null` otherwise.
	 * @private
	 */
	Sound.prototype._choosePath = function(sources) {
		if (!(sources instanceof Array)) {
			sources = [sources];
		}

		var length = sources.length;
		for (var i = 0; i < length; i++) {
			var point = sources[i].lastIndexOf(".");
			var ext = sources[i].substr(point + 1).toLowerCase();
			if (this.capabilities[ext] === true) {
				return sources[i];
			}
		}
		return null;
	};

	/**
	 * Called when an error occurs for cleaning audio tag.
	 *
	 * @method _playFailed
	 * @private
	 */
	Sound.prototype._playFailed = function() {
		this.playState = TW.Audio.PLAY_FAILED;
		this.audio.pause();
		this.audio.currentTime = 0;
		this.audio.removeEventListener(TW.Audio.AUDIO_ENDED, this.endedHandler, false);
		this.audio.removeEventListener(TW.Audio.AUDIO_READY, this.readyHandler, false);
		this.audio = null;
	};

	/**
	 * Load sound and call `onReady` callback when load finish.
	 *
	 * @method load
	 * @param {Number} offset The offset where sound start.
	 * @param {Number} loop The number of loop where sound played.
	 * @param {Number} volume The volume of sound.
	 * @return {Boolean} true if sound begin the loading or false if the sound loading is impossible.
	 */
	Sound.prototype.load = function(offset, loop, volume) {

		if (this.audio === null) {
			this._playFailed();
			return false;
		}

		this.audio.addEventListener(TW.Audio.AUDIO_ENDED, this.endedHandler, false);

		this._offset = offset;
		this._volume = volume;
		this._updateVolume();
		this.remainingLoops = loop;

		if (this.audio.readyState !== 4) {
			this.audio.addEventListener(TW.Audio.AUDIO_READY, this.readyHandler, false);
			this.audio.load();
		} else {
			this.handleSoundReady();
		}

		return true;
	};

	Sound.prototype.handleSoundReady = function() {
		this.playState = TW.Audio.PLAY_SUCCEEDED;
		this.paused = false;
		this.audio.removeEventListener(TW.Audio.AUDIO_READY, this.readyHandler, false);

		if (this._offset >= this.getDuration()) {
			this._playFailed();
			return;
		}

		this.audio.currentTime = this._offset;

		if (this.onReady !== null) {
			this.onReady(this);
		}
	};

	Sound.prototype.handleSoundComplete = function() {
		if (this.remainingLoops !== 0) {
			this.remainingLoops--;
			this.audio.currentTime = 0;
			this.audio.play();
			if (this.onLoop !== null) {
				this.onLoop(this);
			}
			return;
		}
		this.playState = TW.Audio.PLAY_FINISHED;

		if (this.onComplete !== null) {
			this.onComplete(this);
		}
	};

	/**
	 * Start play sound.
	 *
	 * @method play
	 */
	Sound.prototype.play = function() {
		this.audio.play();
		this.playState = TW.Audio.AUDIO_PLAYED;
	};

	/**
	 * Pause sound.
	 *
	 * @method pause
	 */
	Sound.prototype.pause = function() {
		this.paused = true;
		this.audio.pause();
	};

	/**
	 * Resume sound.
	 *
	 * @method resume
	 */
	Sound.prototype.resume = function() {
		this.paused = false;
		this.audio.play();
	};

	/**
	 * Stop sound.
	 *
	 * @method stop
	 */
	Sound.prototype.stop = function() {
		this.pause();
		this.playState = TW.Audio.PLAY_FINISHED;
		this.audio.currentTime = 0;
	};

	/**
	 * Set current sound volume.
	 *
	 * @method mute
	 * @param {Number} value sound volume, between 0.0 and 1.0.
	 */
	Sound.prototype.setVolume = function(value) {
		value = (value > 1.0) ? 1.0 : value;
		value = (value < 0.0) ? 0.0 : value;
		this._volume = value;
		this._updateVolume();
	};

	/**
	 * Applies all volume modifications.
	 *
	 * @method _updateVolume
	 * @private
	 */
	Sound.prototype._updateVolume = function() {
		this.audio.volume = this._muted ? 0 : this._volume;
	};

	/**
	 * Get current sound volume.
	 *
	 * @method getVolume
	 * @return {Number} A current sound volume.
	 */
	Sound.prototype.getVolume = function() {
		return this._volume;
	};

	/**
	 * Mute or Unmute all sound in this channel.
	 *
	 * @method mute
	 * @param {Boolean} isMuted True for mute or false for unmute.
	 */
	Sound.prototype.mute = function(isMuted) {
		this._muted = isMuted;
		this._updateVolume();
	};

	/**
	 * Get current sound offset.
	 *
	 * @method getPosition
	 * @return {Number} A current sound offset.
	 */
	Sound.prototype.getPosition = function() {
		return this.audio.currentTime;
	};

	/**
	 * Set current sound offset.
	 *
	 * @method setPosition
	 * @param {Number} value The value of offset.
	 */
	Sound.prototype.setPosition = function(value) {
		this.audio.currentTime = value;
	};

	/**
	 * Get current sound duration.
	 *
	 * @method getDuration
	 * @return {Number} A current sound duration.
	 */
	Sound.prototype.getDuration = function() {
		return this.audio.duration;
	};

	TW.Audio.Sound = Sound;
	return Sound;
});

/**
 * @module Audio
 * @namespace Audio
 */

var TW = TW || {};
define('Audio/Channel',['./Sound', '../Utils/Polyfills'], function(Sound) {

	TW.Audio = TW.Audio || {};


	/**
	 * Channel class is utility for manage multiple sound with same source.
	 *
	 * @class Channel
	 * @constructor
	 * @param {String|String[]} src The source(s) of channel.
	 *   If many values are passed, the first compatible are used.
	 * @param {Number} max The number of sound allocated in this channel.
	 * @param {Number} id The identifier of the channel.
	 */
	function Channel(src, max, id) {

		/**
		 * Array of Sound.
		 *
		 * @property {Sound[]} _sounds
		 * @default []
		 */
		this._sounds = [];

		/**
		 * Callback function when all sound is ready to play in this channel.
		 *
		 * @property {Function} allSoundsReady
		 * @default null
		 */
		this.allSoundsReady = null;

		/**
		 * Source sound for this channel.
		 * Can contains many values (first compatible are used).
		 *
		 * @property {String|String[]} _src
		 * @private
		 */
		this._src = src;

		/**
		 * Channel id.
		 *
		 * @property {Number} id
		 * @default id
		 * @readonly
		 */
		this.id = id;

		this.add(max);
	}

	/**
	 * Add max sound instance with sources in channel.
	 *
	 * @method add
	 * @param {Number} max The number of sound allocated in this channel.
	 */
	Channel.prototype.add = function(max) {

		while (this._sounds.length < max) {
			this._sounds.push(new Sound(this._src));
		}
	};

	/**
	 * Load all sound.
	 *
	 * @method load
	 */
	Channel.prototype.load = function() {
		var handleAllSoundsReady = function() {
			if (this.allSoundsReady !== null) {
				this.allSoundsReady(this);
			}
		}.bind(this);

		for (var i = 0; i < this._sounds.length; ++i) {
			var sound = this._sounds[i];
			if (i === 0) {
				sound.onReady = handleAllSoundsReady;
			}
			sound.load(0, 0, 1);
		}
	};

	/**
	 * Get a playable sound.
	 *
	 * @method getPlayableSound
	 * @return {Object} A playable sound.
	 */
	Channel.prototype.getPlayableSound = function() {
		for (var i = 0; i < this._sounds.length; ++i) {
			var sound = this._sounds[i];
			if (sound.playState !== TW.Audio.AUDIO_PLAYED) {
				return sound;
			}
		}
		this._sounds[0].stop();
		return this._sounds[0];
	};

	/**
	 * Applies the command to all sounds.
	 *
	 * @method _tellAllSounds
	 * @param {String} command commands availables:
	 *
	 *  - `"pause"`
	 *  - `"resume"`
	 *  - `"setVolume"`
	 *  - `"mute"`
	 *  - `"stop"`
	 *
	 * @param {*} [value] argument
	 * @private
	 */
	Channel.prototype._tellAllSounds = function(command, value) {

		for (var i = this._sounds.length - 1; i >= 0; --i) {
			var sound = this._sounds[i];
			switch (command) {
				case "pause":
					sound.pause();
					break;
				case "resume":
					sound.resume();
					break;
				case "setVolume":
					sound.setVolume(value);
					break;
				case "mute":
					sound.mute(value);
					break;
				case "stop":
					sound.stop();
					break;
				default:
			}
		}
	};

	/**
	 * Mute or Unmute all sound in this channel.
	 *
	 * @method setMute
	 * @param {Boolean} isMuted True for mute or false for unmute.
	 */
	Channel.prototype.setMute = function(isMuted) {
		this._tellAllSounds("mute", isMuted);
	};

	/**
	 * Pause all sound in this channel.
	 *
	 * @method pause
	 */
	Channel.prototype.pause = function() {
		this._tellAllSounds("pause", null);
	};

	/**
	 * Resume all sound in this channel.
	 *
	 * @method resume
	 */
	Channel.prototype.resume = function() {
		this._tellAllSounds("resume", null);
	};

	/**
	 * Stop all sound in this channel.
	 *
	 * @method stop
	 */
	Channel.prototype.stop = function() {
		this._tellAllSounds("stop", null);
	};

	/**
	 * Set a volume for all sound in this channel.
	 *
	 * @method setMasterVolume
	 * @param {Number} value The value of volume needed. min: 0.0 -> max: 1.0
	 */
	Channel.prototype.setMasterVolume = function(value) {
		this._tellAllSounds("setVolume", value);
	};

	TW.Audio.Channel = Channel;
	return Channel;
});

/**
 * @module Audio
 * @namespace Audio
 */

var TW = TW || {};
define('Audio/Manager',['./Channel', '../Utils/Polyfills'], function(Channel) {

	TW.Audio = TW.Audio || {};


	/**
	 * Manager class is utility for manage all sound in channel.
	 *
	 * @class Manager
	 * @constructor
	 */
	function Manager() {

		/**
		 * Array of Channel.
		 *
		 * @property {Array} _instances
		 * @default []
		 * @private
		 */
		this._instances = [];

		/**
		 * Number of Channel.
		 *
		 * @property {Number} length
		 * @default 0
		 * @readonly
		 */
		this.length = 0;

		/**
		 * LastId of Channel.
		 *
		 * @property {Number} _lastId
		 * @default 0
		 * @private
		 */
		this._lastId = 0;

		/**
		 * Number of Channel ready to play.
		 *
		 * @property {Number} _ready
		 * @default 0
		 * @private
		 */
		this._ready = 0;

		/**
		 * Callback function when all channel is ready to play.
		 *
		 * @property {Function} allInstancesReady
		 * @default null
		 */
		this.allInstancesReady = null;

		/**
		 * Callback function when a channel is ready to play.
		 *
		 * @property {Function} instanceReady
		 *  @param {Number} id first callback arg; id of ready instance.
		 * @default null
		 */
		this.instanceReady = null;

		/**
		 * Volume of all sound in all channel, between 0.0 and 1.0.
		 *
		 * @property {Number} _masterVolume
		 * @default 1
		 * @private
		 */
		this._masterVolume = 1;

	}

	/**
	 * Create new channel with src and max sound instance.
	 *
	 * @method add
	 * @param {String|String[]} src The source(s) of channel. If many values are passed, the first compatibel are used.
	 * @param {Number} max The number of sound allocated in this channel.
	 * @return {Number} The id of the channel.
	 */
	Manager.prototype.add = function(src, max) {
		this._lastId++;
		this._instances[this._lastId] = new Channel(src, max, this._lastId);
		this.length++;
		return this._lastId;
	};

	/**
	 * Remove a channel.
	 *
	 * @method remove
	 * @param {Number} uniqueId The id of the channel need remove.
	 * @return {Boolean} True if the channel has been remove or False.
	 */
	Manager.prototype.remove = function(uniqueId) {
		if (this._instances[uniqueId] === null) {
			return false;
		}
		delete this._instances[uniqueId];
		this.length--;
		return true;
	};

	/**
	 * Get a channel.
	 *
	 * @method get
	 * @param {Number} uniqueId The id of the channel need get.
	 * @return {Object} The channel with uniqueId.
	 */
	Manager.prototype.get = function(uniqueId) {
		return this._instances[uniqueId];
	};

	/**
	 * Get a playable sound.
	 *
	 * @method getPlayableSound
	 * @param {Number} uniqueId The id of the channel need get a sound.
	 * @return {Object} A playable sound.
	 */
	Manager.prototype.getPlayableSound = function(uniqueId) {
		return this._instances[uniqueId].getPlayableSound();
	};

	/**
	 * Load all sounds on all channels.
	 *
	 * @method loadAll
	 */
	Manager.prototype.loadAll = function() {
		this._ready = 0;
		for (var key in this._instances) {
			var sounds = this._instances[key];
			sounds.allSoundsReady = this._handleAllInstancesReady.bind(this);
			sounds.load();
		}
	};

	/**
	 * Used has callback for the `allSoundsReady` event.
	 *
	 * @method _handleAllInstancesReady
	 * @param channel
	 * @private
	 */
	Manager.prototype._handleAllInstancesReady = function(channel) {
		this._ready++;

		if (this.instanceReady !== null) {
			this.instanceReady(channel.id);
		}
		if (this.allInstancesReady !== null && this._ready === this.length) {
			this.allInstancesReady();
		}
	};

	/**
	 * Applies the command to all channels.
	 *
	 * @method _tellAllInstances
	 * @param {String} command commands availables:
	 *
	 *  - `"pause"`
	 *  - `"resume"`
	 *  - `"setVolume"`
	 *  - `"mute"`
	 *  - `"stop"`
	 *
	 * @param {*} [value] argument
	 * @private
	 */
	Manager.prototype._tellAllInstances = function(command, value) {
		var key;

		for (key in this._instances) {
			var sounds = this._instances[key];
			switch (command) {
				case "pause":
					sounds.pause();
					break;
				case "resume":
					sounds.resume();
					break;
				case "setVolume":
					sounds.setMasterVolume(value);
					break;
				case "mute":
					sounds.setMute(value);
					break;
				case "stop":
					sounds.stop();
					break;
			}
		}
	};

	/**
	 * Get a current master volume.
	 *
	 * @method getMasterVolume
	 * @return {Number} A current master volume.
	 */
	Manager.prototype.getMasterVolume = function() {
		return this._masterVolume;
	};

	/**
	 * Mute or Unmute all sound in every channel.
	 *
	 * @method setMute
	 * @param {Boolean} isMuted True for mute or false for unmute.
	 */
	Manager.prototype.setMute = function(isMuted) {
		this._tellAllInstances("mute", isMuted);
	};

	/**
	 * Pause all sound in every channel.
	 *
	 * @method pause
	 */
	Manager.prototype.pause = function() {
		this._tellAllInstances("pause", null);
	};

	/**
	 * Resume all sound in every channel.
	 *
	 * @method resume
	 */
	Manager.prototype.resume = function() {
		this._tellAllInstances("resume", null);
	};

	/**
	 * Stop all sound in every channel.
	 *
	 * @method stop
	 */
	Manager.prototype.stop = function() {
		this._tellAllInstances("stop", null);
	};

	/**
	 * Set a volume for all sound in every channel.
	 *
	 * @method setMasterVolume
	 * @param {Number} value The value of volume needed. min: 0.0 -> max: 1.0
	 */
	Manager.prototype.setMasterVolume = function(value) {
		value = (value > 1.0) ? 1.0 : value;
		value = (value < 0.0) ? 0.0 : value;

		this._masterVolume = value;
		this._tellAllInstances("setVolume", value);
	};

	TW.Audio.Manager = Manager;
	return Manager;
});

/**
 * TODO: describe module here.
 *
 * @module Audio
 * @main
 */


var TW = TW || {};

define('Audio',[
	       './Audio/Sound',
	       './Audio/Manager',
	       './Audio/Channel'
       ], function() {
	return TW.Audio;
});


/**
 * This module contain some useful functions and helpers used in the Tumbleweed framework.
 * It include some pollyfills and a way to use inheritance.
 *
 * The {{#crossLink "Utils.inherit"}}inherit(){{/crossLink}} function is a powerfull inheritance method, used by all
 * Tumbleweed classes.
 *
 * {{#crossLink "Utils.clone" }}clone(){{/crossLink}} and {{#crossLink "Utils.copyParam"}}copyParam(){{/crossLink}}
 * are both function manipulating objects to perform common tasks, like copying recursively an object,
 * or copying properties to another object with control and default values.
 *
 * The Polyfills file contains some polyfills for give a more large browser compatibility.
 *
 * @module Utils
 * @main
 */


var TW = TW || {};

define('Utils',[
	       './Utils/inherit',
	       './Utils/clone',
	       './Utils/copyParam'
       ], function() {
	return TW.Utils;
});

var TW = TW || {};

define('TW',[
	       './Collision',
	       './Event',
	       './Gamelogic',
	       './Graphic',
	       './Math',
	       './Preload',
	       './Audio',
	       './Utils'
       ], function() {
	return TW;
});
  return require("TW");
}));
