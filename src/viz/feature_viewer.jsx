/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var StyleSheet = require("react-style");
var _ = require("underscore");

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
		position: "relative"
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
		chromStart: React.PropTypes.number,
		chromEnd: React.PropTypes.number,
		features: React.PropTypes.array, // [{ chromStart, chromEnd, strand }, ...]
		focusFeature: React.PropTypes.object, // { chromStart, chromEnd, strand }
		highlightedSegment: React.PropTypes.array, // []
		onSetScale: React.PropTypes.func,
		variantData: React.PropTypes.array, // [{ coordinates: [0, 5], type: "Insertion" }, ...]
		onHighlightSegment: React.PropTypes.func
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
				<div ref="container" styles={[styles.frame]}>
					{scrollNode}
					{this._renderVoronoi()}
					<canvas ref="canvas" width={this.state.DOMWidth} height={HEIGHT} styles={[{ marginLeft: this.state.offsetLeft }]} />
				</div>
			</div>
		);
	},

	componentDidMount: function () {
		this._calculateWidth();
		this._drawCanvas();
		this._setupMousemoveEvents();
		if (this.props.canScroll) this._setupScroll();
	},

	componentDidUpdate: function (prevProps, prevState) {
		this._drawCanvas();
		if (prevState.DOMWidth !== this.state.DOMWidth) {
			this._setupMousemoveEvents();
			if (this.props.onSetScale) this.props.onSetScale(this._getScale());
		}
	},

	_renderVoronoi: function () {
		if (!this.props.variantData) return null;

		var scale = this._getScale();
		var avgCoord, x;
		var y  = 50; // TEMP
		var points = this.props.variantData.map( d => {
			avgCoord = this.props.focusFeature.chromStart + (d.coordinates[0] + d.coordinates[1]) / 2;
			x = Math.round(scale(avgCoord));
			return [x, y];
		});

		var voronoiFn = d3.geom.voronoi()
			.clipExtent([[0, 0], [this.state.DOMWidth, HEIGHT]]);

		var voronoiPoints = voronoiFn(points);
		var color = d3.scale.category10();
		var pathString;
		var pathNodes = voronoiPoints.map( (d, i) => {
			pathString = "M" + d.join("L") + "Z";
			var _onMouseOver = e => {
				var coord = this.props.variantData[i].coordinates;
				if (this.props.onHighlightSegment) {
					this.props.onHighlightSegment(coord[0], coord[1]);
				}
			}
			return <path key={"pathVn" + i} onMouseOver={_onMouseOver}  d={pathString} fill="white" fillOpacity="0"/>;
		});

		return (
			<svg width={this.state.DOMWidth} height={HEIGHT} style={{ position: "absolute", top: 0 }}>
				{pathNodes}
			</svg>
		);
	},

	_calculateWidth: function () {
		var _width = this.getDOMNode().getBoundingClientRect().width - 1;
		this.setState({
			DOMWidth: _width
		});
	},

	_drawCanvas: function () {
		var scale = this._getScale();
		var ticks = scale.ticks();
		var data = this.props.features;

		var canvas = this.refs.canvas.getDOMNode();
		var ctx = canvas.getContext("2d");
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

		this._drawVariants(ctx);
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

	_setupMousemoveEvents: function () {
		var scale = this._getScale();
		var coord;
		this.refs.canvas.getDOMNode().onmousemove = _.throttle( e => {
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

module.exports = FeatureViewer;
