var assert = require("assert");
var React = require("react");
// jsx
require("node-jsx").install({ harmony: true });

var FeatureViewer = require("../src/sgd_visualization.jsx").FeatureViewer;
var FeatureViewerStore = require("../src/sgd_visualization/feature_viewer/feature_viewer_store.jsx");

describe("FeatureViewer", function(){
	it("should be constructed with lots of 'neighbor' data", function() {
		var _store = new FeatureViewerStore();
		_store.setFixtureData();

		var element = React.createElement(FeatureViewer, {
			store: _store
		});
		var markup = React.renderToStaticMarkup(element);
		assert.equal(markup.match('class="feature-viewer') !== null, true);
		assert.equal(markup.match(/<div/).index, 0);
	});
});
