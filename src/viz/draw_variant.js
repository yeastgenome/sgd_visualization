"use strict";

module.exports = function (ctx, variantType, snpType, x, y, originalX, originalY) {
	if (typeof originalX === "undefined") originalX = x;
	if (typeof originalY === "undefined") originalY = y;

	var snpColors = {
		"synonymous": SYNONYMOUS_COLOR,
		"nonsynonymous": NON_SYNONYMOUS_COLOR,
		"intron": INTRON_COLOR,
		"untranslatable": UNTRANSLATEABLE_COLOR
	};

	// draw line
	ctx.beginPath();
	ctx.moveTo(originalX, originalY + VARIANT_DIAMETER / 2 + 1);
	ctx.lineTo(originalX, originalY + VARIANT_HEIGHT);
	ctx.stroke();
	
	var color = (variantType === "insertion" || variantType === "deletion") ?
		"black" : snpColors[snpType];

	if (variantType === "insertion") {
		// caret
		ctx.globalAlpha = 1;
		ctx.fillColor = TEXT_COLOR;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x - VARIANT_DIAMETER, y);
		ctx.lineTo(x, y - VARIANT_DIAMETER);
		ctx.lineTo(x + VARIANT_DIAMETER, y);
		ctx.stroke();
	} else if (variantType === "deletion") {
		// draw x
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x - VARIANT_DIAMETER, y + VARIANT_DIAMETER);
		ctx.lineTo(x + VARIANT_DIAMETER, y - VARIANT_DIAMETER);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x - VARIANT_DIAMETER, y - VARIANT_DIAMETER);
		ctx.lineTo(x + VARIANT_DIAMETER, y + VARIANT_DIAMETER);
		ctx.stroke();
	} else {
		// draw circle
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = color;
		var path = new Path2D();
		path.arc(x + 0.5, y, VARIANT_DIAMETER, 0, Math.PI * 2, true);
		ctx.fill(path);
		ctx.stroke(path);
		ctx.globalAlpha = 1;
	}

};

var VARIANT_DIAMETER = 4;
var VARIANT_HEIGHT = 17;
// fill colors for variants
var SYNONYMOUS_COLOR = "#7b3294" // purply
var NON_SYNONYMOUS_COLOR = "#d7191c";  // red
var INTRON_COLOR = "#2c7bb6"; // dark blue
var UNTRANSLATEABLE_COLOR = "gray";
