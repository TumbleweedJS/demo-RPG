
define([], function() {

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
	 * Parse the <map> node element
	 *
	 * @method parseMap
	 * @param {Element} mapNode
	 */
	TMXParser.prototype.parseMap = function(mapNode) {

		this.map = {
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


		var tilesets = mapNode.getElementsByTagName("tileset");
		this._parseTilesets(tilesets);
		//this.createTileModelsFromTileSets(tilesets);


		console.log(this.map);
		console.log(this.tilesets);


		//////////////////////
		//others child elements: layer, objectgroup, imagelayer

	};



	TMXParser.prototype._parseTilesets = function(tilesets) {
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
				source:     image.getAttribute("source"),
				width:      parseInt(image.getAttribute("width")) || null,
				height:     parseInt(image.getAttribute("height")) || null
			};
			this._ressources.push(tileset.image.source);

			var tiles = tilesets[i].getElementsByTagName("tile");
			for (var j = 0; j < tiles.length; j++) {
				tileset.tiles.push({
					id:     parseInt(tiles[j].getAttribute("id")) || 0
               });
			}

			this.tilesets.push(tileset);
		}
	};


	TMXParser.prototype.getTileModelFromGID = function(gid) {
		for (var i = 0; i < this.tilesets.length && gid > this.tilesets[i].first_gid; i++);
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
			return null;
		}


		/*
			TODO: code copied from the old branch.
			Must be refactorized.
		 */
		x_max = (tileset.image.width - tileset.margin) / (tileset.spacing + tileset.tile_size.width);

		var x = i % x_max;
		var y = i / x_max;

		//coordonée dans l'image du Tile
		total_offsetx = tileset.margin + (x * (tileset.spacing + tileset.tile_size.width));
		total_offsety = tileset.margin + (y * (tileset.spacing + tileset.tile_size.height));

		return {
             gid:       gid,
             image:     null,
             width:     tileset.tile_size.width,
             height:    tileset.tile_size.height,
             x_tex:     total_offsetx,
             y_tex:     total_offsety
         };
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
