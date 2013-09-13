
define([], function() {

	/**
	 * Map data containing all data loaded from TMX file.
	 *
	 * @class Map
	 * @constructor
	 */
	function Map(data) {
		this.data = data;

		this.properties = data.properties;

		this.tilesets = data.tilesets;

		this._loader = null;
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

	/**
	 * Give a resource associated to the map.
	 *
	 * @method getResource
	 * @param id id of the resource requested.
	 */
	Map.prototype.getResource = function(id) {
		return this._loader.get(id);
	};


	return Map;
});
