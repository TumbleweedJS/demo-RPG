
define(['TW/Utils/inherit', 'TW/Graphic/AnimatedSprite', 'TW/Graphic/SpriteSheet', 'TW/Collision/CollisionBox'],
       function(inherit, AnimatedSprite, SpriteSheet, CollisionBox) {

	function Player(loader) {
		AnimatedSprite.call(this, {
			width:          32,
			height:         32,
			spriteSheet:    new SpriteSheet(loader.get('image-player'), loader.get('spritesheet-player'))
		});


		// Default animation
		this.play('stand_left', true, null);
		this.currentAnimation = 'stand_down';

		/**
		 * Map coordinates (in tile)
		 *
		 * @property {Object} coord_map
		 *  @property {Number} coord_map.x
		 *  @property {Number} coord_map.y
		 *  @property {String} coord_map.map
		 */
		this.coord_map = {
			x:      0,
			y:      0,
			map:    null
		};


		/**
		 * Is the player running ?
		 * @property {Boolean} sprint
		 */
		this.sprint = false;

		/**
		 * Collision associated to the player
		 * @type {CollisionBox}
		 */
		this.collisionBox = new CollisionBox(10, 16, 12, 16);
		this.setCoord(5,5);
		/**
		 * Orientation of the player.
		 *
		 * Can be one of these following values:
		 *
		 * - `"up"`
		 * - `"down"`
		 * - `"left"`
		 * - `"right"`
		 *
		 * @property {String} direction
		 *
		 */
		this.direction = "down";

		/**
		 * current Player state.
		 *
		 * Each state correspond to an animation.
		 * These animations are availables:
		 *
		 * - `"stand"`
		 * - `"walk"`
		 * - `"run"`
		 *
		 * @property {String} state
		 */
		this.state = "stand";
	}

	inherit(Player, AnimatedSprite);


	Player.prototype.startRunning = function() {
	   if (this.state === "walk") {
	       this.playAnimation("run");
	   }
	};

	Player.prototype.stopRunning = function() {
	   if (this.state === "run") {
	       this.playAnimation("walk");
	   }
	};



	Player.prototype.playAnimation = function(name, direction) {
	   this.state = (name === undefined) ? this.state : name;
	   this.direction = (direction === undefined) ? this.direction : direction;

	   if (this.sprint === true && this.state === "walk") {
	       this.state = "run";
	   }

		this.play(this.state + "_" + this.direction, true, null);
		this.currentAnimation = this.state + "_" + this.direction;
	};



	Player.prototype.moveUp = function(speed) {
		this.moveCoord(0, -speed / 32);
	};

	Player.prototype.moveLeft = function(speed) {
		this.moveCoord(- speed / 32, 0);
	};

	Player.prototype.moveDown = function(speed) {
		this.moveCoord(0, speed / 32);
	};

	Player.prototype.moveRight = function(speed) {
		this.moveCoord(speed / 32, 0);
	};

	/**
	 * Move the player.
	 * Values are exprimed in tile.
	 *
	 * Note that do not animate the player.
	 *
	 * @method moveCoord
	 * @param {Number} x x coordinate (in tile)
	 * @param {Number} y y coordinate (in tile)
	 */
	Player.prototype.moveCoord = function(x, y) {
		this.setCoord(this.coord_map.x + x, this.coord_map.y + y);	};

	/**
	 * set the coord in the map referenciel
	 *
	 * @method setCoord
	 * @param {Number} x x coordinate (in tile)
	 * @param {Number} y y coordinate (in tile)
	 */
	Player.prototype.setCoord = function(x, y) {
		this.coord_map.x = x;
		this.coord_map.y = y;
		this.collisionBox.x = 10 + x * this.width;
		this.collisionBox.y = 16 + y * this.height;
		this.setAttr({
			x:  x * this.width,
			y:  y * this.height
        });
	};

	return Player;
});
