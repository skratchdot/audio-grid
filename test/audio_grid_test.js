'use strict';

var A = require('../dist/grid.js').A;

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
	test.expect(numAssertions)
	test.done()
  Test assertions:
	test.ok(value, [message])
	test.equal(actual, expected, [message])
	test.notEqual(actual, expected, [message])
	test.deepEqual(actual, expected, [message])
	test.notDeepEqual(actual, expected, [message])
	test.strictEqual(actual, expected, [message])
	test.notStrictEqual(actual, expected, [message])
	test.throws(block, [error], [message])
	test.doesNotThrow(block, [error], [message])
	test.ifError(value)
*/

exports['AudioGridTests'] = {
	setUp: function (done) {
		// setup here
		done();
	},
	'init': function (test) {
		test.expect(1);
		test.equal(A.Grid.hasOwnProperty('init'), true);
		test.done();
	},
	'instruments length': function (test) {
		test.expect(1);
		test.equal(A.instruments.length, 128);
		test.done();
	}
};
