/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState', 'MapScreen'], function(inherit, GameState, MapScreen) {

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
		if (this.screen) {
			this.removeLayer(this.screen);
		}
		this.screen = new MapScreen(this.map, this.getGameStateStack().player);
		this.addLayer(this.screen);
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

	return MapState;
});
