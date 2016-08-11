var expect = require('chai').expect;
var sync = require('synchronize');

var syncIt = require('..');

var isMocha = process.env.ENV === 'mocha',
  beforeName = isMocha ? 'before' : 'beforeAll',
  afterName = isMocha ? 'after' : 'afterAll';

describe('synchronize-bdd', function() {
  describe('.wrap', function() {
    var setup0 = false, setup1 = false, setup2 = false;

    syncIt.wrap(global[beforeName])(function() {
      checkContext(this);

      sync.await(setTimeout(sync.defer(), 5));
      setup0 = true;
    });

    var bmap = {it: global.it};
    bmap[beforeName] = global[beforeName];
    syncIt.wrap(bmap)[beforeName](function() {
      checkContext(this);

      sync.await(setTimeout(sync.defer(), 5));
      setup1 = true;
    });

    syncIt.wrap()[beforeName](function() {
      checkContext(this);

      sync.await(setTimeout(sync.defer(), 5));
      setup2 = true;
    });

    it('should support ' + beforeName + '()', function() {
      expect(setup0).to.be.ok;
      expect(setup1).to.be.ok;
      expect(setup2).to.be.ok;
    });

    it('should throw for invalid input', function() {
      expect(function() {
        syncIt.wrap('not a function');
      }).to.throw(TypeError, 'wrap');

      expect(function() {
        syncIt.wrap(null);
      }).to.throw(TypeError, 'wrap');
    });

    var prevDone = false;
    syncIt.wrap(global.it)('should support it', function() {
      checkContext(this);

      sync.await(setTimeout(sync.defer(), 5));

      prevDone = true;
    });

    it('should delay subsequent tests', function() {
      // This also ensures that the previous test ran at all - ensures that
      // syncIt.wrap isn't just a noop.
      expect(prevDone).to.be.ok;
    });

    var explicitObj = syncIt.wrap({afterEach: global.afterEach, it: global.it});
    it('should wrap all given', function() {
      var names = Object.keys(explicitObj);

      expect(names).to.have.members(['afterEach', 'it']);
    });

    var ranA = false;
    explicitObj.it('should produce wrappers for given block functions', function() {
      checkContext(this);

      ranA = true;
    });

    it('should attach tests for explicit it calls', function() {
      expect(ranA).to.be.ok;
    });

    it('should wrap all visible', function() {
      var names = Object.keys(syncIt.wrap());

      expect(names).to.have.members(isMocha
        ? ['before', 'beforeEach', 'after', 'afterEach', 'it']
        : ['beforeAll', 'beforeEach', 'afterAll', 'afterEach', 'it']);
    });

    var ranB = false;
    syncIt.wrap().it('should produce wrappers for visible block functions', function() {
      checkContext(this);

      ranB = true;
    });

    it('should attach tests for it calls', function() {
      expect(ranB).to.be.ok;
    });
  });

  describe('.it', function() {
    it('should throw for invalid input', function() {
      expect(function() {
        syncIt.it('not a function')
      }).to.throw(TypeError, 'wrap');
    });

    syncIt.it()('should support global wrapping', function() {
      if (isMocha) expect(this.timeout).to.be.a('function');

      sync.await(setImmediate(sync.defer()));
    });

    syncIt.it(global.it)('should support explicit wrapping', function() {
      sync.await(setImmediate(sync.defer()));
    });
  });

  describe('.replace', function() {
    var original = global[beforeName];

    syncIt.replace();

    var replaced = global[beforeName];

    var beforeError;
    global[beforeName](function() {
      try {
        checkContext(this);
      } catch (err) {
        beforeError = err;
      }
    });

    it('should have replaced it()', function() {
      checkContext(this);
    });

    it('should have replaced ' + beforeName + '()', function() {
      if (beforeError) throw beforeError;

      expect(replaced).to.not.equal(original);
    });

    it('should have restored ' + beforeName + '()', function() {
      expect(global[beforeName]).to.equal(original);
    });

    syncIt.restore();
  });
});

function checkContext(obj) {
  if (isMocha) {
    expect(obj).to.have.property('timeout')
      .that.is.a('function');
  }

  // This will throw if we're not in a fiber.
  sync.await(setImmediate(sync.defer()));
}
