
define(['TW/Utils/inherit', 'TW/Graphic/Layer'], function(inherit, Layer) {

	/**
	 * Display view for the MapLoading GameState.
	 *
	 * This screen should display the loading progress of the map and its dependencies.
	 *
	 * There are three steps:
	 *
	 *  - first, the map file itself is loaded. We have not yet informations.
	 *  It begin with a call to `startMapLoading`.
	 *  - After that, we have all informations about the map (name, description),
	 *   and a list of dependencies to load before starting the map.
	 *   It start with a call to `startRessourceLoading`.
	 *  - When all the ressources are fully loaded,
	 *  the screen invites the player to press the space key.
	 *
	 * @class MapLoadingScreen
	 * @extends Layer
	 * @constructor
	 */
	function MapLoadingScreen() {

	}

	inherit(MapLoadingScreen, Layer);


	/**
	 * @method startMapLoading
	 * @param {XHRLoader} loader
	 */
	MapLoadingScreen.prototype.startMapLoading = function(loader) {
		loader.on('progress', function(_, percent) {
			console.log('Map Loading: ' + percent + '%');
		});

		loader.on('complete', function() {
			console.log('Map Loading complete');
		});
	};

	/**
	 * @method startRessourceLoading
	 * @param {Loader} loader
	 */
	MapLoadingScreen.prototype.startRessourceLoading = function(loader) {
		loader.on('progress', function(_, percent) {
			console.log('Ressources Loading: ' + percent + '%');
		});

		loader.on('complete', function() {
			console.log('Ressources Loading complete');
		});
	};


	MapLoadingScreen.prototype.draw = function(context) {
		context.fillStyle = '#FFFF00';
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
	};

	return MapLoadingScreen;
});
