"use strict";

/*
	Assumes that component has method called didClickOutside, which handles being clicked outside
*/
import React,{Component} from 'react';
function DidClickOutside(WrappedComponent){
	return class extends Component{
		componentDidMount(){
			this._handleClick = this._handleClick.bind(this);
			document.addEventListener("click",this._handleClick);
		}

		_handleClick(){
			this.wrappedComponent.didClickOutside();
		}

		render(){
			return(<WrappedComponent ref={(wrappedComponent) => this.wrappedComponent = wrappedComponent} {...this.props}/>);
		}
	}
}

export default DidClickOutside;
