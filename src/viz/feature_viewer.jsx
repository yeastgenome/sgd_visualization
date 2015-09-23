/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var Radium = require("radium");
var _ = require("underscore");

var AssignTracksToDomains = require("./assign_tracks_to_domains");
var DrawVariant = require("./draw_variant");
var VariantLegend = require("./variant_legend.jsx");

var FeatureViewer = React.createClass({
	propTypes: {
		featureTrackId: React.PropTypes.string,
		canScroll: React.PropTypes.bool,
		chromStart: React.PropTypes.number,
		chromEnd: React.PropTypes.number,
		domains: React.PropTypes.array, // [{ name, id, start, end, sourceName, sourceId }, ...]
		features: React.PropTypes.array, // [{ chromStart, chromEnd, strand }, ...]
		focusFeature: React.PropTypes.object, // { chromStart, chromEnd, strand }
		highlightedSegment: React.PropTypes.array, // []
		onSetScale: React.PropTypes.func,
		variantData: React.PropTypes.array, // [{ coordinates: [0, 5], referenceCoordinates: [0, 5], type: "SNP", snpType: "intron" }, ...]
		onHighlightSegment: React.PropTypes.func,
		onForceUpdate: React.PropTypes.func,
		isRelative: React.PropTypes.bool,
		drawIntrons: React.PropTypes.bool,
		downloadCaption: React.PropTypes.string,
		contigName: React.PropTypes.string,
		contigHref: React.PropTypes.string
	},

	getDefaultProps: function () {
		return {
			canScroll: true,
			drawIntrons: true,
			isRelative: false
		};
	},

	render: function () {
		var _height = this._calculateHeight();
		var scrollerNode = null// {this.props.canScroll ? <div ref="scroller" style={[style.scroller]} /> : null} // TEMP
		return (
			<div className="feature-viewer">
				{this._renderControls()}
				<div style={[style.container]}>
					<canvas ref="canvas" width={this.state.DOMWidth} height={_height} style={[style.canvas]} />
					<div ref="frame" style={[style.frame, { height: _height }]}>
						{this._renderVoronoi()}
						{scrollerNode}
					</div>
				</div>
			</div>
		);
	},

	getInitialState: function () {
		return {
			DOMWidth: 400,
			offsetLeft: 0,
			offsetTop: 0,
			computedForceData: null,
			canvasRatio: 1
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

	_calculateHeight: function () {
		if (!this.props.domains) return HEIGHT * this.state.canvasRatio;

		// TEMP
		return (HEIGHT + 200)  * this.state.canvasRatio;
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
			if (this.props.onSetScale) {
				var scale = this._getScale();
					if (this.props.isRelative) {
						var oldDomain = scale.domain();
						var chromStart = this.props.focusFeature.chromStart;
						var newDomain = [oldDomain[0] + chromStart, oldDomain[1] + chromStart];
						scale.domain(newDomain);

					}
				this.props.onSetScale(scale);
			}
			this._recalculateForceLayout();
		}
	},

	_renderControls: function () {
		var contigTextNode = this.props.contigHref ? <a href={this.props.contigHref}>{this.props.contigName}</a> : <span>{this.props.contigName}</span>;
		return (
			<div style={[style.uiContainer]}>
				<div>
					<h3>Location: {contigTextNode} {this.props.chromStart}..{this.props.chromEnd}</h3>
				</div>
				<div style={[style.btnContainer]}>
					<div style={[style.btnGroup]}>
						<VariantLegend />
					</div>
				</div>
			</div>
		);
	},

	_recalculateForceLayout: function () {
		var raw = this._getRawVariants();
		var forceFn = d3.layout.force()
			.nodes(raw)
			.size([this._getScale().range()[1], this._calculateHeight()])
			.charge(-0.5)
			.gravity(0)
			.chargeDistance(VARIANT_DIAMETER * 2)
			// .on("tick", () => {
			// 	this.setState({ computedForceData: forceFn.nodes() });
			// });
		forceFn.start();
		this.setState({ computedForceData: forceFn.nodes() });
	},

	_renderVoronoi: function () {
		if (!this.state.computedForceData) return null;

		var scale = this._getScale();
		var domainYScale = this._getDomainYScale();
		var avgCoord, x;
		var y = FEATURE_Y;
		var height = this._calculateHeight();
		var mouseOverFns = [];

		// create array of points
		var points = [];
		this.state.computedForceData.forEach( d => {
			// record a mouseOver cb
			mouseOverFns.push( () => { console.log("variant mouseover"); });
			points.push([d.x, d.y]);
		});
		// add points for domains
		if (this.props.domains) {
			var chromStart = this.props.focusFeature.chromStart;
			var startX, endX, steps, pointX, pointY;
			this.props.domains.forEach( d => {
				startX = scale(chromStart + d.start);
				endX = scale(chromStart + d.end);
				steps = Math.abs(endX - startX) / DOMAIN_VORONOI_INTERVAL;
				for (var i = steps - 1; i >= 0; i--) {
					// record a mouseOver cb
					mouseOverFns.push( () => { console.log("domain mouseover ", d.sourceId); });

					pointX = startX + i * DOMAIN_VORONOI_INTERVAL;
					pointY = domainYScale(d.sourceId) + d._track * PX_PER_DOMAIN;
					points.push([pointX, pointY]);
				};
			});
		}

		// declare d3 voronoi function and run on points to generate points for path
		var voronoiFn = d3.geom.voronoi()
			.clipExtent([[0, 0], [this.state.DOMWidth, height]]);
		var voronoiPoints = voronoiFn(points);

		var color = d3.scale.category10();
		var pathString;
		var pathNodes = voronoiPoints.map( (d, i) => {
			if (d.length === 0) return null;
			pathString = "M" + d.join("L") + "Z";
			var _onMouseOver = mouseOverFns[i];
			return <path key={"pathVn" + i} onMouseOver={_onMouseOver}  d={pathString} fill="white" fillOpacity="0" strokeWidth="1"/>;
		});

		return (
			<svg width={this.state.DOMWidth} height={height} style={{ position: "absolute", top: this.state.offsetTop, left: this.state.offsetLeft }}>
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
		var canvas = this.refs.canvas.getDOMNode();
		var ctx = canvas.getContext("2d");
		ctx.font = FONT_SIZE * this.state.canvasRatio + "px 'Lato' sans-serif";
		ctx.textAlign = "center";
		var height = this._calculateHeight();
		ctx.clearRect(0, 0, this.state.DOMWidth, height);

		this._drawHighlightedSegment(ctx);
		this._drawAxis(ctx);
		this._drawFeatures(ctx);
		this._drawVariants(ctx);
		this._drawDomains(ctx);
	},

	_drawFeatures: function (ctx) {
		ctx.fillStyle = FILL_COLOR;
		var scale = this._getScale();
		var startOffset = this.props.isRelative ? this.props.chromStart : 0;
		var startPos, endPos, startX, endX, y, isPlusStrand;
		this.props.features.forEach( d => {
			isPlusStrand = d.strand === "+";
			startPos = (isPlusStrand ? d.chromStart : d.chromEnd) - startOffset;
			endPos = (isPlusStrand ? d.chromEnd : d.chromStart) - startOffset;
			startX = scale(startPos);
			endX = scale(endPos);
			y = isPlusStrand ? FEATURE_Y : FEATURE_Y; // TEMP

			// draw exons and introns if blockStarts and blockSizes defined
			if (this.props.drawIntrons && d.blockStarts && d.blockSizes) {
				var isLast, _startX, _endX, _width, _nextRelStart, _nextStartX, _nextEndX;
				d.blockStarts.forEach( (_d, _i) => {
					isLast = (_i === d.blockStarts.length - 1);
					if (isPlusStrand) {
						_startX = Math.round(scale(_d + startPos));
						_endX = Math.round(scale(_d + d.blockSizes[_i] + startPos));
					} else {
						_startX = Math.round(scale(endPos - _d - d.blockSizes[_i]));
						_endX = Math.round(scale(endPos - _d));
					}
					
					// draw arrow shape
					if (isLast) {
						ctx.beginPath();
						if (isPlusStrand) {
							ctx.moveTo(_startX, y);
							ctx.lineTo(_endX - TRACK_HEIGHT, y);
							ctx.lineTo(_endX, y + TRACK_HEIGHT / 2);
							ctx.lineTo(_endX - TRACK_HEIGHT, y + TRACK_HEIGHT);
							ctx.lineTo(_startX, y + TRACK_HEIGHT);
						} else {
							ctx.moveTo(_startX + TRACK_HEIGHT, y);
							ctx.lineTo(_endX, y);
							ctx.lineTo(_endX, y + TRACK_HEIGHT);
							ctx.lineTo(_startX + TRACK_HEIGHT, y + TRACK_HEIGHT);
							ctx.lineTo(_startX, y + TRACK_HEIGHT / 2);
						}
						ctx.closePath();
						ctx.fill();
					} else {
						_width = Math.abs(_endX - _startX);
						ctx.fillRect(_startX, y , _width, TRACK_HEIGHT);
						// intron to next exon
						_nextRelStart = d.blockStarts[_i + 1];
						_nextStartX = isPlusStrand ? Math.round(scale(startPos + _nextRelStart)) : Math.round(scale(endPos - d.blockStarts[_i + 1] - d.blockSizes[_i + 1]));
						_nextEndX = isPlusStrand ? _endX : _startX;
						ctx.strokeStyle = TEXT_COLOR;
						ctx.beginPath();
						ctx.moveTo(_nextEndX, y + TRACK_HEIGHT / 2);
						ctx.lineTo(_nextStartX, y + TRACK_HEIGHT / 2);
						ctx.stroke();
					}
				});

			// or just draw simple "blocky" feature
			} else {
				ctx.beginPath();
				ctx.moveTo(startX, y);
				ctx.lineTo(endX - TRACK_HEIGHT, y);
				ctx.lineTo(endX, y + TRACK_HEIGHT / 2);
				ctx.lineTo(endX - TRACK_HEIGHT, y + TRACK_HEIGHT);
				ctx.lineTo(startX, y + TRACK_HEIGHT);
				ctx.closePath();
				ctx.fill();
			}
		});
	},

	_drawHighlightedSegment: function (ctx) {
		if (!this.props.highlightedSegment) return;
		var scale = this._getScale();
		var startX = scale(this.props.highlightedSegment[0]);
		var endX = scale(this.props.highlightedSegment[1]);
		var width = Math.abs(endX - startX);
		var height = this._calculateHeight();
		ctx.fillStyle = HIGHLIGHT_COLOR;
		ctx.fillRect(startX, 0 , width, height);
	},

	_drawAxis: function (ctx) {
		var scale = this._getScale();
		var ticks = scale.ticks();
		var featureZoneHeight = HEIGHT;
		var totalHeight = this._calculateHeight();
		var x;
		ctx.strokeStyle = TICK_COLOR;
		ctx.fillStyle = TEXT_COLOR;
		ctx.lineWidth = 1;
		ticks.forEach( d => {
			x = Math.round(scale(d)) + 0.5;
			// tick
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, featureZoneHeight - AXIS_HEIGHT);
			ctx.stroke();
			// tick label
			ctx.fillText(d.toString(), x, featureZoneHeight);

			// draw extended axis
			if (this.props.domains) {
				ctx.beginPath();
				ctx.moveTo(x, featureZoneHeight + 3);
				ctx.lineTo(x, totalHeight);
				ctx.stroke();
			}
		});
	},

	_drawVariants: function (ctx) {
		var computedData = this.state.computedForceData;
		// TEMP
		// if (!computedData) return;
		var originalData = this._getRawVariants();
		var colors = {
			"synonymous": SYNONYMOUS_COLOR,
			"nonsynonymous": NON_SYNONYMOUS_COLOR,
			"intron": INTRON_COLOR,
			"untranslatable": UNTRANSLATEABLE_COLOR
		};
		var originalDatum, snpType, type, color, path;

		// TEMP, just use raw, don't recalc
		// old computedData.forEach( (d, i) => {
		originalData.forEach( (d, i) => {
			snpType = (typeof d.snpType === "undefined") ? "" : d.snpType;
			originalDatum = originalData[i];
			DrawVariant(ctx, d.variant_type.toLowerCase(), snpType.toLowerCase(), d.x, d.y, originalDatum.x, originalDatum.y);
		});
		
	},

	// input for force layout, get array of "natural" positions of variant nodes
	_getRawVariants: function () {
		var scale = this._getScale();
		var positionOffset = this.props.isRelative ? 0 : this.props.focusFeature.chromStart;

		var _y = FEATURE_Y + TRACK_HEIGHT / 2; // TEMP
		var avgCoord, snpType, type, _x;
		return this.props.variantData.map( d => {
			avgCoord = positionOffset + (d.referenceCoordinates[0] + d.referenceCoordinates[1]) / 2;

			_x = Math.round(scale(avgCoord));
			snpType = d.snpType ? d.snpType.toLowerCase() : "";
			type = d.type.toLowerCase();
			return _.extend(d, {
				x: _x,
				y: _y - VARIANT_HEIGHT
			});
		});
	},

	_drawDomains: function (ctx) {
		if (!this.props.domains) return;
		var domains = this._getTrackedDomains();
		var xScale = this._getScale();
		var yScale = this._getDomainYScale();
		var colorScale = d3.scale.category10();
		var chromStart = this.props.isRelative ? 0 : this.props.focusFeature.chromStart;
		var startX, endX, y;
		ctx.fillStyle = TEXT_COLOR;
		ctx.textAlign = "left";

		domains.forEach( d => {
			startX = xScale(chromStart + d.start);
			endX = xScale(chromStart + d.end);
			y = yScale(d.sourceId) + d._track * PX_PER_DOMAIN;

			ctx.strokeStyle = colorScale(d.sourceId);
			ctx.strokeWidth = 2;
			// left tick
			ctx.beginPath();
			ctx.moveTo(startX, y - DOMAIN_NODE_HEIGHT / 2);
			ctx.lineTo(startX, y + DOMAIN_NODE_HEIGHT / 2);
			ctx.stroke();
			// line
			ctx.beginPath();
			ctx.moveTo(startX, y);
			ctx.lineTo(endX, y);
			ctx.stroke();
			// left tick
			ctx.beginPath();
			ctx.moveTo(endX, y - DOMAIN_NODE_HEIGHT / 2);
			ctx.lineTo(endX, y + DOMAIN_NODE_HEIGHT / 2);
			ctx.stroke();

			// label
			ctx.fillText(d.name, startX + 3, y - 3);
		});
	},

	_getScale: function () {
		var _domain = this.props.isRelative ?
			[0, Math.abs(this.props.chromEnd - this.props.chromStart)] :
			[this.props.chromStart, this.props.chromEnd];
		return d3.scale.linear()
			.domain(_domain)
			.range([10, (this.state.DOMWidth - 10) * this.state.canvasRatio]);
	},

	_getTrackedDomains: function () {
		if (typeof this._trackedDomains === "undefined") {
			this._trackedDomains = AssignTracksToDomains(this.props.domains);
		}
		return this._trackedDomains;
	},

	_getDomainYScale: function () {
		var startY = HEIGHT + 35;
		var domain = [];
		var range = [];
		var sourceIds = _.uniq(this.props.domains, (a, b) => {
			return a.sourceId === b.sourceId;
		}).map( d => { return d.sourceId; });
		var trackedDomains = this._getTrackedDomains();
		var sourceY = startY;
		var groupedDomains, maxTracks;
		sourceIds.forEach( d => {
			groupedDomains = _.filter(trackedDomains, _d => { return d === _d.sourceId; });
			maxTracks = d3.max(groupedDomains, _d => { return _d._track; });
			domain.push(d);
			range.push(sourceY);
			sourceY += (maxTracks + 1) * PX_PER_DOMAIN;
		});
		range.push(sourceY);

		return d3.scale.ordinal()
			.domain(domain)
			.range(range);
	},

	_onScroll: function (e) {
		return // TEMP
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
	}
});

module.exports = Radium(FeatureViewer);

var DOMAIN_VORONOI_INTERVAL = 15; // add a new voronoi point for every n px across domain
var HEIGHT = 70;
var AXIS_HEIGHT = 16;
var DOMAIN_NODE_HEIGHT = 7;
var HIGHLIGHT_COLOR = "#EBDD71";
var FONT_SIZE = 14;
var FILL_COLOR = "#09AEB2";
var MAX_Y_SCROLL = HEIGHT * 4;
var PX_PER_DOMAIN = 24;
var SCROLL_WIDTH = 10000;
var SCROLL_START = SCROLL_WIDTH / 2;
var TEXT_COLOR = "black";
var TICK_COLOR = "#b0b0b0";
var TRACK_HEIGHT = 20;
var VARIANT_HEIGHT = 17;
var VARIANT_DIAMETER = 4;
// TEMP
var FEATURE_Y = 23;

// fill colors for variants
var SYNONYMOUS_COLOR = "#7b3294" // purply
var NON_SYNONYMOUS_COLOR = "#d7191c";  // red
var INTRON_COLOR = "#2c7bb6"; // dark blue
var UNTRANSLATEABLE_COLOR = "gray";

// CSS in JS
var style = {
	container: {
		position: "relative",
		minHeight: HEIGHT
	},

	canvas: {
		position: "absolute",
		top: 0
	},

	frame: {
		position: "relative",
		overflow: "scroll"
	},

	scroller: {
		width: SCROLL_WIDTH,
		height: HEIGHT * 5
	},

	uiContainer: {
		display: "flex",
		justifyContent: "space-between"
	},

	btnContainer: {
		padding: "1rem 0 1rem 1rem",
		textAlign: "right"
	},

	btnGroup: {
		display: "inline-block",
		marginLeft: "1rem"
	}
};
