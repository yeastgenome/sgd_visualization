/** @jsx React.DOM */
"use strict";

var React = require("react");
var SGDVisualization = require("./sgd_visualization.jsx");

class BundledSGDVisualization {
	draw (options, targetNode) {
		React.renderComponent(<SGDVisualization foo="bar"/>, targetNode);
	}
}

window.SGDVisualization = BundledSGDVisualization;
module.exports = BundledSGDVisualization;
