/*!
 * Project: Audio Grid
 *    File: A.Draw.js
 *  Source: https://github.com/skratchdot/audio-grid/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
/*global A, $, d3 */
(function (global) {
	'use strict';

	var Draw = {},
		// config
		colors = {
			data: {
				on: 'steelblue',
				off: 'none'
			},
			line: {
				on: 'yellow',
				off: 'none'
			}
		},
		// state
		lastIndex = null,
		isMouseDown = false,
		// cached data
		dataRect,
		dataSize,
		groupData,
		groupPlay,
		groupLine,
		// functions
		swapData;

	swapData = function (obj) {
		var item, d, $grid, pos, col, row;
		if (isMouseDown) {
			$grid = $('#grid');
			pos = d3.mouse(obj);
			// compute col
			col = Math.floor((pos[0] / $grid.width()) * dataSize);
			col = Math.max(0, col);
			col = Math.min(col, dataSize);
			// compute row
			row = Math.floor((pos[1] / $grid.height()) * dataSize);
			row = Math.max(0, row);
			row = Math.min(row, dataSize);
			item = groupData.selectAll('rect').filter(function (d) {
				return d.row === row && d.col === col;
			});
			d = item.data()[0];
			if (lastIndex !== d.index) {
				d.play = !d.play;
				item.data(d);
				lastIndex = d.index;
				Draw.dataUpdate();
			}
		}
	};

	Draw.dataInit = function () {
		lastIndex = null;
		dataSize = A.Grid.getSelected('dataSize');

		// select some items
		dataRect = groupData.selectAll('rect').data(A.Data.get().filter(function (d) {
			return d.row < dataSize && d.col < dataSize;
		}), function (d) {
			return d.index;
		});

		// create
		dataRect.enter().append('rect')
			.attr('data-col', function (d) {
				return d.col;
			})
			.attr('data-row', function (d) {
				return d.row;
			});

		// update
		dataRect
			.attr('width', function () {
				return (100 / dataSize) + '%';
			})
			.attr('height', function () {
				return (100 / dataSize) + '%';
			})
			.attr('x', function (d) {
				return (d.col * (100 / dataSize)) + '%';
			})
			.attr('y', function (d) {
				return (d.row * (100 / dataSize)) + '%';
			})
			.attr('opacity', 0.5)
			.attr('stroke', '#333')
			.attr('fill', function (d) {
				return d.play ? colors.data.on : colors.data.off;
			});

		// exit
		dataRect.exit().remove();
	};

	Draw.dataUpdate = function () {
		dataRect
			.attr('fill', function (d) {
				return d.play ? colors.data.on : colors.data.off;
			});
	};

	Draw.playLine = function (index, duration) {
		var data, line;

		// initialize our data
		data = {
			width: (100 / dataSize) + '%',
			height: '100%',
			x: (index * (100 / dataSize)) + '%',
			y: 0
		};

		// select some items
		line = groupLine.selectAll('rect').data([data], function (d) {
			return d.x;
		});

		// create
		line.enter().append('rect');

		// update
		line.attr('opacity', 0.5)
			.attr('fill', colors.line.on)
			.attr('width', data.width)
			.attr('height', data.height)
			.attr('x', data.x)
			.attr('y', data.y)
			.transition()
				.duration(duration * 4)
				.attr('opacity', 0);
	};

	Draw.init = function () {
		// cache some selectors
		groupData = d3.select('#group-data');
		groupPlay = d3.select('#group-play');
		groupLine = d3.select('#group-line');
		// handle some events
		$('body').on('mouseup', function () {
			isMouseDown = false;
			lastIndex = null;
		});
		d3.select('svg')
			.on('mousedown', function () {
				isMouseDown = true;
				lastIndex = null;
				swapData(this);
			})
			.on('mousemove', function () {
				swapData(this);
			});
	};

	global.A.Draw = Draw;
}(this));