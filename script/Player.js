
define(['TW/Utils/inherit', 'TW/Graphic/AnimatedSprite', 'TW/Graphic/SpriteSheet', 'TW/Collision/CollisionBox'],
       function(inherit, AnimatedSprite, SpriteSheet, CollisionBox) {

	function Player(loader) {
		AnimatedSprite.call(this, {
			width:          32,
			height:         32,
			spriteSheet:    new SpriteSheet(loader.get('image-player'), loader.get('spritesheet-player'))
		});

		this.mapState = null;
		this.npcTalking = null;
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
		 * Speed of the player (in case per second)
		 * @property {{walk: number, run: number}} speed
		 */
		this.speed = {
			walk:   2,
			run:   4
		};

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
		this.sprint = true;
	   if (this.state === "walk") {
	       this.playAnimation("run");
	   }
	};

	Player.prototype.stopRunning = function() {
		this.sprint = false;
	   if (this.state === "run") {
	       this.playAnimation("walk");
	   }
	};

	Player.prototype.onTalk = function() {
		if (this.npcTalking === null) {
			for (var i = 0; i < this.mapState._npcs.length; i++) {
				if (this.getDistanceToNPC(this.mapState._npcs[i].npc) < 50) {
					this.npcTalking = this.mapState._npcs[i].npc;
					this.mapState._npcs[i].npc.onStartConversation(this);
					return;
				}
			}
		} else {
			this.npcTalking.onEndConversation(this);
			this.npcTalking = null;
		}
	};

	Player.prototype.getDistanceToNPC = function(npc) {
		var vector = {x: npc.position.x - this.x, y: npc.position.y - this.y};
		var distance = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
		return distance;
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



	//TODO: method exists for compatibility with old code. should be deleted.
	Player.prototype.moveUp = function(speed) {
		this.moveCoord(0, -speed / 32);
	};

	Player.prototype.moveLeft = function(speed) {
		this.moveCoord(- speed / 32, 0);
	};

	Player.prototype.moveDown = function(speed) {
		this.move(speed, 'down');
		this.moveCoord(0, speed / 32);
	};

	Player.prototype.moveRight = function(speed) {
		this.moveCoord(speed / 32, 0);
	};


	/**
	 * Tell to the player to move during `delta` miliseconds,
	 * in the direction `direction`.
	 *
	 * His walk and run speed are used for the distance.
	 *
     * @method move
	 * @param {Number} delta elapsed time, in milisecond
	 * @param {String} direction should be one of the four direction: "up", "down", "left" and "right".
	 *  It's also possible to set a diagonal direction, separated by a hyphen ( "up-left" )
     */
	Player.prototype.move = function(delta, direction) {
		//speed, in case per second
		var speed = this.sprint ? this.speed.run : this.speed.walk;

		var multi_dir = direction.split('-');
		if (multi_dir.length === 2) {
			//delta /= Math.sqrt(2)
			delta /= 1.4142;
			this.move(delta, multi_dir[0]);
			direction = multi_dir[1];
		}

		var dist = (delta / 1000) * speed;


		switch(direction) {
			case 'up':
				this.moveCoord(0, - dist);
				break;
			case 'left':
				this.moveCoord(- dist, 0);
				break;
			case 'down':
				this.moveCoord(0, dist);
				break;
			case 'right':
				this.moveCoord(dist, 0);
				break;
			default:
				throw new Error('[Player]: invalid direction');
		}


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
		this.setCoord(this.coord_map.x + x, this.coord_map.y + y);
	};

	/**
	 * set the coord in the map referenciel
	 *
	 * @method setCoord
	 * @param {Number} x x coordinate (in tile)
	 * @param {Number} y y coordinate (in tile)
	 * @param {Number} [zIndex] change the zIndex
	 */
	Player.prototype.setCoord = function(x, y, zIndex) {
		this.coord_map.x = x;
		this.coord_map.y = y;
		this.collisionBox.x = 10 + x * this.width;
		this.collisionBox.y = 16 + y * this.height;
		this.setAttr({
			x:          x * this.width,
			y:          y * this.height,
			zIndex:     zIndex === undefined ? this.zIndex : zIndex
        });

       	//this.setAttr({ zIndex: this.y });
		if (this.parent !== null) {
			this.parent.rmChild(this);
			this.parent.addChild(this);
		}


		//dirty hack,
		//because the zIndex is not dynamic. (yes, it's a bug)
		//if (zIndex !== undefined && this.parent !== null) {
		//	this.parent.rmChild(this);
		//	this.parent.addChild(this);
		//}
	};

	return Player;
});
