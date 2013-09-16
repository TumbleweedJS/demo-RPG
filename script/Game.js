
define(['TW/Utils/inherit', 'TW/GameLogic/GameStateStack', 'TW/GameLogic/Gameloop',
       'TW/Event/KeyboardInput', 'Player'], function(inherit, GSS, Gameloop, KeyboardInput, Player) {

	/**
	 * Main controller, this class is the global GameStateStack.
	 *
	 * Its roles are:
	 *
	 * - to make the transitions between each GameState
	 * - to help communication between theses states. (by passing attributes and calling getter/setter)
	 * - to contain and to provide global ressources (like loaded ressource, keyboard device access, and so on)
	 *
	 * @class Game
	 * @extend GameStateStack
	 * @constructor
	 */
	function Game(canvas) {
		GSS.call(this, canvas);

		/**
		 * Used for transition between states.
		 *
		 * @property {Object} transition
		 */
		this.transition = null;
	}

	inherit(Game, GSS);

	Game.prototype.start = function() {
		this.gl = new Gameloop();
		this.gl.addObject(this);

		/* access devices */
		this.keyboard = new KeyboardInput();


		this.gl.start();
	};


	Game.prototype.createPlayer = function() {
		this.player = new Player(this.shared.loader);
	};





	/**
	 * @method pop
	 * @param {Number} [delay] fade out delay (in milliseconds)
	 */
	Game.prototype.pop = function(delay) {

		//Fade out
		if (delay !== undefined) {

			this.transition = {
				type:   'fade-out',
				delay:  delay,
				start:  Date.now()
			};

			var that = this;
			setTimeout(function() {
				that.transition = null;
				GSS.prototype.pop.call(that);
			}, delay);
		} else {
			GSS.prototype.pop.call(this);
		}
	};

	Game.prototype.push = function(state, delay) {
		GSS.prototype.push.call(this, state);

		//Fade out
		if (delay !== undefined) {

			this.transition = {
				type:   'fade-in',
				//type:   'open-circle',
				delay:  delay,
				//delay:  10000,
				start:  Date.now()
			};

			var that = this;
			setTimeout(function() {
				that.transition = null;
			}, delay);
		}

	};

	Game.prototype.draw = function() {

		GSS.prototype.draw.call(this);

		if (this.transition !== null) {
			var context = this.localContext;
			var transition = this.transition;
			var time_elapsed = Date.now() - this.transition.start;
			var opacity = 1;

			context.save();
			switch(transition.type) {
				case 'fade-out':
					context.fillStyle = "#000000";
					opacity = time_elapsed / this.transition.delay;
					context.globalAlpha = opacity > 1 ? 1 : opacity;
					context.fillRect(0, 0, context.canvas.width, context.canvas.height);
					break;
				case 'fade-in':
					context.fillStyle = "#000000";
					opacity = 1 - (time_elapsed / this.transition.delay);
					context.globalAlpha = opacity < 0 ? 0 : opacity;
					context.fillRect(0, 0, context.canvas.width, context.canvas.height);
					break;
/*				case 'open-circle':
//					context.fillStyle = "#000000";
					context.globalCompositeOperation = 'destination-in';
//					opacity = 1 - (time_elapsed / this.transition.delay);
//					context.globalAlpha = 1;//opacity < 0 ? 0 : opacity;

					context.beginPath();
					context.arc(0, 0, 1, 0, Math.PI);
					//context.fillRect(0, 0, context.canvas.width, context.canvas.height);
					break;
					*/
			}
			context.restore();
		}
	};

	return Game;
});
