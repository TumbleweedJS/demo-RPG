
define(['TW/Utils/inherit', 'TW/GameLogic/GameState'], function(inherit, GameState) {

	/**
	 * First screen wich appears after the main loading.
	 *
	 * It display some graphic stuff and wait the user to press start.
	 *
	 * TODO: adding Touch event support
	 *
	 * @class StartScreen
	 * @extends GameState
	 * @constructor
	 * @param {KeyBoardInput} kb_input
	 */
	function StartScreen(kb_input) {
		GameState.call(this, {
			name:   "start"
		});

		//TODO: this code should be put out of this class.
		kb_input.once('KEY_SPACE', function() {
			this.getGameStateStack().pop();
		}.bind(this));
	}

	inherit(StartScreen, GameState);

	/**
	 * Draw the start screen.
	 *
	 * @method draw
	 * @param context
	 */
	StartScreen.prototype.draw = function(context) {
		context.fillStyle = '#33FF33';
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
	};

	return StartScreen;
});
