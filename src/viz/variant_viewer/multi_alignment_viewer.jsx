"use strict";
import d3 from 'd3';
import React,{Component} from 'react';
import _ from 'underscore';
import Radium from 'radium';
import PropTypes from 'prop-types';

import getJaggedScale  from './get_jagged_scale';
import MultiScaleAxis from './multi_scale_axis.jsx';

class MultiAlignmentViewer extends Component{
	
	constructor(props){
		super(props);
		this.state = {activeSequenceName: null};
		this._onScroll = this._onScroll.bind(this);
	}

	render() {
		var xScale = this._getXScale();
		var maxX = _.max(xScale.range());
		var svgHeight = (this.props.sequences.length + 3) * (PX_PER_CHAR + 3);

		return (<div>
			{this._getLabelsNode()}
			<div ref="scroller" style={[style.scroller]}>
				<div style={{ width: maxX + FONT_SIZE }}>
					<MultiScaleAxis segments={this.props.segments} scale={xScale} />
					<svg ref="svg" style={{ width: maxX + FONT_SIZE, height: svgHeight }}>
						{this._getSegmentNodes()}
						{this._getVisibleSegmentNodes()}
					</svg>
				</div>
			</div>
		</div>);
	}

	componentDidMount(){
		if (this.props.onSetScale) {
			var _scale = this._getXScale();
			this.props.onSetScale(_scale);
		}
		this.refs.scroller.onscroll = this._onScroll;
	}

	componentDidUpdate(prevProps, prevState) {
		var didProteinUpdate = (prevProps.isProteinMode !== this.props.isProteinMode);
		if (typeof this.props.onSetScale === "function" && didProteinUpdate) {
			var scale = this._getXScale();
			this.props.onSetScale(scale);
		}
	}

	_onScroll(e) {
		if (!this.props.onSetScale) return;
		var _scrollLeft = this.refs.scroller.scrollLeft;
		var _xScale = this._getXScale();
		var _oldRange = _xScale.range();
		var _newRange = _oldRange.map( d => {
			return d - _scrollLeft;
		});
		var _newScale = _xScale
			.copy()
			.range(_newRange);
		this.props.onSetScale(_newScale);
	}

	_onSegmentMouseOver(e, d, i, sequenceName) {
		if (this.props.onHighlightSegment) {
			var _start = d.domain[0] - 1;
			var _end = d.domain[1] - 1;
			this.props.onHighlightSegment(_start, _end);
		}
		this.setState({ activeSequenceName: sequenceName });
	}

	_clearMouseOver() {
		if (this.props.onHighlightSegment) this.props.onHighlightSegment(null);
		this.setState({ activeSequenceName: null });
	}

	_getLabelsNode() {
		var yScale = this._getYScale();
		var labelNodes = _.map(this.props.sequences, (s, i) => {
			var _style = [style.sequenceLabel, { top: yScale(s.name) + 28 }];
			var indicatorNode = (this.state.activeSequenceName === s.name) ? <i className="fa fa-chevron-right"></i> : null;
			return <a href={s.href} key={"sequenceAlignLabel" + i} target="_new" style={_style}>{indicatorNode} {s.name}</a>
		});
		return (<div style={[style.sequenceLabelContainer]}>
			{labelNodes}
		</div>);
	}

	_getSegmentNodes() {
		var xScale = this._getXScale();
		return _.map(this.props.segments, (s, i) => {
			var offset = s.visible ? PX_PER_CHAR / 2 : 0;
			var _x = xScale(s.domain[0]) - offset;
			var _y = 0;
			var _width = xScale(s.domain[1]) - xScale(s.domain[0]) + offset;
			var _height = this.props.sequences.length * FONT_SIZE + 3;
			var _fill = (i === this.state.mouseOverSegmentIndex) ? "#DEC113" : "none";
			var _opacity = 0.5;
			var _onMouseOver = e => {
				this._onSegmentMouseOver(e, s, i);
			};
			return <rect onMouseOver={_onMouseOver} key={"segRect" + i} x={_x} y={_y} width={_width} height={_height} fill={"none"} stroke="none" opacity={_opacity} style={{ pointerEvents: "all" }} />;
		});
	}

	_getVisibleSequenceNodes(seg, i) {
		var xScale = this._getXScale();
		var yScale = this._getYScale();
		return _.map(this.props.sequences, (seq, _i) => {
			var _seqText = seq.sequence.slice(seg.domain[0] - 1, seg.domain[1] - 1)
			var _transform = `translate(${xScale(seg.domain[0] - 1)}, ${yScale(seq.name)})`;
			var _onMouseOver = e => {
				this._onSegmentMouseOver(e, seg, i, seq.name);
			};
			return <text onMouseOver={_onMouseOver} key={"variantSeqNode" + i + "_" + _i} transform={_transform} fontSize={FONT_SIZE} fontFamily="Courier" >{_seqText}</text>;
		});
	}

	_getVisibleSegmentNodes() {
		return _.reduce(this.props.segments, (memo, seg, i) => {
			if (seg.visible) {
				memo = memo.concat(this._getVisibleSequenceNodes(seg, i));
			}
			return memo;
		}, []);
	}

	// returns a d3 scale which has multiple linear scale segments corresponding to segments prop
	_getXScale() {
		return getJaggedScale(this.props.segments);
	}

	_getYScale() {
		var height = (this.props.sequences.length + 1) * (PX_PER_CHAR + 3);
		var names = _.map(this.props.sequences, s => { return s.name; });
		return d3.scale.ordinal()
			.domain(names)
			.rangePoints([PX_PER_CHAR + 3, height + PX_PER_CHAR]);
	}
}

MultiAlignmentViewer.propTypes = {
	// highlightedSegmentDomain: null or [start, end]
	onHighlightSegment: PropTypes.func, // (start, end) =>
	onSetScale: PropTypes.func, // scale =>
	segments: PropTypes.array.isRequired,
	sequences: PropTypes.array.isRequired,
	isProteinMode: PropTypes.bool
}

MultiAlignmentViewer.defaultProps = {
	highlightedSegmentDomain: null
}

var FONT_SIZE = 14;
var LABEL_WIDTH = 150;
var PX_PER_CHAR = 9.25;
var TICK_HEIGHT = 6;

// CSS in JS
var style = {
	scroller: {
		marginLeft: LABEL_WIDTH,
		overflow: "scroll"
	},

	sequenceLabelContainer: {
		position: "absolute",
		height: "100%",
		background: "inherit",
		width: LABEL_WIDTH
	},

	sequenceLabel: {
		position: "absolute",
		right: "1rem"
	}
};


export default Radium(MultiAlignmentViewer);
