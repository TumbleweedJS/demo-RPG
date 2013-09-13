/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState'], function(inherit, GameState) {

	/**
	 * @class MapLoadingScreen
	 * @extends GameState
	 * @constructor
	 * @param {KeyBoardInput} kb_input
	 */
	function MapLoadingScreen(kb_input) {
		GameState.call(this, {
			name:   "map-loading"
		});
	}

	inherit(MapLoadingScreen, GameState);

	/**
	 * Draw the start screen.
	 *
	 * @method draw
	 * @param context
	 */
	MapLoadingScreen.prototype.draw = function(context) {
		context.fillStyle = '#FFFF33';
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
	};

	return MapLoadingScreen;
});
