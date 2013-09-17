/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState', 'MapScreen', 'TW/Event/KeyboardInput', 'TW/Event/InputMapper',
       'TW/Graphic/TrackingCamera'],
       function(inherit, GameState, MapScreen, KeyboardInput, InputMapper, TrackingCamera) {

	/**
	 * @class MapState
	 * @extends GameState
	 * @constructor
	 */
	function MapState() {
		GameState.call(this, {
			name:   "map"
		});
		this.startToDraw = false;
		this.opacity = 0.0;
		this.status = "fadeIN";
		/**mainCanvas
		 * @property {Map} map
		 */
		this.map = null;

		//hack for enable XXState.prototype.onXXX()
		delete this.onCreation;
		//delete this.onDelete;



		this.totalElapsedTime = 0;
	}

	inherit(MapState, GameState);

	MapState.prototype.onCreation = function() {
		var player = this.getGameStateStack().player;
		this.player = player;

		if (this.screen) {
			this.removeLayer(this.screen);
		}
		this.screen = new MapScreen(this.map, player);
		this.addLayer(this.screen);

		var keyboard = this.getGameStateStack().keyboard;

		this.listCollisionBox = [];


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
			.on("SPRINT", this.startPlayerSprint.bind(this), KeyboardInput.isPressed)
			.on("SPRINT", this.stopPlayerSprint.bind(this), KeyboardInput.isReleased);

		//this.keyboard.on("KEY_M", this.muteUnmuteMusic.bind(this), KeyboardInput.isPressed);
		//this.keyboard.on("KEY_P", this.pauseResume.bind(this), KeyboardInput.isPressed);




		this.screen.camera = new TrackingCamera(player);
		this.screen.camera.margin = {
			x:  100,
			y: 100
		};


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



       MapState.prototype.movePlayerDir = function(direction) {
	       if (this.player.state !== "walk" || this.player.direction !== direction) {
		       this.player.playAnimation("walk", direction);
	       }
       };


       MapState.prototype.getSpeed = function() {
	       if (this.player.sprint === true) {
		       return 4;
	       } else {
		       return 2;
	       }
       };

       MapState.prototype.update = function(delta) {
	       this.player.update(delta);

	       if (this.pause === true) {
		       return;
	       }

	       if ((this.totalElapsedTime + delta) > (1000 / 50)) {
		       if (this.mapper.get("MOVE_UP")) {
			       this.player.moveUp(this.getSpeed());
			       if (this.isPlayerCollidingAnObstacle()) {
				       this.player.moveDown(this.getSpeed());
			       }
		       }
		       if (this.mapper.get("MOVE_LEFT")) {
			       this.player.moveLeft(this.getSpeed());
			       if (this.isPlayerCollidingAnObstacle()) {
				       this.player.moveRight(this.getSpeed());
			       }
		       }
		       if (this.mapper.get("MOVE_DOWN")) {
			       this.player.moveDown(this.getSpeed());
			       if (this.isPlayerCollidingAnObstacle()) {
				       this.player.moveUp(this.getSpeed());
			       }
		       }
		       if (this.mapper.get("MOVE_RIGHT")) {
			       this.player.moveRight(this.getSpeed());
			       if (this.isPlayerCollidingAnObstacle()) {
				       this.player.moveLeft(this.getSpeed());
			       }
		       }

//		       this.checkTriggerZone();

		       this.totalElapsedTime = 0;
	       } else {
		       this.totalElapsedTime += delta;
	       }
       };

       MapState.prototype.isPlayerCollidingAnObstacle = function() {
	       var length = this.listCollisionBox.length;
	       for (i = 0; i < length; i++) {
		       if (this.listCollisionBox[i].isCollidingBox(this.player.collisionBox)) {
			       return true;
		       }
	       }

	       if (this.player.collisionBox.x + this.player.collisionBox.width > this.screen.width) {
		       return true;
	       }
	       if (this.player.collisionBox.x < 0) {
		       return true;
	       }
	       if (this.player.collisionBox.y < 0) {
		       return true;
	       }
	       if (this.player.collisionBox.y + this.player.collisionBox.height > this.screen.height) {
		       return true;
	       }
	       return false;
       };


       MapState.prototype.startPlayerSprint = function() {
	       this.player.sprint = true;
	       this.player.startRunning();
       };

       MapState.prototype.stopPlayerSprint = function() {
	       this.player.sprint = false;
	       this.player.stopRunning();
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

       MapState.prototype.stopMovingDir = function(event) {
	       this.deduceAnimation();
       };


	       return MapState;
});
