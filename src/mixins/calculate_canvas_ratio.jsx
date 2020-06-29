"use strict";

// calculate drawing ratio to solve blurry high DPI canvas issue
// cb passed to cb for this.setState
import React,{Component} from 'react';
function CalculateCanvasRatio(WrappedComponent){
	return class extends Component{
		constructor(props){
			super(props);
		}

		calculateCanvasRatio(component){
			// query device pixel ratio
			var ctx = component.canvas.getContext("2d");
			var devicePixelRatio = window.devicePixelRatio || 1;
			var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio ||
			ctx.oBackingStorePixelRatio ||
			ctx.backingStorePixelRatio || 1;

			var _canvasRatio = devicePixelRatio / backingStoreRatio;
			return _canvasRatio;
			// this.setState({ canvasRatio: _canvasRatio }, cb);
		}

		render(){
			return(<WrappedComponent {...this.props} calculateCanvasRatio={this.calculateCanvasRatio}/>)
		}
	}
}

export default CalculateCanvasRatio;

