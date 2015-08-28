/** @jsx React.DOM */
"use strict";
var React = require("react");
var StyleSheet = require("react-style");

var DrawVariant = require("./draw_variant");

var VariantLegend = React.createClass({

	getInitialState: function () {
		return {
			isActive: false
		}
	},

	render: function () {
		return (
			<div styles={[styles.container]}>
				<a className="btn btn-default">
					Legend <span className="caret" />
				</a>
				{this._renderPanel()}
			</div>
		);
	},

	componentDidMount: function () {
		this._drawLegend();
	},

	_renderPanel: function () {
		return (
			<div styles={[styles.panel]}>
				<canvas ref="canvas" width={WIDTH} height={HEIGHT} />
			</div>
		);
	},

	_drawLegend: function () {
		var inDels = ["insertion", "deletion"];
		var exampleSnps = ["synonymous", "nonsynonymous", "intron", "untranslatable"];
		var yDelta = 25;
		var canvas = this.refs.canvas.getDOMNode();
		var ctx = canvas.getContext("2d");
		exampleSnps.forEach( (d, i) => {
			DrawVariant(ctx, "snp", d, 14, i * yDelta + 14);
		});
	}
});

module.exports = VariantLegend;

var WIDTH = 150;
var HEIGHT = 300;
var BACKGROUND_COLOR = "#fff";
var BORDER_COLOR = "#ccc"

// CSS in JS
var styles = StyleSheet.create({
	container: {
		position: "relative"
	},

	panel: {
		position: "absolute",
		top: "3.5rem",
		right: 0,
		width: WIDTH,
		height: HEIGHT,
		background: BACKGROUND_COLOR,
		borderRadius: 4,
		border: "1px solid #ccc",
		zIndex: 1
	}
});


