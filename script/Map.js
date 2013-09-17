
define([], function() {

	/**
	 * Map data containing all data loaded from TMX file.
	 *
	 * @class Map
	 * @constructor
	 * @param {Object} data
	 * @param {Object} data.tile_size
	 * @param {String|null} data.bgColor
	 * @param {Object} data.map_size
	 * @param {Object} data.properties
	 */
	function Map(data) {

		this.tile_size = data.tile_size;
		this.bgColor = data.bgColor;
		this.map_size = data.map_size;
		this.properties = data.properties;


		this.tilesets = null;

		this._loader = null;

		this.layers = [];
	}

	/**
	 * Set the resource loader when it's fully loaded.
	 *
	 * @method setResourceLoader
	 * @param {Loader} loader
	 */
	Map.prototype.setResourceLoader = function(loader) {
		this._loader = loader;
	};

	Map.prototype.setTilesets = function(tilesets) {
		this.tilesets = tilesets;
	};

	/**
	 * Give a resource associated to the map.
	 *
	 * @method getResource
	 * @param id id of the resource requested.
	 */
	Map.prototype.getResource = function(id) {
		return this._loader.get(id);
	};

	/**
	 * add a layer to the map.
	 *
	 * @method addLayer
	 * @param {Object} layer
	 *  @param {String} layer.name
	 *  @param {Array} layer.tiles
	 *  @param {Object} layer.properties
	 */
	Map.prototype.addLayer = function(layer) {
		this.layers.push(layer);
	};


	/**
	 * Search the corresponding tile parameters from a gid.
	 *
	 * @method getTileModelFromGID
	 * @param {Number} gid the tile gid to search
	 * @return {Object} tile parameters
	 */
	Map.prototype.getTileModelFromGID = function(gid) {
		for (var i = 0; i < this.tilesets.length && gid >= this.tilesets[i].first_gid; i++);
		i--;

		if (i === -1) {
			return null;
		}

		var tileset = this.tilesets[i];
		var id = gid - tileset.first_gid;
		var tile;

		if (tileset.tiles[id] !== undefined && tileset.tiles[id].id === id) {
			tile = tileset.tiles[id];
		} else {
			for (i = 0; i < tileset.tiles.length; i++) {
				if (tileset.tiles[i].id === id) {
					tile = tileset.tiles[i];
				}
			}
			//bad tile ?
			return null;
		}


		var nb_tile_x = Math.floor(tileset.image.width - tileset.margin * 2) /
		                (tileset.spacing + tileset.tile_size.width);

		//position in number of tile
		var x = id % nb_tile_x;
		var y = Math.floor(id / nb_tile_x);

		return {
			gid:        gid,
			image:      this._loader.get(tileset.image.id),
			x:          tileset.margin + x * (tileset.spacing + tileset.tile_size.width),
			y:          tileset.margin + y * (tileset.spacing + tileset.tile_size.height),
			width:      tileset.tile_size.width,
			height:     tileset.tile_size.height
		};
	};


	return Map;
});
