/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");
var Radium = require("radium");

var FlexibleTooltip = React.createClass({
	propTypes: {
		visible: React.PropTypes.bool,
		text: React.PropTypes.string,
		title: React.PropTypes.string,
		href: React.PropTypes.string,
		left: React.PropTypes.number,
		top: React.PropTypes.number
		// data, null or object
	},

	getDefaultProps: function () {
		return {
			visible: false,
			text: "",
			left: 0,
			top: 0,
			title: "",
			data: null,
		};
	},

	render: function () {
		var props = this.props;
		var _isComplex = this._isComplex();
		var _complexWidth = 350;
		var _style = {
			display: (props.visible ? "block" : "none"),
			top: props.top,
			left: props.left,
			// padding: _isComplex ? "1em" : 0,
			width: _isComplex ? _complexWidth: "auto"
		};

		var innerContentNode = this._getInnerContentNode();
		var arrowKlass = _isComplex ? "flexible-tooltip-arrow complex" : "flexible-tooltip-arrow";
		return (
			<div style={[style.wrapper, _style]}>
				{innerContentNode}
				<div style={[style.triangle]}></div>
			</div>
		);
	},

	_getInnerContentNode: function () {
		if (this._isComplex()) {
			return this._getComplexContent();
		} else {
			return this._getTextNode();
		}
	},

	// false if just has text, true means has title and data object
	_isComplex: function () {
		return (this.props.title && this.props.data);
	},

	_getComplexContent: function () {
		// init the title node
		var titleNode = null;
		if (this.props.title) {
			var _innerText = this.props.href ? (<a href={this.props.href}>{this.props.title}</a>) : this.props.title;
			titleNode = <h3>{_innerText}</h3>;
		}

		var dataNode = null;
		if (this.props.data) {
			var _keys = _.keys(this.props.data);
			var _innerNodes = _.reduce(_keys, (memo, k, i) => {
				memo.push(<dt key={"flexToolTipT" + i}>{k}</dt>);
				memo.push(<dd key={"flexToolTipD" + i}>{this.props.data[k]}</dd>);
				return memo;
			}, []);
			dataNode = <dl className="key-value">{_innerNodes}</dl>;
		}

		return (
			<div>
				{titleNode}
				{dataNode}
			</div>
		);
	},

	_getTextNode: function () {
		var _innerText = this.props.href ? (<a href={this.props.href}>{this.props.text}</a>) : this.props.text;
		return (<span className="flexible-tooltip-text">
			{_innerText}
		</span>);
	}
});

var ARROW_OFFSET = 20;
var style = {
	wrapper: {
		position: "absolute",
		marginLeft: -ARROW_OFFSET,
		marginTop: -65,
		minHeight: 35,
		padding: "0.5rem 0.5rem 0 0.5rem",
		width: "auto",
	    backgroundColor: "#e7e7e7",
	    borderRadius: 5,
	    fontSize: 16,
	    zIndex: 100
	},
	triangle: {
	    position: "absolute",
	    bottom: -15,
	    left: ARROW_OFFSET - 2,
	    width: 0,
	    height: 0,
	    marginLeft: -7,
	    borderLeft: "8px solid transparent",
	    borderRight: "8px solid transparent",
	    borderTop: "15px solid #e7e7e7"
	}
};

module.exports = Radium(FlexibleTooltip);
