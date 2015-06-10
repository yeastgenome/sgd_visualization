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
		height: HEIGHT
	}
});

var FeatureViewer = React.createClass({
	propTypes: {
		data: React.PropTypes.array.isRequired,
		position: React.PropTypes.object.isRequired
	},

	getInitialState: function () {
		return {
			DOMWidth: 400
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
				<div styles={[styles.frame]}>
					<canvas ref="canvas" width={this.state.DOMWidth} height={HEIGHT} />
				</div>
			</div>
		);
	},

	componentDidMount: function () {
		this._calculateWidth();
		this._drawCanvas();
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
		var position = this.props.position
		return d3.scale.linear()
			.domain([position.chromStart, position.chromEnd])
			.range([0, this.state.DOMWidth]);
	}
});

module.exports = FeatureViewer;
