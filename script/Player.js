
define(['TW/Utils/inherit', 'TW/Graphic/AnimatedSprite', 'TW/Graphic/SpriteSheet'],
       function(inherit, AnimatedSprite, SpriteSheet) {

	function Player(loader) {
		AnimatedSprite.call(this, {
			width:          32,
			height:         32,
			spriteSheet:    new SpriteSheet(loader.get('image-player'), loader.get('spritesheet-player'))
		});

		this.play('walk_left', true, null);
	}

	inherit(Player, AnimatedSprite);

	return Player;
});
