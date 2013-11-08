/**
 * @module GameState
 */
define(['TW/Utils/inherit', 'TW/GameLogic/GameState', 'MapScreen', 'TW/Event/KeyboardInput', 'TW/Event/InputMapper',
       'TW/Collision/CollisionBox', 'NPC', 'Enemy'],
       function(inherit, GameState, MapScreen, KeyboardInput, InputMapper, CollisionBox, NPC, Enemy) {

	/**
	 * @class MapState
	 * @extends GameState
	 * @constructor
     * @param {Map} map map loaded from a LoadingState.
     * @param {Loader} ressource loader.
	 */
	function MapState(map, loader) {
		GameState.call(this);

		/**
		 * TMX map parsed.
		 * It's the model in the MVC pattern.
		 *
		 * @property {Map} map
		 */
		this.map = map;

		/**
		 * List of all objects which are not purely graphic.
		 *
		 * Each type of objects have it own entry in the attribute.
		 *
		 * @property {Object} _logic_objects
		 */
		this._logic_objects = {};

		/**
		 * Contain reference to all objects with a name.
		 *
		 * They are accessed with the following syntax:
		 * `this._refs.my_object_Name`
		 *
		 * @property {Object} _refs
		 * @private
		 */
		this._refs = {};

		this.mapper = null;

        this._npcs = [];
        this._waypoints = [];

        // Create the new screen and let it create all drawable objects.
        this.screen = new MapScreen(this.map);
        this.addObject(this.screen);


        // process the this.map attribute for create all objects in memory.
        this._initObjects(loader);
    }

	inherit(MapState, GameState);


	/**
	 * Creation of the map, and all its objects.
	 *
	 * `this.map` is already defined and the player can be get from the `Game` class.
	 *
	 * @method init
	 */
	MapState.prototype.init = function() {
        GameState.prototype.init.call(this);

        //set the player
        this.player = this.getStack().player;
        this.player.mapState = this;

        this.screen.addPlayer(this.player);


        // Controle Keyboard
		var keyboard = this.getStack().get('keyboard');

		this.mapper = new InputMapper();
		this.mapper.allowMultiInput = true;
		this.mapper.bindEvent("MOVE_UP", "KEY_W", keyboard)
			.bindEvent("MOVE_UP", "KEY_UP", keyboard)
			.bindEvent("MOVE_DOWN", "KEY_S", keyboard)
			.bindEvent("MOVE_DOWN", "KEY_DOWN", keyboard)
			.bindEvent("MOVE_LEFT", "KEY_A", keyboard)
			.bindEvent("MOVE_LEFT", "KEY_LEFT", keyboard)
			.bindEvent("MOVE_RIGHT", "KEY_D", keyboard)
			.bindEvent("MOVE_RIGHT", "KEY_RIGHT", keyboard)
			.bindEvent("SPRINT", "KEY_SPACE", keyboard)
			.bindEvent("TALK", "KEY_P", keyboard)
			.on("MOVE_UP", this.movePlayerDir.bind(this, "up"), KeyboardInput.isPressed)
			.on("MOVE_DOWN", this.movePlayerDir.bind(this, "down"), KeyboardInput.isPressed)
			.on("MOVE_LEFT", this.movePlayerDir.bind(this, "left"), KeyboardInput.isPressed)
			.on("MOVE_RIGHT", this.movePlayerDir.bind(this, "right"), KeyboardInput.isPressed)
			.on("MOVE_UP", this.stopMovingDir.bind(this), KeyboardInput.isReleased)
			.on("MOVE_DOWN", this.stopMovingDir.bind(this), KeyboardInput.isReleased)
			.on("MOVE_LEFT", this.stopMovingDir.bind(this), KeyboardInput.isReleased)
			.on("MOVE_RIGHT", this.stopMovingDir.bind(this), KeyboardInput.isReleased)
			.on("SPRINT", this.player.startRunning.bind(this.player), KeyboardInput.isPressed)
			.on("SPRINT", this.player.stopRunning.bind(this.player), KeyboardInput.isReleased)
			.on("TALK", this.player.onTalk.bind(this.player), KeyboardInput.isReleased);


		//keyboard.once('KEY_G', function() {
		//	this.getStack().goToMap('map2.tmx', 'spawn-2');
		//}.bind(this));
		//this.keyboard.on("KEY_M", this.muteUnmuteMusic.bind(this), KeyboardInput.isPressed);
		//this.keyboard.on("KEY_P", this.pauseResume.bind(this), KeyboardInput.isPressed);
	};


    /**
     * @method dispose
     */
    MapState.prototype.dispose = function() {
        if (this.mapper !== null) {
            this.mapper.removeAll();
        }
        if (this.screen) {
            this.rmObject(this.screen);
        }
        this._logic_objects = null;
        this._refs = null;
        this._npcs = null;
        this._waypoints = null;
    };


	/**
	 * @method update
	 * @param {Number} delta elapsed time (in miliseconds)
	 */
	MapState.prototype.update = function(delta) {
		GameState.prototype.update.call(this, delta);
		this.player.update(delta);

		if (this.pause === true) {
			return;
		}


		/* player movement */

		var direction = '';
		var undo = '';

		if (this.mapper.get("MOVE_UP")) {
			direction = 'up';
			undo = 'down';
		}
		if (this.mapper.get("MOVE_DOWN")) {
			direction = 'down';
			undo = 'up';
		}
		if (this.mapper.get("MOVE_LEFT")) {
			direction = (direction !== '' ? direction + '-left' : 'left');
			undo = (undo !== '' ? undo + '-right' : 'right');
		}
		if (this.mapper.get("MOVE_RIGHT")) {
			direction = (direction !== '' ? direction + '-right' : 'right');
			undo = (undo !== '' ? undo + '-left' : 'left');
		}

		if (direction !== '') {
			this.player.move(delta, direction);
			if (this.isPlayerCollidingAnObstacle()) {
				this.player.move(delta, undo);
			}

			this._checkTriggerZone();
		}
	};


	/**
	 * Check if the player activate a zone trigger.
	 *
	 * @method _checkTriggerZone
	 * @private
     */
	MapState.prototype._checkTriggerZone = function() {
		var length = this._logic_objects.zone === undefined ? 0 : this._logic_objects.zone.length;
		for (var i = 0; i < length; i++) {
			var zone = this._logic_objects.zone[i];
			if (zone.box.isCollidingBox(this.player.collisionBox) !== zone.isInZone) {
				if (zone.isInZone) {
					if (zone.trigger.onLeave) {
						zone.trigger.onLeave(this, zone.properties);
					}
				} else {
					if (zone.trigger.onEnter) {
						zone.trigger.onEnter(this, zone.properties);
					}
				}
				zone.isInZone = !zone.isInZone;
			}
		}
	};

	/**
	 * get a named object by its name.
	 *
	 * @method getRefs
	 * @param {String} ref name of the object
	 * @return the object itself. null if not exist.
     */
	MapState.prototype.getRefs = function(ref) {
		return this._refs[ref] || null;
	};


	/**
	 * initialize all objects present in layers.
	 *
	 * @method _initObjects
     * @param {Loader} loader
	 * @private
	 */
	MapState.prototype._initObjects = function(loader) {
		for (var i = 0; i < this.map.layers.length; i++) {
			var layer = this.map.layers[i];

			if (layer.objects !== undefined) {
				for (var j = 0; j < layer.objects.length; j++) {
					var info = layer.objects[j];
					var obj = null;

					switch (info.type) {
						case 'spawn':
							obj = {
								type:   'spawn',
								x:          info.x,
								y:          info.y,
								zIndex:     i
							};
							break;
						case 'collision':
							obj = new CollisionBox(info.x, info.y, info.width, info.height);
							break;
						case 'zone':
							var box = new CollisionBox(info.x, info.y, info.width, info.height);
							obj = {
								box:        box,
								trigger:    null,
								isInZone:   false,
								properties: info.properties
							};
							require(['trigger/' + info.properties.source], function(obj) {
								return function(trigger) {
									obj.trigger = trigger;
								}
							}(obj));
							break;
						case 'NPC':
							obj = new NPC({x: info.x, y: info.y, width: info.width, height: info.height}, loader, info.properties.tag, this);
							this._npcs.push({npc:obj, waypoints:[]});
							this.screen.getLayerZIndex(i).addChild(obj);
						break;
						case 'ENEMY':
							obj = new Enemy({x: info.x, y: info.y, width: info.width, height: info.height}, loader, info.properties.tag, this);
							this._npcs.push({npc:obj, waypoints:[]});
							this.screen.getLayerZIndex(i).addChild(obj);
						break;
						case 'WAYPOINT':
							this._waypoints.push({x:info.x + (info.width / 2), y: info.y + (info.height / 2), tag_owner: info.properties.tag_owner, number: parseInt(info.properties.number)});
						break;
						default:
							console.log('MAP: unknow object type: ' + info.type);
					}
					if (obj !== null) {
						if (this._logic_objects[info.type] === undefined) {
							this._logic_objects[info.type] = [];
						}
						this._logic_objects[info.type].push(obj);

						if (info.name !== null) {
							this._refs[info.name] = obj;
						}
					}
				}
			}
		}
		//Tous les objets ont etes creer.
		for (i = 0; i < this._waypoints.length; i++) {
			this.associateWaypointToNPC(this._waypoints[i]);
		}
	};

	/** This method associate a waypoint to its NPC
	*/
	MapState.prototype.associateWaypointToNPC = function(info) {
		for (var i = 0; i < this._npcs.length; i++) {
			if (this._npcs[i].npc.tag === info.tag_owner) {
				this._npcs[i].waypoints.push(info);
				this.orderWaypoints(this._npcs[i]);
				this._npcs[i].npc.waypoints = this._npcs[i].waypoints;
			}
		}
	};

	/** This method order the waypoints within a npc
	*/
	MapState.prototype.orderWaypoints = function(npc) {
		var ordered_waypoints = [];
		var index_little;

		while (npc.waypoints.length > 0) {
			index_little = 0;
			for (var i = 0; i < npc.waypoints.length; i++) {
				if (npc.waypoints[i].number < npc.waypoints[index_little].number) {
					index_little = i;
				}
			ordered_waypoints.push(npc.waypoints[index_little]);
			npc.waypoints.splice(index_little, 1);
			}
		}
		npc.waypoints = ordered_waypoints;
	};

	/* Old code, should be cleaned */

	MapState.prototype.movePlayerDir = function(direction) {
	   if (this.player.state !== "walk" || this.player.direction !== direction) {
	       this.player.playAnimation("walk", direction);
	   }
	};




       MapState.prototype.isPlayerCollidingAnObstacle = function() {
	       var length = this._logic_objects['collision'].length;
	       for (var i = 0; i < length; i++) {
		       if (this._logic_objects['collision'][i].isCollidingBox(this.player.collisionBox)) {
			       return true;
		       }
	       }

	       if (this.player.collisionBox.x + this.player.collisionBox.width > this.map.width) {
		       return true;
	       }
	       if (this.player.collisionBox.x < 0) {
		       return true;
	       }
	       if (this.player.collisionBox.y < 0) {
		       return true;
	       }
	       if (this.player.collisionBox.y + this.player.collisionBox.height > this.map.height) {
		       return true;
	       }
	       return false;
       };


       MapState.prototype.isPlayerMoving = function() {
	       return this.mapper.get("MOVE_UP") ||
	              this.mapper.get("MOVE_DOWN") ||
	              this.mapper.get("MOVE_LEFT") ||
	              this.mapper.get("MOVE_RIGHT");
       };

       MapState.prototype.deduceAnimation = function() {
	       if (this.isPlayerMoving() === false) {
		       this.player.playAnimation("stand");
	       }
	       var state = this.mapper.get("SPRINT") ? "run" : "walk";
	       if (this.mapper.get("MOVE_UP")) {
		       this.player.playAnimation(state, "up");
	       }
	       if (this.mapper.get("MOVE_LEFT")) {
		       this.player.playAnimation(state, "left");
	       }
	       if (this.mapper.get("MOVE_DOWN")) {
		       this.player.playAnimation(state, "down");
	       }
	       if (this.mapper.get("MOVE_RIGHT")) {
		       this.player.playAnimation(state, "right");
	       }
       };

       MapState.prototype.stopMovingDir = function() {
	       this.deduceAnimation();
       };


	       return MapState;
});
