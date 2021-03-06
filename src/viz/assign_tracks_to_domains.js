"use strict";
import _ from 'underscore';

var isLeftOverlap, isRightOverlap, isInside;
var isOverlap = function (a, b) {
	isLeftOverlap = (a.start <= b.start && a.end >= b.start);
	isRightOverlap = (a.end >= b.end && a.start <= b.end);
	isInside = (a.start >= b.start && a.end <= b.end);
	return (isLeftOverlap || isRightOverlap || isInside);
}

var AssignTracksToDomains = function (domains) {
	// split by groups
	var groupedDomains = _.groupBy(domains, function (d) {
		return d.sourceId;
	});

	// in each group, assign tracks, push to merged
	var merged = [];
	var gDomains, trackedGDomains, groupOverlaps;
	var maxTrack = 0;
	for (var key in groupedDomains) {
		gDomains = _.sortBy(groupedDomains[key], function (d) { return d.start; });
		trackedGDomains = gDomains.map( function (d, i) {
			groupOverlaps = _.filter(gDomains, function (_d) {
				return isOverlap(d, _d);
			});
			groupOverlaps = _.sortBy(groupOverlaps, function (d) { return d.start; });
			d._track = groupOverlaps.indexOf(d) + maxTrack;
			return d;
		});
		var maxTrackInGroup = _.max(trackedGDomains, d => { return d._track; })._track;
		maxTrack = maxTrackInGroup + 1;
		// concat tracked domains in this group with merged
		merged = merged.concat(trackedGDomains);
	}
	return merged;
};

export default AssignTracksToDomains;
