/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState'], function(inherit, GameState) {

	/**
	 * @class MapScreen
	 * @extends GameState
	 * @constructor
	 * @param {KeyBoardInput} kb_input
	 */
	function MapScreen(kb_input) {
		GameState.call(this, {
			name:   "map"
		});
	}

	inherit(MapScreen, GameState);

	/**
	 * Draw the start screen.
	 *
	 * @method draw
	 * @param context
	 */
	MapScreen.prototype.draw = function(context) {
		context.fillStyle = '#FF33FF';
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
	};

	return MapScreen;
});
