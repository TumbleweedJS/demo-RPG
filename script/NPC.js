define(['TW/Utils/inherit', 'TW/Graphic/Rect', 'TW/Graphic/AnimatedSprite', 'TW/Graphic/SpriteSheet', 'TW/Collision/CollisionBox'],
	function (inherit, Rect, AnimatedSprite, SpriteSheet, CollisionBox) {
		function NPC(obj, loader, tag, mapState) {
			AnimatedSprite.call(this, {
				width:          32,
				height:         32,
				spriteSheet:    new SpriteSheet(loader.get('image-npc'), loader.get('spritesheet-player'))
			});
			this.speak = "Bonjour, soyez le bienvenu sur cette demonstration. N'hesitez pas a explorer les lieux de fond en comble et a nous faire part de vos remarques ! (Pressez la touche 'P' pour fermer cette boite de dialogue).";
			this.mapState = mapState;
			this.position = obj;
			this.tag = tag;
			this.waypoints = [];
			this.waypointToReach = 0;
			this.collisionBox = new TW.Collision.CollisionBox(this.position);
			this.play('stand_left', true, null);
			this.currentAnimation = "STAND";
			this.intervalDialog = null;
			this.isTalking = false;
		}

		inherit(NPC, AnimatedSprite);

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
			this.setAttr({ zIndex: this.position.y });
			this.parent.rmChild(this);
			this.parent.addChild(this);
		};

		NPC.prototype.update = function(elapsedTime) {
			AnimatedSprite.prototype.update.call(this, elapsedTime);
			//Test if the current waypointToReach isn't out of bounds.
			if (this.waypoints.length >= this.waypointToReach + 1 && this.isTalking === false) {
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

		NPC.prototype.setAnimationOrientation = function(projectionX, projectionY) {
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

		NPC.prototype.onStartConversation = function(talkee) {
			this.isTalking = true;
			this.pause();
			var div_dialog = document.createElement('div');
			this.conversationDiv = div_dialog;
			div_dialog.style.background = "black";
			div_dialog.style.color = "white";
			div_dialog.style.position = "absolute";
			var canvasRect = document.getElementsByTagName("canvas")[0].getBoundingClientRect();
			div_dialog.style.left = parseInt(canvasRect.left) + 50 + "px";
			div_dialog.style.top = parseInt(canvasRect.top) + 50 + "px";
			div_dialog.style.width = "1px";
			div_dialog.style.height = "1px";
			div_dialog.style.borderRadius = "15px";
			div_dialog.innerHTML = "";
			div_dialog.style.padding = "30px";
			div_dialog.width = parseInt(canvasRect.width) - 150;
			div_dialog.height = parseInt(canvasRect.height / 10);
			this.intervalDialog = window.setInterval(this.developpDialog.bind(this), 1);
			document.body.appendChild(div_dialog); 
		};

		NPC.prototype.developpDialog = function() {
			var changed = false;
			if (parseInt(this.conversationDiv.style.width.split("p")[0]) < this.conversationDiv.width) {
				this.conversationDiv.style.width = parseInt(this.conversationDiv.style.width.split("p")[0]) + 20 + "px";
				changed = true;
				if (parseInt(this.conversationDiv.style.width.split("p")[0]) > this.conversationDiv.width) {
					this.conversationDiv.style.width = this.conversationDiv.width + "px";
				}
			}
			if (parseInt(this.conversationDiv.style.height.split("p")[0]) < this.conversationDiv.height) {
				this.conversationDiv.style.height = parseInt(this.conversationDiv.style.height.split("p")[0])+ 20 + "px";
				changed = true;
				if (parseInt(this.conversationDiv.style.height.split("p")[0]) < this.conversationDiv.height) {
					this.conversationDiv.style.height = this.conversationDiv.height + "px";
				}
			}
			if (changed === false) {
				clearInterval(this.intervalDialog);
				this.intervalDialog = window.setInterval(this.developpText.bind(this), 20);
			}
		};

		NPC.prototype.developpText = function() {
			if (this.conversationDiv.innerHTML.length < this.speak.length) {
				this.conversationDiv.innerHTML = this.speak.substring(0, this.conversationDiv.innerHTML.length + 1);
			} else {
				clearInterval(this.intervalDialog);
				this.intervalDialog = null;
			}
		};

		NPC.prototype.onEndConversation = function(talkee) {
			this.isTalking = false;
			this.resume();
			document.body.removeChild(this.conversationDiv);
			this.conversationDiv = null;
			if (this.intervalDialog) {
				clearInterval(this.intervalDialog);
			}
		};

		/*NPC.prototype.draw = function(context) {
			context.fillRect(this.position.x, this.position.y, this.position.width, this.position.height);
		};*/

	return NPC;
	}
);
