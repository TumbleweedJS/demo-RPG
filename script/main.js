
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
	    { src: "http://www.tumbleweed-studio.net/website/img/logo.png", id: 'logo', type: 'image'},
	    { src: "http://www.tumbleweed-studio.net/~bonnet_b/images/scene01.jpg", id: 'campagne', type: 'image'},
	    { src: "http://www.tumbleweed-studio.net/~bonnet_b/images/cave.jpg", id: "cave", type: 'image'}
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
			map_load.path = 'default.tmx';
			gss.push(map_load);
		};

		map_load.onDelete = function() {
			map_state.setMap(map_load.getMap());
			console.log('--> go to map !');
			gss.push(map_state);
		};

		gss.push(start);    // !!!

		gl.start();
	}
});

