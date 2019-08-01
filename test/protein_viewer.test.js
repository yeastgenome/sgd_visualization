import React from 'react';
import ReactDOMServer from 'react-dom/server';
// jsx
require("node-jsx").install({ harmony: true });

import {ProteinViewer} from '../src/sgd_visualization';

test("should render to a viz with classes 'sgd-viz' and 'protein-viewer'",()=>{
		var _data = [
			{
				start: 1,
				end: 400,
				domain: {
					name: "PF0022",
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
				},
				source: {
					name: "Panther",
					href: null,
					id: 1
				}
			}
		];
		var _locusData = {
			start: 0,
			end: 650,
			name: "Foo",
			href: "http://google.com"
		};

		var markup = ReactDOMServer.renderToStaticMarkup(<ProteinViewer data={_data} locusData={_locusData}/>)
		
		expect(markup.match('class="sgd-viz protein-viewer')).not.toBeNull()
		expect(markup.match(/<div/).index).toEqual(0)
});
