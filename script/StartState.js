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
	 */
	function StartState() {
		GameState.call(this, {
			name:   "start"
		});

        var state = this;
        this.on('creation', function() { return init(state); });
	}

	inherit(StartState, GameState);

    /**
     * Initialize the screen.
     *
     * Listen the SPACE event on keyboard. Called during the `creation` event.
     * @method init
     * @param {StartState} state state to initialize. (equivalent of `this`)
     * @private
     */
    function init(state) {
        var gss = state.getGameStateStack();
        gss.shared.keyboard.once('KEY_SPACE', function() {
            gss.pop(400);
        }, function(_, is_pressed) { return !is_pressed; });
    }


	/**
	 * Draw the start screen.
	 *
	 * @method draw
	 * @param context
	 */
	StartState.prototype.draw = function(context) {
			//Drawing campaign background
			var loader = this.getGameStateStack().shared.loader;
			var logo_tumbleweed = loader.get("logo");
			var background = loader.get("campagne");
			context.shadowOffsetX = 4;
			context.shadowOffsetY = 4;
			context.shadowBlur = 5;
			context.shadowColor = "black";
			context.drawImage(background, 0, 0, background.width, background.height, 0, 0, context.canvas.width, context.canvas.height);
			//Drawing the gray gradient square.
			var gradient = context.createLinearGradient(0,0,0, context.canvas.height);
			context.globalAlpha = 0.8;
			gradient.addColorStop(0, "rgb(255,255,255)");
			gradient.addColorStop(1, "rgb(128,128,128)");
			context.fillStyle = gradient;
			context.fillRect(context.canvas.width / 7, context.canvas.height / 7, context.canvas.width - 2*(context.canvas.width / 7), context.canvas.height - 2*(context.canvas.height / 7));
			//Drawing tumbleweed logo
			context.globalAlpha = 1.0;
			context.drawImage(logo_tumbleweed, 0, 0, logo_tumbleweed.width, logo_tumbleweed.height, (context.canvas.width) / 2 - (logo_tumbleweed.width/4), context.canvas.height / 6, logo_tumbleweed.width/2, logo_tumbleweed.height/2);
			//Drawing text "RPG Demo" and "Press Space".
			context.font = "Bold 40px Calibri, Geneva, Arial";
			context.fillStyle = "rgb(60,144,193)";
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.fillText("RPG Demo", context.canvas.width / 2, 3.5 * context.canvas.height / 7);
			context.fillText("Press Space", context.canvas.width / 2, 4.5 * context.canvas.height / 7);
	};

	return StartState;
});
