var assert = require("assert");
var React = require("react");
// jsx
require("node-jsx").install({ harmony: true });

var ProteinViewer = require("../src/sgd_visualization.jsx").proteinViewer;

describe("ProteinViewer", function(){
	it("should render to a viz with classes 'sgd-viz' and 'protein-viewer'", function(){
		
		var markup = React.renderToStaticMarkup(React.createElement(ProteinViewer, null));
		assert.equal(markup.match('class="sgd-viz protein-viewer') !== null, true);
		assert.equal(markup.match(/<div/).index, 0);
	});
});
