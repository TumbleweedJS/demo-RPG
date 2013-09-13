/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState', 'MapLoadingScreen', 'TW/Preload/XHRLoader', 'TW/Preload/Loader',
       'TMXParser'],
       function(inherit, GameState, MLScreen, XHRLoader, Loader, TMXParser) {

	/**
	 * @class MapLoadingState
	 * @extends GameState
	 * @constructor
	 * @param {KeyBoardInput} kb_input
	 */
	function MapLoadingState(kb_input) {
		GameState.call(this, {
			name:   "map-loading"
		});

		this.screen = new MLScreen();
		this.addLayer(this.screen);
	}

	inherit(MapLoadingState, GameState);


	/**
	 * Ask for loading the specified map.
	 *
	 * The map file and all its dependencies are downloaded,
	 * ready to be used.
	 *
	 * When called, this state take the focus on the GSS.
	 *
	 * @method loadMap
	 * @param {String} path
	 */
	MapLoadingState.prototype.loadMap = function(path) {

		var loader = new XHRLoader('ressources/maps/' + path, "xml");
		this.screen.startMapLoading(loader);

		loader.on('complete', function(_, xml) {
			console.log('hello world');

			var parser = new TMXParser(xml);
			var ressources = parser.getListRessources();

			console.log(ressources);

			var ress_loader = new Loader();

			ress_loader.loadManyFiles(ressources);
			this.screen.startRessourceLoading(ress_loader);

			ress_loader.on('complete', function() {
				//TODO detect space key
				console.log('--> go to map !');
			});

			ress_loader.start();
		}.bind(this));

		loader.on('error', function(_, error) {
			console.log('error loading map !');
		});

		loader.load();
	};

	return MapLoadingState;
});
