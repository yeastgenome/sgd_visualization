/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var StyleSheet = require("react-style");
var _ = require("underscore");

var FeatureViewer = React.createClass({
	propTypes: {
		featureTrackId: React.PropTypes.string,
		canScroll: React.PropTypes.bool,
		chromStart: React.PropTypes.number,
		chromEnd: React.PropTypes.number,
		features: React.PropTypes.array, // [{ chromStart, chromEnd, strand }, ...]
		focusFeature: React.PropTypes.object, // { chromStart, chromEnd, strand }
		highlightedSegment: React.PropTypes.array, // []
		onSetScale: React.PropTypes.func,
		variantData: React.PropTypes.array, // [{ coordinates: [0, 5], type: "Insertion" }, ...]
		onHighlightSegment: React.PropTypes.func,
		onForceUpdate: React.PropTypes.func
	},

	render: function () {
		return (
			<div className="feature-viewer" styles={[styles.container]}>
				<div styles={[styles.uiContainer]}>
					<div className="btn-group">
						<a className="btn btn-default">Left</a>
						<a className="btn btn-default">Right</a>
					</div>
				</div>
				<canvas ref="canvas" width={this.state.DOMWidth} height={HEIGHT} styles={[styles.canvas]} />
				<div ref="frame" styles={[styles.frame]}>
					{this._renderVoronoi()}
					{this.props.canScroll ? <div ref="scroller" styles={[styles.scroller]} /> : null}
				</div>
			</div>
		);
	},

	getDefaultProps: function () {
		return {
			canScroll: true
		};
	},

	getInitialState: function () {
		return {
			DOMWidth: 400,
			offsetLeft: 0,
			offsetTop: 0
		};
	},

	componentDidMount: function () {
		var frame = this.refs.frame.getDOMNode();
		// scroll to half
		frame.scrollLeft = SCROLL_START;
		frame.scrollTop = MAX_Y_SCROLL;

		this._calculateWidth();
		this._drawCanvas();
		if (this.props.canScroll) frame.addEventListener("scroll", this._onScroll);

		// if (isMobile) this._setupZoomEvents();
	},

	_setupZoomEvents: function () {
		// play with d3 zoom
		var scroller = this.refs.scroller.getDOMNode();
		var scale = this._getScale();
		var zoomFn = d3.behavior.zoom()
			.y(scale)
			.on("zoom", () => {
				var dm = scale.domain();
				this.props.store.setPositionByFeatureTrack(this.props.featureTrackId, dm[0], dm[1]);
				this.props.onSetScale(scale)
			});
		d3.select(scroller).call(zoomFn);
	},

	componentDidUpdate: function (prevProps, prevState) {
		this._drawCanvas();
		if (prevState.DOMWidth !== this.state.DOMWidth) {
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
			if (d.length === 0) return null;
			pathString = "M" + d.join("L") + "Z";
			var _onMouseOver = e => {
				var coord = this.props.variantData[i].coordinates;
				if (this.props.onHighlightSegment) {
					this.props.onHighlightSegment(coord[0], coord[1]);
				}
			}
			return <path key={"pathVn" + i} onMouseOver={_onMouseOver}  d={pathString} fill="white" fillOpacity="0" strokeWidth="1"/>;
		});

		return (
			<svg width={this.state.DOMWidth} height={HEIGHT} style={{ position: "absolute", top: this.state.offsetTop, left: this.state.offsetLeft }}>
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
		var data = this.props.features;

		var canvas = this.refs.canvas.getDOMNode();
		var ctx = canvas.getContext("2d");
		ctx.font = FONT_SIZE + "px 'Lato' sans-serif";
		ctx.textAlign = "center";
		ctx.clearRect(0, 0, this.state.DOMWidth, HEIGHT);

		this._drawHighlightedSegment(ctx);
		this._drawAxis(ctx);
	
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

	_drawAxis: function (ctx) {
		var scale = this._getScale();
		var ticks = scale.ticks();
		var x;
		ctx.strokeStyle = TICK_COLOR;
		ctx.fillStyle = "black";
		ctx.lineWidth = 1;
		ticks.forEach( d => {
			x = scale(d);
			// tick
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, HEIGHT - AXIS_HEIGHT);
			ctx.stroke();
			// tick label
			ctx.fillText(d.toString(), x, HEIGHT);
		});
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

		ctx.strokeStyle = "black";
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

	_getScale: function () {
		return d3.scale.linear()
			.domain([this.props.chromStart, this.props.chromEnd])
			.range([0, this.state.DOMWidth]);
	},

	_onScroll: function (e) {
		var frame = this.refs.frame.getDOMNode();
		var left = frame.scrollLeft;
		var top = frame.scrollTop;
		var originalLeft = SCROLL_WIDTH / 2;
		var leftDelta = originalLeft - left;
		var oldScale = this._getScale();
		var bpDelta = oldScale.domain()[1] - oldScale.domain()[0];
		var originalPosition = this.props.store.getOriginalPosition(this.props.featureTrackId);
		var originalScale = d3.scale.linear().domain([originalPosition.chromStart, originalPosition.chromEnd]).range([SCROLL_START, SCROLL_START + this.state.DOMWidth]);
		var newChromStart = originalScale.invert(left);
		var newChromEnd = newChromStart + bpDelta;

		// mutate data in store
		this.props.store.setPositionByFeatureTrack(this.props.featureTrackId, newChromStart, newChromEnd);
		if (this.state.offsetTop !== top) {
			var yScale = d3.scale.linear()
				.domain([MAX_Y_SCROLL, 0])
				.range([0, 1]);
			var newZoomLevel = yScale(top);
			this.props.store.zoomByFeatureTrack(this.props.featureTrackId, newZoomLevel);
		}

		this.setState({ offsetLeft: left, offsetTop: top });
		if (typeof this.props.onForceUpdate === "function") this.props.onForceUpdate();
	},

	_downloadImage: function (e) {
		if (e) e.preventDefault();
		var canvas = this.refs.canvas.getDOMNode();
		var image = new Image();
		var a = document.createElement('a');
		a.download = "image.png";
		a.href = canvas.toDataURL("image/png");
		document.body.appendChild(a);
		a.click();
		a.remove();
	}
});

module.exports = FeatureViewer;

var HEIGHT = 100;
var AXIS_HEIGHT = 16;
var HIGHLIGHT_COLOR = "#EBDD71";
var FONT_SIZE = 14;
var FILL_COLOR = "#09AEB2";
var MAX_Y_SCROLL = HEIGHT * 4;
var SCROLL_WIDTH = 10000;
var SCROLL_START = SCROLL_WIDTH / 2;
var TICK_COLOR = "#b0b0b0";
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
	container: {
		position: "relative",
		minHeight: HEIGHT
	},

	canvas: {
		position: "absolute",
		top: 0
	},

	frame: {
		height: HEIGHT,
		position: "relative",
		overflow: "scroll"
	},

	scroller: {
		width: SCROLL_WIDTH,
		height: HEIGHT * 5
	},

	uiContainer: {
		width: 200,
		position: "absolute",
		padding: "1rem"
	}
});
