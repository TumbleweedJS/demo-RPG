
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
	 * @param {Loader} mainLoader global loader
	 * @extends Layer
	 * @constructor
	 */
	function MapLoadingScreen(mainLoader) {
		this.mainLoader = mainLoader;
	}

	inherit(MapLoadingScreen, Layer);


	/**
	 * @method startMapLoading
	 * @param {XHRLoader} loader
	 */
	MapLoadingScreen.prototype.startMapLoading = function(loader) {
		loader.on('progress', function(_, percent) {
			this.progress = 0;
		});

		loader.on('complete', function() {
			console.log('Map Loading complete');
		});
	};

	/**
	 * @method startRessourceLoading
	 * @param {Loader} loader
	 * @param {Object} infos
	 *  @param {String} [infos.name] Name of the map
	 *  @param {String} [infos.description] Description of the map
	 */
	MapLoadingScreen.prototype.startRessourceLoading = function(loader, infos) {
		loader.on('progress', function(_, percent) {
			this.progress = percent;
		}.bind(this));

		loader.on('complete', function() {
			console.log('Ressources Loading complete');
		});
	};


	MapLoadingScreen.prototype.draw = function(context) {
			var loader = this.mainLoader;
			var logo_empty = loader.get("logo_empty");
			var logo_fill = loader.get("logo_fill");
			var background = loader.get("campagne");
			//drawing background
			context.drawImage(background, 0, 0, background.width, background.height, 0, 0, context.canvas.width, context.canvas.height);
			//drawing grey gradient square
			var gradient = context.createLinearGradient(0,0,0, context.canvas.height);
			context.globalAlpha = 0.8;
			context.shadowOffsetX = 4;
			context.shadowOffsetY = 4;
			context.shadowBlur = 5;
			context.shadowColor = "black";
			gradient.addColorStop(0, "rgb(255,255,255)");
			gradient.addColorStop(1, "rgb(0, 0, 0)");
			context.fillStyle = gradient;
			context.fillRect(context.canvas.width / 18, context.canvas.height / 11, context.canvas.width - 2*(context.canvas.width / 18), context.canvas.height - 2*(context.canvas.height / 11));
			context.globalAlpha = 1.0;
			//drawing empty logo
			context.drawImage(logo_empty, 0, 0, logo_empty.width, logo_empty.height, context.canvas.width / 18, context.canvas.height / 7, logo_empty.width / 1.5, logo_empty.height / 1.5);
			//drawing filled logo (progressing during time)
			context.drawImage(logo_fill, 0, 0, logo_fill.width, logo_fill.height, context.canvas.width / 18, context.canvas.height / 7, logo_fill.width / 1.5, logo_fill.height * (this.progress / 100.0) / 1.5);
			//drawing loading percent.
			context.font = "Bold 35px Calibri,Geneva,Arial";
			context.fillStyle = "rgb(60,144,193)";
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.fillText(this.progress + "%", context.canvas.width / 11 + (logo_empty.width / 3.3), context.canvas.height / 11 + (logo_fill.height * 1.2));
			//Drawing map description
			context.shadowOffsetX = 0;
			context.shadowOffsetY = 0;
			context.shadowBlur = 0;
			context.textAlign = "left";
			context.font = "Bold 15px Calibri,Geneva,Arial";
			context.fillStyle = "rgb(0,0,0)";
			context.fillText("Welcome on the tumbleweed RPG Demo", context.canvas.width / 3, context.canvas.height / 3);
			context.font = "Bold 12px Calibri,Geneva,Arial";
			context.fillText("We hope that you'll enjoy to see whiches", context.canvas.width / 3, context.canvas.height / 3 + (18 * 2));
			context.fillText("are the capabilities of the framework.", context.canvas.width / 3, context.canvas.height / 3 + (18 * 3));
			context.fillText("Press space when loading is complete.", context.canvas.width / 3, context.canvas.height / 3 + (18 * 4));
	};

	return MapLoadingScreen;
});
