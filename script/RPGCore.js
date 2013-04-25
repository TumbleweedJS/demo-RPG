
define(['./TW/Audio/Manager', 'TW/Graphic/Window', 'TW/Graphic/TrackingCamera',
		'TW/Event/KeyboardInput', './Player', './TMXParser', 'TW/Event/InputMapper',
	   'TW/Preload/XHRLoader'],
	   function(Manager, Window, TrackingCamera, KeyboardInput, Player, TMXParser, InputMapper, XHRLoader) {

		   function RPGCore() {
			   this.totalElapsedTime = 0;
			   this.debug = false;
			   this.pause = false;

			   this.audioManager = new Manager;
			   this.idSound1 = this.audioManager.add(["ressources/Music/main.ogg",
													  "ressources/Music/main.mp3"], 1);
			   
			   this.audioManager.get(this.idSound1)._sounds[0].audio.loop = true;
			   this.player = new Player(3 * 32, 2 * 32, 32, 32);
			   this.window = new Window(document.getElementById("myCanvas"));

			   this.window.camera = new TrackingCamera(this.player.animatedSprite);
			   this.window.camera.margin = {
				   x: 100,
				   y: 100
			   };

			   this.listCollisionBox = [];
			   this.keyboard = new KeyboardInput();
			   this.mapper = new InputMapper();
			   this.mapper.allowMultiInput = true;
			   this.mapper.bindEvent("MOVE_UP", "KEY_W", this.keyboard)
				   .bindEvent("MOVE_UP", "KEY_UP", this.keyboard)
				   .bindEvent("MOVE_DOWN", "KEY_S", this.keyboard)
				   .bindEvent("MOVE_DOWN", "KEY_DOWN", this.keyboard)
				   .bindEvent("MOVE_LEFT", "KEY_A", this.keyboard)
				   .bindEvent("MOVE_LEFT", "KEY_LEFT", this.keyboard)
				   .bindEvent("MOVE_RIGHT", "KEY_D", this.keyboard)
				   .bindEvent("MOVE_RIGHT", "KEY_RIGHT", this.keyboard)
				   .bindEvent("SPRINT", "KEY_SPACE", this.keyboard)
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
			   
			   this.keyboard.on("KEY_M", this.muteUnmuteMusic.bind(this), KeyboardInput.isPressed);
			   this.keyboard.on("KEY_P", this.pauseResume.bind(this), KeyboardInput.isPressed);
		   }

		   RPGCore.prototype.pauseResume = function() {
			   this.pause = !this.pause;
			   if (this.pause) {
				   this.mapper.enable(false);
				   this.player.animatedSprite.pause();
			   } else {
				   this.player.animatedSprite.resume();
				   this.mapper.enable(true);
			   }
		   };

		   RPGCore.prototype.muteUnmuteMusic = function() {
			   this.audioManager.setMute(!this.audioManager.get(this.idSound1)._sounds[0]._muted);
		   };

		   RPGCore.prototype.startPlayerSprint = function() {
			   this.player.sprint = true;
			   this.player.startRunning();
		   };

		   RPGCore.prototype.stopPlayerSprint = function() {
			   this.player.sprint = false;
			   this.player.stopRunning();
		   };

		   RPGCore.prototype.playSound = function() {
			   this.audioManager.getPlayableSound(this.idSound1).play();
		   };

		   RPGCore.prototype.isPlayerMoving = function() {
			   return this.mapper.get("MOVE_UP") ||
				   this.mapper.get("MOVE_DOWN") ||
				   this.mapper.get("MOVE_LEFT") ||
				   this.mapper.get("MOVE_RIGHT");
		   };

		   RPGCore.prototype.deduceAnimation = function() {
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

		   RPGCore.prototype.stopMovingDir = function(event) {
			   this.deduceAnimation();
		   };

		   RPGCore.prototype.loadMap = function(mapName) {
			   this.file_name = mapName;

			   var loader = new XHRLoader(mapName, "xml");
			   loader.on('complete', function(_, xml) {
				   
				   this.parser = new TMXParser();
				   var tumbleweedLayer = this.parser.parseXML(xml);
				   
				   this.window.addChild(tumbleweedLayer);
				   if (this.parser.zIndexPlayer) {
					   this.player.animatedSprite.zIndex = this.parser.zIndexPlayer;
				   }
				   tumbleweedLayer.addChild(this.player.animatedSprite);
				   //console.log(this.player.rect);
				   //tumbleweedLayer.addChild(this.player.rect);//
				   this.listCollisionBox = this.parser.getCollisionList();
			   
				   this.tumbleweedLayer = tumbleweedLayer;
				   this.loadingScreen = new LoadingScreen(this);
				   this.gameloop.addObject(this.loadingScreen);
				   this.loaderInterval = window.setInterval(this.checkImageLoaded.bind(this), 30);
				   
			   }.bind(this));

			   loader.on('error', function(_, error) {
				   //TODO 
			   });

			   loader.load();
		   };

		   RPGCore.prototype.checkImageLoaded = function() {
			   var i;
			   for (i = 0; i < this.parser.images.length; i++) {
				   if (this.parser.images[i].complete === false) {
					   return;
				   }
			   }
			   if (this.player.spriteSheet.image.complete === true && this.audioManager.get(this.idSound1)._sounds[0].audio.readyState >= 3) {
				   window.clearInterval(this.loaderInterval);
				   this.onImagesLoaded();
			   }
		   };

		   RPGCore.prototype.setDebug = function(bool_status) {
			   this.debug = bool_status;
		   };

		   RPGCore.prototype.draw = function() {
			   if (this.debug === true) {
				   var i = 0;
				   var context = document.getElementById("myCanvas").getContext("2d");
				   while (i < this.listCollisionBox.length) {
					   context.strokeRect(this.listCollisionBox[i].x, this.listCollisionBox[i].y, this.listCollisionBox[i].width, this.listCollisionBox[i].height);
					   i++;
				   }
			   }
			   if (this.pause) {
				   var context = document.getElementById("myCanvas").getContext("2d");
				   context.save();
				   context.fillStyle = "rgb(0,0,0)";
				   context.globalAlpha = 0.5;
				   context.fillRect(0, 0, context.canvas.width, context.canvas.height);
				   context.restore();
				   context.save();
				   context.font = 'italic 50px Calibri';
				   context.shadowColor = "rgb(10, 10, 10)";
				   context.shadowOffsetX = 10;
				   context.shadowOffsetY = 10;
				   context.shadowBlur = 5;
				   var gradient = context.createLinearGradient((context.canvas.width / 3) + (0.05 * context.canvas.width), (context.canvas.height / 2), 300, 150);
				   gradient.addColorStop(0, "rgb(0, 0, 255)");
				   gradient.addColorStop(1, "rgb(0, 255, 255)");
				   context.fillStyle = gradient;
				   context.fillText("PAUSE", (context.canvas.width / 3) + (0.05 * context.canvas.width), (context.canvas.height / 2));
				   context.restore();
			   }
		   }


		   RPGCore.prototype.isPlayerCollidingAnObstacle = function() {
			   var length = this.listCollisionBox.length;
			   for (i = 0; i < length; i++) {
				   if (this.listCollisionBox[i].isCollidingBox(this.player.collisionBox)) {
					   return true;
				   }
			   }
			   
			   if (this.player.collisionBox.x + this.player.collisionBox.width > this.tumbleweedLayer.width) {
				   return true;
			   }
			   if (this.player.collisionBox.x < 0) {
				   return true;
			   }
			   if (this.player.collisionBox.y < 0) {
				   return true;
			   }
			   if (this.player.collisionBox.y + this.player.collisionBox.height > this.tumbleweedLayer.height) {
				   return true;
			   }
			   return false;
		   };

		   RPGCore.prototype.getSpeed = function() {
			   if (this.player.sprint === true) {
				   return 4;
			   } else {
				   return 2;
			   }
		   };

		   RPGCore.prototype.update = function(delta) {
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

				   this.checkTriggerZone();

				   this.totalElapsedTime = 0;
			   } else {
				   this.totalElapsedTime += delta;
			   }
		   };

		   /**
			* Called when a MOVE key is pressed.
			*/
		   RPGCore.prototype.movePlayerDir = function(direction) {
			   if (this.player.state !== "walk" || this.player.direction !== direction) {
				   this.player.playAnimation("walk", direction);
			   }
		   };

		   RPGCore.prototype.checkTriggerZone = function() {
			   var length = this.parser.zoneList.length;
			   for (var i  =0; i < length; i++) {
				   var zone = this.parser.zoneList[i];
				   if (zone.zone.isCollidingBox(this.player.collisionBox) !== zone.isInZone) {
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

		   return RPGCore;

	   });
