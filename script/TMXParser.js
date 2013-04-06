define(['require', './TW/Graphic/Layer', 'TW/Graphic/Sprite', 'TW/Collision/CollisionBox', 'TW/Graphic/Rect'], function(require, Layer, Sprite, CollisionBox, Rect) {

  function TMXParser() {
	  this.xmlObject = null;
	  this.rootLayer = null;

	  /** map config **/
	  this.tileWidth;
	  this.tileHeight;
	  this.numberOfTileInWidth;
	  this.numberOfTileInHeight;

	  /** Xml nodes **/
	  this.tilesets = null;
	  this.layers = null; 
	  this.objectgroups = [];

	  /** tilesets data **/
	  this.tilemodels = [];
	  this.images = [];

	  /** collision AABB **/
	  this.collisionList = [];

	  this.zoneList = [];
  }

  //Prend en entree l'objet XML qui contient le descriptif du fichier TMX.
  TMXParser.prototype.parseXML = function(xmlObject) {
	  if (xmlObject.hasChildNodes()) {
		  var childNodes = xmlObject.childNodes;
		  var i;
		  for (i = 0; i < childNodes.length; i++) {
			  if (childNodes[i].tagName === "map") {
				  this.xmlObject = xmlObject;
				  this.parseMap(childNodes[i]);
				  return this.rootLayer;
			  }
		  }
		  return null;
	  }
  };
  
  //Permet de recuperer la liste de tiles de collisions fournis par le fichier TMX.
  TMXParser.prototype.getCollisionList = function() {
	return this.collisionList;
  };

  //Prend en entree le noeud de l'objet XML qui contient la map
  TMXParser.prototype.parseMap = function(mapNode) {
	  this.tileWidth = parseInt(mapNode.getAttribute("tilewidth"));
	  this.tileHeight = parseInt(mapNode.getAttribute("tileheight"));
	  this.numberOfTileInWidth = parseInt(mapNode.getAttribute("width"));
	  this.numberOfTileInHeight = parseInt(mapNode.getAttribute("height"));
	  this.rootLayer = new Layer({
		  x: 0,
		  y: 0,
		  width: (this.numberOfTileInWidth * this.tileWidth),
		  height: (this.numberOfTileInHeight * this.tileHeight)
	  });
	  this.tilesets = mapNode.getElementsByTagName("tileset");
	  this.createTileModelsFromTileSets(this.tilesets);
	  this.layers = mapNode.getElementsByTagName("layer");
	  this.buildLayers(this.layers);
	  this.objectgroups = mapNode.getElementsByTagName("objectgroup");
	  this.parseAllObjectGroups();
  };
  
  TMXParser.prototype.createTileModelsFromTileSets = function(tileSets){
	var i;
	var j;
	var tileList;
	var tmxImage;
	var tmxImageWidth;
	var tmxImageHeight;
	var tilesetSpacing;
	var tilesetMargin;
	var tilesetTileWidth;
	var tilesetTileHeight;
	var img;
	var texture_x = 0;
	var texture_y = 0;
	//x_max represente le nombre maximal de tiles en largeur
	var x_max = 0;
	//y_max represente le nombre maximal de tiles en hauteur
	var y_max = 0;
	//x represente l'index en abscisse du tile en cours de traitement
	var x = 0;
	//y represente l'index en ordonnee du tile en cours de traitement
	var y = 0;
	//total_offsetx represente la coordonnee en abscisse de la partie de l'image a utiliser
	var total_offsetx;
	//total_offsety represente la coordonnee en ordinnee de la la partie de l'image a utiliser
	var total_offsety;

	for (i = 0; i < tileSets.length; i++) {
		tileList = tileSets[i].getElementsByTagName("tile");
		tmxImage = tileSets[i].getElementsByTagName("image")[0];
		tmxImageWidth = parseInt(tmxImage.getAttribute("width"));
		tmxImageHeight = parseInt(tmxImage.getAttribute("height"));
		if (tileSets[i].getAttribute("spacing")) {
		 tilesetSpacing = parseInt(tileSets[i].getAttribute("spacing"));
		} else {
		 tilesetSpacing = 0;
		}
		if (tileSets[i].getAttribute("margin")) {
		tilesetMargin = parseInt(tileSets[i].getAttribute("margin"));
		} else {
		 tilesetMargin = 0;
		}
		tilesetTileWidth = parseInt(tileSets[i].getAttribute("tilewidth"));
		tilesetTileHeight = parseInt(tileSets[i].getAttribute("tileheight"));
		
		x_max = (tmxImageWidth - tilesetMargin) / (tilesetSpacing + tilesetTileWidth);
		y_max = (tmxImageHeight - tilesetMargin) / (tilesetSpacing + tilesetTileHeight);
		img = new Image();
		img.src = tmxImage.getAttribute("source");
		this.images.push(img);
		for (j = 0; j < tileList.length; j++) {
			x = j % x_max;
			y = parseInt(j / x_max);
			var gid = parseInt(tileSets[i].getAttribute("firstgid")) + parseInt(tileList[j].getAttribute("id"));
			var tileWidth = parseInt(tileSets[i].getAttribute("tilewidth"));
			var tileHeight = parseInt(tileSets[i].getAttribute("tileheight"));
			total_offsetx = tilesetMargin + (x * (tilesetSpacing + tilesetTileWidth));
			total_offsety = tilesetMargin + (y * (tilesetSpacing + tilesetTileHeight));
			this.tilemodels.push({gid:gid+'', image:img, width:tileWidth, height:tileHeight, x_tex:total_offsetx,
								y_tex:total_offsety});
		}
	}
  };
    
  TMXParser.prototype.buildLayers = function(layers) {
	  var layer;
	  var zIndex = 1;

	  for (var i = 0; i < layers.length; i++) {
		  layer = new Layer({
			  x: 0,
			  y: 0,
			  width: this.numberOfTileInWidth * this.tileWidth,
			  height: this.numberOfTileInHeight * this.tileHeight,
			  zIndex: zIndex
		  });
		  //TODO: virer pour un objet sur la map ?
		  if (layers[i].getAttribute("name") === "baseGround") {
			  zIndex++;
			  this.zIndexPlayer = zIndex;
		  }
		  zIndex++;
		  this.rootLayer.addChild(layer);
		  this.fillLayerWithTiles(layer, layers[i]);
	  }
  };
  
  TMXParser.prototype.fillLayerWithTiles = function(tumbleweedLayer, TMXLayer) {
	var tileList = TMXLayer.getElementsByTagName("tile");
	var layerWidthTileNumber = parseInt(TMXLayer.getAttribute("width"));
	var layerHeightTileNumber = parseInt(TMXLayer.getAttribute("height"));
	var x;
	var y;
	var sprite;

	for (y = 0; y < layerHeightTileNumber; y++) {
		for (x = 0; x < layerWidthTileNumber; x++) {
			var tileModel = this.getTileModelFromGID(parseInt(tileList[(y * layerWidthTileNumber) + x].getAttribute("gid")));
			if (tileModel === null) {
			 continue;
			}
			var imageSprite = tileModel.image;
			var spriteImageRect;
			sprite = new Sprite({x:(x*this.tileWidth),
											y:(y*this.tileHeight),
											width:(tileModel.width),
											height:(tileModel.height),
											image:imageSprite,
											imageRect:{x:tileModel.x_tex, y:tileModel.y_tex, w:tileModel.width, h:tileModel.height}});
			tumbleweedLayer.addChild(sprite);
		}
	}
  };
  
  TMXParser.prototype.getTileModelFromGID = function(gidNumber) {
	var i;
	for (i = 0; i < this.tilemodels.length; i++) {
		if (parseInt(this.tilemodels[i].gid) === gidNumber) {
		 return this.tilemodels[i];
		}
	}
	return null;
  };
  
  TMXParser.prototype.parseJSON = function(jsonObject) {
  };

	/**
	 * parse all `<objectgroup>` tags.
	 *
	 * @method parseAllObjectGroups
	 */
	TMXParser.prototype.parseAllObjectGroups = function() {
		for (var i = 0; i < this.objectgroups.length; i++) {
			this.parseObjectGroup(this.objectgroups[i]);
		}
	};

	/**
	 * Parse a `<objectgroup>` tag.
	 * @method parseObjectGroup
	 * @param {XMLNode} group 
	 */
	TMXParser.prototype.parseObjectGroup = function(group) {
		var objects = group.getElementsByTagName('object');
		var length = objects.length;

		for (var i = 0; i < length; i++) {
			if (objects[i].getElementsByTagName('ellipse').length) {
				console.warn('TMXParser: ellipse are not supported; ignored.');
			}
			else if (objects[i].getElementsByTagName('polygon').length) {
				console.warn('TMXParser: polygon are not supported; ignored.');
			}
			else if (objects[i].getElementsByTagName('polyline').length) {
				console.warn('TMXParser: polyline are not supported; ignored.');
			}
			else if (objects[i].hasAttribute('gid').length) {
				console.warn('TMXParser: tiles are not supported in objectgroup; ignored.');
			} else {
				var width = objects[i].getAttribute('width') || 20;
				var height = objects[i].getAttribute('height') || 20;
				this.parseObject(objects[i]);
			}
		}
	};

	/**
	 * parse an `<object>` tag.
	 *
	 * aT this point, the tag is always a rectangle.
	 *
	 * @method parseObject
	 * @param {XMLNode} object
	 */
	TMXParser.prototype.parseObject = function(object) {
		var type = object.getAttribute('type');
		switch (type) {
		case 'collision':
			var AABB = new CollisionBox(parseInt(object.getAttribute('x')),
										parseInt(object.getAttribute('y')),
										parseInt(object.getAttribute('width')),
										parseInt(object.getAttribute('height')));
			this.collisionList.push(AABB);
			break;
		case 'zone':
			require(['trigger/' + object.getAttribute('name') ], function(trigger) {
				var AABB = new CollisionBox(parseInt(object.getAttribute('x')),
											parseInt(object.getAttribute('y')),
											parseInt(object.getAttribute('width')),
											parseInt(object.getAttribute('height')));
				this.zoneList.push({
					zone: AABB,
					trigger: trigger,
					isInZone: false,
					properties: this.parseProperties(object)
				});
			}.bind(this));
			break;
		default:
			console.warn('TMXParser: Unknow type object: ' + type);
			break;
		}
	}

	/**
	 * Parse All `<property>` in the `<properties>` child tag.
	 * If a property is set two times or more, result will be an array with all values.
	 *
	 * @method parseProperties
	 * @param {XMLNode} node
	 * @return {Object} object containing all properties.
	 */
	TMXParser.prototype.parseProperties = function(node) {
		var obj = {};
		var list = node.getElementsByTagName('property');
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
