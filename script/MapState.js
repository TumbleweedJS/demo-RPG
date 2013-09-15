/**
 * @module GameState
 */

define(['TW/Utils/inherit', 'TW/GameLogic/GameState'], function(inherit, GameState) {

	/**
	 * @class MapState
	 * @extends GameState
	 * @constructor
	 */
	function MapState() {
		GameState.call(this, {
			name:   "map"
		});
		this.startToDraw = false;
		this.opacity = 0.0;
		this.status = "fadeIN";
		/**mainCanvas
		 * @property {Map} map
		 */
		this.map = null;

		//hack for enable XXState.prototype.onXXX()
		delete this.onCreation;
		//delete this.onDelete;
	}

	inherit(MapState, GameState);

	MapState.prototype.onCreation = function() {
		if (!this.fadeInID) {
		var context = document.getElementById("mainCanvas").getContext("2d");
		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		this.fadeInID = window.setInterval(this.fadeIn.bind(this, document.getElementById("mainCanvas").getContext("2d")), (1/60)*1000);
		}
	};

	/**
	 * set and initialize a new map.
	 *
	 * @method setMap
	 * @param {Map} map
	 */
	MapState.prototype.setMap = function(map) {
		this.map = map;
	};

	MapState.prototype.fadeIn = function(context) {
		if (this.opacity >= 1.0) {
			this.status = "fadeOUT";
			window.clearInterval(this.fadeInID);
			this.fadeOutID = window.setInterval(this.fadeOut.bind(this, context, {x:80, y:80}), (1/60)*1000);
			return;
		}
		
		this.opacity+=1/60;
	};

	MapState.prototype.fadeOut = function(context, posPlayer) {
		if (this.opacity <= 0.0) {
			window.clearInterval(this.fadeOutID);
			this.startToDraw = true;
			this.status = "";
			this.opacity = 0.0;
			return;
		}
		this.opacity-=1/60;
		if (this.opacity < 0)
			this.opacity = 0;
	};

	/**
	 * Draw the start screen.
	 *
	 * @method draw
	 * @param context
	 */
	MapState.prototype.draw = function(context) {
		//if (this.startToDraw === true) {
		context.save();
		context.fillStyle = '#FF33FF';
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
		//}
		if (this.status === "fadeIN") {
			context.fillStyle = "rgb(0, 0, 0)";
			context.globalAlpha = this.opacity;
			context.fillRect(0, 0, context.canvas.width, context.canvas.height);
		} else if (this.status === "fadeOUT") {
			console.log("global alpha "+this.opacity);
			context.fillStyle = "rgb(0, 0, 0)";
			context.globalAlpha = this.opacity;
			context.fillRect(0, 0, context.canvas.width, context.canvas.height);	
		}
		context.restore();
	};

	return MapState;
});
