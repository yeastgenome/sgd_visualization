/** @jsx React.DOM */
"use strict";
var d3 = require("d3");
var React = require("react");
var StyleSheet = require("react-style");
var _ = require("underscore");
var HTML5Backend = require("react-dnd/modules/backends/HTML5");
var DragDropContext = require("react-dnd").DragDropContext;

var DraggableItem = require("./draggable_item.jsx");
var FeatureTrack = require("./feature_track.jsx");
var VizTrack = require("./viz_track.jsx");

var HEIGHT = 250;
var HIGHLIGHT_COLOR = "#DEC113";
var FILL_COLOR = "#09AEB2";
// ?? other color to use for this color scheme is #FFDD19
var TRACK_HEIGHT = 20;
var VARIANT_HEIGHT = 20;
var VARIANT_DIAMETER = 7;

// fill colors for variants
var MAIN_BORDER_COLOR = "#e6e6e6";
var SYNONYMOUS_COLOR = "#4D9221";  // dark yellow-green
var NON_SYNONYMOUS_COLOR = "#C51B7D"; // dark pink
var INTRON_COLOR = "#E6F5D0"; // pale yellow-green
var UNTRANSLATEABLE_COLOR = "gray";

// CSS in JS
var styles = StyleSheet.create({
	frame: {
		height: HEIGHT,
		position: "relative",
		overflow: "scroll",
		display: "inline-block"
	},

	scroller: {
		position: "absolute",
		width: 100000,
		height: HEIGHT
	},

	flexParent: {
		display: "flex",
		height: 150
	}
});

var FeatureViewer = React.createClass({
	propTypes: {
		canScroll: React.PropTypes.bool,
		store: React.PropTypes.object,
		focusFeature: React.PropTypes.object, // { chromStart, chromEnd, strand }
		highlightedSegment: React.PropTypes.array, // []
		interactionData: React.PropTypes.array,
		onSetScale: React.PropTypes.func,
		variantData: React.PropTypes.array // [{ coordinates: [0, 5], type: "Insertion" }, ...]
	},

	getDefaultProps: function () {
		return {
			canScroll: true
		};
	},

	getInitialState: function () {
		return {
			DOMWidth: 400,
			offsetLeft: 0
		};
	},

	render: function () {
		return (
			<div className="feature-viewer" style={{ padding: "1rem" }}>
				<div className="row">
					<div className="col-md-12">
						<div className="row">
							<div className="col-md-12">
								<DraggableItem text="Example File 1" />
								<DraggableItem text="Example File 2"/>
								<DraggableItem text="Example File 3"/>
							</div>
						</div>
						<div className="row">
							<div className="col-md-12">
								{this._renderFeatureTracks()}
								<VizTrack chromStart={this.props.chromStart} chromEnd={this.props.chromEnd} width={this.state.DOMWidth - 24} store={this.props.store} />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},

	componentDidMount: function () {
		// try to let the font load
		setTimeout( () => {
			this._calculateWidth();
		}, 250)
	},

	componentDidUpdate: function (prevProps, prevState) {
		if (prevState.DOMWidth !== this.state.DOMWidth) {
			if (this.props.onSetScale) this.props.onSetScale(this._getScale());
		}
	},

	_renderFeatureTracks: function () {
		var store = this.props.store;
		var _features = store.getFeatures();
		var _position = store.getPosition();
		var _onScroll = () => { this.forceUpdate(); };
		var featureProps = _.extend(this.props);

		return (
			<div styles={[styles.flexParent]}>
				<FeatureTrack {...featureProps}
					width={this.state.DOMWidth - 24}
					features={_features}
					chromStart={_position.chromStart}
					chromEnd={_position.chromEnd}
					onScroll={_onScroll}
				/>
			</div>
		);
	},

	_calculateWidth: function () {
		var _width = this.getDOMNode().getBoundingClientRect().width - 1;
		this.setState({
			DOMWidth: _width
		});
	},

	_drawVariants: function (ctx) {
		var feature = this.props.focusFeature;
		var variantData = this.props.variantData;
		var scale = this._getScale();
		var colors = {
			"synonymous": SYNONYMOUS_COLOR,
			"nonsynonymous": NON_SYNONYMOUS_COLOR,
			"intron": INTRON_COLOR,
			"untranslatable": UNTRANSLATEABLE_COLOR
		};

		var y = 50 + TRACK_HEIGHT / 2; // TEMP

		var avgCoord, snpType, type, x;
		variantData.forEach( d => {
			avgCoord = feature.chromStart + (d.coordinates[0] + d.coordinates[1]) / 2;
			x = Math.round(scale(avgCoord));
			snpType = d.snpType.toLowerCase();
			type = d.type.toLowerCase();
			ctx.lineWidth = 1;

			if (type !== "deletion") {
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(x, y - VARIANT_HEIGHT);
				ctx.stroke();
			}
			

			if (type === "snp") {
				ctx.fillStyle = colors[snpType] || "gray";
				var path = new Path2D();
				path.arc(x, y - VARIANT_HEIGHT, VARIANT_DIAMETER, 0, Math.PI * 2, true);
				ctx.fill(path);
			} else if (type === "insertion") {
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(x - VARIANT_DIAMETER / 2, y - VARIANT_HEIGHT);
				ctx.lineTo(x, y - VARIANT_HEIGHT - VARIANT_DIAMETER / 2);
				ctx.lineTo(x + VARIANT_DIAMETER / 2, y - VARIANT_HEIGHT);
				ctx.stroke();
			} else if (type === "deletion") {
				var startX = scale(feature.chromStart + d.coordinates[0]);
				var endX = scale(feature.chromStart + d.coordinates[1]);
				var avgX = Math.round((startX + endX) / 2);
				y = 45; // TEMP
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(startX, y);
				ctx.lineTo(endX, y);
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(avgX, y);
				ctx.lineTo(avgX, y - 15);
				ctx.stroke();

				var r = VARIANT_DIAMETER / 2;
				// draw 'x'
				ctx.beginPath();
				ctx.moveTo(avgX - r, y - 15 + r);
				ctx.lineTo(avgX + r, y - 15 - r);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(avgX - r, y - 15 - r);
				ctx.lineTo(avgX + r, y - 15 + r);
				ctx.stroke();
			}
		});
	},

	_getScale: function () {
		return d3.scale.linear()
			.domain([this.props.chromStart, this.props.chromEnd])
			.range([0, this.state.DOMWidth]);
	}
});

module.exports = DragDropContext(HTML5Backend)(FeatureViewer);
