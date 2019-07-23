"use strict";

var _ = require("underscore");

var DEFAULT_REFERENCE_NAME = "S288C";

module.exports = class AlignmentModel {

	constructor (options) {
		this.attributes = {};
		this.attributes.alignedDnaSequences = options.alignedDnaSequences;
		this.attributes.alignedProteinSequences = options.alignedProteinSequences;
		this.attributes.variantDataDna = options.variantDataDna;
		this.attributes.variantDataProtein = options.variantDataProtein;
		this.attributes.referenceName = options.referenceName || DEFAULT_REFERENCE_NAME;
	}

	parse (response) {
		response.strand = "+"; // force to render as crick strand
		response.alignedProteinSequences = this._sortSequencesByStrain(response.alignedProteinSequences);
		response.alignedDnaSequences = this._sortSequencesByStrain(response.alignedDnaSequences);
		return response;
	}

	canShowSequence (isProtein) {
		var attr = this.attributes;
		if (isProtein) {
			return attr.alignedProteinSequences.length > 1 && attr.variantDataProtein.length > 0;
		} else {
			return attr.alignedDnaSequences.length > 1 && attr.variantDataDna.length > 0;
		}
	}

	_sortSequencesByStrain (sequences) {
		return _.sortBy(sequences, d => {
			return (d.name === DEFAULT_REFERENCE_NAME) ? 1 : 2;
		});
	}

	// pure function that returns true or false if two segments overlap
	_isOverlap (segA, segB) {
		var _isBefore = (segA.end >= segB.start && segA.start <= segB.end + 1);
		var _isAfter = (segA.start <= segB.end + 1 && segA.end >= segB.start);
		var _isSame = (segA === segB);
		return ((_isBefore || _isAfter) && (!_isSame));
	}

	// from start and end of aligned sequence, return reference coordinates (currently always S288C)
	getReferenceCoordinatesFromAlignedCoordinates (alignedStart, alignedEnd, isProtein) {
		var _attr = this.attributes;
		var _seqs = isProtein ? _attr.alignedProteinSequences : _attr.alignedDnaSequences;
		var referenceSequence = _.findWhere(_seqs, { name: _attr.referenceName }).sequence;
		var refDomain = referenceSequence
			.split("")
			.reduce( (memo, next, i) => {
				// only edit memo if this character isn't a gap
				if (next !== "-") {
					if (i < alignedStart) {
						memo.start += 1;
					}
					if (i < alignedEnd) {
						memo.end += 1;
					}
				}
				return memo;
			}, { start: 0, end: 0 });
		return refDomain;
	}

	_mergeOrAddSegment (existingSegments, newSegment) {
		var old;
		for (var i = existingSegments.length - 1; i >= 0; i--) {
			old = existingSegments[i];
			if (this._isOverlap(old, newSegment)) {
				old.start = Math.min(old.start, newSegment.start);
				old.end = Math.max(old.end, newSegment.end);
				return existingSegments;
			}
		};

		existingSegments.push(_.extend(newSegment, { visible: true }));
		return existingSegments;
	}

	// from raw variant data, produce segments as expected by multi_alignment_viewer
	formatSegments (isProtein) {
		var variants = isProtein ? this.attributes.variantDataProtein : this.attributes.variantDataDna;
		var sequences = isProtein ? this.attributes.alignedProteinSequences : this.attributes.alignedDnaSequences;
		// make sure they're sorted by start
		variants = _.sortBy(variants, d => {
			return d.start;
		});

		// merge segments
		var mergedSegments = _.reduce(variants, (memo, d) => {
			return this._mergeOrAddSegment(memo, d);
		}, []);

		// add in needed summarized segments
		// first one
		if (mergedSegments[0].start > 1) {
			mergedSegments.push({
				visible: false,
				start: 1,
				end: mergedSegments[0].start
			});
		}
		// loop through and connect visible segments with summarized segments
		var _visibleSegments = _.where(mergedSegments, { visible: true });
		_visibleSegments.forEach( (d, i) => {
			// must not be last or visible
			if (d.visible && i < _visibleSegments.length - 1) {
				mergedSegments.push({
					visible: false,
					start: d.end,
					end: _visibleSegments[i + 1].start
				});
			}
		});
		
		var _last = _.max(mergedSegments, d => { return d.end; });
		var _maxLength = _.max(sequences, d => { return d.sequence.length; }).sequence.length;
		// add last if last segment is visible and not at the end
		if (_last.end < _maxLength) {
			mergedSegments.push({
				start: _last.end,
				end: _maxLength,
				visible: false
			});
		// add last if visible
		} else {
			mergedSegments.push({
				start: _last.end,
				end: _maxLength + 1,
				visible: true
			});
		}
		
		// change starts and ends to domains
		mergedSegments = _.map(mergedSegments, d => {
			d.domain = [d.start, d.end];
			return d;
		});
		// sort
		mergedSegments = _.sortBy(mergedSegments, d => {
			return d.start;
		});
		return mergedSegments;
	}

	formatSequences (isProtein) {
		var _baseArray = isProtein ? this.attributes.alignedProteinSequences : this.attributes.alignedDnaSequences;
		return _.map(_baseArray, d => {
			return {
				name: d.name,
				href: d.href,
				sequence: d.sequence
			};
		});
	}
};
