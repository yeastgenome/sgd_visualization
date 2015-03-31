/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");
var FlexibleTooltip = require("./flexible_tooltip.jsx");
var GenerateTrapezoidPath = require("./generate_trapezoid_path.jsx");
var StandaloneAxis = require("./standalone_axis.jsx");

var DOMAIN_NODE_HEIGHT = 10;
var DOMAIN_TEXT_FONT_SIZE = 14;
var LOCUS_HEIGHT = 40;
var PX_PER_DOMAIN = 24;
var LOCUS_FILL = "#696599";

var ProteinViewer = React.createClass({
	mixins: [CalcWidthOnResize],

	propTypes: {
		data: React.PropTypes.array.isRequired,
		locusData: React.PropTypes.object.isRequired
	},

	getInitialState: function () {
		return {
			DOMWidth: 400,
			mouseOverDomainId: null
		};
	},
	
	render: function () {
		return (
			<div className="sgd-viz protein-viewer">
				{this._renderLabels()}
				{this._renderViz()}
			</div>
		);
	},

	componentDidMount: function () {
		this._calculateWidth();
	},

	_calculateWidth: function () {
		var vizNodeWidth = this.refs.vizNode.getDOMNode().getBoundingClientRect().width;
		this.setState({ DOMWidth: vizNodeWidth });
	},

	_renderLabels: function () {
		var sources = this._getSources();

		var y = this.props.locusData ? 50 : 0;
		var node;
		var labelNodes = sources.map( (d, i) => {
			node = (
				<div key={"proteinViewerLabel" + i} style={{ position: "absolute", top: y }}>
					<label>{d.name}</label>
				</div>
			);
			y += d.numberDomains * PX_PER_DOMAIN;
			return node;
		});
		return (
			<div className="protein-viewer-label-container" style={{ position: "relative" }}>
				{labelNodes}
			</div>
		);
	},

	_renderViz: function () {
		var domain = this._getXScale().domain();
		var height = this._getHeight();

		return (
			<div className="protein-viewer-viz-container"  style={{ position: "relative", width: "100%", height: height }}>
				<StandaloneAxis
					domain={domain}
					leftRatio={0.20}
					gridTicks={true}
					orientation="bottom"
				/>
				<div ref="vizNode" style={{ width: "80%", height: height, left: "20%", position: "absolute", top: 0, border: "1px solid #ddd"}}>
					{this._getSVGNode()}
					{this._getTooltipNode()}
				</div>
			</div>
		);
	},

	_getSVGNode: function () {
		var xScale = this._getXScale();
		var yScale = this._getYScale();
		var colorScale = this._getColorScale();
		var domainNodeY = PX_PER_DOMAIN - DOMAIN_NODE_HEIGHT;
		var domainNodeLineY = PX_PER_DOMAIN - DOMAIN_NODE_HEIGHT + DOMAIN_NODE_HEIGHT / 2;

		var transform, length, strokeColor;
		var domainNodes = this.props.data.map( (d, i) => {
			transform = `translate(${xScale(d.start)}, ${yScale(i)})`;
			length = Math.round(Math.abs(xScale(d.start) - xScale(d.end)));
			strokeColor = colorScale(d.source.name);
			var _onMouseOver = (e) => { this._onDomainMouseOver(e, d); };
			return (
				<g 	onMouseOver={_onMouseOver} key={"proteinDomain" + i} transform={transform}>
					<text x="3" y={DOMAIN_TEXT_FONT_SIZE} fontSize={DOMAIN_TEXT_FONT_SIZE}>{d.domain.name}</text>
					<line strokeWidth="2" stroke={strokeColor} x1="0" x2={length} y1={domainNodeLineY} y2={domainNodeLineY}/>
					<line strokeWidth="2" stroke={strokeColor} x1="0" x2="0" y1={domainNodeY} y2={PX_PER_DOMAIN}/>
					<line strokeWidth="2" stroke={strokeColor} x1={length} x2={length} y1={domainNodeY} y2={PX_PER_DOMAIN}/>
					<rect x="0" y="0" width={length} height={PX_PER_DOMAIN} fill="none"/>
				</g>
			);
		});

		return (
			<svg width={this.state.DOMWidth} height={this._getHeight()}>
				{this._getLocusNode()}
				{domainNodes}
			</svg>
		);
	},

	_getLocusNode: function () {
		if (!this.props.locusData) return null;
		var width = this._getXScale()(this.props.locusData.end);
		var pathString = GenerateTrapezoidPath(width);
		var lineY = LOCUS_HEIGHT - 13;
		var endX = this._getXScale().range()[1] - 2;
		return (
			<g transform="translate(0, 7)">
				<line x1="0" x2={endX} y1={lineY} y2={lineY} stroke="black" strokeDasharray="5 3" />
				<path d={pathString} fill={LOCUS_FILL}/>
				<text x={width/2} y={DOMAIN_TEXT_FONT_SIZE} fontSize={DOMAIN_TEXT_FONT_SIZE} fill="white" anchor="middle">
					{this.props.locusData.name}
				</text>
			</g>
		);
	},

	_getTooltipNode: function () {
		if (!this.state.mouseOverDomainId) return null;

		var d = _.find(this.props.data, d => { return d.domain.id === this.state.mouseOverDomainId; });
		var xScale = this._getXScale();
		var yScale = this._getYScale();
		var left = xScale(d.start);
		var top = yScale(this.props.data.indexOf(d));
		return (<FlexibleTooltip
			visible={true}
			left={left}
			top={top}
			text="Hola Mundo"
		/>);
	},

	_onDomainMouseOver: function (e, d) {
		this.setState({
			mouseOverDomainId: d.domain.id
		});
	},

	_getSources: function () {
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
	},

	_getXScale: function () {
		var locusData = this.props.locusData;
		return d3.scale.linear()
			.domain([locusData.start, locusData.end])
			.range([0, this.state.DOMWidth]);
	},

	_getYScale: function () {
		var _length = this.props.data.length;
		var _startY = this.props.locusData ? LOCUS_HEIGHT : 0;
		return d3.scale.linear()
			.domain([0, _length])
			.range([_startY,  _length * PX_PER_DOMAIN + _startY]);
	},

	_getColorScale: function () {
		var sources = this._getSources()
			.map( d => { return d.name; });
		return d3.scale.category10()
			.domain(sources);
	},

	_getHeight: function () {
		return this._getYScale().range()[1] + DOMAIN_TEXT_FONT_SIZE;
	}
});

module.exports = ProteinViewer;
