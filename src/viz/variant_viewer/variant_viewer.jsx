/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var AlignmentModel = require("./alignment_model.jsx");
var FeatureViewer = require("../feature_viewer.jsx");
var MultiAlignmentViewer = require("./multi_alignment_viewer.jsx");
var Parset = require("./parset.jsx");
var VariantPop = require("./variant_pop.jsx");

var VariantViewer = React.createClass({
	propTypes: {
		alignedDnaSequences: React.PropTypes.array,
		alignedProteinSequences: React.PropTypes.array,
		variantDataDna: React.PropTypes.array,
		variantDataProtein: React.PropTypes.array,
		coordinates: React.PropTypes.object,
		name: React.PropTypes.string,
		dnaLength: React.PropTypes.number,
		proteinLength: React.PropTypes.number,
		strand: React.PropTypes.string // "+" or "-"
	},

	getInitialState: function () {
		return {
			highlightedAlignedSegment: null, // [0, 100] relative coord to aligned sequence
			parsetVisible: false,
			x1Scale: function () { return 0; },
			x2Scale: function () { return 0; }
		};
	},

	render: function () {
		return (
			<div className="sgd-viz variant-viewer">
				{this._renderFeatureViewer()}
				{this._renderParset()}
				{this._renderSequence()}
			</div>
		);
	},
	
	_renderFeatureViewer: function () {
		var coord = this.props.coordinates;
		var padding = Math.round(Math.abs(coord.end - coord.start) * 0.1);
		var _features = [
			{
				chromStart: coord.start,
				chromEnd: coord.end,
				strand: "+" // TEMP always +
			}
		];
		var _onSetX1Scale = scale => {
			this.setState({ x1Scale: scale });
		};
		return (<FeatureViewer
			canScroll={false}
			chromStart={coord.start - padding}
			chromEnd={coord.end + padding}
			features={_features}
			onSetScale={_onSetX1Scale}
		/>);
	},

	_renderParset: function () {
		var _alignedCoord = this.state.highlightedAlignedSegment || [0, 0];
		
		// get ref highlighted coord
		var model = this._getModel();
		var _refCoord = model.getReferenceCoordinatesFromAlignedCoordinates(_alignedCoord[0], _alignedCoord[1], false);
		_refCoord = [_refCoord.start, _refCoord.end];

		var parsetX1Coord = _refCoord
			.map( d => {
				return this.state.x1Scale(d);
			});
		var parsetX2Coord = _alignedCoord
			.map( d => {
				return this.state.x2Scale(d);
			});
		// if a SNP (actually one nucleotide) make the text refer to the position, not a range
		var text = "FOO"
		if (Math.abs(_refCoord[1] - _refCoord[0]) === 1) {
			var _coord = (this.props.strand === "+") ? _refCoord[0] : _refCoord[1];
			text = _coord.toString();
		}

		return (<Parset 
			isVisible={this.state.parsetVisible}
			x1Coordinates={parsetX1Coord}
			x2Coordinates={parsetX2Coord}
			text={text}
			contigDisplayName={"FOOBAR"}
			contigHref={"http://google.com"}
		/>);
	},

	_renderSequence: function () {
		var model = this._getModel();
		var _sequences = model.formatSequences(this.props.isProteinMode, this.props.strainIds);
		var _segments = model.formatSegments(this.props.isProteinMode);
		var _onSetX2Scale = scale => {
			this.setState({ x2Scale: scale });
		};

		// TODO onHighlight
		return (
			<div>
				<MultiAlignmentViewer
					segments={_segments} sequences={_sequences}
					onSetScale={_onSetX2Scale}
					highlightedSegmentDomain={this.state.highlightedAlignedSegment}
				/>
			</div>
		);
	},

	_getModel: function () {
		return new AlignmentModel({
			alignedDnaSequences: this.props.alignedDnaSequences,
			alignedProteinSequences: this.props.alignedDnaSequences,
			variantDataDna: this.props.variantDataDna,
			variantDataProtein: this.props.variantDataProtein
		});
	}
});

module.exports = VariantViewer;
