var assert = require("assert");
var fs = require("fs");
var React = require("react");
// jsx
require("node-jsx").install({ harmony: true });

var VariantViewer = require("../src/sgd_visualization.jsx").VariantViewer;
var FeatureViewerStore = require("../src/store/feature_viewer_store.jsx");
var exampleData = require("../src/variant_viewer_fixture_data.json");

describe("VariantViewer", function(){
	it("should render to a viz with classes 'sgd-viz' and 'variant-viewer'", function(){
		var markup = React.renderToStaticMarkup(React.createElement(VariantViewer, {
			alignedDnaSequences: exampleData.alignedDnaSequences,
			alignedProteinSequences: exampleData.alignedProteinSequences,
			variantDataDna: exampleData.variantDataDna,
			variantDataProtein: exampleData.variantDataProtein,
			chromStart:  exampleData.chromStart,
			chromEnd: exampleData.chromEnd,
			name: exampleData.displayName,
			dnaLength: exampleData.dnaLength,
			proteinLength: exampleData.proteinLength,
			strand: exampleData.strand,
		}));
		assert.equal(markup.match('class="sgd-viz variant-viewer') !== null, true);
		assert.equal(markup.match(/<div/).index, 0);
	});
});
