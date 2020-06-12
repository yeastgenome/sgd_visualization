"use strict";

import React,{Component} from 'react';
import _ from 'underscore';
import Radium from 'radium';
import PropTypes from 'prop-types';

class FlexibleTooltip extends Component{
	constructor(props){
		super(props);
	}

	render(){
		var props = this.props;
		var _isComplex = this._isComplex();
		var heightOffset = 0;
		if (_isComplex) {
			heightOffset = _.keys(this.props.data).length * 30;
		}
		var _complexWidth = 350;
		var _style = {
			display: (props.visible ? "block" : "none"),
			top: props.top - heightOffset,
			left: props.left,
			// padding: _isComplex ? "1em" : 0,
			width: _isComplex ? _complexWidth: "auto"
		};
		var innerContentNode = this._getInnerContentNode();
		var arrowKlass = _isComplex ? "flexible-tooltip-arrow complex" : "flexible-tooltip-arrow";
		return (
			<div onMouseEnter={this.props.onMouseEnter} style={[style.wrapper, _style]}>
				{innerContentNode}
				<div style={[style.triangle]}></div>
			</div>
		);
	}

	_getInnerContentNode() {
		if (this._isComplex()) {
			return this._getComplexContent();
		} else {
			return this._getTextNode();
		}
	}

	_isComplex() {
		return (this.props.title && this.props.data);
	}

	_getComplexContent() {
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
	}	

	_getTextNode() {
		var _innerText = this.props.href ? (<a href={this.props.href}>{this.props.text}</a>) : this.props.text;
		return (<span className="flexible-tooltip-text">
			{_innerText}
		</span>);
	}
}

FlexibleTooltip.propTypes = {
	visible: PropTypes.bool,
	text: PropTypes.string,
	title: PropTypes.string,
	href: PropTypes.string,
	left: PropTypes.number,
	top: PropTypes.number,
	onMouseEnter: PropTypes.func
}

FlexibleTooltip.defaultProps = {
	visible: false,
	text: "",
	left: 0,
	top: 0,
	title: "",
	data: null
}

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
	    marginLeft: -70,
	    borderLeft: "8px solid transparent",
	    borderRight: "8px solid transparent",
	    borderTop: "15px solid #e7e7e7"
	}
};

export default Radium(FlexibleTooltip);
