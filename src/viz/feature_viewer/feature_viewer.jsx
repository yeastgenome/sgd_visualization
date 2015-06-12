/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var StyleSheet = require("react-style");
var _ = require("underscore");

var HEIGHT = 300;

// CSS in JS
var styles = StyleSheet.create({
	frame: {
		border: "1px solid #efefef",
		height: HEIGHT,
		overflow: "scroll",
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
		store: React.PropTypes.object.isRequired
	},

	getInitialState: function () {
		return {
			DOMWidth: 400,
			offsetLeft: 0
		};
	},

	render: function () {
		return (
			<div className="feature-viewer">
				<ul>
					<li><a href="#">Zoom In</a></li>
					<li><a href="#">Zoom Out</a></li>
				</ul>
				<ul>
					<li><a href="#">Left</a></li>
					<li><a href="#">Right</a></li>
				</ul>
				<div ref="container" styles={[styles.frame]}>
					<div ref="scroller" styles={[styles.scroller]} />
					<canvas ref="canvas" width={this.state.DOMWidth} height={HEIGHT} styles={[{ marginLeft: this.state.offsetLeft }]} />
				</div>
			</div>
		);
	},

	componentDidMount: function () {
		this._calculateWidth();
		this._drawCanvas();
		this._setupScroll();
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

		var canvas = this.refs.canvas.getDOMNode();
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, this.state.DOMWidth, HEIGHT);

		var x;
		ticks.forEach( d => {
			x = scale(d);
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, HEIGHT);
			ctx.stroke();
		});
	},

	_getScale: function () {
		var position = this.props.store.getPosition();
		return d3.scale.linear()
			.domain([position.chromStart, position.chromEnd])
			.range([0, this.state.DOMWidth]);
	},

	_setupScroll: function () {
		this.refs.container.getDOMNode().addEventListener("scroll", this._onScroll);
	},

	_onScroll: function (e) {
		// var oldLeft = this.state.offsetLeft;
		// var newLeft = this.refs.container.getDOMNode().scrollLeft;
		// this.setState({ offsetLeft: newLeft });
		// var oldPos
		// var positionDelta = this._getScale().invert
		this.props.store.translate(10);
		this.forceUpdate()
	}
});

module.exports = FeatureViewer;
