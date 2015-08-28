/** @jsx React.DOM */
"use strict";

/*
	Assumes that component has method called didClickOutside, which handles being clicked outside
*/

var DidClickOutside = {
	// add event listener to document to dismiss when clicking
	componentDidMount: function () {
		document.addEventListener("click", () => {
			if (this.isMounted() && this.didClickOutside) {
				this.didClickOutside();
			}
		});
	},
};

module.exports = DidClickOutside;
