/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState'], function(inherit, GameState) {

	/**
	 * @class MapLoadingState
	 * @extends GameState
	 * @constructor
	 * @param {KeyBoardInput} kb_input
	 */
	function MapLoadingState(kb_input) {
		GameState.call(this, {
			name:   "map-loading"
		});
	}

	inherit(MapLoadingState, GameState);

	/**
	 * Draw the start screen.
	 *
	 * @method draw
	 * @param context
	 */
	MapLoadingState.prototype.draw = function(context) {
		context.fillStyle = '#FFFF33';
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
	};

	return MapLoadingState;
});
