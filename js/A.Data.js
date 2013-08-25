/*!
 * Project: Audio Grid
 *    File: A.Data.js
 *  Source: https://github.com/skratchdot/audio-grid/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
(function (global) {
	'use strict';

	var Data = {},
		data = [],
		max = 0,
		shuffle,
		sorted;

	// shuffle function is the fisherYates algorithm adapted from:
	// http://sedition.com/perl/javascript-fy.html
	shuffle = function (arr) {
		var i = arr.length, j, temp_i, temp_j;
		if (i === 0) {
			return arr;
		}
		while (--i) {
			j = Math.floor(Math.random() * (i + 1));
			// swap
			temp_i = arr[i];
			temp_j = arr[j];
			arr[i] = temp_j;
			arr[j] = temp_i;
		}
		return arr;
	};

	sorted = function (size) {
		var i, ret = [];
		for (i = 0; i < size; i++) {
			ret.push(i);
		}
		return ret;
	};

	Data.clear = function () {
		var i, j, index = 0;
		for (i = 0; i < max; i++) {
			for (j = 0; j < max; j++) {
				data[index].play = 0;
				index++;
			}
		}
	};

	Data.randomize = function (num) {
		var i, j, arr, rand, maxNotes = 3;
		Data.clear();
		for (i = 0; i < num; i++) {
			rand = Math.floor(Math.random() * (maxNotes + 1));
			if (rand > 0) {
				arr = sorted(num);
				arr = shuffle(arr);
				arr = arr.splice(0, rand);
				for (j = 0; j < arr.length; j++) {
					data[(i * max) + arr[j]].play = 1;
				}
			}
		}
	};

	Data.getPlayArray = function (col, size) {
		var ret = [], i = 0, j = 0, start = max * col;
		for (i = start; i < start + size; i++) {
			if (data[i].play) {
				ret.push(j);
			}
			j++;
		}
		return ret;
	};

	Data.get = function (col, row) {
		if (typeof col === 'number' && typeof row === 'number') {
			return data[(max * col) + row];
		} else {
			return data;
		}
	};

	Data.set = function (col, row, play) {
		data[(max * col) + row].play = play;
	};

	Data.init = function (maxSize) {
		var i, j, index = 0;
		max = maxSize;
		data = [];
		for (i = 0; i < max; i++) {
			for (j = 0; j < max; j++) {
				data.push({
					index: index++,
					col: i,
					row: j,
					play: 0
				});
			}
		}
	};

	global.A.Data = Data;
}(this));