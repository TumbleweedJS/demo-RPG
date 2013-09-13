/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState'], function(inherit, GameState) {

	/**
	 * @class MapState
	 * @extends GameState
	 * @constructor
	 * @param {KeyBoardInput} kb_input
	 */
	function MapState(kb_input) {
		GameState.call(this, {
			name:   "map"
		});
	}

	inherit(MapState, GameState);

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
