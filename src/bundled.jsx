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
		var store = new FeatureViewerStore();
		if (options.type === "featureViewer" && options.fixtures) {
			store.setFixtureData();
		}

		var VizComponent = componentTypes[options.type];
		React.render(<VizComponent data={options.data} locusData={options.locusData} store={store} />, targetNode);
	}
}

window.SGDVisualization = BundledSGDVisualization;
module.exports = BundledSGDVisualization;
