/*!
 * Project: Audio Grid
 *    File: A.Tick.js
 *  Source: https://github.com/skratchdot/audio-grid/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
/*globals timbre */
(function (global) {
	'use strict';

	var Tick = {},
		info = [
			{ ticks: 0, name: 'Off', short: 'Off' },
			{ ticks: 7.5, name: '1/256th Note', short: '256n' },
			{ ticks: 15, name: '1/128th Note', short: '128n' },
			{ ticks: 30, name: '1/64 Note', short: '64n' },
			{ ticks: 40, name: '1/32 Note Triplet', short: '32nt' },
			{ ticks: 45, name: 'Dotted 1/64 Note', short: '64nd' },
			{ ticks: 60, name: '1/32 Note', short: '32n' },
			{ ticks: 80 , name: 'Sixteenth Note Triplet', short: '16nt' },
			{ ticks: 90, name: 'Dotted 1/32 Note', short: '32nd' },
			{ ticks: 120, name: 'Sixteenth Note', short: '16n' },
			{ ticks: 160, name: 'Eighth Note Triplet', short: '8nt' },
			{ ticks: 180, name: 'Dotted Sixteenth Note', short: '16nd' },
			{ ticks: 240, name: 'Eighth Note', short: '8n' },
			{ ticks: 320, name: 'Quarter Note Triplet', short: '4nt' },
			{ ticks: 360, name: 'Dotted Eighth Note', short: '8nd' },
			{ ticks: 480, name: 'Quarter Note', short: '4n' },
			{ ticks: 640, name: 'Half Note Triplet', short: '2nt' },
			{ ticks: 720, name: 'Dotted Quarter Note', short: '4nd' },
			{ ticks: 960, name: 'Half Note', short: '2n' },
			{ ticks: 1280, name: 'Whole Note Triplet', short: '1nt' },
			{ ticks: 1440, name: 'Dotted Half Note', short: '2nd' },
			{ ticks: 1920, name: 'Whole Note', short: '1n' },
			{ ticks: 2880, name: 'Dotted Whole Note', short: '1nd' }
		];

	Tick.getName = function (index) {
		var name = '';
		if (index < info.length && index >= 0) {
			name = info[index].name;
		}
		return name;
	};

	Tick.getTime = function (index, bpm) {
		var time = 0;
		if (index < info.length && index >= 0) {
			bpm = bpm || 80;
			time = timbre.timevalue('bpm' + bpm + ' ' + info[index].ticks + 'ticks');
		}
		return time;
	};

	global.A.Tick = Tick;
}(this));