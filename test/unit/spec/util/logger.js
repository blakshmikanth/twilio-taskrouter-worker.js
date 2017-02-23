'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const sinon = require('sinon');
const Errors = require('../../../../lib/util/constants').twilioErrors;
const Logger = require('../../../../lib/util/logger');

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxMTMxIiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4Iiwicm9sZSI6IndvcmtlciJ9fSwiaWF0IjoxNDg3NTcxMTMxLCJleHAiOjE0ODc1NzQ3MzEsImlzcyI6IlNLeHh4Iiwic3ViIjoiQUN4eHgifQ.d7M8HaDL25C1yvywBGOQ4G3YQRNUSJ1miKKANzEis2k';

describe('Logger', () => {
  describe('constructor', () => {
    it('should throw an error if the module name is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to instantiate Logger. <string>moduleName is a required parameter.');
      assert.throws(() => new Logger(), Error, missingParamError);
    });

    it('should throw an error if the logging level option is not a permitted value', () => {
      const logLevelError = Errors.INVALID_ARGUMENT.clone('Error instantiating Logger. <string>logLevel must be one of [\'trace\', \'debug\', \'info\', \'warn\', \'error\']');
      assert.throws(() => new Logger('TestLogger', { logLevel: 'DEFCON 1' }), Error, logLevelError);
    });

    it('should set the logging level if option provided', () => {
      const log = new Logger('TestLogger', { logLevel: 'info' } );
      assert.equal(log.name, 'TestLogger');
      assert.equal(log.logLevel, 'info');
    });

    it('should use default values if no overriding log level option is provided', () => {
      const log = new Logger('TestLogger');
      assert.equal(log.name, 'TestLogger');
      assert.equal(log.logLevel, 'error');
    });
  });

  describe('#logLevel(msg)', () => {
    let traceSpy;
    let infoSpy;
    let debugSpy;
    let warnSpy;
    let errorSpy;

    before(function() {
      traceSpy = sinon.spy(Logger.prototype, 'trace');
      infoSpy = sinon.spy(Logger.prototype, 'info');
      debugSpy = sinon.spy(Logger.prototype, 'debug');
      warnSpy = sinon.spy(Logger.prototype, 'warn');
      errorSpy = sinon.spy(Logger.prototype, 'error');
    });

    afterEach(function() {
      traceSpy.reset();
      infoSpy.reset();
      debugSpy.reset();
      warnSpy.reset();
      errorSpy.reset();
    });

    describe('#trace(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        const log = new Logger('TestLogger', { logLevel: 'trace' });
        log.trace('Test trace message');

        assert.isTrue(traceSpy.calledOnce);
        assert.isTrue(traceSpy.calledWith('Test trace message'));
      });

      it('should call all log functions whose level is above trace', () => {
        const log = new Logger('TestLogger', { logLevel: 'trace' });
        log.info('Test info message');
        log.error('Test error message');
        log.trace('Test trace message');
        log.trace('Test trace message again');

        assert.isTrue(infoSpy.calledOnce);
        assert.isTrue(infoSpy.calledWith('Test info message'));

        assert.isTrue(errorSpy.calledOnce);
        assert.isTrue(errorSpy.calledWith('Test error message'));

        assert.isTrue(traceSpy.calledTwice);
        assert.isTrue(traceSpy.withArgs('Test trace message').calledOnce);
        assert.isTrue(traceSpy.withArgs('Test trace message again').calledOnce);

        assert.isFalse(warnSpy.called);
        assert.isFalse(debugSpy.called);
      });

    });

    describe('#info(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        const log = new Logger('TestLogger', { logLevel: 'info' });
        log.info('Test info message');

        assert.isTrue(infoSpy.calledOnce);
        assert.isTrue(infoSpy.calledWith('Test info message'));
      });

      it('should not call log functions whose level is not permitted', () => {
        const log = new Logger('TestLogger', { logLevel: 'info' });
        log.trace('Test trace message');
        log.warn('Test warn message');
        log.warn('Test warn message again');

        assert.isTrue(traceSpy.called);
        assert.isTrue(warnSpy.calledTwice);
        assert.isTrue(warnSpy.withArgs('Test warn message').calledOnce);
        assert.isTrue(warnSpy.withArgs('Test warn message again').calledOnce);
        assert.isFalse(infoSpy.called);
        assert.isFalse(debugSpy.called);
        assert.isFalse(errorSpy.called);
      });

    });

    describe('#debug(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        const log = new Logger('TestLogger', { logLevel: 'debug' });
        log.debug('Test debug message');

        assert.isTrue(debugSpy.calledOnce);
        assert.isTrue(debugSpy.calledWith('Test debug message'));
      });

      it('should not call log functions whose level is not permitted', () => {
        const log = new Logger('TestLogger', { logLevel: 'debug' });
        log.debug('Test debug message');
        log.trace('Test trace message');
        log.error('Test error message');

        assert.isTrue(debugSpy.calledOnce);
        assert.isTrue(debugSpy.calledWith('Test debug message'));
        assert.isTrue(traceSpy.calledOnce);
        assert.isTrue(traceSpy.calledWith('Test trace message'));
        assert.isTrue(errorSpy.calledOnce);
        assert.isTrue(errorSpy.calledWith('Test error message'));

        assert.isFalse(infoSpy.called);
        assert.isFalse(warnSpy.called);
      });

    });

    describe('#warn(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        const log = new Logger('TestLogger', { logLevel: 'warn' });
        log.warn('Test warn message');

        assert.isTrue(warnSpy.calledOnce);
        assert.isTrue(warnSpy.calledWith('Test warn message'));
      });

      it('should not call log functions whose level is not permitted', () => {
          const log = new Logger('TestLogger', { logLevel: 'warn' });
          log.warn('Test warn message');
          log.info('Test info message');
          log.info('Test info message again');
          log.error('Test error message');

          assert.isTrue(warnSpy.calledOnce);
          assert.isTrue(warnSpy.calledWith('Test warn message'));
          assert.isTrue(infoSpy.calledTwice);
          assert.isTrue(infoSpy.withArgs('Test info message').calledOnce);
          assert.isTrue(infoSpy.withArgs('Test info message again').calledOnce);
          assert.isTrue(errorSpy.calledOnce);
          assert.isTrue(errorSpy.calledWith('Test error message'));

          assert.isFalse(traceSpy.called);
          assert.isFalse(debugSpy.called);
      });

    });

    describe('#error(msg)', () => {
      it('should call the specific log function, if the level is permitted', () => {
        const log = new Logger('TestLogger', { logLeve: 'error' });
        log.error('Test error message');

        assert.isTrue(errorSpy.calledOnce);
        assert.isTrue(errorSpy.calledWith('Test error message'));
      });

      it('should be able to call all log functions whose level is below error', () => {
        const log = new Logger('TestLogger', { logLevel: 'error' });
        log.trace('Test trace message');
        log.info('Test info message');
        log.debug('Test debug message');
        log.warn('Test warn message');
        log.error('Test error message');
        log.info('Test info message again');

        assert.isTrue(traceSpy.calledOnce);
        assert.isTrue(traceSpy.calledWith('Test trace message'));
        assert.isTrue(infoSpy.calledTwice);
        assert.isTrue(infoSpy.withArgs('Test info message').calledOnce);
        assert.isTrue(infoSpy.withArgs('Test info message again').calledOnce);
        assert.isTrue(debugSpy.calledOnce);
        assert.isTrue(debugSpy.calledWith('Test debug message'));
        assert.isTrue(warnSpy.calledOnce);
        assert.isTrue(warnSpy.calledWith('Test warn message'));
        assert.isTrue(errorSpy.calledOnce);
        assert.isTrue(errorSpy.calledWith('Test error message'));
      });
    });
  });
});