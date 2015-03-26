/** @jsx React.DOM */
"use strict";

var React = require("react");
var SGDVisualization = require("./sgd_visualization.jsx");

// define bundled react components
var componentTypes = {
	proteinViewer: SGDVisualization.proteinViewer
};

class BundledSGDVisualization {
	draw (options, targetNode) {
		// TEMP force to be protein viewer
		var VizComponent = componentTypes.proteinViewer;
		React.render(<VizComponent foo="bar"/>, targetNode);
	}
}

window.SGDVisualization = BundledSGDVisualization;
module.exports = BundledSGDVisualization;
