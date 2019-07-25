"use strict";
import d3 from 'd3';
import React,{Component} from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';

import AssignTracksToDomains from './assign_tracks_to_domains'; 
import CalcWidthOnResize from '../mixins/calc_width_on_resize';
import FlexibleTooltip from './flexible_tooltip';
import GenerateTrapezoidPath from './generate_trapezoid_path';
import StandaloneAxis from './standalone_axis';

var DOMAIN_NODE_HEIGHT = 10;
var DOMAIN_TEXT_FONT_SIZE = 14;
var LOCUS_HEIGHT = 40;
var MOUSE_LEAVE_DELAY = 250;
var PX_PER_DOMAIN = 24;
var PX_PER_CHAR = 7;
var LOCUS_FILL = "#696599";

class ProteinViewer extends Component{
	constructor(props){
		super(props);
		this.state={DOMWidth: 400,mouseOverDomainId: null};
		this._onDomainMouseLeave = this._onDomainMouseLeave.bind(this);
		this._calculateWidth = this._calculateWidth.bind(this);
	}

	render(){
		return(
      <div>
				{this._renderLabels()}
				{this._renderViz()}
			</div>
		)
	}

  componentDidMount(){
		this.setState({isMounted:true},this._calculateWidth);
  }

	componentWillUnmount(){
		this.setState({isMounted:false});
	}

  _calculateWidth() {
		if(this.state.isMounted){
			var vizNodeWidth = this.refs.vizNode.getBoundingClientRect().width;
			this.setState({ DOMWidth: vizNodeWidth });
		}
	}

  _renderLabels() {
		var sources = this._getSources();

		var trackedDomains = this._getTrackedDomains();
		var startY = this.props.locusData ? LOCUS_HEIGHT : 0;
		var node, sourceDomains, lowestTrackNum, _top;
		var labelNodes = sources.map( (d, i) => {
			// find domain with lowest track num corresponding to this label
			sourceDomains = _.filter(trackedDomains, _d => { return _d.source.id === d.id; });
			lowestTrackNum = d3.min(sourceDomains, _d => { return _d._track; });
			_top = startY + lowestTrackNum * PX_PER_DOMAIN;
			node = (
				<div key={"proteinViewerLabel" + i} style={{ position: "absolute", top: _top, right: "1rem" }}>
					<label>{d.name}</label>
				</div>
			);
			return node;
		});
		return (
			<div className="protein-viewer-label-container" style={{ position: "relative", width: "20%" }}>
				{labelNodes}
			</div>
		);
	}

  _renderViz() {
		var domain = this._getXScale().domain();
		var height = this._getHeight();

		return (
			<div onMouseLeave={this._onDomainMouseLeave} className="protein-viewer-viz-container"  style={{ position: "relative", width: "100%", height: height + 24 }}>
				<StandaloneAxis domain={domain} leftRatio={0.20} gridTicks={true} orientation="bottom" />
				<div ref="vizNode" style={{ width: "80%", height: height, left: "20%", position: "absolute", top: 0, border: "1px solid #ddd"}}>
					{this._getSVGNode()}
					{this._getTooltipNode()}
				</div>
			</div>
		);
	}

  _getSVGNode() {
		var xScale = this._getXScale();
		var yScale = this._getYScale();
		var colorScale = this._getColorScale();
		var domainNodeY = PX_PER_DOMAIN - DOMAIN_NODE_HEIGHT;
		var domainNodeLineY = PX_PER_DOMAIN - DOMAIN_NODE_HEIGHT + DOMAIN_NODE_HEIGHT / 2;

		var transform, length, strokeColor, text, textCanFit, textNode, y;
		var trackedDomains = this._getTrackedDomains();
		var startY = this.props.locusData ? LOCUS_HEIGHT : 0;
		var domainNodes = trackedDomains.map( (d, i) => {
			y = startY + d._track * PX_PER_DOMAIN;
			transform = `translate(${xScale(d.start)}, ${y})`;
			length = Math.round(Math.abs(xScale(d.start) - xScale(d.end)));
			strokeColor = colorScale(d.source.name);
			var _onMouseOver = e => { this._onDomainMouseOver(e, d); };
			text = d.domain.name;
			textCanFit = text.length * PX_PER_CHAR < length;
			textNode = null;
			if (textCanFit) {
				textNode = <text x="3" y={DOMAIN_TEXT_FONT_SIZE} fontSize={DOMAIN_TEXT_FONT_SIZE}>{text}</text>;
			}
			var backFill = (d.domain.id === this.state.mouseOverDomainId) ? "gray" : "none";

			return (
				<g onMouseOver={_onMouseOver} key={"proteinDomain" + i} transform={transform}>
					<rect x="0" y="0" width={length} height={PX_PER_DOMAIN} fill={backFill} opacity={0.10}/>
					{textNode}
					<line strokeWidth="2" stroke={strokeColor} x1="0" x2={length} y1={domainNodeLineY} y2={domainNodeLineY}/>
					<line strokeWidth="2" stroke={strokeColor} x1="0" x2="0" y1={domainNodeY} y2={PX_PER_DOMAIN}/>
					<line strokeWidth="2" stroke={strokeColor} x1={length} x2={length} y1={domainNodeY} y2={PX_PER_DOMAIN}/>
				</g>
			);
		});

		return (
			<svg width={this.state.DOMWidth} height={this._getHeight()}>
				{this._getLocusNode()}
				{domainNodes}
			</svg>
		);
	}

  _getLocusNode() {
		if (!this.props.locusData) return null;
		var width = this._getXScale()(this.props.locusData.end);
		var pathString = GenerateTrapezoidPath(width);
		var lineY = LOCUS_HEIGHT - 13;
		var endX = this._getXScale().range()[1] - 2;

		return (
			<g transform="translate(0, 7)">
				<line x1="0" x2={endX} y1={lineY} y2={lineY} stroke="#ddd" strokeDasharray="5 3" />
				<path d={pathString} fill={LOCUS_FILL}/>
				<text x={width/2} y={DOMAIN_TEXT_FONT_SIZE} fontSize={DOMAIN_TEXT_FONT_SIZE} fill="white" textAnchor="middle">
					{this.props.locusData.name}
				</text>
			</g>
		);
	}

  _getTooltipNode() {
		if (!this.state.mouseOverDomainId) return null;
		
		var d = _.find(this.props.data, d => { return d.domain.id === this.state.mouseOverDomainId; });
		var xScale = this._getXScale();
		var left = xScale(d.start);
		var startY = this.props.locusData ? LOCUS_HEIGHT : 0;
		var top = startY + d._track * PX_PER_DOMAIN;
		var _coordString = `${d.start}..${d.end}`;
		var tooltipData = {
			Coords: _coordString,
		};
		if (d.domain.description) tooltipData.Description = d.domain.description;
		return (<FlexibleTooltip
			visible={true}
			left={left}
			top={top}
			title={d.domain.name}
			href={d.domain.href}
			data={tooltipData}
		/>);
	}

  _onDomainMouseOver(e, d) {
		if (this._mouseLeaveTimeout) clearTimeout(this._mouseLeaveTimeout)
		this.setState({ mouseOverDomainId: d.domain.id });
	}

	_onDomainMouseLeave() {
		this._mouseLeaveTimeout = setTimeout( () => {
			if (this.state.isMounted) {
				this.setState({ mouseOverDomainId: null });
			}
		}, MOUSE_LEAVE_DELAY);
	}

	_getSources() {
		var _groupedData = _.groupBy(this.props.data, d => {
			return d.source.name;
		});
		var _keys = _.keys(_groupedData);
		var _dataAsArray = _keys.map( d => {
			var _baseData = _groupedData[d][0].source;
			// add data length
			var _length =  _groupedData[d].length;
			return _.extend(_baseData, { numberDomains: _length });
		});
		return _dataAsArray;
	}

	_getTrackedDomains() {
		// cache to this._trackedDomains
		if (!this._trackedDomains) {
			this._trackedDomains = AssignTracksToDomains(this.props.data);
		}
		return this._trackedDomains;
	}

	_getXScale() {
		var locusData = this.props.locusData;
		return d3.scale.linear()
			.domain([locusData.start, locusData.end])
			.range([-2, this.state.DOMWidth - 2]);
	}

	_getYScale() {
		var startY = this.props.locusData ? LOCUS_HEIGHT : 0;
		var domain = [];
		var range = [];
		var sources = this._getSources();
		var trackedDomains = this._getTrackedDomains();
		var sourceY = startY;
		var groupedDomains, maxTracks;
		sources.forEach( d => {
			groupedDomains = _.filter(trackedDomains, _d => { return d.id === _d.source.id; });
			maxTracks = d3.max(groupedDomains, _d => { return _d._track; });
			domain.push(d.id);
			range.push(sourceY);
			sourceY += (maxTracks + 1) * PX_PER_DOMAIN;
		});
		range.push(sourceY);

		return d3.scale.ordinal()
			.domain(domain)
			.range(range);
	}

	_getColorScale() {
		if (this.props.colorScale) return this.props.colorScale;
		var sources = this._getSources()
			.map( d => { return d.name; });
		return d3.scale.category10()
			.domain(sources);
	}

	_getHeight() {
		var trackedDomains = this._getTrackedDomains();
		var heightestTrackNum = d3.max(trackedDomains, d => { return d._track; });
		return (heightestTrackNum + 2) * PX_PER_DOMAIN + LOCUS_HEIGHT;
	}
};

ProteinViewer.propTypes = {
		data: PropTypes.array.isRequired,
		locusData:PropTypes.object.isRequired,
		colorScale:PropTypes.func // optional d3-ish scale
};

export default CalcWidthOnResize(ProteinViewer);
