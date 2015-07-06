/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var StyleSheet = require("react-style");
var _ = require("underscore");
var HTML5Backend = require("react-dnd/modules/backends/HTML5");
var DragDropContext = require("react-dnd").DragDropContext;

var DraggableItem = require("./draggable_item.jsx");

var HEIGHT = 150;
var HIGHLIGHT_COLOR = "#DEC113";
var FILL_COLOR = "#356CA7";
var TRACK_HEIGHT = 20;
var VARIANT_HEIGHT = 20;
var VARIANT_DIAMETER = 7;

// fill colors for variants
var SYNONYMOUS_COLOR = "#4D9221";  // dark yellow-green
var NON_SYNONYMOUS_COLOR = "#C51B7D"; // dark pink
var INTRON_COLOR = "#E6F5D0"; // pale yellow-green
var UNTRANSLATEABLE_COLOR = "gray";

// CSS in JS
var styles = StyleSheet.create({
	frame: {
		border: "1px solid #efefef",
		height: HEIGHT,
		position: "relative",
		overflow: "scroll",
		display: "inline-block"
	},

	scroller: {
		position: "absolute",
		width: 100000,
		height: HEIGHT
	}
});

var FeatureViewer = React.createClass({
	propTypes: {
		canScroll: React.PropTypes.bool,
		chromStart: React.PropTypes.number.isRequired,
		chromEnd: React.PropTypes.number.isRequired,
		features: React.PropTypes.array.isRequired, // [{ chromStart, chromEnd, strand }, ...]
		focusFeature: React.PropTypes.object, // { chromStart, chromEnd, strand }
		highlightedSegment: React.PropTypes.array, // []
		interactionData: React.PropTypes.array.isRequired,
		onSetScale: React.PropTypes.func,
		variantData: React.PropTypes.array // [{ coordinates: [0, 5], type: "Insertion" }, ...]
	},

	getDefaultProps: function () {
		return {
			canScroll: true
		};
	},

	getInitialState: function () {
		return {
			DOMWidth: 400,
			offsetLeft: 0
		};
	},

	render: function () {
		var scrollNode = this.props.canScroll ? <div ref="scroller" styles={[styles.scroller]} /> : null;
		return (
			<div className="feature-viewer">
				<div>
					<DraggableItem text="Example File 1"/>
					<DraggableItem text="Example File 2"/>
					<DraggableItem text="Example File 3"/>
				</div>
				<div ref="container" styles={[styles.frame, { width: this.state.DOMWidth / 2 - 2 }]}>
					{scrollNode}
					<canvas ref="canvas1" width={this.state.DOMWidth / 2} height={HEIGHT} styles={[{ marginLeft: this.state.offsetLeft }]} />
				</div>
				<div ref="container2" styles={[styles.frame, { width: this.state.DOMWidth / 2 - 2 }]}>
					{scrollNode}
					<canvas ref="canvas2" width={this.state.DOMWidth / 2} height={HEIGHT} styles={[{ marginLeft: this.state.offsetLeft }]} />
				</div>
			</div>
		);
	},

	componentDidMount: function () {
		this._calculateWidth();
		this._drawAllCanvases();
		this._setupMousemoveEvents();
		if (this.props.canScroll) this._setupScroll();
	},

	componentDidUpdate: function (prevProps, prevState) {
		this._drawAllCanvases();
		if (prevState.DOMWidth !== this.state.DOMWidth) {
			this._setupMousemoveEvents();
			if (this.props.onSetScale) this.props.onSetScale(this._getScale());
		}
	},

	_calculateWidth: function () {
		var _width = this.getDOMNode().getBoundingClientRect().width - 1;
		this.setState({
			DOMWidth: _width
		});
	},

	_drawAllCanvases: function () {
		var canvas1 = this.refs.canvas1.getDOMNode();
		var ctx1 = canvas1.getContext("2d");
		this._drawCanvas(ctx1);
		var canvas2 = this.refs.canvas2.getDOMNode();
		var ctx2 = canvas2.getContext("2d");
		this._drawCanvas(ctx2);
	},

	_drawCanvas: function (ctx) {
		var scale = this._getScale();
		var ticks = scale.ticks();
		var data = this.props.features;


		ctx.font = "14px Helvetica";
		ctx.clearRect(0, 0, this.state.DOMWidth, HEIGHT);

		// draw axis
		var x;
		ctx.fillStyle = "black";
		ctx.lineWidth = 1;
		ticks.forEach( d => {
			x = scale(d);
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, HEIGHT);
			ctx.stroke();

			// tick label
			ctx.fillText(d.toString(), x, 16);
		});

		// highlight
		this._drawHighlightedSegment(ctx);

		// draw features
		ctx.fillStyle = FILL_COLOR;
		var startPos, endPos, startX, endX, y;
		var _startPos, _endPos, _startX, _width;
		data.forEach( d => {
			startPos = d.strand === "+" ? d.chromStart : d.chromEnd;
			endPos = d.strand === "+" ? d.chromEnd : d.chromStart;
			startX = scale(startPos);
			endX = scale(endPos);
			y = d.strand === "+" ? 50 : 100;

			ctx.beginPath();
			ctx.moveTo(startX, y);
			ctx.lineTo(endX - TRACK_HEIGHT, y);
			ctx.lineTo(endX, y + TRACK_HEIGHT / 2);
			ctx.lineTo(endX - TRACK_HEIGHT, y + TRACK_HEIGHT);
			ctx.lineTo(startX, y + TRACK_HEIGHT);
			ctx.closePath();
			ctx.fill();
		});

		if (this.props.variantData) this._drawVariants(ctx);

		if (this.props.interactionData) this._drawInteractions(ctx);
	},

	_drawHighlightedSegment: function (ctx) {
		if (!this.props.highlightedSegment) return;
		var scale = this._getScale();
		var startX = scale(this.props.highlightedSegment[0]);
		var endX = scale(this.props.highlightedSegment[1]);
		var width = Math.abs(endX - startX);
		ctx.fillStyle = HIGHLIGHT_COLOR;
		ctx.fillRect(startX, 0 , width, HEIGHT);
	},

	_drawVariants: function (ctx) {
		var feature = this.props.focusFeature;
		var variantData = this.props.variantData;
		var scale = this._getScale();
		var colors = {
			"synonymous": SYNONYMOUS_COLOR,
			"nonsynonymous": NON_SYNONYMOUS_COLOR,
			"intron": INTRON_COLOR,
			"untranslatable": UNTRANSLATEABLE_COLOR
		};

		var y = 50 + TRACK_HEIGHT / 2; // TEMP

		var avgCoord, snpType, type, x;
		variantData.forEach( d => {
			avgCoord = feature.chromStart + (d.coordinates[0] + d.coordinates[1]) / 2;
			x = Math.round(scale(avgCoord));
			snpType = d.snpType.toLowerCase();
			type = d.type.toLowerCase();
			ctx.lineWidth = 1;

			if (type !== "deletion") {
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(x, y - VARIANT_HEIGHT);
				ctx.stroke();
			}
			

			if (type === "snp") {
				ctx.fillStyle = colors[snpType] || "gray";
				var path = new Path2D();
				path.arc(x, y - VARIANT_HEIGHT, VARIANT_DIAMETER, 0, Math.PI * 2, true);
				ctx.fill(path);
			} else if (type === "insertion") {
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(x - VARIANT_DIAMETER / 2, y - VARIANT_HEIGHT);
				ctx.lineTo(x, y - VARIANT_HEIGHT - VARIANT_DIAMETER / 2);
				ctx.lineTo(x + VARIANT_DIAMETER / 2, y - VARIANT_HEIGHT);
				ctx.stroke();
			} else if (type === "deletion") {
				var startX = scale(feature.chromStart + d.coordinates[0]);
				var endX = scale(feature.chromStart + d.coordinates[1]);
				var avgX = Math.round((startX + endX) / 2);
				y = 45; // TEMP
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(startX, y);
				ctx.lineTo(endX, y);
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(avgX, y);
				ctx.lineTo(avgX, y - 15);
				ctx.stroke();

				var r = VARIANT_DIAMETER / 2;
				// draw 'x'
				ctx.beginPath();
				ctx.moveTo(avgX - r, y - 15 + r);
				ctx.lineTo(avgX + r, y - 15 - r);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(avgX - r, y - 15 - r);
				ctx.lineTo(avgX + r, y - 15 + r);
				ctx.stroke();
			}
		});
	},

	_drawInteractions: function (ctx) {
		// TEMP
		var interactionCoord = 1500;
		var depth = 8;
		var cScale = d3.scale.linear()
			.domain([0, 1])
			.range(["white", "#B94694"]);

		var scale = this._getScale();
		var x = scale(interactionCoord);
		ctx.save();
		ctx.translate(x, 150);

		ctx.rotate(-Math.PI / 4);
		for (var i = depth - 1; i >= 0; i--) {
			for (var _i = depth - 1; _i >= 0; _i--) {
				if (i < _i) {
					ctx.fillStyle = cScale(Math.random());
					ctx.fillRect(i * 20, _i * 20, 20, 20);
				}
			}
		}

		ctx.restore();

	},

	_setupMousemoveEvents: function () {
		var scale = this._getScale();
		var coord;
		this.refs.canvas1.getDOMNode().onmousemove = _.throttle( e => {
			coord = Math.round(scale.invert(e.clientX));
			// if onVariantMouseover, then check to see if it falls within a variant
			// TODO

		}, 100);
	},

	_getScale: function () {
		return d3.scale.linear()
			.domain([this.props.chromStart, this.props.chromEnd])
			.range([0, this.state.DOMWidth]);
	},

	_setupScroll: function () {
		// this.refs.container.getDOMNode().addEventListener("scroll", this._onScroll);
	}
});

module.exports = DragDropContext(HTML5Backend)(FeatureViewer);
