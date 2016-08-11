var sync = require('synchronize');

var fakeContext = {};
var context =
  typeof root !== 'undefined' ? root :
  typeof global !== 'undefined' ? global :
  typeof window !== 'undefined' ? window : fakeContext;

var has = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

var blockFunctionNames = [
  'after',
  'afterAll',
  'afterEach',
  'before',
  'beforeAll',
  'beforeEach',
  'it'
];

/**
 * Wrap the given block function or hash of block functions with synchronize,
 * and return the wrapped function(s).
 *
 * @param {Function|Object<String, Function>=} input
 * @return {Function|Object}
 */
function wrap(input) {
  var i, name, value, output;

  if (arguments.length === 0 || input === undefined) {
    checkContext();

    input = {};
    for (i = 0; i < blockFunctionNames.length; i++) {
      name = blockFunctionNames[i];
      if (typeof context[name] === 'function') {
        input[name] = context[name];
      }
    }
  }

  if (typeof input === 'object' && input) {
    output = {};
    for (name in input) {
      value = input[name];
      if (typeof value === 'function') {
        output[name] = wrapFn(value);
      }
    }
    return output;
  }

  if (typeof input === 'function') {
    return wrapFn(input);
  }

  throw new TypeError('expected an object or function to wrap');
}

var savedBlocks = null;

/**
 * Overwrites the global block functions with their synchronized equivalents.
 */
function replace() {
  var i, name, value;
  checkContext();

  if (savedBlocks) {
    for (i = 0; i < blockFunctionNames.length; i++) {
      name = blockFunctionNames[i];
      value = context[name];
      if (typeof value === 'function' && savedBlocks[name] !== value) {
        savedBlocks[name] = value;
        context[name] = wrapFn(value);
      }
    }
  } else {
    savedBlocks = {};
    for (i = 0; i < blockFunctionNames.length; i++) {
      name = blockFunctionNames[i];
      value = context[name];
      if (typeof value === 'function') {
        savedBlocks[name] = value;
        context[name] = wrapFn(value);
      }
    }
  }
}

/**
 * Undoes the global replacement from `syncIt.replace()`, and restores the
 * original block functions.
 */
function restore() {
  checkContext();

  if (savedBlocks) {
    for (var name in savedBlocks) {
      context[name] = savedBlocks[name];
    }
    savedBlocks = null;
  }
}


/**
 * @private
 */
function wrapDone(done) {
  // Jasmine support.
  if (typeof done.fail === 'function') {
    return function(err) {
      if (err) done.fail(err);
      else done();
    };
  }

  return done;
}

/**
 * @private
 */
function wrapFn(input) {
  var output = function(name, fn) {
    if (typeof name === 'function') {
      return input(wrapBody(name));
    }

    return input(name, wrapBody(fn));
  };

  if (typeof input.only === 'function') {
    output.only = function(name, fn) {
      return input.only(name, wrapBody(fn));
    };
  }

  if (typeof input.skip === 'function') {
    output.skip = function(name) {
      return input.skip(name);
    };
  }

  return output;
}

/**
 * @private
 */
function wrapBody(input) {
  // Let the test runner handle a non-function.
  if (typeof input !== 'function') return input;

  // Don't double-wrap a function.
  if (input.__syncit === fakeContext) return input;

  var body = function(done) {
    var self = this;
    sync.fiber(function() {
      input.call(self);
    }, wrapDone(done));
  };

  body.__syncit = fakeContext;

  return body;
}

/**
 * @private
 */
function checkContext() {
  if (context === fakeContext) {
    throw new Error('unable to identify root scope');
  }
}

exports.wrap = wrap;
exports.replace = replace;
exports.restore = restore;

blockFunctionNames.forEach(function(name) {
  exports[name] = function(input) {
    if (arguments.length === 0 || input === undefined) {
      checkContext();
      input = context[name];
    }
    if (typeof input === 'function') {
      return wrapFn(input);
    }
    throw new TypeError('expected a function to wrap');
  };
});
