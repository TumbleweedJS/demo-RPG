
define([], function() {

	/**
	 * @class TMXParser
	 * @param {XMLDocument} xml tmx map
	 * @constructor
	 */
	function TMXParser(xml) {

	}

	/**
	 * @method getListRessources
	 * @return {Array} list of all ressources required by the map.
	 */
	TMXParser.prototype.getListRessources = function() {
		return ['index.html'];
	};

	return TMXParser;
});
