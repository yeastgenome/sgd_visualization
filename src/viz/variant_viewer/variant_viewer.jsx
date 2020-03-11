/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var AlignmentModel = require("./alignment_model.jsx");
var FeatureViewer = require("../feature_viewer.jsx");
var FeatureViewerStore = require("../../store/feature_viewer_store.jsx");
var MultiAlignmentViewer = require("./multi_alignment_viewer.jsx");
var Parset = require("./parset.jsx");

var LABEL_WIDTH = 150;

var VariantViewer = React.createClass({
	propTypes: {
		name: React.PropTypes.string,
		chromStart: React.PropTypes.number.isRequired,
		chromEnd: React.PropTypes.number.isRequired,
		contigName: React.PropTypes.string,
		contigHref: React.PropTypes.string,
		alignedDnaSequences: React.PropTypes.array,
		alignedProteinSequences: React.PropTypes.array,
		variantDataDna: React.PropTypes.array,
		variantDataProtein: React.PropTypes.array,
		dnaLength: React.PropTypes.number,
		proteinLength: React.PropTypes.number,
		strand: React.PropTypes.string, // "+" or "-"
		isProteinMode: React.PropTypes.bool,
		domains: React.PropTypes.array,
		downloadCaption: React.PropTypes.string,
	},

	getInitialState: function () {
		var _store = this._getNewStore();

		return {
			highlightedAlignedSegment: null, // [0, 100] relative coord to aligned sequence
			parsetVisible: false,
			x1Scale: function () { return 0; },
			x2Scale: function () { return 0; },
			store: _store
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
		var featureData = this.state.store.getFeatureTrackData("variantViewer");
		var _features = featureData.features;
		var _focusFeature = _features[0];
		var _onSetX1Scale = scale => {
			this.setState({ x1Scale: scale });
		};
		var model = this._getModel();
		var refCoordinates;
		var baseArr = this.props.isProteinMode ? this.props.variantDataProtein : this.props.variantDataDna;
	        var _variantData = baseArr.map( d => {
		        var start = d.start;
		        var end = d.end;
		        if (this.props.isProteinMode) {
			    start = d.dna_start;
			    end = d.dna_end;
			}
			refCoordinates = model.getReferenceCoordinatesFromAlignedCoordinates(start, end, this.props.isProteinMode);
			return _.extend(d, {
				coordinates: [d.start, d.end],
				referenceCoordinates: [refCoordinates.start, refCoordinates.end],
				type: d.variant_type
			});
		});
		var _highlightedSegment = null;
		var hs = this.state.highlightedAlignedSegment;
		if (hs) {
			var obj = model.getReferenceCoordinatesFromAlignedCoordinates(hs[0], hs[1], this.props.isProteinMode);
			_highlightedSegment = [obj.start, obj.end];
		}
		var _onForceUpdate = () => {
			this.forceUpdate();
		}
		var _domains = (this.props.isProteinMode && this.props.domains) ? this.props.domains: null;
		var _chromStart = Math.min(featureData.position.chromStart, featureData.position.chromEnd);
		var _chromEnd = Math.max(featureData.position.chromStart, featureData.position.chromEnd);

		var forceLength;
		if (this.props.isProteinMode && this.props.proteinLength) forceLength = this.props.proteinLength;

		return (<FeatureViewer
			featureTrackId={"variantViewer"}
			store={this.state.store}
			domains={_domains}
			canScroll={true}
			chromStart={_chromStart}
			chromEnd={_chromEnd}
			contigName={this.props.contigName}
			contigHref={this.props.contigHref}
			downloadCaption={this.props.downloadCaption}
			features={_features}
			focusFeature={_focusFeature}
			highlightedSegment={_highlightedSegment}
			onSetScale={_onSetX1Scale}
			variantData={_variantData}
			onHighlightSegment={this._highlightSegment}
			onForceUpdate={_onForceUpdate}
			isRelative={true}
			drawIntrons={!this.props.isProteinMode}
			forceLength={forceLength}
			model={model}
			isProteinMode={this.props.isProteinMode}
		/>);
	},

	_renderParset: function () {
		var _alignedCoord = this.state.highlightedAlignedSegment || [0, 0];
		// get ref highlighted coord
		var model = this._getModel();
		var _refCoord = model.getReferenceCoordinatesFromAlignedCoordinates(_alignedCoord[0], _alignedCoord[1], this.props.isProteinMode);
		_refCoord = [_refCoord.start, _refCoord.end];
		var offset = this.props.isRelative ? 0 : this.props.chromStart;
		var parsetX1Coord = _refCoord
			.map( d => {
				return this.state.x1Scale(d + offset);
			});
		var parsetX2Coord = _alignedCoord
			.map( d => {
				return this.state.x2Scale(d) + LABEL_WIDTH;
			});
		// if a SNP (actually one nucleotide) make the text refer to the position, not a range
		if (Math.abs(_refCoord[1] - _refCoord[0]) === 1) {
			var _coord = (this.props.strand === "+") ? _refCoord[0] : _refCoord[1];
		}
		return (<Parset ref="parset"
			isVisible={true}
			x1Coordinates={parsetX1Coord}
			x2Coordinates={parsetX2Coord}
		/>);
	},

	_renderSequence: function () {
		var model = this._getModel();
		var _sequences = model.formatSequences(this.props.isProteinMode, this.props.strainIds);
		var _segments = model.formatSegments(this.props.isProteinMode);
		var _onSetX2Scale = scale => {
			this.setState({ x2Scale: scale });
		};

		return (
			<div>
				<MultiAlignmentViewer ref="multiAlignmentViewer"
					segments={_segments} sequences={_sequences}
					onSetScale={_onSetX2Scale} onHighlightSegment={this._highlightSegment}
					highlightedSegmentDomain={this.state.highlightedAlignedSegment}
					isProteinMode={this.props.isProteinMode}
				/>
			</div>
		);
	},

	_highlightSegment: function (start, end) {
		this.setState({ highlightedAlignedSegment: [start, end] })
	},

	_getModel: function () {
		return new AlignmentModel({
			alignedDnaSequences: this.props.alignedDnaSequences,
			alignedProteinSequences: this.props.alignedProteinSequences,
			variantDataDna: this.props.variantDataDna,
			variantDataProtein: this.props.variantDataProtein
		});
	},

	_getNewStore: function () {
		var _chromStart = this.props.chromStart;
		var _chromEnd = this.props.chromEnd;
		var _strand = this.props.strand || "+";
		var _blockSizes = this.props.blockSizes || [Math.abs(_chromEnd - _chromStart)];
		var _blockStarts = this.props.blockStarts || [0];
		var _chrom = this.props.contigName || "";
		
		// make default feature viewer store
		var featureTrackData = {
				id: "variantViewer",
				position: {
					chromStart: _chromStart,
					chromEnd: _chromEnd
				},
				features: [
					{
						chrom: _chrom,
						chromStart: _chromStart,
						chromEnd: _chromEnd,
						strand: _strand,
						blockSizes: _blockSizes,
						blockStarts: _blockStarts
					}
				]
			};
		var store = new FeatureViewerStore();
		store.addFeatureTrack(featureTrackData);
		return store;
	}
});

module.exports = VariantViewer;
