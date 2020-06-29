"use strict";

import d3 from 'd3';
import React,{Component} from 'react';
import PropTypes from 'prop-types';

import CalcWidthOnResize from '../mixins/calc_width_on_resize.jsx';
class StandaloneAxis extends Component{
	constructor(props){
		super(props);
		this.state = {scale: null};
		this._calculateWidth = this._calculateWidth.bind(this);
	}

	render() {
		var labelNode = this.props.labelText ?
			<p className="axis-label" style={{ marginLeft: `${this.props.leftRatio * 100}%`, position: "relative" }}>{this.props.labelText}</p> :
			null;

		var _height = this.props.height || (this.props.gridTicks ? "100%" : 32);
		var _klass = `standalone-axis ${this.props.gridTicks ? "grid-ticks" : ""}`;
		var _containerStyle = { position: "relative" };
		if (this.props.gridTicks) _containerStyle.height = "100%";
		return (<div ref={(wrapper) => this.wrapper=wrapper} className={_klass} style={_containerStyle}>
			{labelNode}
			<svg ref={(svg) => this.svg = svg} style={{ width: "100%", height: _height }}></svg>
		</div>);
	};

	// After initial render, calculate the scale (based on width), which will then trigger update, which eventually
	// renders d3 SVG axis.
	componentDidMount() {
		this.setState({isMounted:true},this._calculateScale());
	};

	componentWillUnmount(){
		this.setState({isMounted:false});
	}

	componentWillReceiveProps(nextProps) {
		this._calculateScale(nextProps);
	};

	componentDidUpdate() {
		this._renderSVG();
	};

	// called by mixin
	_calculateWidth(){
		if(this.state.isMounted){
			this._calculateScale();
		}
	};

	_calculateScale(nextProps) {
		
		var props = nextProps || this.props;
		// maxValue can't be null
		if (props.maxValue === null) return;

		// list of possible scale types
		var scaleTypes = {
			linear: d3.scale.linear(),
			sqrt: d3.scale.sqrt()
		};
		var _baseScale = scaleTypes[this.props.scaleType];
		
		var _width = this.wrapper.getBoundingClientRect().width - 1;
		var _xOffset = _width * props.leftRatio;
		var _scale = _baseScale.domain(props.domain).range([0, _width - _xOffset]);

		this.setState({
			scale: _scale
		});
	};

	// render d3 axis 
	_renderSVG(){
		// must have scale calculated
		if (!this.state.scale) return;

		var _tickSize = this.props.gridTicks ? (-this.wrapper.offsetHeight) : 6;
		var axisFn = d3.svg.axis()
			.orient(this.props.orientation)
			.ticks(this.props.ticks)
			.tickFormat(this.props.tickFormat)
			.tickSize(_tickSize)
			.scale(this.state.scale);

		var svg = d3.select(this.svg);
		
		var _xTranslate = (this.wrapper.getBoundingClientRect().width * this.props.leftRatio)
		var _yTranslate = (this.props.orientation === "top") ? 30 : 0;
		if (this.props.gridTicks && this.props.orientation === "bottom") {
			_yTranslate += this.wrapper.getBoundingClientRect().height - 24;
		}
		var _translate = `translate(${_xTranslate}, ${_yTranslate})`;
		var axis = svg.selectAll("g.axis").data([null]);
		axis.enter().append("g")
			.attr({
				class: "axis",
				transform: _translate
			});
		axis.transition().duration(this.props.transitionDuration)
			.attr({ transform: _translate })
			.call(axisFn);
	};
}

StandaloneAxis.propTypes = {
	domain: PropTypes.array.isRequired, // * d3 style i.e. [0, 100]
	gridTicks: PropTypes.bool,
	labelText: PropTypes.string,
	leftRatio: PropTypes.number,
	orientation: PropTypes.string, // *
	scaleType: PropTypes.string, // ["linear", "sqrt"]
	ticks: PropTypes.number,
	tickFormat: PropTypes.func, // d3 style
	transitionDuration: PropTypes.number // millis
}

StandaloneAxis.defaultProps={
	gridTicks: false,
	leftRatio: 0,
	orientation: "top", // [top, right, bottom, left]
	scaleType: "linear",
	ticks: 3,
	transitionDuration: 0
}

export default CalcWidthOnResize(StandaloneAxis);
