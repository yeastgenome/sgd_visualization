/** @jsx React.DOM */
"use strict";
var React = require("react");
var Radium = require("radium");

var DrawVariant = require("./draw_variant");
var DidClickOutside = require("../mixins/did_click_outside.jsx");
var CalculateCanvasRatio = require("../mixins/calculate_canvas_ratio.jsx");

var VariantLegend = React.createClass({
	mixins: [DidClickOutside, CalculateCanvasRatio],

	getInitialState: function () {
		return {
			isActive: false,
			canvasRatio: 1
		}
	},

	render: function () {
		return (
			<div style={[style.container]}>
				<a style={[style.button]} onClick={this._toggleActive}>
					Legend <i className="fa fa-sort-desc" />
				</a>
				{this._renderPanel()}
			</div>
		);
	},

	componentDidUpdate: function (prevProps, prevState) {
		if (this.state.isActive) this._drawLegend();
		if (this.state.isActive !== prevState.isActive && this.state.isActive) this.calculateCanvasRatio();
	},

	didClickOutside: function () {
		if (this.isMounted() && this.state.isActive) this.setState({ isActive: false });
	},

	_renderPanel: function () {
		if (!this.state.isActive) return null;
		var _width = this._getWidth();
		var _height = this._getHeight();
		var canvasRatio = this.state.canvasRatio;
		return (
			<div style={[style.panel]}>
				<canvas ref="canvas"
					width={_width * canvasRatio} height={_height * canvasRatio}
					style={{ width: _width, height: _height }}
				/>
				<div>
					<p style={[style.label]}>Insertion</p>
					<p style={[style.label]}>Deletion</p>
					<p style={[style.label]}>Synonymous SNP</p>
					<p style={[style.label]}>Nonsynonymous SNP</p>
					<p style={[style.label]}>Intron SNP</p>
					<p style={[style.label]}>Untranslatable SNP</p>
				</div>
			</div>
		);
	},

	_toggleActive: function (e) {
		if (e) {
			e.preventDefault();
			e.nativeEvent.stopImmediatePropagation();
		}
		this.setState({ isActive: !this.state.isActive });
	},

	_getWidth: function () {
		return 28;
	},

	_getHeight: function () {
		return HEIGHT;
	},

	_drawLegend: function () {
		var exampleInDels = ["insertion", "deletion"];
		var exampleSnps = ["synonymous", "nonsynonymous", "intron", "untranslatable"];
		var canvasRatio = this.state.canvasRatio;
		var yDelta = (LABEL_HEIGHT + LABEL_BOTTOM + 1);
		var width = this._getWidth() * canvasRatio;
		var height = this._getHeight() * canvasRatio;
		var canvas = this.refs.canvas.getDOMNode();
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, width, height);
		var i = 0;
		var x = 16;
		var y;
		exampleInDels.forEach( d => {
			y = (i * yDelta + 8);
			DrawVariant(ctx, d, "", x, y, x, y, canvasRatio);
			i += 1;
		});
		exampleSnps.forEach( d => {
			y = (i * yDelta + 8);
			DrawVariant(ctx, "snp", d, x, y, x, y, canvasRatio);
			i += 1;
		});
	}
});

module.exports = Radium(VariantLegend);

var WIDTH = 200;
var HEIGHT = 190;
var BACKGROUND_COLOR = "#fff";
var BORDER_COLOR = "#ccc";
var LABEL_HEIGHT = 20;
var LABEL_BOTTOM = 10;

// CSS in JS
var style = {
	container: {
		position: "relative"
	},

	panel: {
		position: "absolute",
		top: 45,
		right: 0,
		width: WIDTH,
		height: HEIGHT,
		background: BACKGROUND_COLOR,
		borderRadius: 4,
		border: "1px solid #ccc",
		zIndex: 1,
		display: "flex",
		textAlign: "left",
		paddingTop: 15,
		boxSizing: "content-box"
	},

	button: {
	    display: "inline-block",
	    padding: "6px 12px",
	    marginBottom: 0,
	    fontSize: 14,
	    fontWeight: 400,
	    lineHeight: 1.42857143,
	    textAlign: "center",
	    whiteSpace: "nowrap",
	    verticalAlign: "middle",
	    touchAction: "manipulation",
	    cursor: "pointer",
	    userSelect: "none",
	    backgroundImage: "none",
	    border: "1px solid #ccc",
	    borderRadius: 4,
        color: "#333",
	    backgroundColor: "#fff",
	    textDecoration: "none",
	    ":hover": {
	    	backgroundColor: "#efefef"
	    }
	},

	label: {
		height: LABEL_HEIGHT,
		marginTop: 5,
		marginBottom: LABEL_BOTTOM + 1
	}
};
