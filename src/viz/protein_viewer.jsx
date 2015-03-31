/** @jsx React.DOM */
"use strict";
var React = require("react");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");
var StandaloneAxis = require("./standalone_axis.jsx");

var PX_PER_DOMAIN = 27;
var DOMAIN_NODE_HEIGHT = 15;
var DOMAIN_TEXT_FONT_SIZE = 14;

var ProteinViewer = React.createClass({
	mixins: [CalcWidthOnResize],

	propTypes: {
		data: React.PropTypes.array.isRequired,
		locusData: React.PropTypes.object.isRequired
	},

	getInitialState: function () {
		return {
			DOMWidth: 400
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

		var y = 0;
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

		return (
			<div className="protein-viewer-viz-container"  style={{ position: "relative", width: "100%", height: 122 }}>
				<StandaloneAxis
					domain={domain}
					leftRatio={0.20}
					gridTicks={true}
					orientation="bottom"
				/>
				<div ref="vizNode" style={{ width: "80%", height: 122, left: "20%", position: "absolute", top: 0, border: "1px solid #ddd"}}>
					{this._renderSVG()}
				</div>
			</div>
		);
	},

	_renderSVG: function () {
		var xScale = this._getXScale();
		var yScale = this._getYScale();
		var domainNodeY = PX_PER_DOMAIN - DOMAIN_NODE_HEIGHT;
		var domainNodeLineY = PX_PER_DOMAIN - DOMAIN_NODE_HEIGHT + DOMAIN_NODE_HEIGHT / 2;

		var transform, length, strokeColor;
		// TEMP hardcoded stroke color
		strokeColor = "black";
		var domainNodes = this.props.data.map( (d, i) => {
			transform = `translate(${xScale(d.start)}, ${yScale(i)})`;
			length = Math.round(Math.abs(xScale(d.start) - xScale(d.end)));
			var _onMouseOver = (e) => { this._onDomainMouseOver(e, d); };
			return (
				<g key={"proteinDomain" + i} transform={transform}>
					<text x="5" y={DOMAIN_TEXT_FONT_SIZE} fontSize={DOMAIN_TEXT_FONT_SIZE}>{d.domain.name}</text>
					<line strokeWidth="2" stroke={strokeColor} x1="0" x2={length} y1={domainNodeLineY} y2={domainNodeLineY}/>
					<line strokeWidth="2" stroke={strokeColor} x1="0" x2="0" y1={domainNodeY} y2={PX_PER_DOMAIN}/>
					<line strokeWidth="2" stroke={strokeColor} x1={length} x2={length} y1={domainNodeY} y2={PX_PER_DOMAIN}/>
					<rect onMouseOver={_onMouseOver} x="0" y="0" width={length} height={PX_PER_DOMAIN} fill="none"/>
				</g>
			);
		});

		return (
			<svg width={this.state.DOMWidth} height={400}>
				{domainNodes}
			</svg>
		);
	},

	_onDomainMouseOver: function (e, d) {
		console.log(d)
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
		return d3.scale.linear()
			.domain([0, _length])
			.range([0, _length * PX_PER_DOMAIN]);
	}
});

module.exports = ProteinViewer;
