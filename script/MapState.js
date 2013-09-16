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
		this.startToDraw = false;
		this.opacity = 0.0;
		this.status = "fadeIN";
		/**mainCanvas
		 * @property {Map} map
		 */
		this.map = null;

		//hack for enable XXState.prototype.onXXX()
		delete this.onCreation;
		//delete this.onDelete;
	}

	inherit(MapState, GameState);

	MapState.prototype.onCreation = function() {
		if (!this.fadeInID) {
		var context = document.getElementById("mainCanvas").getContext("2d");
		}
	};

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

		context.save();
		context.fillStyle = '#FF33FF';
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);



		context.restore();

	};

	return MapState;
});
