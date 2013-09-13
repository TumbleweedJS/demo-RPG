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
	 */
	function MapLoadingState() {
		GameState.call(this, {
			name:   "map-loading"
		});

		/**
		 * Path to the next map file to load.
		 *
		 * @property {String} path
		 */
		this.path = null;

		//hack for enable XXState.prototype.onXXX()
		delete this.onCreation;
		delete this.onDelete;
	}

	inherit(MapLoadingState, GameState);

	MapLoadingState.prototype.onCreation = function() {
		this.screen = new MLScreen(this.getGameStateStack().shared.loader);
		this.addLayer(this.screen);
		this.load();
	};

	MapLoadingState.prototype.onDelete = function() {
		this.removeLayer(this.screen);
		this.screen = null;
	};


	/**
	 * Ask for loading the specified map.
	 *
	 * The map file and all its dependencies are downloaded,
	 * ready to be used.
	 *
	 * When called, this state take the focus on the GSS.
	 *
	 * @method load
	 */
	MapLoadingState.prototype.load = function() {

		var screen = this.screen;
		var gss = this.getGameStateStack();

		var loader = new XHRLoader('ressources/maps/' + this.path, "xml");
		screen.startMapLoading(loader);

		loader.on('complete', function(_, xml) {

			var parser = new TMXParser(xml);
			var ressources = parser.getListRessources();

			var ress_loader = new Loader();
			ress_loader.loadManyFiles(ressources);
			screen.startRessourceLoading(ress_loader);

			ress_loader.on('complete', function() {
				gss.shared.keyboard.once('KEY_SPACE', function() {
					gss.pop();
				}, function(_, is_pressed) { return !is_pressed; });
			});

			ress_loader.on('error', function(_, error) {
				console.log('error loading map resource !');
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
