define(['TW/Graphic/SpriteSheet', 'TW/Graphic/AnimatedSprite', 'TW/Collision/CollisionBox', 'TW/Graphic/Rect'], function(SpriteSheet, AnimatedSprite, CollisionBox, Rect) {

function Player(x, y, w, h) {
	this.spriteSheet = new SpriteSheet(this.createSpriteImage(), this.createSpriteSheet());
	this.animatedSprite = new AnimatedSprite({x:x, y:y, width:w, height:h, spriteSheet: this.spriteSheet});
	this.sprint = false;
	this.currentAnimation = "stand_down";
	this.playAnimation("stand_down");
	this.collisionBox = new CollisionBox(x + 10, y + 16, 12, 16);
	//this.rect = new Rect({x: x + 10, y: y + 16, width: 12, height: 16, color: '#FF0000', mode: "FILLED", zIndex: 1000});
}

Player.prototype.startRunning = function() {
		switch (this.currentAnimation) {
			case "walk_left":
			this.animatedSprite.play("run_left", true, null);
			this.currentAnimation = "run_left";
			return;
			case "walk_up":
			this.animatedSprite.play("run_up", true, null);
			this.currentAnimation = "run_up";
			return;
			case "walk_right":
			this.animatedSprite.play("run_right", true, null);
			this.currentAnimation = "run_right";
			return;
			case "walk_down":
			this.animatedSprite.play("run_down", true, null);
			this.currentAnimation = "run_down";
			return;
		}	
};

Player.prototype.stopRunning = function() {
		switch (this.currentAnimation) {
			case "run_left":
			this.animatedSprite.play("walk_left", true, null);
			this.currentAnimation = "walk_left";
			return;
			case "run_up":
			this.animatedSprite.play("walk_up", true, null);
			this.currentAnimation = "walk_up";
			return;
			case "run_right":
			this.animatedSprite.play("walk_right", true, null);
			this.currentAnimation = "walk_right";
			return;
			case "run_down":
			this.animatedSprite.play("walk_down", true, null);
			this.currentAnimation = "walk_down";
			return;
		}
};

Player.prototype.createSpriteImage = function() {
	var image = new Image();
	image.src = "ressources/Sprites/Human/TerraSheet.png";
	return image;
};

Player.prototype.playAnimation = function(name) {
	if (this.sprint === true) {
		switch (name) {
			case "walk_left":
			this.animatedSprite.play("run_left", true, null);
			this.currentAnimation = "run_left";
			return;
			case "walk_up":
			this.animatedSprite.play("run_up", true, null);
			this.currentAnimation = "run_up";
			return;
			case "walk_right":
			this.animatedSprite.play("run_right", true, null);
			this.currentAnimation = "run_right";
			return;
			case "walk_down":
			this.animatedSprite.play("run_down", true, null);
			this.currentAnimation = "run_down";
			return;
		}
	}
	this.animatedSprite.play(name, true, null);
	this.currentAnimation = name;
};

Player.prototype.pauseAnimation = function() {
	this.animatedSprite.pause();
};

Player.prototype.createSpriteSheet = function() {
	var spriteSheet = {
	 default : {
		w : 32,
		h : 32,
		framerate : 10
	 },
	 stand_up : {
		frames : [{x:32, y:96}]
	 },
	 stand_left : {
		frames : [{x:32, y:32}]
	 },
	 stand_down : {
		frames : [{x:32, y:0}]
	 },
	 stand_right : {
		frames : [{x:32, y:64}]
	 },	 
	 walk_up : {
		frames : [{x:0, y:96}, {x:32, y:96}, {x:64, y:96}]
	 },
	 run_up : {
		framerate : 30,
		frames : [{x:0, y:96}, {x:32, y:96}, {x:64, y:96}]
	 },
	 walk_left : {
		frames : [{x:0, y:32}, {x:32, y:32}, {x:64, y:32}]
	 },
	 run_left : {
		framerate : 30,
		frames : [{x:0, y:32}, {x:32, y:32}, {x:64, y:32}]
	 },
	 walk_down : {
		frames : [{x:0, y:0}, {x:32, y:0}, {x:64, y:0}]
	 },
	 run_down : {
		framerate : 30,
		frames : [{x:0, y:0}, {x:32, y:0}, {x:64, y:0}]
	 },
	 walk_right : {
		frames : [{x:0, y:64}, {x:32, y:64}, {x:64, y:64}]
	 },
	 run_right : {
		framerate : 30,
		frames : [{x:0, y:64}, {x:32, y:64}, {x:64, y:64}]
	 }
	};
	return spriteSheet;
};

	Player.prototype.moveUp = function(speed) {
		this.animatedSprite.setAttr({ y: this.animatedSprite.y - speed });
		this.collisionBox.y -= speed;
		//this.rect.setAttr({y: this.collisionBox.y } );
	};

	Player.prototype.moveLeft = function(speed) {
		this.animatedSprite.setAttr({ x: this.animatedSprite.x - speed });
		this.collisionBox.x -= speed;
		//this.rect.setAttr({x: this.collisionBox.x } );
	};

	Player.prototype.moveDown = function(speed) {
		this.animatedSprite.setAttr({ y: this.animatedSprite.y + speed });
		this.collisionBox.y += speed;
		//this.rect.setAttr({y: this.collisionBox.y } );
	};

	Player.prototype.moveRight = function(speed) {
		this.animatedSprite.setAttr({ x: this.animatedSprite.x + speed });
		this.collisionBox.x += speed;
		//this.rect.setAttr({x: this.collisionBox.x } );
	};

	Player.prototype.move = function(x, y) {
		this.collisionBox.x += x - this.animatedSprite.x;
		this.collisionBox.y += y - this.animatedSprite.y;
		this.animatedSprite.setAttr({ x: x, y: y });
	};

return Player;

});
