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