/** @jsx React.DOM */
"use strict";

var React = require("react");
var SGDVisualization = require("./sgd_visualization.jsx");

// define bundled react components
var componentTypes = {
	proteinViewer: SGDVisualization.ProteinViewer,
	variantViewer: SGDVisualization.VariantViewer,
};

class BundledSGDVisualization {
	draw (options, targetNode) {
		var VizComponent = componentTypes[options.type];
		React.render(<VizComponent {...options.data} />, targetNode);
	}
}

window.SGDVisualization = BundledSGDVisualization;
module.exports = BundledSGDVisualization;
