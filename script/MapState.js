/**
 * @module GameState
 */
define(['TW/Utils/inherit', 'TW/GameLogic/GameState', 'MapScreen', 'TW/Event/KeyboardInput', 'TW/Event/InputMapper',
       'TW/Graphic/TrackingCamera', 'TW/Collision/CollisionBox', 'NPC'],
       function(inherit, GameState, MapScreen, KeyboardInput, InputMapper, TrackingCamera, CollisionBox, NPC) {

	/**
	 * @class MapState
	 * @extends GameState
	 * @constructor
	 */
	function MapState() {
		GameState.call(this, {
			name:   "map"
		});

		/**
		 * TMX map parsed.
		 * It's the model in the MVC pattern.
		 *
		 * @property {Map} map
		 */
		this.map = null;

		/**
		 * List of all objects which are not purely graphic.
		 *
		 * Each type of objects have it own entry in the attribute.
		 *
		 * @property {Object} _objects
		 */
		this._objects = {};

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

		//hack for enable XXState.prototype.onXXX()
		delete this.onCreation;
		delete this.onDelete;

	}

	inherit(MapState, GameState);


	/**
	 * Creation of the map, and all its objects.
	 *
	 * `this.map` is already defined and the player can be get from the `Game` class.
	 *
	 * @method onCreation
	 */
	MapState.prototype.onCreation = function() {
		var player = this.getGameStateStack().player;
		this.player = player;

		this._objects = {};
		this._refs = {};

		// Create the new screen and let it ccreate all drawable objects.
		if (this.screen) {
			this.removeLayer(this.screen);
		}
		this.screen = new MapScreen(this.map, player);
		this.addLayer(this.screen);


		// process the this.map attribute for create all objects in memory.
		this._initObjects();


		// Controle Keyboard
		var keyboard = this.getGameStateStack().keyboard;

		if (this.mapper !== null) {
			this.mapper.removeAll();
		}
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
			.on("MOVE_UP", this.movePlayerDir.bind(this, "up"), KeyboardInput.isPressed)
			.on("MOVE_DOWN", this.movePlayerDir.bind(this, "down"), KeyboardInput.isPressed)
			.on("MOVE_LEFT", this.movePlayerDir.bind(this, "left"), KeyboardInput.isPressed)
			.on("MOVE_RIGHT", this.movePlayerDir.bind(this, "right"), KeyboardInput.isPressed)
			.on("MOVE_UP", this.stopMovingDir.bind(this), KeyboardInput.isReleased)
			.on("MOVE_DOWN", this.stopMovingDir.bind(this), KeyboardInput.isReleased)
			.on("MOVE_LEFT", this.stopMovingDir.bind(this), KeyboardInput.isReleased)
			.on("MOVE_RIGHT", this.stopMovingDir.bind(this), KeyboardInput.isReleased)
			.on("SPRINT", this.player.startRunning.bind(this.player), KeyboardInput.isPressed)
			.on("SPRINT", this.player.stopRunning.bind(this.player), KeyboardInput.isReleased);


		//keyboard.once('KEY_G', function() {
		//	this.getGameStateStack().goToMap('map2.tmx', 'spawn-2');
		//}.bind(this));
		//this.keyboard.on("KEY_M", this.muteUnmuteMusic.bind(this), KeyboardInput.isPressed);
		//this.keyboard.on("KEY_P", this.pauseResume.bind(this), KeyboardInput.isPressed);



		// Tracking Camera: make the camera follow the player.
		// TODO: this should be done in the view (MapScreen)
		this.screen.camera = new TrackingCamera(player);
		this.screen.camera.margin = {
			x:  100,
			y: 100
		};
	};

	MapState.prototype.onDelete = function() {
/*		console.log("map delete");
		this._objects = {};
		this._refs = {};
		this.mapper.removeAll();
		*/
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
		var length = this._objects.zone === undefined ? 0 : this._objects.zone.length;
		for (var i = 0; i < length; i++) {
			var zone = this._objects.zone[i];
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
	 * set and initialize a new map.
	 *
	 * @method setMap
	 * @param {Map} map
	*/
	MapState.prototype.setMap = function(map) {
		this.map = map;
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
	 * @private
	 */
	MapState.prototype._initObjects = function() {
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
							obj = new NPC({x: info.x, y: info.y, width: info.width, height: info.height, mode: "FILLED"});
							this.screen.getLayerZIndex(i).addChild(obj);
						break;
						default:
							console.log('MAP: unknow object type: ' + info.type);
					}
					if (obj !== null) {
						if (this._objects[info.type] === undefined) {
							this._objects[info.type] = [];
						}
						this._objects[info.type].push(obj);

						if (info.name !== null) {
							this._refs[info.name] = obj;
						}
					}
				}
			}
		}
	};



	/* Old code, should be cleaned */

	MapState.prototype.movePlayerDir = function(direction) {
	   if (this.player.state !== "walk" || this.player.direction !== direction) {
	       this.player.playAnimation("walk", direction);
	   }
	};




       MapState.prototype.isPlayerCollidingAnObstacle = function() {
	       var length = this._objects['collision'].length;
	       for (var i = 0; i < length; i++) {
		       if (this._objects['collision'][i].isCollidingBox(this.player.collisionBox)) {
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
