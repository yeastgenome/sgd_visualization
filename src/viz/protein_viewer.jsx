/** @jsx React.DOM */
"use strict";
var React = require("react");

var StandaloneAxis = React.createFactory(require("./standalone_axis.jsx"));

var ProteinViewer = React.createClass({
	render: function () {
		var _domain = [0, 100];
		return (
			<div className="sgd-viz protein-viewer">
				<StandaloneAxis
					domain={_domain}
				/>
			</div>
		);
	}
});

module.exports = ProteinViewer;
