"use strict";

import d3 from 'd3';
import React,{Component} from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';

// style static elements
var HEIGHT = 70;
var HIGHLIGHT_COLOR = "#EBDD71";
var LINE_HEIGHT = 6;

class Parset extends Component{
	constructor(props){
		super(props);
	}

	render(){
		var _x1C = this.props.x1Coordinates;
		var _x2C = this.props.x2Coordinates;
		var x1 = [_x1C[0], _x1C[1]];
		var x2 = [_x2C[0], _x2C[1]];
		var _polygonString = `${x1[0]},0 ${x1[1]},0 ${x2[1]},${HEIGHT - LINE_HEIGHT} ${x2[0]},${HEIGHT - LINE_HEIGHT}`;

		var polygonNode = !this.props.isVisible ? null : <polygon points={_polygonString} fill={HIGHLIGHT_COLOR} />;
		var x1LineNode = this._getX1LineNode();
		var x2LineNode = this._getX2LineNode();

		return (<div className="parset" style={{ height: HEIGHT, position: "relative" }}>
			<svg width="100%" height={HEIGHT}>
				{x1LineNode}
				{polygonNode}
				{x2LineNode}
			</svg>
		</div>);
	}

	_getX1LineNode() {
		return null;
		if (!this.props.isVisible) return null;
		var _x1C = this.props.x1Coordinates;
		return (<g>
			<line x1={_x1C[0]} x2={_x1C[0]} y1={0} y2={LINE_HEIGHT} stroke="black" />
			<line x1={_x1C[0]} x2={_x1C[1]} y1={LINE_HEIGHT} y2={LINE_HEIGHT} stroke="black" />
			<line x1={_x1C[1]} x2={_x1C[1]} y1={0} y2={LINE_HEIGHT} stroke="black" />
		</g>);
	}

	_getX2LineNode() {
		if (!this.props.isVisible) return null;

		var _x2C = this.props.x2Coordinates;
		return (<g>
			<line x1={_x2C[0]} x2={_x2C[0]} y1={HEIGHT - LINE_HEIGHT} y2={HEIGHT} stroke="black" />
			<line x1={_x2C[0]} x2={_x2C[1]} y1={HEIGHT - LINE_HEIGHT} y2={HEIGHT - LINE_HEIGHT} stroke="black" />
			<line x1={_x2C[1]} x2={_x2C[1]} y1={HEIGHT - LINE_HEIGHT} y2={HEIGHT} stroke="black" />
		</g>);
	}
}

Parset.propTypes = {
	isVisible: PropTypes.bool,
	x1Coordinates: PropTypes.array,
	x2Coordinates: PropTypes.array
}

Parset.defaultProps = {
	isVisible: false,
	text: ""
}

export default Parset;
