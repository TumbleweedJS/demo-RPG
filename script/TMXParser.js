define(['./TW'], function(TW) {

  function TMXParser() {
   this.rootLayer = null;
   this.xmlObject = null;
   this.tileWidth;
   this.tileHeight;
   this.numberOfTileInWidth;
   this.numberOfTileInHeight;
   this.tilesets = null;
   this.tilemodels = [];
   this.layers = null; 
   this.images = [];
   this.collisionList = [];
  }

  //Prend en entree l'objet XML qui contient le descriptif du fichier TMX.
  TMXParser.prototype.parseXML = function(xmlObject) {
	if (xmlObject.hasChildNodes()) {
		var childNodes = xmlObject.childNodes;
		var i;
		for (i = 0; i < childNodes.length; i++) {
		  if (!childNodes[i].tagName) {
		   continue;
		  }
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
	this.rootLayer = new TW.Graphic.Layer({x:0,y:0,width:(this.numberOfTileInWidth * this.tileWidth), height:(this.numberOfTileInHeight * this.tileHeight)});
	this.tilesets = mapNode.getElementsByTagName("tileset");
	this.createTileModelsFromTileSets(this.tilesets);
	this.layers = mapNode.getElementsByTagName("layer");
	this.buildLayers(this.layers);
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
  
  TMXParser.prototype.fillCollisionList = function(layer) {
   var tileList = layer.getElementsByTagName("tile");
   var length = tileList.length;
   var i;
   var x;
   var y;
   
   for (i = 0; i < length; i++) {
    x = i % this.numberOfTileInWidth;
	y = Math.floor(i / this.numberOfTileInWidth);
	if (tileList[i].getAttribute("gid") != "0") {
	 var tileModel = this.getTileModelFromGID(parseInt(tileList[i].getAttribute("gid")));
	 if (tileModel) {
	 var collisionBox = new TW.Collision.CollisionBox(x * tileModel.width,
														   y * tileModel.height,
														   tileModel.width,
														   tileModel.height);
	this.collisionList.push(collisionBox);
	 }
	}
   }
  };
  
  TMXParser.prototype.buildLayers = function(layers) {
	var i;
	var layer;
	var zIndex = 1;

	for (i = 0; i < layers.length; i++) {
		if (layers[i].getAttribute("name") != "collision") {
		 layer = new TW.Graphic.Layer({x:0, y:0, width:(this.numberOfTileInWidth * this.tileWidth), height:(this.numberOfTileInHeight * this.tileHeight),zIndex: zIndex});
		 if (layers[i].getAttribute("name") === "baseGround") {
		  zIndex++;
		  this.zIndexPlayer = zIndex;
		 }
		 zIndex++;
		 this.rootLayer.addChild(layer);
		 this.fillLayerWithTiles(layer, layers[i]);
		} else
		{
		 this.fillCollisionList(layers[i]);
		}
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
			sprite = new TW.Graphic.Sprite({x:(x*this.tileWidth),
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

  return TMXParser;
});
