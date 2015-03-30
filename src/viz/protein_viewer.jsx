/** @jsx React.DOM */
"use strict";
var React = require("react");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");
var StandaloneAxis = require("./standalone_axis.jsx");

var PX_PER_DOMAIN = 10;

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
				<div ref="vizNode" style={{ width: "80%", height: 122, left: "20%", position: "absolute", top: 0, border: "1px solid #ddd"}}>
					{this._renderSVG()}
				</div>
				<StandaloneAxis
					domain={domain}
					leftRatio={0.20}
					gridTicks={true}
					orientation="bottom"
				/>
			</div>
		);
	},

	_renderSVG: function () {
		var xScale = this._getXScale();
		var yScale = this._getYScale();

		var transform, length, strokeColor;
		// TEMP
		strokeColor = "black";
		var domainNodes = this.props.data.map( (d, i) => {
			transform = `translate(${xScale(d.start)}, ${yScale(i)})`;
			var length = Math.round(Math.abs(xScale(d.start) - xScale(d.end)));
			return (
				<g key={"proteinDomain" + i} transform={transform}>
					<line stroke={strokeColor} x1="0" x2={length} y1={PX_PER_DOMAIN / 2} y2={PX_PER_DOMAIN / 2}/>
					<line stroke={strokeColor} x1="0" x2="0" y1="0" y2={PX_PER_DOMAIN}/>
					<line stroke={strokeColor} x1={length} x2={length} y1="0" y2={PX_PER_DOMAIN}/>
				</g>
			);
		});

		return (
			<svg width={this.state.DOMWidth} height={400}>
				{domainNodes}
			</svg>
		);
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
