
define([], function() {
	return {
		onEnter: function(core, properties) {
			console.log("Abra, TELEPORT !", properties);
			core.player.move(parseInt(properties.x) * core.parser.tileWidth,
							 parseInt(properties.y) * core.parser.tileHeight);
		}
	};		   
});
