/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var DragSource = require("react-dnd").DragSource;
var StyleSheet = require("react-style");
var _ = require("underscore");

/**
 * Implements the drag source contract.
 */
var cardSource = {
  beginDrag: function (props) {
    return {
      text: props.text
    };
  }
};

/**
 * Specifies the props to inject into your component.
 */
function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}


// dragging item
var DataSourceCard = React.createClass({
  propTypes: {
    text: React.PropTypes.string.isRequired,

    // Injected by React DnD:
    isDragging: React.PropTypes.bool.isRequired,
    connectDragSource: React.PropTypes.func.isRequired
  },

  render: function () {
    var isDragging = this.props.isDragging;
    var connectDragSource = this.props.connectDragSource;
    var text = this.props.text;

    return connectDragSource(
      <div style={{ opacity: isDragging ? 0.5 : 1 }}>
        <span><span className="glyphicon glyphicon-file"></span> {text}</span>
      </div>
    );
  }
});

// Export the wrapped component:
module.exports = DragSource("vizTrack", cardSource, collect)(DataSourceCard);
