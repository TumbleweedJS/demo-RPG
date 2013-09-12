
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
define(['TW/Graphic/Window', 'TW/Preload/Loader', 'BootLoadingScreen'], function(Window, Loader, BootLoadingScreen) {

	// list of all global ressources to load.
	var ressources = [
		"index.html"
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
		console.log('start game');
	}
});

