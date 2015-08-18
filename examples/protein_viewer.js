"use strict";
var ProteinViewer = require("sgd_visualization").ProteinViewer;

var pv = new ProteinViewer({
	el: document.getElementById("target"),
	config: {
		domains: [
			{
				start: 1,
				end: 400,
				domain: {
					name: "PF0022",
					id: 1,
					description: "Lorem ipsum stuff"
				},
				source: {
					name: "Pfam",
					href: null,
					id: 1
				}
			},
			{
				start: 145,
				end: 340,
				domain: {
					name: "PF0023",
					id: 2
				},
				source: {
					name: "Pfam",
					href: null,
					id: 1
				}
			},
			{
				start: 245,
				end: 540,
				domain: {
					name: "Some23",
					id: 3
				},
				source: {
					name: "Panther",
					href: null,
					id: 2
				}
			}
		],
		locus: {
			start: 0,
			end: 650,
			name: "Foo",
			href: "http://google.com"
		}
	}
});
