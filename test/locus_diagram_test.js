var assert = require("assert");
var React = require("react");
// jsx
require("node-jsx").install({ harmony: true });

var LocusDiagram = require("../src/sgd_visualization.jsx").LocusDiagram;

describe("LocusDiagram", function(){
	it("should be constructed with lots of 'neighbor' data", function() {
		var url = "http://www.yeastgenome.org/backend/contig/257964/sequence_details";
		// TODO fetch from API Chromosome VI data
		// 
		var _data = [];
		var element = React.createElement(LocusDiagram, {
			data: _data,
			metaData: {}
		});
		var markup = React.renderToStaticMarkup(element);
		// assert something about markup
		//
		//
		// TEMP
		assert.equal(2 + 2, 4);
	});
});
