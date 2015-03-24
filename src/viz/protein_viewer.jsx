/** @jsx React.DOM */
"use strict";
var React = require("react");

var StandaloneAxis = React.createFactory(require("./standalone_axis.jsx"));

var ProteinViewer = React.createClass({
	
	render: function () {
		return (
			<div className="sgd-viz protein-viewer">
				{this._renderLabels()}
				{this._renderViz()}
			</div>
		);
	},

	_renderLabels: function () {
		return (
			<div className="protein-viewer-label-container">
				<span>labels</span>
			</div>
		);
	},

	_renderViz: function () {
		var _domain = [0, 100];
		return (
			<div className="protein-viewer-viz-container"  style={{ position: "relative" }}>
				<div style={{ width: "100%", height: 75, position: "absolute", border: "1px solid #ddd"}}>
				</div>
				<StandaloneAxis
					domain={_domain}
					leftRatio={0.20}
					gridTicks={true}
					orientation="bottom"
				/>
			</div>
		);
	}
});

module.exports = ProteinViewer;
