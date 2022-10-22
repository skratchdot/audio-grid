(function (global) {
	'use strict';
	global.A = global.A || {};
}(this));
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
/*!
 * Project: Audio Grid
 *    File: A.MidiExport.js
 *  Source: https://github.com/skratchdot/audio-grid/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
/*global $, A */
(function (global) {
	'use strict';

	var MidiExport = {};

	MidiExport.populateChannels = function (selector) {
		var i, $select = $(selector), $option, html = '', numChannels = 16;

		// empty select
		$select.empty();

		// populate select
		for (i = 0; i < numChannels; i++) {
			$option = $('<option></option>')
				.val(i)
				.text(i);
			if (i === 0) {
				$option.attr('selected', 'selected');
			}
			html += $option.wrap('<div />').parent().html();
		}
		$select.append(html);
	};

	MidiExport.populateInstruments = function (selector) {
		var i, instrument, group = '',
			$select = $(selector), $optGroup, $option;

		// empty select
		$select.empty();

		// populate select
		for (i = 0; i < A.instruments.length; i++) {
			instrument = A.instruments[i];
			if (group !== instrument.group) {
				group = instrument.group;
				if ($optGroup) {
					$select.append($optGroup);
				}
				$optGroup = $('<optgroup></optgroup>')
					.attr('label', group);
			}
			$option = $('<option></option>')
				.val(i)
				.text(i + ': ' + instrument.name);
			if (i === 0) {
				$option.attr('selected', 'selected');
			}
			$optGroup.append($option);
		}
		$select.append($optGroup);
	};

	global.A.MidiExport = MidiExport;
}(this));
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
/*!
 * Project: Audio Grid
 *    File: A.Grid.js
 *  Source: https://github.com/skratchdot/audio-grid/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
/*global A, $, sc, timbre */
(function (global) {
	'use strict';

	var Grid = {},
		// settings
		canvasBackground = 'rgba(255, 255, 255, 0)',
		// defaults
		defaults = {
			maxDataSize: 32,
			volume: { value: 0.25, min: 0, max: 1, step: 0.01 },
			tempo: { value: 80, min: 20, max: 300, step: 1 },
			centerNote: { value: 69, min: 0, max: 127, step: 1 },
			scale: { value: 'major' },
			dataSize: { value: 16, min: 4, max: 32, step: 1 },
			audioType: { value: 'waveform' },
			waveform: { value: 'string' },
			soundfont: { value: 0 },
			delay_enabled: { value: true },
			delay_time: { value: 9, min: 1, max: 20, step: 1 },
			delay_feedback: { value: 0.2, min: -1, max: 1, step: 0.01 },
			delay_mix: { value: 0.6, min: 0, max: 1, step: 0.01 }
		},
		// Currently Selected Items
		selected = {
			volume: defaults.volume.value,
			tempo: defaults.tempo.value,
			centerNote: defaults.centerNote.value,
			scale: defaults.scale.value,
			dataSize: defaults.dataSize.value,
			audioType: defaults.audioType.value,
			waveform: defaults.waveform.value,
			soundfont: defaults.soundfont.value,
			adshr: { a: 3, d: 10, s: 0.5, h: 6, r: 8 },
			delay_enabled: defaults.delay_enabled.value,
			delay_time: defaults.delay_time.value,
			delay_feedback: defaults.delay_feedback.value,
			delay_mix: defaults.delay_mix.value
		},
		// private variables
		displayCache = {},
		// functions
		updateDisplayCache,
		onActionButtonClick,
		onAudioTypeButtonClick,
		onAudioTypeDisplayClick,
		onDelayEnabled,
		onScaleLinkClick,
		onSlider,
		onSliderVolume,
		onSliderTempo,
		onSliderCenterNote,
		onSliderDataSizeChange,
		onSliderDataSizeStop,
		onSliderDelay,
		onSliderWaveform,
		onWaveformButtonClick,
		populateScaleOptions,
		populateSoundfontOptions,
		populateWaveformButtons,
		preloadSoundfonts,
		updateAdshrDisplays;

	onWaveformButtonClick = function () {
		var $this = $(this), canvas, wave;
		selected.waveform = $this.attr('data-waveform');
		// update text on audio tab
		updateDisplayCache('#audio-type-display', 'waveform: ' + selected.waveform);
		// draw waveform
		canvas = $('#waveform-canvas').get(0);
		A.Helper.clearCanvas(canvas);
		wave = A.Player.getWaveform(selected.waveform);
		timbre(selected.waveform).plot({target: canvas, background: canvasBackground});
	};

	populateWaveformButtons = function () {
		var html = '';
		$.each(A.Player.getWaveform(), function (waveformName) {
			html += $('<button />')
				.addClass('btn btn-large' + (waveformName === selected.waveform ? ' active' : ''))
				.attr('type', 'button')
				.attr('data-waveform', waveformName)
				.text(waveformName)
				.wrap('<div />').parent().html();
		});
		$('#waveform .btn-group').html(html);
	};

	updateDisplayCache = function (selector, value, fnFormat) {
		if (!displayCache.hasOwnProperty(selector)) {
			displayCache[selector] = $(selector);
		}
		if (typeof fnFormat === 'function') {
			value = fnFormat(value);
		}
		displayCache[selector].text(value);
	};

	onActionButtonClick = function () {
		var $this = $(this),
			action = $this.data('action');
		if (action === 'clear') {
			A.Data.clear();
			A.Draw.dataUpdate();
		} else if (action === 'randomize') {
			A.Data.randomize(selected.dataSize);
			A.Draw.dataUpdate();
		} else if (action === 'export') {
			// export midi
		}
	};

	onAudioTypeButtonClick = function () {
		var $this = $(this),
			$tabs = $('#settings li[data-audio-type]'),
			$tabLink = $('#audio-type-tab-link'),
			audioType = $this.attr('data-audio-type'),
			audioTypeName = $this.text(),
			displayName;
		// set selected type
		selected.audioType = audioType;
		displayName = audioType;
		if (selected.audioType === 'waveform') {
			displayName += ': ' + selected.waveform;
		} else if (selected.audioType === 'soundfont') {
			displayName = $('#soundfont-options li.active').text();
		}
		updateDisplayCache('#audio-type-display', displayName);
		// update settings link
		$tabLink.text(audioTypeName.toLowerCase() + ' settings');
		// show correct tab
		$tabs.removeClass('hidden');
		$tabs.filter('[data-audio-type!="' + audioType + '"]').addClass('hidden');
		preloadSoundfonts();
	};

	onAudioTypeDisplayClick = function () {
		$('#settings li[data-audio-type]:visible a:last').click();
	};

	onScaleLinkClick = function () {
		$('#settings li a[href="#scale"]').click();
	};

	onDelayEnabled = function () {
		selected.delay_enabled = $(this).data('delay-enabled');
		if (selected.delay_enabled) {
			A.Player.delayStart();
		} else {
			A.Player.delayStop();
		}
	};

	onSlider = function (key, selector, event, fnFormat) {
		if (event) {
			selected[key] = event.value;
			if (fnFormat !== 'function' && event.value % 1 !== 0) {
				fnFormat = function (val) {
					return val.toFixed(2);
				};
			}
		}
		updateDisplayCache(selector, selected[key], fnFormat);
	};

	onSliderVolume = function (e) {
		onSlider('volume', '#volume-display', e, function (val) {
			return val.toFixed(2);
		});
	};

	onSliderTempo = function (e) {
		onSlider('tempo', '#tempo-display', e);
		A.Player.setTempo(e.value);
	};

	onSliderCenterNote = function (e) {
		onSlider('centerNote', '#center-note-display', e, A.Helper.getNoteName);
	};

	onSliderDataSizeChange = function (e) {
		onSlider('dataSize', '#data-size-display', e);
	};

	onSliderDataSizeStop = function (e) {
		onSliderDataSizeChange(e);
		A.Draw.dataInit();
	};

	onSliderDelay = function (e) {
		var $slider = $(e.target),
			$container = $slider.parents('[data-delay]:first'),
			delay = $container.attr('data-delay');
		if (delay === 'time') {
			onSlider('delay_' + delay, '#delay-' + delay + '-display', e, function (val) {
				return A.Tick.getName(val);
			});
		} else {
			onSlider('delay_' + delay, '#delay-' + delay + '-display', e);
		}
	};

	onSliderWaveform = function (e) {
		var $slider = $(e.target),
			$container = $slider.parents('[data-adshr]:first'),
			adshr = $container.attr('data-adshr');
		selected.adshr[adshr] = (adshr === 's') ? parseFloat(e.value.toFixed(2)) : e.value;
		updateAdshrDisplays();
	};

	populateScaleOptions = function (selector) {
		var currentKey, lastKey, scale, scaleNames,
			numPitches, numDegrees,
			$ul = $(selector), $li, htmlString = '';

		scaleNames = A.Helper.getSortedScaleNames();
		$.each(scaleNames, function (index, scaleName) {
			// loop variables
			scale = sc.ScaleInfo.at(scaleName);
			numPitches = scale.pitchesPerOctave();
			numDegrees = scale.degrees().length;
			currentKey = numPitches + '_' + numDegrees;
			if (currentKey !== lastKey) {
				lastKey = currentKey;
				$li = $('<li />').addClass('disabled').wrapInner(
					$('<a href="javascript:void(0);"></a>').text(
						'Octave: ' + numPitches + ' / Notes: ' + numDegrees
					)
				);
				htmlString += $li.wrap('<div />').parent().html();
			}
			$li = $('<li />').attr('data-scale', scaleName).wrapInner(
				$('<a href="javascript:void(0);"></a>').text(index + ': ' + scale.name)
			);
			htmlString += $li.wrap('<div />').parent().html();
		});
		$ul.append(htmlString);
		$ul.on('click', 'li', function () {
			var $this = $(this);
			if (!$this.hasClass('disabled')) {
				$ul.find('li').removeClass('active');
				$this.addClass('active');
				selected.scale = $this.data('scale');
				updateDisplayCache('.scale-display', $this.text());
				preloadSoundfonts();
			}
		});
	};

	populateSoundfontOptions = function (selector) {
		var i, instrument, group = '',
			$ul = $(selector), $li, htmlString = '';
		for (i = 0; i < A.instruments.length; i++) {
			instrument = A.instruments[i];
			// output group
			if (group !== instrument.group) {
				group = instrument.group;
				$li = $('<li />').addClass('disabled').wrapInner(
					$('<a href="javascript:void(0);"></a>').text(
						instrument.group
					)
				);
				htmlString += $li.wrap('<div />').parent().html();
			}
			// output instrument
			$li = $('<li />').attr('data-soundfont', instrument.val).wrapInner(
				$('<a href="javascript:void(0);"></a>').text(i + ': ' + instrument.name)
			);
			if (selected.soundfont === i) {
				$li.addClass('active');
			}
			htmlString += $li.wrap('<div />').parent().html();
		}
		$ul.append(htmlString);
		$ul.on('click', 'li', function () {
			var $this = $(this);
			if (!$this.hasClass('disabled')) {
				$ul.find('li').removeClass('active');
				$this.addClass('active');
				selected.soundfont = $this.data('soundfont');
				timbre.soundfont.setInstrument(selected.soundfont);
				updateDisplayCache('#soundfont-display', $this.text());
				updateDisplayCache('#audio-type-display', $this.text());
				preloadSoundfonts();
			}
		});
	};

	preloadSoundfonts = function () {
		var i, midiNotes = [], midi, theData = [];
		if (selected.audioType === 'soundfontX') {
			for (i = 0; i < theData.length; i++) {
				midi = A.Helper.getMidiNumber(theData[i]);
				if (midiNotes.indexOf(midi) === -1 && midi >= 0 && midi < 128) {
					midiNotes.push(midi);
				}
			}
			timbre.soundfont.preload(midiNotes);
		}
	};

	updateAdshrDisplays = function () {
		var canvas = $('#adshr-canvas').get(0);
		updateDisplayCache('#adshr-attack-display', selected.adshr.a);
		updateDisplayCache('#adshr-decay-display', selected.adshr.d);
		updateDisplayCache('#adshr-sustain-display', selected.adshr.s);
		updateDisplayCache('#adshr-hold-display', selected.adshr.h);
		updateDisplayCache('#adshr-release-display', selected.adshr.r);
		A.Helper.clearCanvas(canvas);
		timbre('adshr', {
			a: A.Tick.getTime(selected.adshr.a),
			d: A.Tick.getTime(selected.adshr.d),
			s: selected.adshr.s,
			h: A.Tick.getTime(selected.adshr.h),
			r: A.Tick.getTime(selected.adshr.r)
		}).plot({
			target: canvas,
			background: canvasBackground
		});
	};

	Grid.getSelected = function (key, defaultValue) {
		return selected.hasOwnProperty(key) ? selected[key] : defaultValue;
	};

	Grid.init = function () {
		// when using a mobile device, decrease samplerate.
		// idea taken from: http://mohayonao.github.io/timbre.js/misc/js/common.js
		if (timbre.envmobile) {
			timbre.setup({samplerate:timbre.samplerate * 0.5});
		}
		// init our data
		A.Data.init(defaults.maxDataSize);
		A.Draw.init();
		// build waveform buttons
		populateWaveformButtons();
		// populate our scale dropdown
		populateScaleOptions('#scale-options');
		updateDisplayCache(
			'.scale-display',
			$('#scale-options li[data-scale="' + selected.scale + '"]').text()
		);
		$('#scale-filter')
			.on('keyup', A.Helper.onOptionBoxFilter)
			.on('focus', function () {
				$(this).val('');
				$('#scale-options li').show();
			});
		// populate our soundfont dropdown
		populateSoundfontOptions('#soundfont-options');
		updateDisplayCache(
			'#soundfont-display',
			$('#soundfont-options li[data-soundfont="' + selected.soundfont + '"]').text()
		);
		$('#soundfont-filter')
			.on('keyup', A.Helper.onOptionBoxFilter)
			.on('focus', function () {
				$(this).val('');
				$('#soundfont-options li').show();
			});
		// select first tab
		$('#settings li:first a').click();
		// init audio sliders
		A.Helper.createSlider('#volume-container', defaults.volume, onSliderVolume);
		A.Helper.createSlider('#tempo-container', defaults.tempo, onSliderTempo);
		A.Helper.createSlider('#center-note-container', defaults.centerNote, onSliderCenterNote);
		A.Helper.createSlider('#data-size-container', defaults.dataSize, onSliderDataSizeChange, onSliderDataSizeStop);
		// init delay settings
		A.Helper.createSlider('#delay-time-container', defaults.delay_time, onSliderDelay);
		A.Helper.createSlider('#delay-feedback-container', defaults.delay_feedback, onSliderDelay);
		A.Helper.createSlider('#delay-mix-container', defaults.delay_mix, onSliderDelay);		
		// init waveform sliders
		A.Helper.createSlider('#adshr-attack-container', {
			value: selected.adshr.a, min: 0, max: 16, step: 1
		}, onSliderWaveform);
		A.Helper.createSlider('#adshr-decay-container', {
			value: selected.adshr.d, min: 0, max: 16, step: 1
		}, onSliderWaveform);
		A.Helper.createSlider('#adshr-sustain-container', {
			value: selected.adshr.s, min: 0, max: 1, step: 0.01
		}, onSliderWaveform);
		A.Helper.createSlider('#adshr-hold-container', {
			value: selected.adshr.h, min: 0, max: 16, step: 1
		}, onSliderWaveform);
		A.Helper.createSlider('#adshr-release-container', {
			value: selected.adshr.r, min: 0, max: 16, step: 1
		}, onSliderWaveform);
		updateAdshrDisplays();
		// handle button clicks
		$('#action-buttons .btn[data-action]').on('click', onActionButtonClick);
		$('#delay-container button').on('click', onDelayEnabled);
		$('#audio-type-display').on('click', onAudioTypeDisplayClick);
		$('#audio-type-container .btn').on('click', onAudioTypeButtonClick);
		$('#scale-link').on('click', onScaleLinkClick);
		$('#waveform .btn-group .btn').on('click', onWaveformButtonClick);
		//$('span[data-midi-export]').on('click', onMidiExportClick);
		//$('#midi-export-btn').on('click', onMidiSave);
		// update slider selection text
		updateDisplayCache('#volume-display', selected.volume);
		updateDisplayCache('#tempo-display', selected.tempo);
		updateDisplayCache('#center-note-display', selected.centerNote, A.Helper.getNoteName);
		updateDisplayCache('#data-size-display', selected.dataSize);
		updateDisplayCache('#delay-time-display', A.Tick.getName(selected.delay_time));
		updateDisplayCache('#delay-feedback-display', selected.delay_feedback);
		updateDisplayCache('#delay-mix-display', selected.delay_mix);
		updateDisplayCache('.scale-display', $('#scale-options li[data-scale="' + selected.scale + '"]').text());
		$('#waveform .btn[data-waveform="' + selected.waveform + '"]').click();
		$('#audio-type-container .btn[data-audio-type="' + selected.audioType + '"]').click();
		A.Draw.dataInit();
		A.Player.init();
	};

	global.A.Grid = Grid;
}(this));
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
/*!
 * Project: Audio Grid
 *    File: A.instruments.js
 *  Source: https://github.com/skratchdot/audio-grid/
 *
 * Copyright (c) 2013 skratchdot
 * Licensed under the MIT license.
 */
(function (global) {
	'use strict';

	global.A.instruments = [
	  { "val": 0, "name": "Acoustic Grand Piano", "group": "Piano"}
	, { "val": 1, "name": "Bright Acoustic Piano", "group": "Piano"}
	, { "val": 2, "name": "Electric Grand Piano", "group": "Piano"}
	, { "val": 3, "name": "Honky-tonk Piano", "group": "Piano"}
	, { "val": 4, "name": "Electric Piano 1", "group": "Piano"}
	, { "val": 5, "name": "Electric Piano 2", "group": "Piano"}
	, { "val": 6, "name": "Harpsichord", "group": "Piano"}
	, { "val": 7, "name": "Clavinet", "group": "Piano"}
	
	, { "val": 8, "name": "Celesta", "group": "Chromatic Percussion"}
	, { "val": 9, "name": "Glockenspiel", "group": "Chromatic Percussion"}
	, { "val": 10, "name": "Music Box", "group": "Chromatic Percussion"}
	, { "val": 11, "name": "Vibraphone", "group": "Chromatic Percussion"}
	, { "val": 12, "name": "Marimba", "group": "Chromatic Percussion"}
	, { "val": 13, "name": "Xylophone", "group": "Chromatic Percussion"}
	, { "val": 14, "name": "Tubular Bells", "group": "Chromatic Percussion"}
	, { "val": 15, "name": "Dulcimer", "group": "Chromatic Percussion"}
	
	, { "val": 16, "name": "Drawbar Organ", "group": "Organ"}
	, { "val": 17, "name": "Percussive Organ", "group": "Organ"}
	, { "val": 18, "name": "Rock Organ", "group": "Organ"}
	, { "val": 19, "name": "Church Organ", "group": "Organ"}
	, { "val": 20, "name": "Reed Organ", "group": "Organ"}
	, { "val": 21, "name": "Accordion", "group": "Organ"}
	, { "val": 22, "name": "Harmonica", "group": "Organ"}
	, { "val": 23, "name": "Tango Accordion", "group": "Organ"}
	
	, { "val": 24, "name": "Acoustic Guitar (nylon)", "group": "Guitar"}
	, { "val": 25, "name": "Acoustic Guitar (steel)", "group": "Guitar"}
	, { "val": 26, "name": "Electric Guitar (jazz)", "group": "Guitar"}
	, { "val": 27, "name": "Electric Guitar (clean)", "group": "Guitar"}
	, { "val": 28, "name": "Electric Guitar (muted)", "group": "Guitar"}
	, { "val": 29, "name": "Overdriven Guitar", "group": "Guitar"}
	, { "val": 30, "name": "Distortion Guitar", "group": "Guitar"}
	, { "val": 31, "name": "Guitar Harmonics", "group": "Guitar"}
	
	, { "val": 32, "name": "Acoustic Bass", "group": "Bass"}
	, { "val": 33, "name": "Electric Bass (finger)", "group": "Bass"}
	, { "val": 34, "name": "Electric Bass (pick)", "group": "Bass"}
	, { "val": 35, "name": "Fretless Bass", "group": "Bass"}
	, { "val": 36, "name": "Slap Bass 1", "group": "Bass"}
	, { "val": 37, "name": "Slap Bass 2", "group": "Bass"}
	, { "val": 38, "name": "Synth Bass 1", "group": "Bass"}
	, { "val": 39, "name": "Synth Bass 2", "group": "Bass"}
	
	, { "val": 40, "name": "Violin", "group": "Strings"}
	, { "val": 41, "name": "Viola", "group": "Strings"}
	, { "val": 42, "name": "Cello", "group": "Strings"}
	, { "val": 43, "name": "Contrabass", "group": "Strings"}
	, { "val": 44, "name": "Tremolo Strings", "group": "Strings"}
	, { "val": 45, "name": "Pizzicato Strings", "group": "Strings"}
	, { "val": 46, "name": "Orchestral Harp", "group": "Strings"}
	, { "val": 47, "name": "Timpani", "group": "Strings"}
	
	, { "val": 48, "name": "String Ensemble 1", "group": "Ensemble"}
	, { "val": 49, "name": "String Ensemble 2", "group": "Ensemble"}
	, { "val": 50, "name": "Synth Strings 1", "group": "Ensemble"}
	, { "val": 51, "name": "Synth Strings 2", "group": "Ensemble"}
	, { "val": 52, "name": "Choir Aahs", "group": "Ensemble"}
	, { "val": 53, "name": "Voice Oohs", "group": "Ensemble"}
	, { "val": 54, "name": "Synth Choir", "group": "Ensemble"}
	, { "val": 55, "name": "Orchestra Hit", "group": "Ensemble"}
	
	, { "val": 56, "name": "Trumpet", "group": "Brass"}
	, { "val": 57, "name": "Trombone", "group": "Brass"}
	, { "val": 58, "name": "Tuba", "group": "Brass"}
	, { "val": 59, "name": "Muted Trumpet", "group": "Brass"}
	, { "val": 60, "name": "French Horn", "group": "Brass"}
	, { "val": 61, "name": "Brass Section", "group": "Brass"}
	, { "val": 62, "name": "Synth Brass 1", "group": "Brass"}
	, { "val": 63, "name": "Synth Brass 2", "group": "Brass"}
	
	, { "val": 64, "name": "Soprano Sax", "group": "Reed"}
	, { "val": 65, "name": "Alto Sax", "group": "Reed"}
	, { "val": 66, "name": "Tenor Sax", "group": "Reed"}
	, { "val": 67, "name": "Baritone Sax", "group": "Reed"}
	, { "val": 68, "name": "Oboe", "group": "Reed"}
	, { "val": 69, "name": "English Horn", "group": "Reed"}
	, { "val": 70, "name": "Bassoon", "group": "Reed"}
	, { "val": 71, "name": "Clarinet", "group": "Reed"}
	
	, { "val": 72, "name": "Piccolo", "group": "Pipe"}
	, { "val": 73, "name": "Flute", "group": "Pipe"}
	, { "val": 74, "name": "Recorder", "group": "Pipe"}
	, { "val": 75, "name": "Pan Flute", "group": "Pipe"}
	, { "val": 76, "name": "Blown bottle", "group": "Pipe"}
	, { "val": 77, "name": "Shakuhachi", "group": "Pipe"}
	, { "val": 78, "name": "Whistle", "group": "Pipe"}
	, { "val": 79, "name": "Ocarina", "group": "Pipe"}
	
	, { "val": 80, "name": "Lead 1 (square)", "group": "Synth Lead"}
	, { "val": 81, "name": "Lead 2 (sawtooth)", "group": "Synth Lead"}
	, { "val": 82, "name": "Lead 3 (calliope)", "group": "Synth Lead"}
	, { "val": 83, "name": "Lead 4 (chiff)", "group": "Synth Lead"}
	, { "val": 84, "name": "Lead 5 (charang)", "group": "Synth Lead"}
	, { "val": 85, "name": "Lead 6 (voice)", "group": "Synth Lead"}
	, { "val": 86, "name": "Lead 7 (fifths)", "group": "Synth Lead"}
	, { "val": 87, "name": "Lead 8 (bass + lead)", "group": "Synth Lead"}
	
	, { "val": 88, "name": "Pad 1 (new age)", "group": "Synth Pad"}
	, { "val": 89, "name": "Pad 2 (warm)", "group": "Synth Pad"}
	, { "val": 90, "name": "Pad 3 (polysynth)", "group": "Synth Pad"}
	, { "val": 91, "name": "Pad 4 (choir)", "group": "Synth Pad"}
	, { "val": 92, "name": "Pad 5 (bowed)", "group": "Synth Pad"}
	, { "val": 93, "name": "Pad 6 (metallic)", "group": "Synth Pad"}
	, { "val": 94, "name": "Pad 7 (halo)", "group": "Synth Pad"}
	, { "val": 95, "name": "Pad 8 (sweep)", "group": "Synth Pad"}
	
	, { "val": 96, "name": "FX 1 (rain)", "group": "Synth Effects"}
	, { "val": 97, "name": "FX 2 (soundtrack)", "group": "Synth Effects"}
	, { "val": 98, "name": "FX 3 (crystal)", "group": "Synth Effects"}
	, { "val": 99, "name": "FX 4 (atmosphere)", "group": "Synth Effects"}
	, { "val": 100, "name": "FX 5 (brightness)", "group": "Synth Effects"}
	, { "val": 101, "name": "FX 6 (goblins)", "group": "Synth Effects"}
	, { "val": 102, "name": "FX 7 (echoes)", "group": "Synth Effects"}
	, { "val": 103, "name": "FX 8 (sci-fi)", "group": "Synth Effects"}
	
	, { "val": 104, "name": "Sitar", "group": "Ethnic"}
	, { "val": 105, "name": "Banjo", "group": "Ethnic"}
	, { "val": 106, "name": "Shamisen", "group": "Ethnic"}
	, { "val": 107, "name": "Koto", "group": "Ethnic"}
	, { "val": 108, "name": "Kalimba", "group": "Ethnic"}
	, { "val": 109, "name": "Bagpipe", "group": "Ethnic"}
	, { "val": 110, "name": "Fiddle", "group": "Ethnic"}
	, { "val": 111, "name": "Shanai", "group": "Ethnic"}
	
	, { "val": 112, "name": "Tinkle Bell", "group": "Percussive"}
	, { "val": 113, "name": "Agogo", "group": "Percussive"}
	, { "val": 114, "name": "Steel Drums", "group": "Percussive"}
	, { "val": 115, "name": "Woodblock", "group": "Percussive"}
	, { "val": 116, "name": "Taiko Drum", "group": "Percussive"}
	, { "val": 117, "name": "Melodic Tom", "group": "Percussive"}
	, { "val": 118, "name": "Synth Drum", "group": "Percussive"}
	, { "val": 119, "name": "Reverse Cymbal", "group": "Percussive"}
	
	, { "val": 120, "name": "Guitar Fret Noise", "group": "Sound effects"}
	, { "val": 121, "name": "Breath Noise", "group": "Sound effects"}
	, { "val": 122, "name": "Seashore", "group": "Sound effects"}
	, { "val": 123, "name": "Bird Tweet", "group": "Sound effects"}
	, { "val": 124, "name": "Telephone Ring", "group": "Sound effects"}
	, { "val": 125, "name": "Helicopter", "group": "Sound effects"}
	, { "val": 126, "name": "Applause", "group": "Sound effects"}
	, { "val": 127, "name": "Gunshot", "group": "Sound effects"}
	];
}(this));