/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var VariantViewer = React.createClass({
	propTypes: {
		alignedDnaSequences: React.PropTypes.array,
		alignedProteinSequences: React.PropTypes.array,
		coordinates: React.PropTypes.object,
		name: React.PropTypes.string,
		dnaLength: React.PropTypes.number,
		proteinLength: React.PropTypes.number,
		strand: React.PropTypes.string // "+" or "-"
	},

	render: function () {
		return <h1>VariantViewer</h1>;
	}
});

module.exports = VariantViewer;
