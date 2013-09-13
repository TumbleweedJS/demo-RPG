/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState'], function(inherit, GameState) {

	/**
	 * First screen wich appears after the main loading.
	 *
	 * It display some graphic stuff and wait the user to press start.
	 *
	 * TODO: adding Touch event support
	 *
	 * @class StartState
	 * @extends GameState
	 * @constructor
	 * @param {KeyBoardInput} kb_input
	 */
	function StartState(kb_input) {
		GameState.call(this, {
			name:   "start"
		});

		//TODO: this code should be put out of this class.
		kb_input.once('KEY_SPACE', function() {
			this.getGameStateStack().pop();
		}.bind(this));
	}

	inherit(StartState, GameState);

	/**
	 * Draw the start screen.
	 *
	 * @method draw
	 * @param context
	 */
	StartState.prototype.draw = function(context) {
		context.fillStyle = '#33FF33';
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
	};

	return StartState;
});
