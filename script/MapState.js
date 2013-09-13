/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState'], function(inherit, GameState) {

	/**
	 * @class MapState
	 * @extends GameState
	 * @constructor
	 */
	function MapState() {
		GameState.call(this, {
			name:   "map"
		});

		/**
		 * @property {Map} map
		 */
		this.map = null;

		//hack for enable XXState.prototype.onXXX()
		//delete this.onCreation;
		//delete this.onDelete;
	}

	inherit(MapState, GameState);

	/**
	 * set and initialize a new map.
	 *
	 * @method setMap
	 * @param {Map} map
	 */
	MapState.prototype.setMap = function(map) {
		this.map = map;
	};

	/**
	 * Draw the start screen.
	 *
	 * @method draw
	 * @param context
	 */
	MapState.prototype.draw = function(context) {
		context.fillStyle = '#FF33FF';
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
	};

	return MapState;
});
