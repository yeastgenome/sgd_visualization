var assert = require("assert");
var React = require("react");
// jsx
require("node-jsx").install({ harmony: true });

var FeatureViewer = require("../src/sgd_visualization.jsx").FeatureViewer;

describe("FeatureViewer", function(){
	it("should be constructed with lots of 'neighbor' data", function() {
		var url = "http://www.yeastgenome.org/backend/contig/257964/sequence_details";
		// TODO fetch from API Chromosome VI data
		// 
		var _data = [
			{
				chrom: "chriii",
				chromStart: 1000,
				chromEnd: 1500,
				strand: "+"
			},
			{
				chrom: "chriii",
				chromStart: 1200,
				chromEnd: 1550,
				strand: "+"
			},
			{
				chrom: "chriii",
				chromStart: 1600,
				chromEnd: 1450,
				strand: "-"
			}
		];
		var _position = {
			chrom: "chriii",
			chromStart: 1000,
			chromEnd: 2000
		};
		var element = React.createElement(FeatureViewer, {
			data: _data,
			position: _position
		});
		var markup = React.renderToStaticMarkup(element);
		assert.equal(markup.match('class="feature-viewer') !== null, true);
		assert.equal(markup.match(/<div/).index, 0);
	});
});
