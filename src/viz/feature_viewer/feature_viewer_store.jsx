/** @jsx React.DOM */
"use strict";

var position = {
	chromStart: null,
	chromEnd: null,
	chrom: null
}
var data = [];

var interactionData = [];

module.exports = class FeatureViewerStore {

	getData () { return data; }

	getPosition () { return position; }

	setData (_data) { data = _data; }

	setPosition (_position) { position = _position; }

	setFixtureData () {
		data = [
			{
				chrom: "chriii",
				chromStart: 1000,
				chromEnd: 1500,
				strand: "+",
				blockSizes: [500],
				blockStarts: [0]
			},
			{
				chrom: "chriii",
				chromStart: 1525,
				chromEnd: 1875,
				strand: "+",
				blockSizes: [100, 50],
				blockStarts: [0, 300]
			},
			{
				chrom: "chriii",
				chromStart: 1600,
				chromEnd: 1450,
				strand: "-",
				blockSizes: [150],
				blockStarts: [0]
			}
		];
		position = {
			chromStart: 1000,
			chromEnd: 2000,
			chrom: "chriii"
		};
	}

	translate (delta) {
		position.chromStart = position.chromStart + delta;
		position.chromEnd = position.chromEnd + delta;
	}

	addInteractionData () {
		interactionData = [1,2,3];
	}

	getInteractionData () {
		return interactionData;
	}
};
