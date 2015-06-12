/** @jsx React.DOM */
"use strict";

var position = {
	chromStart: null,
	chromEnd: null,
	chrom: null
}
var data = [];

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
				strand: "+"
			},
			{
				chrom: "chriii",
				chromStart: 1200,
				chromEnd: 1550,
				strand: "+"
			},
			{
				chrom: "chriii",
				chromStart: 1600,
				chromEnd: 1450,
				strand: "-"
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
};
