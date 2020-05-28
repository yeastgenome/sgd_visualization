"use strict";
import d3 from 'd3';
import React,{Component} from 'react';
import Radium from 'radium';
import _ from 'underscore';
import PropTypes from 'prop-types';

import AssignTracksToDomains from  './assign_tracks_to_domains';
import CalculateCanvasRatio from '../mixins/calculate_canvas_ratio';
import DrawVariant from './draw_variant';
import FlexibleTooltip from './flexible_tooltip';
import VariantLegend from './variant_legend';
import appStyle from './style'; 

class FeatureViewer extends Component{
	constructor(props){
		super(props);
		this.state = {DOMWidth: 400,
			offsetLeft: 0,
			offsetTop: 0,
			computedForceData: null,
			trackedDomains: null,
			canvasRatio: 1,
			toolTipVisible: false,
			toolTipTop: 0,
			toolTipLeft: 0,
			toolTipText: "",
			toolTipHref: null}

			this._clearToolTip = this._clearToolTip.bind(this);
			this._download = this._download.bind(this);
			this._clearMouseOverTimeout = this._clearMouseOverTimeout.bind(this);
	}
	
	render(){
		var _width = this.state.DOMWidth;
		var _height = this._calculateHeight();
		var canvasRatio = this.state.canvasRatio;
		var containerHeight = _height / canvasRatio;
		var scrollerNode = null// {this.props.canScroll ? <div ref="scroller" style={[style.scroller]} /> : null} // TEMP
		return (
			<div ref={(wrapper)=>this.wrapper=wrapper} className="feature-viewer">
				{this._renderControls()}
				<div onMouseLeave={this._clearToolTip} style={[style.container]}>
					{this._renderTooltip()}
					<canvas ref={(canvas)=>this.canvas=canvas} width={_width * canvasRatio} height={_height} style={[style.canvas, { width: _width, height: _height / canvasRatio }]} />
					<div ref={(frame)=>this.frame =frame} style={[style.frame, { height: containerHeight }]}>
						{this._renderVoronoi()}
						{scrollerNode}
					</div>
				</div>
			</div>
		);
	}

	componentDidMount(){
		var frame = this.frame;
		// scroll to half
		frame.scrollLeft = SCROLL_START;
		frame.scrollTop = MAX_Y_SCROLL;

		this.setState({canvasRatio:this.props.calculateCanvasRatio(this)});
		this._calculateWidth();
		this._drawCanvas();
		if (this.props.canScroll) frame.addEventListener("scroll", this._onScroll);
		if (this.props.domains) this._updateTrackedDomains();
		// mobile stuff
		// if (isMobile) this._setupZoomEvents();
	}

	_renderTooltip(){
		var toolTipProps = {
			visible: this.state.toolTipVisible,
			top: this.state.toolTipTop,
			left: this.state.toolTipLeft,
			text: this.state.toolTipText,
			href: this.state.toolTipHref
		};
		return <FlexibleTooltip onMouseEnter={this._clearMouseOverTimeout} {...toolTipProps} />;
	}

	_calculateHeight(){
		if (!this.state.trackedDomains) return (HEIGHT + FONT_SIZE * 2) * this.state.canvasRatio;
		var yScaleRange = this._getDomainYScale().range();
		var domainHeight = yScaleRange[1] - yScaleRange[0] + (HEIGHT + FONT_SIZE * 3 + 35) * this.state.canvasRatio;
		return domainHeight;
	}

	_setupZoomEvents(){
		// play with d3 zoom
		var scroller = this.scroller;
		var scale = this._getScale();
		var zoomFn = d3.behavior.zoom()
			.y(scale)
			.on("zoom", () => {
				var dm = scale.domain();
				this.props.store.setPositionByFeatureTrack(this.props.featureTrackId, dm[0], dm[1]);
				this.props.onSetScale(scale);
			});
		d3.select(scroller).call(zoomFn);
	}

	componentDidUpdate(prevProps, prevState) {
		this._drawCanvas();
		var isNewDomain = (prevProps.forceLength !== this.props.forceLength) ||
			(prevProps.chromStart !== this.props.chromStart) ||
			(prevProps.chromEnd !== this.props.chromEnd)
			|| prevProps.isProteinMode !== this.props.isProteinMode;
		if (prevState.DOMWidth !== this.state.DOMWidth || isNewDomain) {
			if (this.props.onSetScale) {
				var scale = this._getScale();
					if (this.props.isRelative) {
						var oldDomain = scale.domain();
						var chromStart = this.props.focusFeature.chromStart;
						var newDomain = [oldDomain[0] + chromStart, oldDomain[1] + chromStart];
						scale.domain(newDomain);

					}
				var adjustedScale = this._getAdjustedScale();
				this.props.onSetScale(adjustedScale);
			}
			this._recalculateForceLayout();
		}
		// maybe update tracked domains
		if (prevProps.domains !== this.props.domains) {
			this._updateTrackedDomains();
			this._clearToolTip();
		}
	}

	_renderControls(){
		var contigTextNode = this.props.contigHref ? <a href={this.props.contigHref}>{this.props.contigName}</a> : <span>{this.props.contigName}</span>;
		return (
			<div style={[style.uiContainer]}>
				<div>
					<h3>Location: {contigTextNode} {this.props.chromStart}..{this.props.chromEnd}</h3>
				</div>
				<div style={[style.btnContainer]}>
					<div style={[style.btnGroup]}>
						<VariantLegend />
						<a onClick={this._download} style={[appStyle.button, style.button]}>Download <i className="fa fa-download" /></a>
					</div>
				</div>
			</div>
		);
	}

	_recalculateForceLayout(){
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
	}

	_renderVoronoi(){
		if (!this.state.computedForceData) return null;
		var scale = this._getScale();
		var avgCoord, x;
		var y = FEATURE_Y;	
		var mouseOverFns = [];
		var canvasRatio = this.state.canvasRatio;
		var height = this._calculateHeight() / canvasRatio;

		// create array of points
		var points = [];
		this.state.computedForceData.forEach( d => {
			// record a mouseOver cb
			if (typeof this.props.onHighlightSegment === "function") {
			    mouseOverFns.push( () => {
				        var refCoord = this.props.model.getReferenceCoordinatesFromAlignedCoordinates(d.start, d.end, this.props.isProteinMode);
					var locationStr;
					// SNP
				        var chromStart = this.props.focusFeature.chromStart;
				        if (this.props.isProteinMode) {
					    if (Math.abs(refCoord.end - refCoord.start) === 1) {
                                                locationStr = chromStart + d.dna_start - 1;
                                            } else {
                                                locationStr = `${chromStart + d.dna_start - 1}..${chromStart + d.dna_end - 1}`
                                            }
					}
				        else if (this.props.isUpstreamMode || this.props.isDownstreamMode) {
				            console.log("chromStart="+chromStart + ", d.start="+d.start + ", d.end="+d.end)
				            if (Math.abs(refCoord.end - refCoord.start) === 1) {
                                                locationStr = chromStart + d.start - 1;
                                            } else {
                                                locationStr = `${chromStart + d.start - 1}..${chromStart + d.end - 1}`
                                            }
				    
				        }
				        else {
					    if (Math.abs(refCoord.end - refCoord.start) === 1) {
						locationStr = chromStart + refCoord.start - 1;
					    } else {
						locationStr = `${chromStart +refCoord.start - 1}..${chromStart +refCoord.end - 1}`
				            }
					}
					var contigName = this.props.contigName || "";
					var fullLocationStr = `${contigName} ${locationStr}`;
					var _toolTipText = `${d.variant_type} at ${fullLocationStr}`
					this.props.onHighlightSegment(d.start - 1, d.end - 1);
					this.setState({
						toolTipVisible: true,
						toolTipTop: d.y / canvasRatio,
						toolTipLeft: d.x / canvasRatio,
						toolTipText: _toolTipText,
						toolTipHref: null
					});
				});
			}
			points.push([d.x / canvasRatio, d.y / canvasRatio]);
		});
		// add points for domains
		if (this.state.trackedDomains) {
			var domainYScale = this._getDomainYScale();
			var chromStart = this.props.isRelative ? 0 : this.props.focusFeature.chromStart;
			var startX, endX, steps;
			this.state.trackedDomains.forEach( d => {
				startX = scale(chromStart + d.start);
				endX = scale(chromStart + d.end);
				steps = Math.abs(endX - startX) / DOMAIN_VORONOI_INTERVAL;
				for (var i = steps - 1; i >= 0; i--) {
					var pointX = (startX + i * DOMAIN_VORONOI_INTERVAL) / canvasRatio;
					var pointY = domainYScale(d._track);
					// record a mouseOver cb
					mouseOverFns.push( () => {
						this.setState({
							toolTipVisible: true,
							toolTipTop: pointY / canvasRatio,
							toolTipLeft: pointX,
							toolTipText: d.name,
							toolTipHref: d.href
						});
					});
					points.push([pointX, pointY / canvasRatio]);
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
			var _onMouseOver = () => {
				this._onMouseOver(mouseOverFns[i]);
			};
			return <path key={"pathVn" + i} onMouseOver={_onMouseOver}  d={pathString} fill="white" stroke="none" fillOpacity="0" strokeWidth="1"/>;
		});

		return (
			<svg width={this.state.DOMWidth} height={height} style={{ position: "absolute", top: this.state.offsetTop, left: this.state.offsetLeft }}>
				{pathNodes}
			</svg>
		);
	}

	_calculateWidth(){
		var _width = this.wrapper.getBoundingClientRect().width - 1;
		this.setState({
			DOMWidth: _width
		});
	}

	_drawCanvas(){
		var canvas = this.canvas;
		var ctx = canvas.getContext("2d");
		ctx.font = FONT_SIZE * this.state.canvasRatio + "px 'Lato' sans-serif";
		ctx.textAlign = "center";
		var height = this._calculateHeight();
		ctx.clearRect(0, 0, this.state.DOMWidth * this.state.canvasRatio, height);

		this._drawHighlightedSegment(ctx);
		this._drawAxis(ctx);
		this._drawFeatures(ctx);
		this._drawVariants(ctx);
		this._drawDomains(ctx);
	}

	_drawFeatures(ctx) {
		ctx.fillStyle = FILL_COLOR;
		var scale = this._getScale();
		var startOffset = this.props.isRelative ? this.props.chromStart : 0;
		var canvasRatio = this.state.canvasRatio;
		var startPos, endPos, startX, endX, arrowX, y, topY, midY, bottomY, isPlusStrand;
		this.props.features.forEach( d => {
			isPlusStrand = d.strand === "+";
			startPos = (isPlusStrand ? d.chromStart : d.chromEnd) - startOffset;
			endPos = (isPlusStrand ? d.chromEnd : d.chromStart) - startOffset;
			if (this.props.forceLength) endPos = this.props.forceLength;
			startX = scale(startPos);
			endX = scale(endPos);
			arrowX = endX - TRACK_HEIGHT * canvasRatio;
			y = isPlusStrand ? FEATURE_Y : FEATURE_Y; // TEMP
			topY = y * canvasRatio;
			midY = (y + TRACK_HEIGHT / 2) * canvasRatio;
			bottomY = (y + TRACK_HEIGHT) * canvasRatio;

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
					
					if (isLast) {
						ctx.beginPath();
						if (isPlusStrand) {
							ctx.moveTo(_startX, topY);
							ctx.lineTo(arrowX, topY);
							ctx.lineTo(_endX, midY);
							ctx.lineTo(arrowX, bottomY);
							ctx.lineTo(_startX, bottomY);
						} else {
							ctx.moveTo(_startX + TRACK_HEIGHT, topY);
							ctx.lineTo(_endX, topY);
							ctx.lineTo(_endX, bottomY);
							ctx.lineTo(_startX + TRACK_HEIGHT, bottomY);
							ctx.lineTo(_startX, midY);
						}
						ctx.closePath();
						ctx.fill();
					} else {
						_width = Math.abs(_endX - _startX);
						ctx.fillRect(_startX, topY, _width, bottomY - topY);
						// intron to next exon
						_nextRelStart = d.blockStarts[_i + 1];
						_nextStartX = isPlusStrand ? Math.round(scale(startPos + _nextRelStart)) : Math.round(scale(endPos - d.blockStarts[_i + 1] - d.blockSizes[_i + 1]));
						_nextEndX = isPlusStrand ? _endX : _startX;
						ctx.strokeStyle = TEXT_COLOR;

						ctx.beginPath();
						ctx.moveTo(_nextEndX, midY);
						ctx.lineTo(_nextStartX, midY);
						ctx.lineWidth = 1 * canvasRatio;
						ctx.stroke();
					}
				});

			// or just draw simple "blocky" feature
			} else {
				ctx.beginPath();
				ctx.moveTo(startX, topY);
				ctx.lineTo(arrowX, topY);
				ctx.lineTo(endX, midY);
				ctx.lineTo(arrowX, bottomY);
				ctx.lineTo(startX, bottomY);
				ctx.closePath();
				ctx.fill();
			}
		});
	}

	_drawHighlightedSegment(ctx) {
		if (!this.props.highlightedSegment) return;
		var scale = this._getScale();
		var start = this.props.highlightedSegment[0];
		if (start !== 0) start += 1;
		var end = this.props.highlightedSegment[1] + 1;
		var startX = scale(start);
		var endX = scale(end);
		var width = Math.abs(endX - startX);
		var height = this._calculateHeight();
		ctx.fillStyle = HIGHLIGHT_COLOR;
		ctx.fillRect(startX, 0 , width, height);
	}

	_drawAxis(ctx) {
		var scale = this._getScale();
		var ticks = scale.ticks();
		var canvasRatio = this.state.canvasRatio;
		var featureZoneHeight = HEIGHT * canvasRatio;
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
			ctx.lineTo(x, featureZoneHeight - AXIS_HEIGHT * canvasRatio);
			ctx.stroke();
			// tick label
			ctx.fillText(d.toString(), x, featureZoneHeight);

			// draw extended axis
			if (this.props.domains) {
				ctx.beginPath();
				ctx.moveTo(x, featureZoneHeight + 3 * canvasRatio);
				ctx.lineTo(x, totalHeight);
				ctx.stroke();
			}
		});
	}

	_drawVariants(ctx) {
		var computedData = this.state.computedForceData;
		var canvasRatio = this.state.canvasRatio;
		// TEMP
		// if (!computedData) return;
		var originalData = this._getRawVariants();
		var originalDatum, snpType, type, path;

		// TEMP, just use raw, don't recalc
		// old computedData.forEach( (d, i) => {
		var x, y, stemX, stemY;
		originalData.forEach( (d, i) => {
			snpType = (typeof d.snpType === "undefined") ? "" : d.snpType;
			originalDatum = originalData[i];
			x = d.x / canvasRatio;
			y = d.y / canvasRatio;
			stemX = originalDatum.x / canvasRatio;
			stemY = originalDatum.y / canvasRatio;
			DrawVariant(ctx, d.variant_type.toLowerCase(), snpType.toLowerCase(), x, y, stemX, stemY, canvasRatio);
		});
		
	}

	// input for force layout, get array of "natural" positions of variant nodes
	_getRawVariants(){
		var scale = this._getScale();
		var positionOffset = this.props.isRelative ? 0 : this.props.focusFeature.chromStart;
		var _y = (FEATURE_Y + TRACK_HEIGHT / 2  - VARIANT_HEIGHT) * this.state.canvasRatio;
		var avgCoord, snpType, type, _x;
		return this.props.variantData.map( d => {
			avgCoord = positionOffset + (d.referenceCoordinates[0] + d.referenceCoordinates[1]) / 2;
			_x = Math.round(scale(avgCoord));
			snpType = d.snpType ? d.snpType.toLowerCase() : "";
			type = d.type.toLowerCase();
			return _.extend(d, {
				x: _x,
				y: _y
			});
		});
	}

	_drawDomains(ctx) {
		var domains = this.state.trackedDomains;
		if (!domains) return;
		var xScale = this._getScale();
		var yScale = this._getDomainYScale();
		var colorScale = d3.scale.category10();
		var chromStart = this.props.isRelative ? 0 : this.props.focusFeature.chromStart;
		var canvasRatio = this.state.canvasRatio;
		ctx.fillStyle = TEXT_COLOR;
		ctx.textAlign = "left";
		ctx.lineWidth = 1 * canvasRatio;
		var fontSize = FONT_SIZE * canvasRatio;

		// label
		ctx.fillText("Protein Domains", fontSize, yScale.range()[0] - fontSize * 2);

		var startX, endX, textX, y, topY, bottomY, textY, width;
		var tickDelta = DOMAIN_NODE_HEIGHT / 2 * canvasRatio;
		domains.forEach( d => {
			startX = xScale(chromStart + d.start);
			endX = xScale(chromStart + d.end);
			y = yScale(d._track);

			topY = y - tickDelta;
			bottomY = y + tickDelta;
			textX = startX + 3 * canvasRatio;
			textY = y - 3 * canvasRatio;
			width = endX - startX;
			ctx.strokeStyle = colorScale(d.sourceId);
			ctx.lineWidth = 2 * this.state.canvasRatio;
			// line
			ctx.beginPath();
			ctx.moveTo(startX, y);
			ctx.lineTo(endX, y);
			ctx.stroke();
			// ticks
			ctx.lineWidth = 2 * this.state.canvasRatio;
			// left tick
			ctx.beginPath();
			ctx.moveTo(startX, topY);
			ctx.lineTo(startX, bottomY);
			ctx.stroke();
			
			// left tick
			ctx.beginPath();
			ctx.moveTo(endX, topY);
			ctx.lineTo(endX, bottomY);
			ctx.stroke();

			// label if there's size
			if (ctx.measureText(d.name).width < width) ctx.fillText(d.name, textX, textY);;
		});
	}

	_getScale(){
		var chromLength = Math.abs(this.props.chromEnd - this.props.chromStart);
		var length = (typeof this.props.forceLength === "undefined") ? chromLength : this.props.forceLength;
		var _domain = this.props.isRelative ?
			[0, length] :
			[this.props.chromStart, this.props.chromStart + length];
		return d3.scale.linear()
			.domain(_domain)
			.range([10, (this.state.DOMWidth - 10) * this.state.canvasRatio]);
	}

	// undo effect of canvas ratio on scales for
	_getAdjustedScale(){
		var oldScale = this._getScale();
		var newRange = oldScale.range()
			.map( d => {
				return d / this.state.canvasRatio;
			});
		oldScale.range(newRange);
		return oldScale;
	}

	_updateTrackedDomains(){
		var _trackedDomains = AssignTracksToDomains(this.props.domains);
		if (!this.props.domains) _trackedDomains = null;
		this.setState({ trackedDomains: _trackedDomains });
	}

	_getDomainYScale(){
		var trackedDomains = this.state.trackedDomains;
		var trackAttr = "_track";
		var allTracks = trackedDomains.map( d => { return d[trackAttr]; });
		var uniqTracks = _.uniq(allTracks);
		var startTrack = d3.min(uniqTracks);
		var topTrack = d3.max(uniqTracks);
		var numTracks = topTrack - startTrack;
		var startY = (HEIGHT + FONT_SIZE + 35);
		var stopY = (numTracks * DOMAIN_NODE_HEIGHT * 3 + startY);
		
		return d3.scale.linear()
			.domain([startTrack, topTrack])
			.range([startY * this.state.canvasRatio, stopY * this.state.canvasRatio]);
	}

	_onScroll(e) {
		return // TEMP
		var frame = this.refs.frame;
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

	_clearToolTip(){
		this.setState({ toolTipVisible: false });
	}

	// convert canvas to png, download to user's browser downloads
	_download(){
		var canvas = this.canvas;
		if (this.props.downloadCaption) {
			var ctx = canvas.getContext("2d");
			var fontSize = FONT_SIZE * this.state.canvasRatio;
			var x = fontSize / 2;
			var y = this._calculateHeight() - fontSize / 2;
			ctx.fillStyle = TEXT_COLOR;
			ctx.textAlign = "left";
			ctx.fillText(this.props.downloadCaption, x, y);
		}
	    var img = canvas.toDataURL("image/png")
	   	img = img.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
	    window.location.href = img;
	    this._drawCanvas();
	}

	_onMouseOver(cb) {
		this._clearMouseOverTimeout();
		this._mouseOverTimeout = setTimeout( () => {
			cb();
		}, TOOLTIP_DELAY);
	}

	_clearMouseOverTimeout(){
		if (this._mouseOverTimeout) clearTimeout(this._mouseOverTimeout);
	}
}

FeatureViewer.propTypes = {
	featureTrackId: PropTypes.string,
	canScroll: PropTypes.bool,
	chromStart: PropTypes.number,
	chromEnd: PropTypes.number,
	domains: PropTypes.array, // [{ name, id, start, end, sourceName, sourceId }, ...]
	features: PropTypes.array, // [{ chromStart, chromEnd, strand }, ...]
	focusFeature: PropTypes.object, // { chromStart, chromEnd, strand }
	highlightedSegment: PropTypes.array, // []
	onSetScale: PropTypes.func,
	variantData: PropTypes.array, // [{ coordinates: [0, 5], referenceCoordinates: [0, 5], type: "SNP", snpType: "intron" }, ...]
	onHighlightSegment: PropTypes.func,
	onForceUpdate: PropTypes.func,
	isRelative: PropTypes.bool,
	drawIntrons: PropTypes.bool,
	downloadCaption: PropTypes.string,
	contigName: PropTypes.string,
	contigHref: PropTypes.string,
	forceLength: PropTypes.number,
        isProteinMode: PropTypes.bool,
        isUpstreamMode: PropTypes.bool,
        isDownstreamMode: PropTypes.bool
}

FeatureViewer.defaultProps = {
	canScroll: true,
	drawIntrons: true,
	isRelative: false,
	isProteinMode: false
}

export default CalculateCanvasRatio(Radium(FeatureViewer));

var DOMAIN_VORONOI_INTERVAL = 30; // add a new voronoi point for every n px across domain
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

var TOOLTIP_DELAY = 200;

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

	button: {
		marginRight: "0.5rem"
	},

	btnContainer: {
		padding: "1rem 0 1rem 1rem",
		textAlign: "right"
	},

	btnGroup: {
		marginLeft: "1rem",
		display: "flex",
		flexDirection: "row-reverse"
	}
};
