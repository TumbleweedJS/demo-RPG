
define([], function() {


	/**
	 * Small loading screen called before starting the game.
	 *
	 * @class BootLoadingScreen
	 * @param {Window} window reference to the main window
	 * @param {Loader} loader global ressource loader
	 * @constructor
	 */
	function BootLoadingScreen(window, loader) {

	    loader.on('start', function(_, x) {
		console.log('start', x);
			//
		});

	    loader.on('progress', function(_, percent) {
		var context = window.canvas.getContext('2d');
		var x = window.canvas.width / 2.0;
		var y = window.canvas.height / 2.0;
		var radius = window.canvas.width / 10;
		var startAngle = 0;
		var endAngle = percent*2.0/100.0 * Math.PI;
		var trigonometricWise = true;
		var loadingValue = percent+"%";
		
		//Drawing the loading arc
		context.fillStyle = '#222222';
		context.lineWidth = window.canvas.width / 40;
		context.fillRect(0, 0, window.canvas.width, window.canvas.height);
		context.strokeStyle = '#FFFFFF';
		context.beginPath();
		context.arc(x, y, radius, startAngle, endAngle, !trigonometricWise);
		//context.closePath();
		context.stroke();
		//End of drawing the loading arc
		//Drawing the loading text
		context.font = "20pt Calibri,Geneva,Arial";
		context.fillStyle = "#FFFFFF";
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillText(loadingValue, x, y);
		//End of drawing the loading text
	    });

		loader.on('error', function(_, error) {
			if (console && console.error) {
				console.error("[BootLoadingScreen] error: " + error);
			    console.log(error);
			}
		});

	    loader.once('complete', function(_,x) {
		console.log('complete', x);
			//TODO: clean all listeners functions.
		});
	}

	return BootLoadingScreen;
});
