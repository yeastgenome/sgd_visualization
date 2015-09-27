"use strict";

module.exports = function (ctx, variantType, snpType, x, y, originalX, originalY, ratio) {
	ratio = ratio || 1;
	ctx.lineWidth = 1 * ratio;
	if (typeof originalX === "undefined") originalX = x;
	if (typeof originalY === "undefined") originalY = y;

	var snpColors = {
		"synonymous": SYNONYMOUS_COLOR,
		"nonsynonymous": NON_SYNONYMOUS_COLOR,
		"intron": INTRON_COLOR,
		"untranslatable": UNTRANSLATEABLE_COLOR
	};

	// draw line
	ctx.strokeStyle = TEXT_COLOR;
	ctx.beginPath();
	ctx.moveTo(originalX * ratio, (originalY + VARIANT_DIAMETER / 2 + 1) * ratio);
	ctx.lineTo(originalX * ratio, (originalY + VARIANT_HEIGHT) * ratio);
	ctx.stroke();
	
	var color = (variantType === "insertion" || variantType === "deletion") ?
		"black" : snpColors[snpType];

	if (variantType === "insertion") {
		// caret
		ctx.globalAlpha = 1;
		ctx.fillColor = TEXT_COLOR;
		ctx.lineWidth = 3 * ratio;
		ctx.beginPath();
		ctx.moveTo((x - VARIANT_DIAMETER) * ratio, y * ratio);
		ctx.lineTo(x * ratio, (y - VARIANT_DIAMETER) * ratio);
		ctx.lineTo((x + VARIANT_DIAMETER) * ratio, y * ratio);
		ctx.stroke();
	} else if (variantType === "deletion") {
		// draw x
		ctx.lineWidth = 2 * ratio;
		ctx.beginPath();
		ctx.moveTo((x - VARIANT_DIAMETER) * ratio, (y + VARIANT_DIAMETER) * ratio);
		ctx.lineTo((x + VARIANT_DIAMETER) * ratio, (y - VARIANT_DIAMETER) * ratio);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo((x - VARIANT_DIAMETER) * ratio, (y - VARIANT_DIAMETER) * ratio);
		ctx.lineTo((x + VARIANT_DIAMETER) * ratio, (y + VARIANT_DIAMETER) * ratio);
		ctx.stroke();
	} else {
		// draw circle
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = color;
		var path = new Path2D();
		path.arc((x + 0.25) * ratio, y * ratio, VARIANT_DIAMETER * ratio, 0, Math.PI * 2, true);
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
var TEXT_COLOR = "black";
var UNTRANSLATEABLE_COLOR = "gray";
