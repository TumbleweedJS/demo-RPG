
define([], function() {


	/**
	 * Small loading screen called before starting the game.
	 *
	 * @class BootLoadingScreen
	 * @param {Window} window reference to the main window
	 * @param {Loader} loader global ressource loader
	 * @constructor
	 */
	function BootLoadingScreen(window, loader) {

		//just for fun
		var context = window.canvas.getContext('2d');
		context.fillStyle = '#3333FF';
		context.fillRect(0, 0, window.canvas.width, window.canvas.height);

		loader.on('start', function() {
			//
		});

		loader.on('progress', function() {

		});

		loader.on('error', function(_, error) {
			if (console && console.error) {
				console.error("[BootLoadingScreen] error: " + error);
			}
		});

		loader.once('complete', function() {
			//TODO: clean all listeners functions.
		});
	}

	return BootLoadingScreen;
});
