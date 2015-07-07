/** @jsx React.DOM */
"use strict";

var position = {
	chromStart: null,
	chromEnd: null,
	chrom: null
}
var originalPosition = {
	chromStart: null,
	chromEnd: null,
	chrom: null
}
var features = [];

var interactionData = [];

module.exports = class FeatureViewerStore {
	// accessors

	getFeatures () { return features; }

	getPosition () { return position; }

	getOriginalPosition () { return originalPosition; }


	getInteractionData () {
		return interactionData;
	}

	setFeatures (_features) { features = _features; }

	setPosition (_position) { position = _position; }

	setFixtureData () {
		features = [
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
		originalPosition = {
			chromStart: 1000,
			chromEnd: 2000,
			chrom: "chriii"
		};
	}

	translate (delta) {
		position.chromStart = originalPosition.chromStart + delta;
		position.chromEnd = originalPosition.chromEnd + delta;
	}

	zoom (newDomain) {
		position.chromStart = newDomain[0];
		position.chromEnd = newDomain[1];
	}

	addInteractionData () {
		interactionData = [1,2,3];
	}
};
