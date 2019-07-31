"use strict";
import d3 from 'd3';
import React,{Component} from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';

var TICK_HEIGHT = 6;
var HEIGHT = 40;

class MultiScaleAxis extends Component{
	constructor(props){
		super(props);
	}

	render(){
		var tickNodes = this._getTickNodes();
		var segmentNodes = this._getSegmentNodes();

		return (<svg ref={(svg)=> this.svg=svg} style={{ width: "100%", height: HEIGHT }}>
			{tickNodes}
			{segmentNodes}
		</svg>);
	}

	_getSegmentNodes() {
		var scale = this.props.scale;
		var segmentNodes= _.map(this.props.segments, (s, i) => {
			var _y = HEIGHT - 1;
			return (<line key={"segmentLine" + i}
				x1={scale(s.domain[0] - 1)}
				x2={scale(s.domain[1] - 1)}
				y1={_y}
				y2={_y}
				strokeDasharray={s.visible ? null : "3px 3px"}
				stroke="black"
				fill="none"
			/>);
		});
		return segmentNodes;
	}

	_getSegmentNodes() {
		var scale = this.props.scale;
		var segmentNodes= _.map(this.props.segments, (s, i) => {
			var _y = HEIGHT - 1;
			return (<line key={"segmentLine" + i}
				x1={scale(s.domain[0] - 1)}
				x2={scale(s.domain[1] - 1)}
				y1={_y}
				y2={_y}
				strokeDasharray={s.visible ? null : "3px 3px"}
				stroke="black"
				fill="none"
			/>);
		});
		return segmentNodes;
	}

	_getTickNodes() {
		var scale = this.props.scale;

		var tickData = _.reduce(this.props.segments, (memo, s) => {
			if (s.domain[1] - s.domain[0] === 1) {
				return memo;
			} else {
				memo.push(s.domain[1]);
				return memo;
			}
		}, [1]);
		
		var tickNodes = _.map(tickData, (t, i) => {
			var _transform = `translate(${scale(t - 0.5)}, ${HEIGHT - TICK_HEIGHT - 1})`;
			var _textTransform = `translate(5, 0) rotate(-90)`;
			return (<g key={"tick" + i} transform={_transform}>
				<text textAnchor="left" transform={_textTransform}>{t}</text>
				<line x1="0" x2="0" y1="2" y2={TICK_HEIGHT + 2} stroke="black" fill="none" />
			</g>);
		});
		return <g>{tickNodes}</g>
	}

}

MultiScaleAxis.propTypes = {
	segments: PropTypes.array.isRequired,
	scale: PropTypes.func.isRequired
}

export default MultiScaleAxis;
