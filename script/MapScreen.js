
define(['TW/Utils/inherit', 'TW/Graphic/Layer', 'TW/Graphic/Sprite'], function(inherit, Layer, Sprite) {

	function MapScreen(map, player) {
		Layer.call(this, {
			width:      document.getElementById("mainCanvas").width,
			height:     document.getElementById("mainCanvas").height
		});
		this.map = map;

		this.saveLayers = [];

		this._createSpriteMap();

		this.addChild(player);
	}

	inherit(MapScreen, Layer);

	/**
	*	Retrieve the Layer which have the specified zIndex.
	*
	*	@method getLayerZIndex
	*	@param {Integer} zIndex
	*/
	MapScreen.prototype.getLayerZIndex = function(valZIndex) {
		for (var i = 0; i < this.saveLayers.length; i++) {
			if (valZIndex === this.saveLayers[i].zIndex) {
				return this.saveLayers[i];
			}
		}
		if (this.saveLayers.length > 0)
			return this.saveLayers[0];
		else
			return null;
	};


	MapScreen.prototype._createSpriteMap = function() {
		var layers = this.map.layers;
		var map = this.map;
		for(var i = 0; i < layers.length; i++) {

			var layer = new Layer({
				width:      map.map_size.width * map.tile_size.width,
				height:     map.map_size.height * map.tile_size.height,
				zIndex:     i
			});

			this.addChild(layer);
			this.saveLayers.push(layer);

			if (!layers[i].tiles) {
				continue;
			}
			for (var j = 0; j < layers[i].tiles.length; j++) {
				var infos = layers[i].tiles[j];
				var tile_model = map.getTileModelFromGID(infos.gid);
				layer.addChild(new Sprite({
					x:          infos.x * map.tile_size.width,
					y:          infos.y * map.tile_size.height,
					width:      map.tile_size.width,
					height:     map.tile_size.height,
					image:      tile_model.image,
					imageRect: {
		                x:      tile_model.x,
		                y:      tile_model.y,
		                w:      tile_model.width,
		                h:      tile_model.height
					}
				}));
			}
		}
	};
/*
	MapScreen.prototype.draw = function(context) {
		var layers = this.map.layers;
		for(var i = 0; i < layers.length; i++) {
			for (var j = 0; j < layers[i].tiles.length; j++) {
				var infos = layers[i].tiles[j];
				var tile_model = this.map.getTileModelFromGID(infos.gid);
				context.drawImage(tile_model.image, tile_model.x, tile_model.y, tile_model.width, tile_model.height,
				                  infos.x * this.map.tile_size.width,
				                  infos.y * this.map.tile_size.height, tile_model.width, tile_model.height);
			}
		}
	};
*/
	return MapScreen;
});