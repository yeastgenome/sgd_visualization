"use strict";
import React,{Component} from 'react';
import Radium from 'radium';

import DrawVariant from './draw_variant';
import DidClickOutside from '../mixins/did_click_outside.jsx';
import CalculateCanvasRatio from '../mixins/calculate_canvas_ratio.jsx';
import appStyle from './style';

var WIDTH = 200;
var HEIGHT = 220;
var BACKGROUND_COLOR = "#fff";
var BORDER_COLOR = "#ccc";
var LABEL_HEIGHT = 20;
var LABEL_BOTTOM = 10;

// CSS in JS
var style = {
	container: {
		position: "relative"
	},

	panel: {
		position: "absolute",
		top: 45,
		right: 0,
		width: WIDTH,
		height: HEIGHT,
		background: BACKGROUND_COLOR,
		borderRadius: 4,
		border: "1px solid #ccc",
		zIndex: 1,
		display: "flex",
		textAlign: "left",
		paddingTop: 15,
		boxSizing: "content-box"
	},
	
	label: {
		height: LABEL_HEIGHT,
		marginTop: 5,
		marginBottom: LABEL_BOTTOM + 1
	}
};

class VariantLegend extends Component{
	constructor(props){
		super(props);
		this.state = {isActive: false,canvasRatio: 1};
		this._toggleActive = this._toggleActive.bind(this);
	}

	render() {
		return (
			<div style={style.container}>
				<a style={appStyle.button} onClick={this._toggleActive}>
					Legend <i className="fa fa-sort-desc" />
				</a>
				{this._renderPanel()}
			</div>
		);
	}

	componentWillMount(){
		this.setState({isMounted:true});
	}
	componentWillUnmount(){
		this.setState({isMounted:false});
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.state.isActive) this._drawLegend();
		if (this.state.isActive !== prevState.isActive && this.state.isActive){
			this.setState({canvasRatio:this.props.calculateCanvasRatio(this)})
		}
	}

	didClickOutside() {
		if (this.state.isMounted && this.state.isActive) this.setState({ isActive: false });
	}

	_renderPanel() {
		if (!this.state.isActive) return null;
		var _width = this._getWidth();
		var _height = this._getHeight();
		var canvasRatio = this.state.canvasRatio;
		return (
			<div style={style.panel}>
				<canvas ref={(canvas)=>this.canvas = canvas}
					width={_width * canvasRatio} height={_height * canvasRatio}
					style={{ width: _width, height: _height }}
				/>
				<div>
					<p style={style.label}>Insertion</p>
					<p style={style.label}>Deletion</p>
					<p style={style.label}>Synonymous SNP</p>
					<p style={style.label}>Nonsynonymous SNP</p>
					<p style={style.label}>Intron SNP</p>
					<p style={style.label}>Untranslatable SNP</p>
					<p style={style.label}>Intergenic SNP</p>
				</div>
			</div>
		);
	}

	_toggleActive(e) {
		if (e) {
			e.preventDefault();
			e.nativeEvent.stopImmediatePropagation();
		}
		this.setState({ isActive: !this.state.isActive });
	}

	_getWidth() {
		return 28;
	}

	_getHeight() {
		return HEIGHT;
	}

	_drawLegend() {
		var exampleInDels = ["insertion", "deletion"];
	        var exampleSnps = ["synonymous", "nonsynonymous", "intron", "untranslatable", "intergenic"];
		var canvasRatio = this.state.canvasRatio;
		var yDelta = (LABEL_HEIGHT + LABEL_BOTTOM + 1);
		var width = this._getWidth() * canvasRatio;
		var height = this._getHeight() * canvasRatio;
		var canvas = this.canvas;
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, width, height);
		var i = 0;
		var x = 16;
		var y;
		exampleInDels.forEach( d => {
			y = (i * yDelta + 8);
			DrawVariant(ctx, d, "", x, y, x, y, canvasRatio);
			i += 1;
		});
		exampleSnps.forEach( d => {
			y = (i * yDelta + 8);
			DrawVariant(ctx, "snp", d, x, y, x, y, canvasRatio);
			i += 1;
		});
	}
}



export default Radium(CalculateCanvasRatio(DidClickOutside(VariantLegend)));
