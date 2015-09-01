"use strict";
var React = require("react");

var _ProteinViewerComponent = require("./viz/protein_viewer.jsx");
var _VariantViewerComponent = require("./viz/variant_viewer/variant_viewer.jsx");
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
		var _contigName = conf.contigName;
		var _contigHref = conf.contigHref;
		var _dnaLength = conf.dnaLength;
		var _proteinLength = conf.proteinLength;
		var _strand = conf.strand;
		var _domains = conf.domains;
		var _isProteinMode = conf.isProteinMode;
		var _downloadCaption = conf.downloadCaption;

		// init store
		var featureTrackData = {
				id: "variantViewer",
				position: {
					chromStart: _chromStart,
					chromEnd: _chromEnd
				},
				features: [
					{
						chrom: ((typeof _contigName === "undefined") ? "contig" : _contigName),
						chromStart: _chromStart,
						chromEnd: _chromEnd,
						strand: _strand,
						blockSizes: _blockSizes,
						blockStarts: _blockStarts
					}
				]
			};
		var _store = new FeatureViewerStore();
		_store.addFeatureTrack(featureTrackData);

		React.render(React.createElement(_VariantViewerComponent, {
			store: _store,
			name: _name,
			alignedDnaSequences: _alignedDnaSequences,
			alignedProteinSequences: _alignedProteinSequences,
			variantDataDna: _variantDataDna,
			variantDataProtein: _variantDataProtein,
			chromStart: _chromStart,
			chromEnd: _chromEnd,
			blockStarts: _blockStarts,
			blockSizes: _blockSizes,
			contigName: _contigName,
			contigHref: _contigHref,
			dnaLength: _dnaLength,
			proteinLength: _proteinLength,
			strand: _strand,
			domains: _domains,
			isProteinMode: _isProteinMode,
			downloadCaption: _downloadCaption
		}), options.el);
	}
};

class _ProteinViewer {
	constructor (options) {
		if (typeof options === "undefined") options = {};
		options.el = options.el || document.body;

		React.render(React.createElement(_ProteinViewerComponent, {
			data: options.config.domains,
			locusData: options.config.locus
		}), options.el);
	}
}

module.exports = {
	ProteinViewer: _ProteinViewer,
	VariantViewer: _VariantViewer,
	ProteinViewerComponent: _ProteinViewerComponent,
	VariantViewerComponent: _VariantViewerComponent
};
