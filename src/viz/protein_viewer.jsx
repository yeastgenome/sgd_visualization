/** @jsx React.DOM */
"use strict";
var React = require("react");

var ProteinViewer = React.createClass({
	render: function () {
		return (
			<div className="sgd-viz protein-viewer">
				<span>Proteins</span>
			</div>
		);
	}
});

module.exports = ProteinViewer;
