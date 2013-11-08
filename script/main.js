
requirejs.config({
	baseUrl: 'script',
	paths: {
		TW: '../TW/modules'
	}
});


/**
 * Not a real class, just the non-member functions
 *
 * @class __GLOBAL__
 */


/*
  entry point

  first steps:
   - initializing screen
   - set BootLoading screen
   - loading global ressources
   - start the GSS and the main loop
*/

/**
 * Entry point
 *
 * initialize the screen and start the main ressource loading,
 * then call `startGame`.
 *
 * @method __entry_point__
 */
require(['TW/Graphic/Window', 'TW/Preload/Loader', 'BootLoadingScreen', 'TW/GameLogic/Gameloop',
        'Game', 'TW/Event/KeyboardInput', 'StartState', 'MapLoadingState', 'MapState'],
       function(Window, Loader, BootLoadingScreen, Gameloop, Game, KeyboardInput,
                StartState, MapLoadingState, MapState) {

	// list of all global ressources to load.
	var ressources = [
	    { src: "ressources/images/logo.png", id: 'logo', type: 'image'},
	    { src: "ressources/backgrounds/scene01.jpg", id: 'campagne', type: 'image'},
	    { src: "ressources/backgrounds/cave.jpg", id: "cave", type: 'image'},
	    { src: "ressources/images/logo_fill.png", id: "logo_fill", type: 'image'},
	    { src: "ressources/images/logo_empty.png", id: "logo_empty", type: 'image'},
	    { src: "ressources/spritesheets/player.json", id: "spritesheet-player", type: 'json'},
	    { src: "ressources/spritesheets/Enemy.json", id: "spritesheet-enemy", type: 'json'},
	    { src: "ressources/charsets/TerraSheet.png", id: "image-player", type: 'image'},
	    { src: "ressources/charsets/NPC.png", id: "image-npc", type: 'image'},
	    { src: ["ressources/music/main.mp3", "ressources/music/main.ogg"], id: "main-music", type: 'sound'}
	];

	var canvas = document.getElementById('mainCanvas');

	var win = new Window(canvas);

	var loader = new Loader();
	loader.loadManyFiles(ressources);
	new BootLoadingScreen(win, loader);
	loader.once('complete', startGame);
	loader.start();


	/**
	 * Called after the loading, to start the GameStateStack.
	 *
	 * @method startGame
	 */
	function startGame() {

		var gss = new Game(win.canvas);

		// shared zone used to share resources.
        gss.set('keyboard', new KeyboardInput());
        gss.set('loader', loader);

		gss.start();
	}
});

