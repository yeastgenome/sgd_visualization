/** @jsx React.DOM */
"use strict";

var React = require("react");
var SGDVisualization = require("./sgd_visualization.jsx");
var FeatureViewerStore = require("./viz/feature_viewer/feature_viewer_store.jsx");

// define bundled react components
var componentTypes = {
	featureViewer: SGDVisualization.FeatureViewer,
	proteinViewer: SGDVisualization.ProteinViewer
};

class BundledSGDVisualization {

	draw (options, targetNode) {
		if (options.type === "featureViewer" && options.fixtures) {
			var store = new FeatureViewerStore();
			store.setFixtureData();
		}

		// need to feed from store !!!
		var VizComponent = componentTypes[options.type];
		React.render(<VizComponent store={store} />, targetNode);
	}
}

window.SGDVisualization = BundledSGDVisualization;
module.exports = BundledSGDVisualization;
