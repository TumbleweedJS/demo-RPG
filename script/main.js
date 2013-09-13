
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
        'TW/GameLogic/GameStateStack', 'TW/Event/KeyboardInput', 'StartState', 'MapLoadingState', 'MapState'],
       function(Window, Loader, BootLoadingScreen, Gameloop, GSS, KeyboardInput,
                StartState, MapLoadingState, MapState) {

	// list of all global ressources to load.
	var ressources = [
	    { src: "index.html", id: '1' },
	    { src: "http://pc-infogame.com/images/images/rpg_maker1.png" },
	    { src: "http://img2.brothergames.com/screenshots/softimage/0/001_action-rpg_maker-245945-1244603396.jpeg" }
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

		var gl = new Gameloop();
		var gss = new GSS(win.canvas);
		gl.addObject(gss);

		/* global objects shared between all states. */
		var kb_input = new KeyboardInput();


		/* add all GS */
		gss.push(new MapState(kb_input));
		var mapload = new MapLoadingState(kb_input);
		gss.push(mapload);
		var start = new StartState(kb_input);
		start.onDelete = function() {
			mapload.loadMap('default.tmx');
		};
		gss.push(start);

		gl.start();
	}
});

