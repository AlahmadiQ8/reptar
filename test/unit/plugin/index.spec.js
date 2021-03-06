import assert from 'power-assert';
import sinon from 'sinon';
import _ from 'lodash';
import Promise from 'bluebird';

import Plugin from '../../../lib/plugin/index.js';

describe('plugin/index Plugin', function() {
  const handlerName = 'test:handler';

  afterEach(() => {
    Plugin._handlers = {};
  });

  describe('addEventHandler', function() {
    it('can add handlers', function() {
      const handlerFn = sinon.spy();

      Plugin.addEventHandler(handlerName, handlerFn);

      assert(_.isArray(Plugin._handlers[handlerName]));
      assert.equal(Plugin._handlers[handlerName].length, 1);

      assert.deepEqual(
        Plugin._handlers[handlerName][0],
        handlerFn
      );

      assert.equal(handlerFn.called, false);

      Plugin.addEventHandler(handlerName, handlerFn);

      assert.equal(Plugin._handlers[handlerName].length, 2);
    });
  });

  describe('processEventHandlers', function() {
    describe('can invoke handlers when none exist', () => {
      it('with one passed argument', async () => {
        const eventArg = 'hey man';
        let newVal;
        try {
          newVal = await Plugin.processEventHandlers('bogus', eventArg);
        } catch (e) {
          console.log(e);
        }

        assert.deepEqual(newVal, eventArg);
      });

      it('with multiple passed arguments', async () => {
        const eventArgs = [
          'the chicken',
          'is',
          5
        ];

        let newVal;
        try {
          newVal = await Plugin.processEventHandlers(
            'bogus',
            eventArgs[0],
            eventArgs[1],
            eventArgs[2]
          );
        } catch (e) {
          console.log(e);
        }

        assert.deepEqual(newVal, eventArgs);
      });
    });

    it('can invoke handlers sequentionally', async () => {
      const noopFunc = sinon.spy(() => {
        // noop
      });

      const promiseFn = sinon.spy((val) => {
        return new Promise(resolve => {
          resolve(val);
        });
      });

      Plugin.addEventHandler(handlerName, noopFunc);
      Plugin.addEventHandler(handlerName, promiseFn);

      assert(_.isArray(Plugin._handlers[handlerName]));
      assert.equal(Plugin._handlers[handlerName].length, 2);

      const handlerValue = 5;
      let newVal;

      try {
        newVal = await Plugin.processEventHandlers(handlerName, handlerValue);
      } catch (e) {
        throw e;
      }

      assert.equal(noopFunc.callCount, 1);
      assert.ok(noopFunc.calledWith(5));

      assert.equal(promiseFn.callCount, 1);
      assert.ok(promiseFn.calledWith(5));

      assert.equal(newVal, handlerValue);

      const modifierFn = sinon.spy((val) => {
        return val * val;
      });
      const trailingNoopFn = sinon.spy();

      Plugin.addEventHandler(handlerName, modifierFn);
      Plugin.addEventHandler(handlerName, trailingNoopFn);

      try {
        newVal = await Plugin.processEventHandlers(handlerName, handlerValue);
      } catch (e) {
        throw e;
      }

      assert.equal(noopFunc.callCount, 2);
      assert.equal(promiseFn.callCount, 2);
      assert.equal(modifierFn.callCount, 1);
      assert.ok(modifierFn.calledWith(5));
      assert.equal(trailingNoopFn.callCount, 1);

      assert.equal(newVal, handlerValue * handlerValue);
    });

    it('invokes handlers with multiple arguments', async () => {
      const blankReturnFn = sinon.spy(() => {
        return;
      });

      Plugin.addEventHandler(handlerName, blankReturnFn);

      assert(_.isArray(Plugin._handlers[handlerName]));
      assert.equal(Plugin._handlers[handlerName].length, 1);

      const argValue1 = {foo: 'bar'};
      const argValue2 = 'a wonderful world';
      let processedEventValue;

      try {
        processedEventValue = await Plugin.processEventHandlers(
          handlerName,
          argValue1,
          argValue2
        );
      } catch (e) {
        console.log(e);
      }

      assert.equal(blankReturnFn.callCount, 1);
      assert.ok(blankReturnFn.calledWith(argValue1, argValue2));

      assert.equal(argValue1, processedEventValue[0]);
      assert.equal(argValue2, processedEventValue[1]);
    });

    describe('throws when plugin handlers', () => {
      it('return only part of the arguments given', (done) => {
        const eventHandlerFn = sinon.spy((arg1, arg2) => {
          return arg2;
        });

        Plugin.addEventHandler(handlerName, eventHandlerFn);

        assert(_.isArray(Plugin._handlers[handlerName]));
        assert.equal(Plugin._handlers[handlerName].length, 1);

        const argValue1 = {foo: 'bar'};
        const argValue2 = 'a wonderful world';

        Plugin.processEventHandlers(
          handlerName,
          argValue1,
          argValue2
        ).catch(() => {
          done();
        });
      });

      it('returns arguments in wrong order given', (done) => {
        const eventHandlerFn = sinon.spy((arg1, arg2) => {
          return [arg2, arg1];
        });

        Plugin.addEventHandler(handlerName, eventHandlerFn);

        assert(_.isArray(Plugin._handlers[handlerName]));
        assert.equal(Plugin._handlers[handlerName].length, 1);

        const argValue1 = {foo: 'bar'};
        const argValue2 = 'a wonderful world';

        Plugin.processEventHandlers(
          handlerName,
          argValue1,
          argValue2
        ).catch(() => {
          done();
        });
      });
    });
  });

  describe('loadFromPackageJson', () => {
    it('TODO', () => {

    });
  });

  describe('loadFromDirectory', () => {
    it('TODO', () => {

    });
  });
});
