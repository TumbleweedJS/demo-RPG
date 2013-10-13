define(['TW/Utils/inherit', 'TW/Graphic/Rect', 'TW/Graphic/AnimatedSprite', 'TW/Graphic/SpriteSheet', 'TW/Collision/CollisionBox'],
	function (inherit, Rect, AnimatedSprite, SpriteSheet, CollisionBox) {
		function NPC(obj, tag) {
			this.position = obj;
			this.tag = tag;
			this.waypoints = [];
			this.collisionBox = new TW.Collision.CollisionBox(this.position);
			Rect.call(this, obj);
		}

		inherit(NPC, Rect);

		NPC.prototype.move = function(direction, pixelsValue) {
			switch (direction)
			{
				case "UP":
					this.setAttr({y: this.position.y -= pixelsValue});
				break;
				case "LEFT":
					this.setAttr({x: this.position.x -= pixelsValue});
				break;
				case "DOWN":
					this.setAttr({y: this.position.y += pixelsValue});
				break;
				case "RIGHT":
					this.setAttr({x: this.position.x += pixelsValue});
				break;
			}
			this.parent.onChange(this);
		};

		NPC.prototype.update = function(elapsedTime) {
			console.log('u');
			if (this.updateCalls) {
				this.updateCalls++;
				if (this.updateCalls > 30) {
					this.onHeartBeat();
					this.updateCalls = 1;
				}
			} else {
				this.updateCalls = 1;
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

		/*NPC.prototype.draw = function(context) {
			context.fillRect(this.position.x, this.position.y, this.position.width, this.position.height);
		};*/

	return NPC;
	}
);
