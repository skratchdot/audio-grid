/*!
 * Project: Audio Grid
 *    File: A.Player.js
 *  Source: https://github.com/skratchdot/audio-grid/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
/*globals A, $, timbre */
(function (global) {
	'use strict';

	var Player = {},
		// Waveform Data
		waveform = {
			'string': { gen: 'PluckGen', mul: 1 },
			'sin':    { gen: 'OscGen', mul: 1 },
			'cos':    { gen: 'OscGen', mul: 1 },
			'pulse':  { gen: 'OscGen', mul: 0.25 },
			'tri':    { gen: 'OscGen', mul: 1 },
			'saw':    { gen: 'OscGen', mul: 0.25 },
			'fami':   { gen: 'OscGen', mul: 1 },
			'konami': { gen: 'OscGen', mul: 0.4 }
		},
		// helpers
		delayEndTime = 5000,
		intervalIndex = 0,
		intervalDuration = 500,
		isPlaying = false,
		isReverse = false,
		// jQuery objects
		$slider,
		// timbre objects
		delay, interval,
		// functions
		ensureIntervalIndex,
		intervalCallback,
		play,
		playObject,
		refreshSliderPosition;

	ensureIntervalIndex = function () {
		// ensure current index is safe
		intervalIndex = Math.min(intervalIndex, A.Grid.getSelected('dataSize') - 1);
		intervalIndex = Math.max(intervalIndex, 0);
	};

	intervalCallback = function () {
		var i, play, midiNote, type;
		if (isPlaying) {
			ensureIntervalIndex();
			refreshSliderPosition();
			type = A.Grid.getSelected('audioType');

			// draw line
			A.Draw.playLine(intervalIndex, intervalDuration);

			// play items
			play = A.Data.getPlayArray(intervalIndex, A.Grid.getSelected('dataSize'));
			for (i = 0; i < play.length; i++) {
				midiNote = A.Helper.getMidiNumber(play[i]);
				if (type === 'waveform') {
					Player.playWaveform(midiNote);
				} else {
					Player.playSoundfont(midiNote);
				}
			}

			// we can advance now
			intervalIndex = isReverse ? intervalIndex - 1 : intervalIndex + 1;

			// we need to loop
			if (intervalIndex < 0) {
				intervalIndex = A.Grid.getSelected('dataSize') - 1;
			} else if (intervalIndex >= A.Grid.getSelected('dataSize')) {
				intervalIndex = 0;
			}
		} else {
			Player.stop();
		}
	};

	play = function (reverse) {
		interval.stop();
		isPlaying = true;
		if (reverse === true) {
			isReverse = true;
			if (intervalIndex <= 0) {
				intervalIndex = A.Grid.getSelected('dataSize') - 1;
			}
		} else {
			isReverse = false;
			if (intervalIndex >= A.Grid.getSelected('dataSize') - 1) {
				intervalIndex = 0;
			}
		}
		isReverse = reverse === true ? true : false;
		Player.delayStart();
		interval.start();
	};

	playObject = function (obj) {
		var isDelay = A.Grid.getSelected('delay_enabled');
		obj.on('ended', function () {
			obj.pause();
			if (isDelay) {
				delay.remove(obj);
			}
		});
		// play note with or without delay
		if (isDelay) {
			delay.set({
				time: A.Tick.getTime(
					A.Grid.getSelected('delay_time'),
					A.Grid.getSelected('tempo')),
				fb: A.Grid.getSelected('delay_feedback'),
				mix: A.Grid.getSelected('delay_mix')
			});
			delay.append(obj);
		}
		obj.bang().play();
	};

	refreshSliderPosition = function () {
		if ($slider && $slider.length) {
			$slider.slider('setValue', intervalIndex);
		}
	};

	Player.getWaveform = function (key) {
		if (waveform.hasOwnProperty(key)) {
			return waveform[key];
		} else {
			return waveform;
		}
	};

	Player.playSoundfont = function (midiNote) {
		timbre.soundfont.setInstrument(A.Grid.getSelected('soundfont'));
		timbre.soundfont.play(midiNote, false, {
			mul: A.Grid.getSelected('volume') * 1.5
		});
	};

	Player.playWaveform = function (midiNote) {
		var obj, wave = A.Grid.getSelected('waveform');

		// setup audio object
		obj = timbre(waveform[wave].gen, {
			wave: wave,
			mul: waveform[wave].mul * A.Grid.getSelected('volume'),
			env: timbre('adshr', {
				a: A.Tick.getTime(A.Grid.getSelected('adshr').a),
				d: A.Tick.getTime(A.Grid.getSelected('adshr').d),
				s: A.Grid.getSelected('adshr').s,
				h: A.Tick.getTime(A.Grid.getSelected('adshr').h),
				r: A.Tick.getTime(A.Grid.getSelected('adshr').r)
			})
		}).on('ended', function () {
			obj.pause();
		});
		obj.noteOn(midiNote, 64);
		playObject(obj);
	};

	Player.play = function () {
		play(false);
	};

	Player.reverse = function () {
		play(true);
	};

	Player.stop = function () {
		isPlaying = false;
		interval.stop();
		setTimeout(function () {
			if (!isPlaying) {
				Player.delayStop();
			}
		}, delayEndTime);
	};

	Player.goToFirst = function () {
		intervalIndex = 0;
	};

	Player.goToLast = function () {
		intervalIndex = A.Grid.getSelected('dataSize') - 1;
	};

	Player.setTempo = function (tempo) {
		timbre.bpm = parseFloat(tempo);
		intervalDuration = timbre.timevalue('l16');
		if (interval) {
			interval.set('interval', intervalDuration);
		}
	};

	Player.delayStart = function () {
		if (isPlaying && A.Grid.getSelected('delay_enabled')) {
			delay.play();
		}
	};

	Player.delayStop = function () {
		delay.removeAll();
		delay.removeAllListeners();
		delay.pause();
		delay.stop();
	};

	Player.init = function () {
		// listen to button clicks
		$('#player-buttons .btn').on('click', function () {
			var action = $(this).data('action');
			if (Player.hasOwnProperty(action) && typeof Player[action] === 'function') {
				timbre.fn._audioContext.resume().then(function () {
					Player[action]();
				});
			}
		});

		// setup timbre objects
		A.Player.setTempo(A.Grid.getSelected('tempo'));
		delay = timbre('delay');
		interval = timbre('interval', { interval: intervalDuration }, intervalCallback);
	};

	global.A.Player = Player;
}(this));