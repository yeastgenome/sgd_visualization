/*
	Assumes that DOMWidth is in state, and that there is an internal method called _calculateWidth, which sets the width.
	This mixin simply calls that method on resize
*/

import React,{Component} from 'react';
function CalcWidthOnResize(WrappedComponent){
	return class extends Component{
		componentDidMount(){
			this._handleResize = this._handleResize.bind(this);
			window.addEventListener('resize', this._handleResize);
		}

		_handleResize(){
			this.refs.wrappedComponent._calculateWidth();
		}

		render(){
			return(<WrappedComponent ref="wrappedComponent" {...this.props}/>)
		}
	}
}

export default CalcWidthOnResize;
