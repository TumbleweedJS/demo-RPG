define(['TW/Utils/inherit', 'TW/Graphic/AnimatedSprite', 'TW/Graphic/SpriteSheet', 'TW/Collision/CollisionBox'],
	function (inherit, AnimatedSprite, SpriteSheet, CollisionBox) {
		function NPC(loader) {
			this.position = {x: 0, y: 0, w: 50, h: 50};
			this.collisionBox = new TW.Collision.CollisionBox(this.position);
		}

		NPC.prototype.move = function(direction, pixelsValue) {
			switch (direction)
			{
				case "UP":
					this.position.y -= pixelsValue;
				break;
				case "LEFT":
					this.position.x -= pixelsValue;
				break;
				case "DOWN":
					this.position.y += pixelsValue;
				break;
				case "RIGHT":
					this.position.x += pixelsValue;
				break;
			}
		};

		NPC.prototype.update = function(elapsedTime) {
			if (this.updateCalls) {
				this.updateCalls++;
				if (this.updateCalls > 30) {
					this.onHeartBeat();
					this.updateCalls = 0;
				}
			} else {
				this.updateCalls = 0;
			}
		};

		NPC.prototype.onHeartBeat = function() {
			if (this.moveState) {
				switch (this.moveState)
				{
					case "UP":
						this.move(this.moveState, 50);
						this.moveState = "LEFT";
					break;
					case "LEFT":
						this.move(this.moveState, 50);
						this.moveState = "DOWN";
					break;
					case "DOWN":
						this.move(this.moveState, 50);
						this.moveState = "RIGHT";
					break;
					case "RIGHT":
						this.move(this.moveState, 50);
						this.moveState = "UP";
					break;
				}
			} else {
				this.moveState = "UP";
			}
		};

		function draw(context) = function() {
			context.fillRect(this.position);
		};
	}
);