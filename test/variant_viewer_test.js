var assert = require("assert");
var React = require("react");
// jsx
require("node-jsx").install({ harmony: true });

var VariantViewer = require("../src/sgd_visualization.jsx").VariantViewer;

describe("VariantViewer", function(){
	it("should render to a viz with classes 'sgd-viz' and 'variant-viewer'", function(){
		var _data = {};

		var markup = React.renderToStaticMarkup(React.createElement(VariantViewer, {
			data: _data
		}));
		assert.equal(markup.match('class="sgd-viz variant-viewer') !== null, true);
		assert.equal(markup.match(/<div/).index, 0);
	});
});
