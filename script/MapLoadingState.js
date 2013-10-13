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

		/**
		 * Map loaded
		 *
		 * @property {Map} map
		 */
		this.map = null;

        this.on('creation', function() {
            this.screen = new MLScreen(this.getGameStateStack().shared.loader);
            this.addLayer(this.screen);
            this.load();
        }.bind(this));

        this.on('delete', function() {
            this.removeLayer(this.screen);
            this.screen = null;

            //hack: the map is needed in an other catch of the delete event.
            //this.map = null;
        }.bind(this));
	}

	inherit(MapLoadingState, GameState);


   /**
    * When the map is loaded, give access to them.
    *
    * @method getMap
    * @return {Map} the loaded map. null if not yet loaded.
    */
	MapLoadingState.prototype.getMap = function() {
		return this.map;
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

		var that = this;
		loader.on('complete', function(_, xml) {

			var parser = new TMXParser(xml);
			var ressources = parser.getListRessources();
			that.map = parser.getMap();

			var ress_loader = new Loader();
			ress_loader.loadManyFiles(ressources);
			screen.startRessourceLoading(ress_loader, {
				name: that.map.properties.name,
				description: that.map.properties.description
			});

			ress_loader.on('complete', function() {
				that.map.setResourceLoader(ress_loader);

				gss.shared.keyboard.once('KEY_SPACE', function() {
					gss.pop(400);
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
