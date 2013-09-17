
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
define(['TW/Graphic/Window', 'TW/Preload/Loader', 'BootLoadingScreen', 'TW/GameLogic/Gameloop',
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
	    { src: "ressources/charsets/TerraSheet.png", id: "image-player", type: 'image'}
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
		gss.shared = {
			keyboard:   new KeyboardInput(),
			loader:     loader
		};


		/* add all GS */
		var map_load = new MapLoadingState();
		var map_state = new MapState();
		var start = new StartState();

		start.onDelete = function() {

			gss.createPlayer();

			map_load.path = 'map.xml';
			gss.push(map_load, 400);
		};

		map_load.onDelete = function() {
			map_state.setMap(map_load.getMap());
			console.log('--> go to map !');
			gss.push(map_state, 400);
		};

		gss.push(start, 300);    // !!!

		gss.start();
	}
});

