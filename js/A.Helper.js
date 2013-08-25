/*!
 * Project: Audio Grid
 *    File: A.Helper.js
 *  Source: https://github.com/skratchdot/audio-grid/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
/*global A, $, sc */
(function (global) {
	'use strict';

	var Helper = {},
		// functions
		getMidiNumberHelper;

	getMidiNumberHelper = function (degrees, degreeSize, octaveSize, position) {
		return degrees[position % degreeSize] + (Math.floor(position / degreeSize) * octaveSize);
	};

	Helper.getMidiNumber = function (playValue) {
		var scale, octaveSize, degrees, degreeSize, centerValue, playMidi, centerMidi;

		// get some info from our current scale
		scale = sc.ScaleInfo.at(A.Grid.getSelected('scale'));
		octaveSize = scale.pitchesPerOctave();
		degrees = scale.degrees();
		degreeSize = degrees.length;
		centerValue = Math.floor(A.Grid.getSelected('dataSize') / 2);

		playMidi = getMidiNumberHelper(degrees, degreeSize, octaveSize, playValue);
		centerMidi = getMidiNumberHelper(degrees, degreeSize, octaveSize, centerValue);

		return playMidi + A.Grid.getSelected('centerNote') - centerMidi;
	};

	Helper.getTempoString = function (tempo, steps) {
		steps = steps || '16';
		return 'bpm' + (parseFloat(tempo) || 120) + ' l' + steps;
	};

	Helper.getNoteName = function (midiNumber) {
		var notes = ['c','c#','d','d#','e','f','f#','g','g#','a','a#','b'],
			len = notes.length,
			octave = Math.floor(midiNumber / len) - 1,
			idx = midiNumber % len,
			note = notes[idx];
		return '(' + note.charAt(0) + octave + note.charAt(1) + ') ' + midiNumber;
	};

	Helper.createSlider = function (selector, obj, onChange, onStop) {
		var $container = $(selector), $elem = $('<div class="audio-slider"></div>'), $slider;
		onChange = typeof onChange === 'function' ? onChange : $.noop;
		onStop = typeof onChange === 'function' ? onStop : onChange;
		$container.empty();
		$elem.appendTo($container);
		$slider = $elem.slider({
			value: obj.value,
			min: obj.min,
			max: obj.max,
			step: obj.step,
			orientation: 'horizontal',
			selection: 'none',
			tooltip: 'hide'
		});
		$slider.on('slide', onChange);
		$slider.on('slideStop', onStop);
		$(selector + ' .slider').width('100%');
		return $slider;
	};

	Helper.clearCanvas = function (canvas) {
		var context = canvas.getContext('2d');
		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	};

	Helper.onOptionBoxFilter = function () {
		var show = false,
			$this = $(this),
			listId = $this.attr('data-list-id'),
			$listItems = $('#' + listId + ' li'),
			val = $.trim($this.val()),
			regex = new RegExp(val, 'i');
		if (val === '') {
			$listItems.show();
		} else {
			$.each($listItems.get().reverse(), function (index, item) {
				var $item = $(item);
				if ($item.hasClass('disabled')) {
					$item.css('display', show ? 'block' : 'none');
					show = false;
				} else {
					if (regex.test($item.text())) {
						$item.show();
						show = true;
					} else {
						$item.hide();
					}
				}
			});
		}
	};

	Helper.getSortedScaleNames = function () {
		var names = sc.ScaleInfo.names().sort(function (o1, o2) {
			var ret = 0,
				s1 = sc.ScaleInfo.at(o1),
				s2 = sc.ScaleInfo.at(o2);
			ret = s1.pitchesPerOctave() - s2.pitchesPerOctave();
			if (ret === 0) {
				ret = s1.degrees().length - s2.degrees().length;
				if (ret === 0) {
					ret = s1.name.localeCompare(s2.name);
				}
			}
			return ret;
		});
		return names;
	};

	// add Helper to the global scope
	global.A.Helper = Helper;
}(this));