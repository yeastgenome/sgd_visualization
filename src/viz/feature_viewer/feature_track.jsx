/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var ReactDnD = require("react-dnd");
var DragSource = ReactDnD.DragSource;
var StyleSheet = require("react-style");
var _ = require("underscore");

var HEIGHT = 240;

// CSS in JS
var styles = StyleSheet.create({
	flexChild: {
		width: "50%",
		height: 100,
		margin: "auto"
	}
});

var FeatureTrack = React.createClass({
	propTypes: {
		isDragging: React.PropTypes.bool.isRequired
	},

	render: function () {
		var connectDragSource = this.props.connectDragSource;
		return connectDragSource(
			<div className="feature-track" styles={[styles.flexChild]}>
				{this.props.children}
			</div>
		);
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
