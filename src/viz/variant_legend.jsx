/** @jsx React.DOM */
"use strict";
var React = require("react");
var StyleSheet = require("react-style");

var DrawVariant = require("./draw_variant");
var DidClickOutside = require("../mixins/did_click_outside.jsx");

var VariantLegend = React.createClass({
	mixins: [DidClickOutside],

	getInitialState: function () {
		return {
			isActive: false
		}
	},

	render: function () {
		return (
			<div styles={[styles.container]}>
				<a className="btn btn-default" onClick={this._toggleActive}>
					Legend <span className="caret" />
				</a>
				{this._renderPanel()}
			</div>
		);
	},

	componentDidUpdate: function (prevProps, prevState) {
		if (this.state.isActive) this._drawLegend();
	},

	didClickOutside: function () {
		if (this.isMounted() && this.state.isActive) this.setState({ isActive: false });
	},

	_renderPanel: function () {
		if (!this.state.isActive) return null;
		return (
			<div styles={[styles.panel]}>
				<canvas ref="canvas" width={25} height={HEIGHT} />
				<div>
					<p styles={[styles.label]}>Insertion</p>
					<p styles={[styles.label]}>Deletion</p>
					<p styles={[styles.label]}>Synonymous SNP</p>
					<p styles={[styles.label]}>Nonsynonymous SNP</p>
					<p styles={[styles.label]}>Intron SNP</p>
					<p styles={[styles.label]}>Untranslatable SNP</p>
				</div>
			</div>
		);
	},

	_toggleActive: function (e) {
		if (e) {
			e.preventDefault();
			e.nativeEvent.stopImmediatePropagation();
		}
		this.setState({ isActive: !this.state.isActive });
	},

	_drawLegend: function () {
		var exampleInDels = ["insertion", "deletion"];
		var exampleSnps = ["synonymous", "nonsynonymous", "intron", "untranslatable"];
		var yDelta = LABEL_HEIGHT + LABEL_BOTTOM + 1;
		var canvas = this.refs.canvas.getDOMNode();
		var ctx = canvas.getContext("2d");
		var i = 0;
		exampleInDels.forEach( d => {
			DrawVariant(ctx, d, "", 14, i * yDelta + 8);
			i += 1;
		});
		exampleSnps.forEach( d => {
			DrawVariant(ctx, "snp", d, 14, i * yDelta + 8);
			i += 1;
		});
	}
});

module.exports = VariantLegend;

var WIDTH = 180;
var HEIGHT = 190;
var BACKGROUND_COLOR = "#fff";
var BORDER_COLOR = "#ccc";
var LABEL_HEIGHT = 20;
var LABEL_BOTTOM = 10;

// CSS in JS
var styles = StyleSheet.create({
	container: {
		position: "relative"
	},

	panel: {
		position: "absolute",
		top: "3.5rem",
		right: 0,
		width: WIDTH,
		height: HEIGHT,
		background: BACKGROUND_COLOR,
		borderRadius: 4,
		border: "1px solid #ccc",
		zIndex: 1,
		display: "flex",
		textAlign: "left",
		paddingTop: "1rem"
	},

	label: {
		height: LABEL_HEIGHT,
		marginBottom: LABEL_BOTTOM
	}
});
