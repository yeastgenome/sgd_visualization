var assert = require("assert");
var fs = require("fs");
var React = require("react");
// jsx
require("node-jsx").install({ harmony: true });

var VariantViewer = require("../src/sgd_visualization.jsx").VariantViewer;
var exampleData = require("../examples/variant_viewer/example_alignment_data.json");

describe("VariantViewer", function(){
	it("should render to a viz with classes 'sgd-viz' and 'variant-viewer'", function(){

		var markup = React.renderToStaticMarkup(React.createElement(VariantViewer, {
			alignedDnaSequences: exampleData.aligned_dna_sequences,
			alignedProteinSequences: exampleData.aligned_protein_sequences,
			variantDataDna: exampleData.variant_data_dna,
			variantDataProtein: exampleData.variant_data_protein,
			coordinates: exampleData.coordinates,
			name: exampleData.display_name,
			dnaLength: exampleData.dna_length,
			proteinLength: exampleData.protein_length,
			strand: exampleData.strand,
		}));
		assert.equal(markup.match('class="sgd-viz variant-viewer') !== null, true);
		assert.equal(markup.match(/<div/).index, 0);
	});
});
