"use strict";

/*
	Assumes that component has method called didClickOutside, which handles being clicked outside
*/
import React,{Component} from 'react';
function DidClickOutside(WrappedComponent){
	return class extends Component{
		componentDidMount(){
			document.addEventListener("click",this._handleClick);
		}

		_handleClick(){
			if (this.isMounted() && this.didClickOutside) {
				this.didClickOutside();
			}
		}

		render(){
			return(<WrappedComponent />);
		}
	}
}

export default DidClickOutside = {
	// add event listener to document to dismiss when clicking
	componentDidMount: function () {
		document.addEventListener("click", () => {
			if (this.isMounted() && this.didClickOutside) {
				this.didClickOutside();
			}
		});
	},
};

