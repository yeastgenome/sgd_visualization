/** @jsx React.DOM */
"use strict";

// calculate drawing ratio to solve blurry high DPI canvas issue
// cb passed to cb for this.setState
var CalculateCanvasRatio = {
	calculateCanvasRatio: function (cb) {
		// query device pixel ratio
		var ctx = this.refs.canvas.getContext("2d");
		var devicePixelRatio = window.devicePixelRatio || 1;
		var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio ||
			ctx.oBackingStorePixelRatio ||
			ctx.backingStorePixelRatio || 1;

	    var _canvasRatio = devicePixelRatio / backingStoreRatio;
	    this.setState({ canvasRatio: _canvasRatio }, cb);
	},
};

module.exports = CalculateCanvasRatio;
