define([], function() {
	return {
		onEnter: function(state, properties) {

			if (properties.map !== undefined) {
				state.getGameStateStack().goToMap(properties.map, properties.spawn);
			} else {
				state.player.setCoord(parseInt(properties.x), parseInt(properties.y));
			}
		}
	};
});
