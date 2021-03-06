define(['TW/Utils/inherit', 'TW/Graphic/Rect', 'TW/Graphic/AnimatedSprite', 'TW/Graphic/SpriteSheet', 'TW/Collision/CollisionBox'],
	function (inherit, Rect, AnimatedSprite, SpriteSheet, CollisionBox) {
		function Enemy(obj, loader, tag, mapState) {
			AnimatedSprite.call(this, {
				width:          32,
				height:         32,
				spriteSheet:    new SpriteSheet(loader.get('image-npc'), loader.get('spritesheet-enemy'))
			});
			this.state = "IDLE";
			this.mapState = mapState;
			this.position = obj;
			this.tag = tag;
			this.waypoints = [];
			this.waypointToReach = 0;
			this.collisionBox = new TW.Collision.CollisionBox(this.position);
			this.play('stand_left', true, null);
			this.currentAnimation = "STAND";
		}

		inherit(Enemy, AnimatedSprite);

		Enemy.prototype.onStartConversation = function(talkee) {

		};

		Enemy.prototype.onEndConversation = function(talkee) {

		};

		Enemy.prototype.move = function(direction, pixelsValue) {
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
			this.setAttr({ zIndex: this.position.y });
			this.parent.rmChild(this);
			this.parent.addChild(this);
		};

		Enemy.prototype.update = function(elapsedTime) {
			AnimatedSprite.prototype.update.call(this, elapsedTime);

			//Test if the Enemy is in chase mode.
			if (this.state === "IDLE") {
				//Test if the current waypointToReach isn't out of bounds.
				this.moveToWaypoint();
					if (this.computeDistanceToPlayer() < 70) {
						this.state = "CHASE";
					}
			} else if (this.state === "CHASE") {
				this.moveToPlayer();
				if (this.computeDistanceToPlayer() > 120) {
					this.state = "IDLE";
				}
			}
		};

		Enemy.prototype.moveToWaypoint = function() {
				if (this.waypoints.length >= this.waypointToReach + 1) {
					var vector = {x : this.waypoints[this.waypointToReach].x - this.position.x, y : this.waypoints[this.waypointToReach].y - this.position.y};
					var norme = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
					vector.x = vector.x / norme;
					vector.y = vector.y / norme;
					this.position.x += vector.x;
					this.position.y += vector.y;

					this.setAttr({x: this.position.x, y: this.position.y});
					this.setAnimationOrientation(vector.x, vector.y);

					this.setAttr({ zIndex: this.position.y });
					this.parent.rmChild(this);
					this.parent.addChild(this);


					var vector2 = {x : this.waypoints[this.waypointToReach].x - this.position.x, y : this.waypoints[this.waypointToReach].y - this.position.y};
					var norme2 = Math.sqrt((vector2.x * vector2.x) + (vector2.y * vector2.y));
					if (norme2 < 10) {
						this.waypointToReach++;
						if (this.waypointToReach >= this.waypoints.length) {
							this.waypointToReach = 0;
						}
					}
				}
		};

		Enemy.prototype.moveToPlayer = function() {
					var vector = {x: this.mapState.player.x - this.position.x, y: this.mapState.player.y - this.position.y};
					var norme = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
					vector.x = vector.x / norme;
					vector.y = vector.y / norme;
					this.position.x += vector.x;
					this.position.y += vector.y;

					this.setAttr({x: this.position.x, y: this.position.y});
					this.setAnimationOrientation(vector.x, vector.y);

					this.setAttr({ zIndex: this.position.y });
					this.parent.rmChild(this);
					this.parent.addChild(this);


					var vector2 = {x : this.waypoints[this.waypointToReach].x - this.position.x, y : this.waypoints[this.waypointToReach].y - this.position.y};
					var norme2 = Math.sqrt((vector2.x * vector2.x) + (vector2.y * vector2.y));
					if (norme2 < 10) {
						this.waypointToReach++;
						if (this.waypointToReach >= this.waypoints.length) {
							this.waypointToReach = 0;
						}
					}	
		};

		Enemy.prototype.computeDistanceToPlayer = function() {
			var vector = {x: this.mapState.player.x - this.position.x, y: this.mapState.player.y - this.position.y};

			return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
		};

		Enemy.prototype.setAnimationOrientation = function(projectionX, projectionY) {
			if (Math.abs(projectionX) >= Math.abs(projectionY)) {
				//Si le vecteur est plus proche de l'axe des abscisses que de l'axe des ordonnees.
				if (projectionX >= 0) {
					//On affiche l'animation vers la droite
					if (this.currentAnimation != "RUN_RIGHT") {
						this.play("run_right", true, null);
						this.currentAnimation = "RUN_RIGHT";
					}
				} else {
					//On affiche l'animation vers la gauche
					if (this.currentAnimation != "RUN_LEFT") {
						this.play("run_left", true, null);
						this.currentAnimation = "RUN_LEFT";
					}
				}
			} else {
				//Si le vecteur est plus proche de l'axe des ordonnees que de l'axe des abscisses.
				if (projectionY >= 0) {
					//On affiche l'animation vers le bas
					if (this.currentAnimation != "RUN_BOTTOM") {
						this.play("run_down", true, null);
						this.currentAnimation = "RUN_BOTTOM";
					}
				} else {
					if (this.currentAnimation != "RUN_TOP") {
					this.play("run_up", true, null);
					this.currentAnimation = "RUN_TOP";
					}
					//On affiche l'animation vers le bas.
				}
			}
		};

		/*NPC.prototype.draw = function(context) {
			context.fillRect(this.position.x, this.position.y, this.position.width, this.position.height);
		};*/

	return Enemy;
	}
);