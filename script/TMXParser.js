
define(['Map'], function(Map) {

	/**
	 * @class TMXParser
	 * @param {XMLDocument} xml tmx map
	 * @constructor
	 */
	function TMXParser(xml) {

		/**
		 * List of all ressources to load
		 *
		 * @property {Array} _ressources
		 * @private
		 */
		this._ressources = [];


		this.tilesets = [];

		if (xml.hasChildNodes()) {
			var child_nodes = xml.childNodes;
			for (var i = 0; i < child_nodes.length; i++) {
				if (child_nodes[i].tagName === "map") {
					this.xmlMap = child_nodes[i];
					this.parseMap(this.xmlMap);
				}
			}
			if (this.xmlMap === undefined) {
				throw new Error('[TMX Parser] <map> node not found.');
			}
		} else {
			throw new Error('[TMXParser] Empty XML');
		}
	}

	/**
	 * @method getListRessources
	 * @return {Array} list of all ressources required by the map.
	 */
	TMXParser.prototype.getListRessources = function() {
		return this._ressources;
	};

	/**
	 * @method getMap
	 * @return the new-created Map object.
	 */
	TMXParser.prototype.getMap = function() {
		return this.map;
	};

	/**
	 * Parse the <map> node element
	 *
	 * @method parseMap
	 * @param {Element} mapNode
	 */
	TMXParser.prototype.parseMap = function(mapNode) {

		var map = {
			version:        parseInt(mapNode.getAttribute("version")) || 0,
			tile_size: {
				width:      parseInt(mapNode.getAttribute("tilewidth")) || 0,
				height:     parseInt(mapNode.getAttribute("tileheight")) || 0
			},
			map_size: { // exprimed in number of tile
				width:      parseInt(mapNode.getAttribute("width")) || 0,
				height:     parseInt(mapNode.getAttribute("height")) || 0
			},
			orientation:    mapNode.getAttribute("orientation"),
			bgColor:        mapNode.getAttribute("backgroundcolor"),
			properties:     this._parseProperties(mapNode)
		};

		this.map = new Map(map);

		var tilesets = mapNode.getElementsByTagName("tileset");
		this.map.setTilesets(this._parseTilesets(tilesets));


		for (var i = 0; i < mapNode.childNodes.length; i++) {
			var layer = mapNode.childNodes[i];

			switch (layer.tagName) {
				case 'layer':
					var data = this._parseLayer(layer);
					this.map.addLayer(data);
					break;
				case 'objectgroup':
					var data = this._parseGroupObject(layer);
					this.map.addLayer(data);
					break;
				case 'imagelayer':
				default:
					if (layer.tagName !== undefined && layer.tagName !== "properties" && layer.tagName !== "tileset") {
						console.log("[TMXParser] unknow Layer type: " + layer.tagName);
					}
			}
		}
	};



	TMXParser.prototype._parseTilesets = function(tilesets) {
		var ret = [];
		for (var i = 0; i < tilesets.length; i++) {

			var tileset = {
				name:           tilesets[i].getAttribute("name"),
				first_gid:      parseInt(tilesets[i].getAttribute("firstgid")) || 0,
				spacing:        parseInt(tilesets[i].getAttribute("spacing")) || 0,
				margin:         parseInt(tilesets[i].getAttribute("margin")) || 0,
				properties:     this._parseProperties(tilesets[i]),
				tile_size: {
					width:      parseInt(tilesets[i].getAttribute("tilewidth")) || 0,
					height:     parseInt(tilesets[i].getAttribute("tileheight")) || 0
				},
				tiles:          []
			};

			var image = tilesets[i].getElementsByTagName("image")[0];
			tileset.image = {
				id:         'tileset #' + (i + 1),
				source:     image.getAttribute("source"),
				width:      parseInt(image.getAttribute("width")) || null,
				height:     parseInt(image.getAttribute("height")) || null
			};
			this._ressources.push({
				                      src:    tileset.image.source,
				                      id:     tileset.image.id,
				                      type:   'image'
			                      });

			var tiles = tilesets[i].getElementsByTagName("tile");
			for (var j = 0; j < tiles.length; j++) {
				tileset.tiles.push({
					                   id:     parseInt(tiles[j].getAttribute("id")) || 0
				                   });
			}

			ret.push(tileset);
		}
		return ret;
	};

	TMXParser.prototype._parseGroupObject = function(layer) {
		var data = {
			type: 'objectgroup',
			opacity:    parseFloat(layer.getAttribute('opacity')) || 0,
			width:      parseFloat(layer.getAttribute('width')) || 0,
			height:     parseFloat(layer.getAttribute('height')) || 0,
			visible:    !!(parseInt(layer.getAttribute('visible')) || 1),
			name:       layer.getAttribute('name'),
			properties: this._parseProperties(layer),
			objects:    []
		};

		var objects = layer.getElementsByTagName('object');
		for (var i = 0; i < objects.length; i++) {
			var obj = {
				name:       objects[i].getAttribute('name'),
				type:       objects[i].getAttribute('type'),
				x:          parseFloat(objects[i].getAttribute('x')),
				y:          parseFloat(objects[i].getAttribute('y')),
				width:      parseFloat(objects[i].getAttribute('width')) || 0,
				height:     parseFloat(objects[i].getAttribute('height')) || 0,
				gid:        parseInt(objects[i].getAttribute('gid')) || 0,
				visible:    !!(parseInt(objects[i].getAttribute('visible')) || 1),
				properties: this._parseProperties(objects[i])
			};
			data.objects.push(obj);
		}

		return data;
	};


	TMXParser.prototype._parseLayer = function(layer) {
		var data = {
			type: 'layer',
			opacity:    parseFloat(layer.getAttribute('opacity')) || 0,
			width:    parseFloat(layer.getAttribute('width')) || 0,
			height:    parseFloat(layer.getAttribute('height')) || 0,
			visible:    !!(parseInt(layer.getAttribute('visible')) || 1),
			name:       layer.getAttribute('name'),
			properties: this._parseProperties(layer),
			tiles:      []
		};

		var tiles = layer.getElementsByTagName('tile');
		for (var i = 0; i < tiles.length; i++) {
			var gid = parseInt(tiles[i].getAttribute('gid')) || 0;
			if (gid !== 0) {
				data.tiles.push({
					                x:      i % data.width,
					                y:      Math.floor(i / data.width),
					                gid:    gid
				                });
			}
		}

		return data;
	};


	/**
	 * Parse All `<property>` in the `<properties>` child tag.
	 * If a property is set two times or more, result will be an array with all values.
	 *
	 * @method _parseProperties
	 * @param {Element} node XML element containing the `<properties>` node.
	 * @return {Object} litteral object containing all properties.
	 * @protected
	 */
	TMXParser.prototype._parseProperties = function(node) {
		var obj = {};

		var props = node.getElementsByTagName("properties");
		if (props.length === 0) {
			return {};
		}
		props = props[0];

		var list = props.getElementsByTagName('property');
		for (var i = 0; i < list.length; i++) {
			var name = list[i].getAttribute('name');
			var value = list[i].getAttribute('value');
			if (obj[name] !== "undefined") {
				obj[name] = value;
			} else if (obj[name] instanceof Array) {
				obj[name].push(value);
			} else {
				obj[name] = [ obj[name], value];
			}
		}
		return obj;
	};


	return TMXParser;
});
