define([], function() {
	return {
		onEnter: function(state, properties) {
			state.player.setCoord(parseInt(properties.x), parseInt(properties.y));
		}
	};
});
