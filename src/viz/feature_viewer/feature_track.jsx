/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var ReactDnD = require("react-dnd");
var DragSource = ReactDnD.DragSource;
var StyleSheet = require("react-style");
var _ = require("underscore");

var HEIGHT = 150;
var AXIS_HEIGHT = 15;

var HIGHLIGHT_COLOR = "#DEC113";
var FILL_COLOR = "#09AEB2";
// ?? other color to use for this color scheme is #FFDD19
var TRACK_HEIGHT = 20;
var VARIANT_HEIGHT = 20;
var VARIANT_DIAMETER = 7;
var MAIN_BORDER_COLOR = "#e6e6e6";
var SYNONYMOUS_COLOR = "#4D9221";  // dark yellow-green
var NON_SYNONYMOUS_COLOR = "#C51B7D"; // dark pink
var INTRON_COLOR = "#E6F5D0"; // pale yellow-green
var UNTRANSLATEABLE_COLOR = "gray";
var SCROLL_WIDTH = 100000;

// CSS in JS
var styles = StyleSheet.create({
	container: {
		position: "relative"
	},

	canvas: {
		position: "absolute",
		left: 0,
		pointerEvents: "none"
	},

	flexChild: {
		height: HEIGHT,
		margin: "auto"
	},

	frame: {
		height: HEIGHT,
		position: "relative",
		overflow: "scroll",
		display: "inline-block"
	},

	scroller: {
		position: "absolute",
		width: SCROLL_WIDTH,
		height: HEIGHT * 5
	},
});

var FeatureTrack = React.createClass({
	propTypes: {
		store: React.PropTypes.object,
		width: React.PropTypes.number.isRequired,
		isDragging: React.PropTypes.bool.isRequired,
		chromStart: React.PropTypes.number.isRequired,
		chromEnd: React.PropTypes.number.isRequired,
		features: React.PropTypes.array.isRequired, // [{ chromStart, chromEnd, strand }, ...]
		focusFeature: React.PropTypes.object, // { chromStart, chromEnd, strand }
		onScroll: React.PropTypes.func
	},

	getInitialState: function () {
		return {};
	},

	render: function () {
		var connectDragSource = this.props.connectDragSource;
		return connectDragSource(
			<div styles={[styles.flexChild]}>
				<div className="feature-track" styles={[styles.container, { width: this.props.width }]}>
					<div ref="frame" styles={[styles.frame, { width: this.props.width }]}>
						<div ref="scroller" styles={[styles.scroller]} />
					</div>
					<canvas ref="canvas" width={this.props.width} height={HEIGHT} styles={[styles.canvas]} />
				</div>
			</div>
		);
	},

	componentDidMount: function () {
		this._drawCanvas();
		// this._setupMousemoveEvents();
		// this.refs.frame.getDOMNode().scrollLeft = SCROLL_WIDTH / 2;
		var node = this.refs.frame.getDOMNode();
		node.scrollTop = node.scrollHeight / 2;
		this._setupScroll();
	},

	componentDidUpdate: function (prevProps, prevState) {
		this._drawCanvas();
		if (this.props.width !== prevProps.width) this._setupScroll();

		
	},

	_drawCanvas: function () {
		var canvas = this.refs.canvas.getDOMNode();
		var ctx = canvas.getContext("2d");

		var scale = this._getScale();
		var ticks = scale.ticks();
		var data = this.props.features;

		ctx.font = "14px 'Lato', sans-serif";
		ctx.textAlign = "center"; 
		ctx.clearRect(0, 0, this.props.width, HEIGHT);

		// draw axis
		var x;
		ctx.fillStyle = "#808080";
		ctx.strokeStyle = MAIN_BORDER_COLOR;
		ctx.lineWidth = 1;
		ticks.forEach( d => {
			x = scale(d);
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, HEIGHT - AXIS_HEIGHT);
			ctx.stroke();

			// tick label
			ctx.fillText(d.toString(), x, HEIGHT);
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

	
	_setupScroll: function () {
		var frameNode = this.refs.frame.getDOMNode();
		var scrollNode = this.refs.scroller.getDOMNode();
		var scale = this._getScale();
		var scrollNum, translateDelta;
		var originalPosition = this.props.store.getOriginalPosition();
		frameNode.onscroll = e => {
			scrollNum = e.currentTarget.scrollLeft;
			translateDelta = (scale.invert(scale.range()[0] + scrollNum)) - originalPosition.chromStart;
			this.props.store.translate(translateDelta);
			if (typeof this.props.onScroll === "function") this.props.onScroll();
		};
	},

	_getScale: function () {
		return d3.scale.linear()
			.domain([this.props.chromStart, this.props.chromEnd])
			.range([0, this.props.width]);
	}
});

var target = {
	beginDrag: function (props) {
		return {};
	}
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}

// make draggable and droppable
module.exports = DragSource("featureTrack", target, collect)(FeatureTrack);
