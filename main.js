var LoadingScreen = (function() {
 function loadingScreen(rpgCore) {
  this.loaded = false;
  this.imagesToLoad = rpgCore.parser.images;
  this.characterSpritesheet = rpgCore.player.spriteSheet.image;
  //Le plus 2 est present pour la spritsheet du personnage et pour le son.
  this.nbRessources = this.imagesToLoad.length + 2;
  this.audio = rpgCore.audioManager.get(rpgCore.idSound1).sounds[0].audio;
 }
 
 loadingScreen.prototype.draw = function() {
	var totalLoaded = 0;
	var i;
	for (i = 0; i < this.imagesToLoad.length; i++) {
		if (this.imagesToLoad[i].complete === true) {
			totalLoaded++;
		}
	}
	if (this.characterSpritesheet.complete === true) {
		totalLoaded++;
	}
	if (this.audio.readyState >= 3) {
		totalLoaded++;
	}
	var percentLoading = totalLoaded / this.nbRessources;
	var context = document.getElementById("myCanvas").getContext("2d");
	
	context.save();
	
	var gradientBackground = context.createLinearGradient(0, 0, context.canvas.width, context.canvas.height);
	gradientBackground.addColorStop(0, "rgb(200, 200, 200)");
	gradientBackground.addColorStop(1, "rgb(0, 200, 200)");
	context.fillStyle = gradientBackground;
	
	context.fillRect(0,0,context.canvas.width, context.canvas.height);
	context.fillStyle = "rgb(0, 0, 0)";
	context.strokeRect(0,0,context.canvas.width, context.canvas.height);
	context.font = 'italic 30px Calibri';
	
	var gradientFont = context.createLinearGradient(0, 0, context.canvas.width, context.canvas.height);
	gradientFont.addColorStop(0, "rgb(50, 0, 50)");
	gradientFont.addColorStop(1, "rgb(0, 50, 50)");
	context.fillStyle = gradientFont;	
	
	context.fillText("Loading Demo : "+parseInt(percentLoading*100)+"%", 0.28 * context.canvas.width, 0.20 * context.canvas.height);
	
	context.fillStyle = "rgb(0,0,0)";
	context.strokeRect(0.16 * context.canvas.width, 0.35 * context.canvas.height, 0.65 * context.canvas.width, 0.18 * context.canvas.height);

	var gradientLoadingBar = context.createLinearGradient(0, 0, context.canvas.width, context.canvas.height);
	gradientLoadingBar.addColorStop(0, "rgb(255, 0, 0)");
	gradientLoadingBar.addColorStop(1, "rgb(0, 255, 0)");
	context.fillStyle = gradientLoadingBar;

	context.fillRect(0.16 * context.canvas.width, 0.35 * context.canvas.height, percentLoading * 0.65 * context.canvas.width, 0.18 * context.canvas.height);
	if (this.loaded === true) {
		context.fillStyle = gradientFont;
		context.fillText("Loading complete ! Press Space !", 0.20 * context.canvas.width, 0.72 * context.canvas.height);
	}
	context.restore();
 }

 return loadingScreen;
})();





window.onload = function start() {
	this.gameloop = new TW.Gameloop.Gameloop();
	this.rpgCore = new RPGCore();
	this.rpgCore.setDebug(false);
	this.rpgCore.onImagesLoaded = launchGame.bind(this);
	this.rpgCore.gameloop = gameloop;
	this.rpgCore.loadMap("map.tmx");
	this.gameloop.start();
};

function launchGame() {
	this.rpgCore.loadingScreen.loaded = true;
	this.listener = this.rpgCore.keyboard.addListener("KEY_SPACE", TW.Event.KeyboardInput.KEY_PRESSED, startGame.bind(this));
}

function startGame() {
	this.rpgCore.keyboard.rmListener(this.listener);
	this.rpgCore.playSound();
	this.gameloop.rmObject(this.rpgCore.loadingScreen);
	this.gameloop.addObject(this.rpgCore.window);	
	this.gameloop.addObject(this.rpgCore);
}
