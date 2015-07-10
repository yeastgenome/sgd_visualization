/** @jsx React.DOM */
"use strict";
var _ = require("underscore");

var featureTracks = [];
var vizTracks = []; // TEMP example [{ id: "viz1", type:"checker" }, false, false]

var interactionData = [];

module.exports = class FeatureViewerStore {
	// *** accessors ***
	getOriginalPosition (featureTrackId) {
		var datum = _.findWhere(featureTracks, { id: featureTrackId });
		return datum ? datum.originalPosition : {};
	}

	getFeatureTrackData (featureTrackId) {
		var datum = _.findWhere(featureTracks, { id: featureTrackId });
		return datum;
	}

	getInteractionData () { return interactionData; }

	getFeatureTracks() { return featureTracks; }

	getVizTracks () { return vizTracks; }

	// *** mutators ***

	addFeatureTrack (featureDatum) {
		featureDatum.originalPosition = featureDatum.position;
		if (typeof featureDatum.id === "undefined") featureDatum.id = "featureTrack" + featureTracks.length.toString();
		featureTracks.push(featureDatum);
	}

	addVizTrack () {
		var index = vizTracks.length.toString();
		vizTracks.push({
			id: "viz" + index,
			type: null
		});
	}

	setPositionByFeatureTrack (featureTrackId, _chromStart, chromEnd) {
		var datum = _.findWhere(featureTracks, { id: featureTrackId });
		datum.position.chromStart = _chromStart;
		datum.position.chromEnd = chromEnd;
	}

	removeVizTrack (id) {
		vizTracks = [];
	}

	setFixtureData () {
		this.addFeatureTrack();
	}

	getFeatureFixture () {
		return {
			features: [
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
			],
			position: {
				chromStart: 1000,
				chromEnd: 2000,
				chrom: "chriii"
			}
		};
	}

	translate (featureTrackId, delta) {
		var datum = _.findWhere(featureTracks, { id: featureTrackId });
		datum.position.chromStart = datum.originalPosition.chromStart + delta;
		datum.position.chromEnd = datum.originalPosition.chromEnd + delta;
	}

	zoom (newDomain) {
		position.chromStart = newDomain[0];
		position.chromEnd = newDomain[1];
	}

	addInteractionData () {
		interactionData = [1,2,3];
	}
};
