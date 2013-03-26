var Direction = {
NONE:0,
UP:1,
LEFT:2,
DOWN:3,
RIGHT:4
};


var RPGCore = (function(){

function RPGCore() {
 this.totalElapsedTime = 0;
 this.debug = false;
 this.pause = false;
 this.playerOrientation = Direction.DOWN;
 
 this.testAudio = new Audio();
 
 this.audioManager = new TW.Audio.Manager;
 if (this.testAudio.canPlayType("audio/ogg") != "") {
 this.idSound1 = this.audioManager.add("ressources/Music/Painted_Dreams_Mock_Up.ogg", 1);
 } else {
 this.idSound1 = this.audioManager.add("ressources/Music/Painted_Dreams_Mock_Up.mp3", 1);
 }
 
 delete this.testAudio;
 
 this.audioManager.get(this.idSound1).sounds[0].audio.loop = true;
 this.playerDirection = Direction.NONE;
 this.directionPressed = [false, false, false, false, false];
 this.player = new Player(3 * 32, 2 * 32, 32, 32);
 this.window = new TW.Graphic.Window(document.getElementById("myCanvas"));
 this.listCollisionBox = [];
 this.keyboard = new TW.Event.KeyboardInput();
 this.keyboard.addListener("KEY_W", TW.Event.KeyboardInput.KEY_PRESSED, this.movePlayerUp.bind(this));
 this.keyboard.addListener("KEY_S", TW.Event.KeyboardInput.KEY_PRESSED, this.movePlayerDown.bind(this));
 this.keyboard.addListener("KEY_A", TW.Event.KeyboardInput.KEY_PRESSED, this.movePlayerLeft.bind(this));
 this.keyboard.addListener("KEY_D", TW.Event.KeyboardInput.KEY_PRESSED, this.movePlayerRight.bind(this));
 this.keyboard.addListener("KEY_UP", TW.Event.KeyboardInput.KEY_PRESSED, this.movePlayerUp.bind(this));
 this.keyboard.addListener("KEY_DOWN", TW.Event.KeyboardInput.KEY_PRESSED, this.movePlayerDown.bind(this));
 this.keyboard.addListener("KEY_LEFT", TW.Event.KeyboardInput.KEY_PRESSED, this.movePlayerLeft.bind(this));
 this.keyboard.addListener("KEY_RIGHT", TW.Event.KeyboardInput.KEY_PRESSED, this.movePlayerRight.bind(this));
 this.keyboard.addListener("KEY_SHIFT", TW.Event.KeyboardInput.KEY_PRESSED, this.startPlayerSprint.bind(this));
 this.keyboard.addListener("KEY_M", TW.Event.KeyboardInput.KEY_PRESSED, this.muteUnmuteMusic.bind(this));
 this.keyboard.addListener("KEY_P", TW.Event.KeyboardInput.KEY_PRESSED, this.pauseResume.bind(this));

 this.keyboard.addListener("KEY_W", TW.Event.KeyboardInput.KEY_RELEASED, this.stopMovingUp.bind(this));
 this.keyboard.addListener("KEY_S", TW.Event.KeyboardInput.KEY_RELEASED, this.stopMovingDown.bind(this));
 this.keyboard.addListener("KEY_A", TW.Event.KeyboardInput.KEY_RELEASED, this.stopMovingLeft.bind(this));
 this.keyboard.addListener("KEY_D", TW.Event.KeyboardInput.KEY_RELEASED, this.stopMovingRight.bind(this));
 this.keyboard.addListener("KEY_UP", TW.Event.KeyboardInput.KEY_RELEASED, this.stopMovingUp.bind(this));
 this.keyboard.addListener("KEY_DOWN", TW.Event.KeyboardInput.KEY_RELEASED, this.stopMovingDown.bind(this));
 this.keyboard.addListener("KEY_LEFT", TW.Event.KeyboardInput.KEY_RELEASED, this.stopMovingLeft.bind(this));
 this.keyboard.addListener("KEY_RIGHT", TW.Event.KeyboardInput.KEY_RELEASED, this.stopMovingRight.bind(this));
 this.keyboard.addListener("KEY_SHIFT", TW.Event.KeyboardInput.KEY_RELEASED, this.stopPlayerSprint.bind(this));
}

RPGCore.prototype.pauseResume = function() {
 this.pause = !this.pause;
 if (this.pause) {
 this.player.animatedSprite.pause();
 } else {
	if (this.playerDirection === Direction.NONE) {
	 this.deduceStandAnimation();
	} else {
	 this.player.animatedSprite.resume();
	}
 }
};

RPGCore.prototype.deduceStandAnimation = function() {
 switch (this.playerOrientation) {
  case Direction.UP:
	this.player.playAnimation("stand_up");
  break;
  case Direction.LEFT:
	this.player.playAnimation("stand_left");
  break;
  case Direction.RIGHT:
	this.player.playAnimation("stand_right");
  break;
  case Direction.DOWN:
	this.player.playAnimation("stand_down");
  break;
 }
};

RPGCore.prototype.muteUnmuteMusic = function() {
 this.audioManager.get(this.idSound1).sounds[0].audio.muted = !this.audioManager.get(this.idSound1).sounds[0].audio.muted;
};

RPGCore.prototype.startPlayerSprint = function() {
		this.player.sprint = true;
	if (!this.pause) {
		this.player.startRunning();
	}
};

RPGCore.prototype.stopPlayerSprint = function() {
	this.player.sprint = false;
	if (!this.pause) {
	this.player.stopRunning();
	}
};

RPGCore.prototype.playSound = function() {
 this.audioManager.getPlayableSound(this.idSound1).play();
};

RPGCore.prototype.isPlayerMoving = function() {
 var i;
 for (i = 0; i < 5; i++) {
  if (this.directionPressed[i] === true) {
   return true;
  }
 }
 return false;
};

RPGCore.prototype.deduceAnimation = function() {
	if (this.directionPressed[Direction.UP] === true) {
		this.playerDirection = Direction.UP;
		this.playerOrientation = Direction.UP;
		this.player.playAnimation("walk_up");
	}
	if (this.directionPressed[Direction.LEFT] === true) {
		this.playerDirection = Direction.LEFT;
		this.playerOrientation = Direction.LEFT;
		this.player.playAnimation("walk_left");
	}
	if (this.directionPressed[Direction.DOWN] === true) {
		this.playerDirection = Direction.DOWN;
		this.playerOrientation = Direction.DOWN;
		this.player.playAnimation("walk_down");		
	}
	if (this.directionPressed[Direction.RIGHT] === true) {
		this.playerDirection = Direction.RIGHT;
		this.playerOrientation = Direction.RIGHT;
		this.player.playAnimation("walk_right");
	}
};

RPGCore.prototype.stopMovingUp = function() {
 if (this.pause) {
 this.directionPressed[Direction.UP] = false;
 this.playerDirection = Direction.NONE;
  return;
 }
 this.directionPressed[Direction.UP] = false;
 if (this.isPlayerMoving() === false) {
  this.playerDirection = Direction.NONE;
  this.player.playAnimation("stand_up");
 } else {
  this.deduceAnimation();
 }
};

RPGCore.prototype.stopMovingDown = function() {
 if (this.pause) {
 this.directionPressed[Direction.DOWN] = false;
 this.playerDirection = Direction.NONE;
  return;
 }
 this.directionPressed[Direction.DOWN] = false;
 if (this.isPlayerMoving() === false) {
  this.playerDirection = Direction.NONE;
  this.player.playAnimation("stand_down");
 } else {
  this.deduceAnimation();
 }
};

RPGCore.prototype.stopMovingLeft = function() {
 if (this.pause) {
 this.directionPressed[Direction.LEFT] = false;
 this.playerDirection = Direction.NONE;
  return;
 }
 this.directionPressed[Direction.LEFT] = false;
 if (this.isPlayerMoving() === false) {
  this.playerDirection = Direction.NONE;
  this.player.playAnimation("stand_left");
 } else {
  this.deduceAnimation();
 }
};

RPGCore.prototype.stopMovingRight = function() {
 if (this.pause) {
 this.directionPressed[Direction.RIGHT] = false;
 this.playerDirection = Direction.NONE;
  return;
 }
 this.directionPressed[Direction.RIGHT] = false;
 if (this.isPlayerMoving() === false) {
  this.playerDirection = Direction.NONE;
  this.player.playAnimation("stand_right");
 } else {
  this.deduceAnimation();
 }
};

RPGCore.prototype.loadMap = function(mapName) {
	this.file_name = mapName;
	this.parser = new TMXParser();

	if (this.file_name)
	{
		var request = new XMLHttpRequest();
		request.open("GET", this.file_name, false);
		request.overrideMimeType('text/xml');
		request.send();
		var xml = request.responseXML;
		if (xml != null)
		{
			var tumbleweedLayer = this.parser.parseXML(xml);
		}
		this.window.addChild(tumbleweedLayer);
		if (this.parser.zIndexPlayer) {
			this.player.animatedSprite.zIndex = this.parser.zIndexPlayer;
		}
		tumbleweedLayer.addChild(this.player.animatedSprite);
		this.listCollisionBox = this.parser.getCollisionList();
	}
	this.loadingScreen = new LoadingScreen(this);
	this.gameloop.addObject(this.loadingScreen);
	this.loaderInterval = window.setInterval(this.checkImageLoaded.bind(this), 30);
};

RPGCore.prototype.checkImageLoaded = function() {
 var i;
 for (i = 0; i < this.parser.images.length; i++) {
  if (this.parser.images[i].complete === false) {
   return;
  }
 }
 if (this.player.spriteSheet.image.complete === true && this.audioManager.get(this.idSound1).sounds[0].audio.readyState >= 3) {
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
	    context.strokeRect(this.listCollisionBox[i].x, this.listCollisionBox[i].y, this.listCollisionBox[i].w, this.listCollisionBox[i].h);
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
	 context.font = 'italic 60px Calibri';
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
	//console.log("orientation joueur : "+this.playerOrientation);
	if (this.pause === true) {
		return;
	}
	if ((this.totalElapsedTime + delta) > (1000 / 50)) {
		if (this.directionPressed[Direction.UP]) {
			this.player.moveUp(this.getSpeed());
			if (this.isPlayerCollidingAnObstacle()) {
				this.player.moveDown(this.getSpeed());
			}
		}
		if (this.directionPressed[Direction.LEFT]) {
			this.player.moveLeft(this.getSpeed());
			if (this.isPlayerCollidingAnObstacle()) {
				this.player.moveRight(this.getSpeed());
			}
		}
		if (this.directionPressed[Direction.DOWN]) {
			this.player.moveDown(this.getSpeed());
			if (this.isPlayerCollidingAnObstacle()) {
				this.player.moveUp(this.getSpeed());
			}
		}
		if (this.directionPressed[Direction.RIGHT]) {
			this.player.moveRight(this.getSpeed());
			if (this.isPlayerCollidingAnObstacle()) {
				this.player.moveLeft(this.getSpeed());
			}
		}
	 this.totalElapsedTime = 0;
	} else {
	 this.totalElapsedTime += delta;
	}
};

RPGCore.prototype.movePlayerUp = function() {
 if (this.pause) {
  return;
 }
 this.playerOrientation = Direction.UP;
 this.directionPressed[Direction.UP] = true;
 if (this.playerDirection != Direction.UP) {
  this.playerDirection = Direction.UP;
  this.player.playAnimation("walk_up");
 }
};

RPGCore.prototype.movePlayerDown = function() {
 if (this.pause) {
  return;
 }
 this.playerOrientation = Direction.DOWN;
 this.directionPressed[Direction.DOWN] = true;
 if (this.playerDirection != Direction.DOWN) {
  this.playerDirection = Direction.DOWN;
  this.player.playAnimation("walk_down");
 }
};

RPGCore.prototype.movePlayerLeft = function() {
 if (this.pause) {
  return;
 }
 this.playerOrientation = Direction.LEFT;
this.directionPressed[Direction.LEFT] = true;
 if (this.playerDirection != Direction.LEFT) {
  this.playerDirection = Direction.LEFT;
  this.player.playAnimation("walk_left");
 }
};

RPGCore.prototype.movePlayerRight = function() {
 if (this.pause) {
  return;
 }
 this.playerOrientation = Direction.RIGHT;
 this.directionPressed[Direction.RIGHT] = true;
 if (this.playerDirection != Direction.RIGHT) {
  this.playerDirection = Direction.RIGHT;
  this.player.playAnimation("walk_right");
 }
};

return RPGCore;

})();