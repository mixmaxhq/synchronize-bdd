synchronize-bdd
===============

A small [synchronize.js](http://alexeypetrushin.github.io/synchronize/docs/index.html) wrapper around the BDD block functions from Mocha and Jasmine.

[![Build Status](https://travis-ci.org/mixmaxhq/synchronize-bdd.svg?branch=master)](https://travis-ci.org/mixmaxhq/synchronize-bdd)

```js
const assert = require('assert');
const sync = require('synchronize');
const fs = require('fs');

require('synchronize-bdd').replace();

describe('thing', function() {
  let data;
  before(function() {
    // We can load things in the before hook.
    data = sync.await(fs.readFile('./data', 'utf-8', sync.defer()));
  });

  it('should have data', function() {
    // We can arbitrarily yield in it blocks.
    sync.await(setImmediate(sync.defer()));

    assert(typeof data === 'string' && ~data.indexOf('data'));
  });
});
```

Why?
----

Many times you want to test an asynchronous API, and if you're already using
synchronize in your codebase, you might be used to the simplicity of `await` and
`defer`. This module wraps your test blocks so that you may `synchronize`
effortlessly.

Install
-------

```sh
$ npm install synchronize-bdd
```
or
```sh
$ npm install synchronize-bdd
```

API
---

### `syncBdd.wrap([blockFn])`

Wrap the given block function or hash of block functions with synchronize, and
return the wrapped function(s).

```js
// Wrap explicitly provided block function.
const it = syncBdd.wrap(global.it);

// Wrap explicitly provided block functions.
const {it, before} = syncBdd.wrap({it: global.it, before: global.before});

// Wrap all globally visible block functions. In this example, we only capture
// `it` and `before`.
const {it, before} = syncBdd.wrap();
```

### `syncBdd.it([it])`

Version of `wrap` which wraps the globally visible `it`. If no function is
given, and no `it` is globally visible, this will throw an error.

```js
// Explicit function.
const it = syncBdd.it(global.it);

// Implicitly from global.
const it = syncBdd.it();
```

### `syncBdd.before([before])`

Version of `wrap`. Similar to `syncBdd.it`, but for Mocha's `before` hook.

### `syncBdd.beforeAll([beforeAll])`

Version of `wrap`. Similar to `syncBdd.before`, but for Jasmine's equivalent
`beforeAll` hook.

### `syncBdd.beforeEach([beforeEach])`

Version of `wrap`. Compatible with both Mocha and Jasmine's `beforeEach` hook.

### `syncBdd.after([after])`

See `syncBdd.before`.

### `syncBdd.afterAll([afterAll])`

See `syncBdd.beforeAll`.

### `syncBdd.afterEach([afterEach])`

See `syncBdd.beforeEach`.

### `syncBdd.replace()`

Overwrites the global block functions with their synchronized equivalents.

```js
syncBdd.replace();

describe('module', function() {
  it('should support synchronize', function() {
    sync.await(setImmediate(sync.defer()));
  });
});
```

### `syncBdd.restore()`

Undoes the global replacement from `syncBdd.replace()`, and restores the original
block functions.

```js
describe('module', function() {
  syncBdd.replace();

  it('should support synchronize', function() {
    sync.await(setImmediate(sync.defer()));
  });

  syncBdd.restore();
});
```

Changelog
-------

* 0.2.0 Wrapped Jasmine's `fit`.

* 0.1.1 Removed use of deprecated `root` that throws a warning in Node 6.

* 0.1.0 Initial release

License
-------

> The MIT License (MIT)
>
> Copyright &copy; 2016 Mixmax, Inc ([mixmax.com](https://mixmax.com))
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in allcopies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
