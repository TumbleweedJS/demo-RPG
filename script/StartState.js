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

		//hack for enable XXState.prototype.onXXX()
		delete this.onCreation;
		delete this.onDelete;
	}

	inherit(StartState, GameState);


	StartState.prototype.onCreation = function() {
		var gss = this.getGameStateStack();
		gss.shared.keyboard.once('KEY_SPACE', function() {
			gss.pop();
		}, function(_, is_pressed) { return !is_pressed; });
	};

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
