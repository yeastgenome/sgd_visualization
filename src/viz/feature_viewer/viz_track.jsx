/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var ReactDnD = require("react-dnd");
var DragSource = ReactDnD.DragSource;
var DropTarget = ReactDnD.DropTarget;
var StyleSheet = require("react-style");
var _ = require("underscore");

var HEIGHT = 240;

// CSS in JS
var styles = StyleSheet.create({
	frame: {
		height: HEIGHT,
		position: "relative",
		display: "inline-block"
	}
});

var VizTrack = React.createClass({
	propTypes: {
		chromStart: React.PropTypes.number.isRequired,
		chromEnd: React.PropTypes.number.isRequired,
		width: React.PropTypes.number,
		isOver: React.PropTypes.bool.isRequired
	},

	render: function () {
		var textNode = this._canRender() ? null : <p>Drag some data to render</p>;

		var _border = this.props.isOver ? "1px solid #FFDD19" : "1px solid white";
		return this.props.connectDropTarget(
			<div className="viz-track" styles={[styles.frame, { width: this.props.width, height: HEIGHT, border: _border }]}>
				{textNode}
				<canvas ref="canvas" width={this.props.width} height={HEIGHT} />
			</div>
		)
	},

	componentDidMount: function () {
		this._renderCanvas();
	},

	componentDidUpdate: function () {
		this._renderCanvas();
	},

	_canRender: function () {
		return this.props.store.getInteractionData().length;
	},

	_renderCanvas: function () {
		var canvas = this.refs.canvas.getDOMNode();
		var ctx = canvas.getContext("2d");
		this._drawInteractions(ctx );
	},

	_drawInteractions: function (ctx) {
		var data = this.props.store.getInteractionData();
		if (!data.length) return;
		var interactionCoord = 1500;
		var depth = 15;
		var cScale = d3.scale.linear()
			.domain([0, 1])
			.range(["white", "#B94694"]);

		var scale = this._getScale();
		var x = scale(interactionCoord);
		ctx.save();
		ctx.translate(x, 15);

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

	_getScale: function () {
		return d3.scale.linear()
			.domain([this.props.chromStart, this.props.chromEnd])
			.range([0, this.props.width]);
	},
});

var vizTrackTarget = {
	drop: function (props, monitor, component) {
		// add interaction data to store
		props.store.addInteractionData();
		return { moved: true };
	}
};

function collect(connect, monitor) {
	return {
		// Call this function inside render()
		// to let React DnD handle the drag events:
		connectDropTarget: connect.dropTarget(),
		// You can ask the monitor about the current drag state:
		isOver: monitor.isOver()
	};
};

var dragTrackTarget = {
	beginDrag: function (props) {
		return {};
	}
};

function collectDragTarget(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}

// make draggable and droppable
var DroppableTrackZone = DropTarget("vizTrackData", vizTrackTarget, collect)(VizTrack);
module.exports = DragSource("vizTrack", dragTrackTarget, collectDragTarget)(DroppableTrackZone);
