"use strict";
var React = require("react");

var VariantViewerComponent = require("./viz/variant_viewer/variant_viewer.jsx");
var FeatureViewerStore = require("./store/feature_viewer_store.jsx");

var exampleData = require("./variant_viewer_fixture_data");

class _VariantViewer {

	constructor (options) {
		if (typeof options === "undefined") options = {};
		options.el = options.el || document.body;

		// TODO, make work for non fixtures
		if (options.config !== "fixture") {

		}

		// init store
		var featureTrackData = {
				id: "variantViewer",
				position: {
					chromStart: exampleData.chromStart,
					chromEnd: exampleData.chromEnd
				},
				features: [
					{
						chrom: "chriii", // TEMP
						chromStart:  exampleData.chromStart,
						chromEnd: exampleData.chromEnd,
						strand: exampleData.strand,
						blockSizes: exampleData.blockSizes,
						blockStarts: exampleData.blockStarts
					}
				]
			};
		var _store = new FeatureViewerStore();
		_store.addFeatureTrack(featureTrackData);

		React.render(React.createElement(VariantViewerComponent, {
			store: _store,
			alignedDnaSequences: exampleData.alignedDnaSequences,
			alignedProteinSequences: exampleData.alignedProteinSequences,
			variantDataDna: exampleData.variantDataDna,
			variantDataProtein: exampleData.variantDataProtein,
			chromStart: exampleData.chromStart,
			chromEnd: exampleData.chromEnd,
			blockStarts: exampleData.blockStarts,
			blockSizes: exampleData.blockSizes,
			name: exampleData.name,
			dnaLength: exampleData.dnaLength,
			proteinLength: exampleData.proteinLength,
			strand: exampleData.strand,
			domains: exampleData.domains,
			isProteinMode: false
		}), options.el);
	}
};

module.exports = {
	VariantViewer: _VariantViewer
};
