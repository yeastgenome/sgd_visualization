"use strict";
var React = require("react");

var ProteinViewerComponent = require("./viz/protein_viewer.jsx");
var VariantViewerComponent = require("./viz/variant_viewer/variant_viewer.jsx");
var FeatureViewerStore = require("./store/feature_viewer_store.jsx");

var exampleData = require("./variant_viewer_fixture_data");

class _VariantViewer {
	constructor (options) {
		if (typeof options === "undefined") options = {};
		options.el = options.el || document.body;

		var conf = (options.config === "fixture") ? exampleData : options.config;
		var _alignedDnaSequences = conf.alignedDnaSequences;
		var _alignedProteinSequences = conf.alignedProteinSequences;
		var _variantDataDna = conf.variantDataDna;
		var _variantDataProtein = conf.variantDataProtein;
		var _chromStart = conf.chromStart;
		var _chromEnd = conf.chromEnd;
		var _blockStarts = conf.blockStarts;
		var _blockSizes = conf.blockSizes;
		var _name = conf.name;
		var _dnaLength = conf.dnaLength;
		var _proteinLength = conf.proteinLength;
		var _strand = conf.strand;
		var _domains = conf.domains;
		var _isProteinMode = conf.isProteinMode;

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
			alignedDnaSequences: _alignedDnaSequences,
			alignedProteinSequences: _alignedProteinSequences,
			variantDataDna: _variantDataDna,
			variantDataProtein: _variantDataProtein,
			chromStart: _chromStart,
			chromEnd: _chromEnd,
			blockStarts: _blockStarts,
			blockSizes: _blockSizes,
			name: _name,
			dnaLength: _dnaLength,
			proteinLength: _proteinLength,
			strand: _strand,
			domains: _domains,
			isProteinMode: false
		}), options.el);
	}
};

class _ProteinViewer {
	constructor (options) {
		if (typeof options === "undefined") options = {};
		options.el = options.el || document.body;

		React.render(React.createElement(ProteinViewerComponent, {
			data: options.config.domains,
			locusData: options.config.locus
		}), options.el);
	}
}

module.exports = {
	ProteinViewer: _ProteinViewer,
	VariantViewer: _VariantViewer
};
