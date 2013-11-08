
define(['TW/Utils/inherit', 'TW/GameLogic/GameStack', 'TW/GameLogic/Gameloop',
		'TW/Event/KeyboardInput', 'Player', 'Enemy', 'TW/Audio/AudioInstance',
'StartState', 'MapLoadingState', 'MapState'], function(inherit, GameStack, Gameloop, KeyboardInput, Player, Enemy,  AudioInstance, StartState, MapLoadingState, MapState    ) {

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
	 * @extend GameStack
	 * @constructor
	 */
	function Game(canvas) {
        GameStack.call(this);

        this.draw_context = canvas.getContext('2d');

		/**
		 * Used for transition between states.
		 *
		 * @property {Object} transition
		 */
		this.transition = null;

		/**
		 *
		 * @property {KeyboardInput} keyboard
		 */
		this.keyboard = null;


		this.map_load = null;
		this.map_state = null;
		this.start_state = null;
	}

	inherit(Game, GameStack);

	Game.prototype.start = function() {



		this.gl = new Gameloop();
		this.gl.addObject(this);

		var sound = new AudioInstance(this.get('loader').get('main-music'));
		sound.play();
		this.get('keyboard').on('KEY_M', function(_, isPressed) {
			if (isPressed) {
				sound.mute(!sound.isMuted());
			}
		});


        var that = this;
        this.link(StartState, function() {
            that.createPlayer();

            that.set('target', "start-spawn");

            var map_load = new MapLoadingState("default.tmx");
            return map_load;
        });

        this.link(MapLoadingState, function(map) {
            var target = that.get('target');
            that.set('target', null);
            var map_state = new MapState(map, that.get('loader'));
            if (target instanceof Object) {
                that.player.setCoord(target.x, target.y, target.zIndex);
            } else {
                var spawn = map_state.getRefs(target);
                if (spawn === null || spawn.type !== 'spawn') {
                    throw new Error('[Game] Bad spawn point on map ' + this.path);
                }
                that.player.setCoord(spawn.x / 32, spawn.y / 32, spawn.zIndex);
            }
            return map_state;
        });

        this.link(MapState, MapLoadingState);

        this.push(new StartState(), 300);

		this.gl.start();
	};


	Game.prototype.createPlayer = function() {
		this.player = new Player(this.get('loader'));
	};

	/**
	 * move to another map.
	 *
	 * @method goToMap
	 * @param {String} map TMX map file.
	 * @param {Object|String} target spawn point of the player.
	 *  If it's a String, this should be the name of a `spown` object on the map.
	 *  As an object, it must contain `x`, `y` and `zIndex` element.
	 *  @param {Number} target.x x coordinate (in tile)
	 *  @param {Number} target.y y coordinate (in tile)
	 *  @param {Number} target.zIndex
	 */
	Game.prototype.goToMap = function(map, target) {

        this.set('target', target);
        this.pop(map, 400);
        return;



		this.map_load.path = map;

		var that = this;
        this.map_load.once('dispose', function() {
			that.map_state.setMap(that.map_load.getMap());
			that.push(that.map_state, 400);

			if (target instanceof Object) {
				that.player.setCoord(target.x, target.y, target.zIndex);
			} else {
				var spawn = that.map_state.getRefs(target);
				if (spawn === null || spawn.type !== 'spawn') {
					throw new Error('[Game] Bad spawn point on map ' + this.path);
				}
				that.player.setCoord(spawn.x / 32, spawn.y / 32, spawn.zIndex);
			}
		});

		//TODO: remove the old map_state if any.

//		this.pop(400);
        return this.map_load;
		this.push(this.map_load, 400);
	};



	/**
	 * Override of `pop` method, adding possibility to use graphic transitions.
	 *
	 * @method pop
     * @param {*} arg
	 * @param {Number} [delay] fade out delay (in milliseconds)
	 */
	Game.prototype.pop = function(arg, delay) {

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
				GameStack.prototype.pop.call(that, arg);
			}, delay);
		} else {
			GameStack.prototype.pop.call(this, arg);
		}
	};

	/**
	 * Override of `push` method, adding possibility to use graphic transitions.
	 *
	 * @method push
	 * @param {GameState} [state] state to set active.
	 * @param {Number} [delay] fade out delay (in milliseconds)
	 */
	Game.prototype.push = function(state, delay) {
        GameStack.prototype.push.call(this, state);

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

        GameStack.prototype.draw.call(this);

		if (this.transition !== null) {
			var context = this.draw_context;
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
