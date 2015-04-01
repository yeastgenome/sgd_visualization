"use strict";
var _ = require("underscore");

var AssignTracksToDomains = function (domains) {
	// split by groups
	var groupedDomains = _.groupBy(domains, function (d) {
		return d.source.id;
	});

	// in each group, assign tracks
	var gDomains;
	for (var key in groupedDomains) {
		gDomains = groupedDomains[key];
		gDomains = gDomains.map( function (d, i) {
			d._track = 0;
			return d;
		});
	}

	// combine again
	var merged = [];
	merged = merged.concat.apply(merged, _.values(groupedDomains));
	merged = _.sortBy(merged, function (d) {
		return d.source.id;
	});
	return merged;
};

module.exports = AssignTracksToDomains;
