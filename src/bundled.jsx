/** @jsx React.DOM */
"use strict";

var React = require("react");
var SGDVisualization = require("./sgd_visualization.jsx");
var FeatureViewerStore = require("./store/feature_viewer_store.jsx");

// define bundled react components
var componentTypes = {
	proteinViewer: SGDVisualization.ProteinViewer,
	variantViewer: SGDVisualization.VariantViewer
};

class BundledSGDVisualization {

	draw (options, targetNode) {
		var store;
		if (options.type === "variantViewer") {
			var featureTrackData = {
				id: "variantViewer",
				position: {
					chromStart: options.data.chromStart,
					chromEnd: options.data.chromEnd
				},
				features: [
					{
						chrom: "chriii", // TEMP
						chromStart:  options.data.chromStart,
						chromEnd: options.data.chromEnd,
						strand: "+",
						blockSizes: options.data.blockSizes,
						blockStarts: options.data.blockStarts
					}
				]
			};
			store = new FeatureViewerStore();
			store.addFeatureTrack(featureTrackData);
		}

		var VizComponent = componentTypes[options.type];
		React.render(<VizComponent {...options.data}  store={store}/>, targetNode);
	}
}

window.SGDVisualization = BundledSGDVisualization;
module.exports = BundledSGDVisualization;
