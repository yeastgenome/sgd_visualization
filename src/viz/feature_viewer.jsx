/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var StyleSheet = require("react-style");
var _ = require("underscore");

var HEIGHT = 300;
var FILL_COLOR = "#356CA7";

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
		features: React.PropTypes.array // [{ chromStart, chromEnd, strand }]
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
					<canvas ref="canvas" width={this.state.DOMWidth} height={HEIGHT} styles={[{ marginLeft: this.state.offsetLeft }]} />
				</div>
			</div>
		);
	},

	componentDidMount: function () {
		this._calculateWidth();
		this._drawCanvas();
		if (this.props.canScroll) this._setupScroll();
	},

	componentDidUpdate: function (prevProps, prevState) {
		this._drawCanvas();
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

		var x;
		ctx.fillStyle = "black";
		ticks.forEach( d => {
			x = scale(d);
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, 150);
			ctx.stroke();

			// tick label
			ctx.fillText(d.toString(), x, 16);
		});

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
			ctx.lineTo(endX, y);
			ctx.stroke();

			// draw exons
			ctx.fillStyle = FILL_COLOR;
			d.blockSizes.forEach( (_d, _i) => {
				_startPos = startPos + d.blockStarts[_i];
				_endPos = _startPos + _d;
				_startX = scale(_startPos);
				_width = scale(_endPos) - _startX;
				ctx.fillRect(_startX, y - 6, _width, 16);
			});
		});
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
