'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');

const Configuration = require('../../../lib/util/configuration');
const credentials = require('../../env');
const Errors = require('../../../lib/util/constants').twilioErrors;
const fakePayloads = require('../../util/fakeWorkerResponses').fakePayloads;
const JWT = require('../../util/makeAccessToken');
const Logger = require('../../../lib/util/logger');
const Task = require('../../../lib/task');
const testTools = require('../../util/testTools');
const Worker = require('../../../lib/worker');

describe('Client', function() {
  const taskSids = [];
  const taskSidsMulti = [];

  let aliceToken = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskAliceSid);
  let bobToken = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskBobSid);
  let aliceMultiToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid);
  let bobMultiToken = JWT.getAccessToken(credentials.accountSid, credentials.multiTaskWorkspaceSid, credentials.multiTaskBobSid);

  const workerChannelsMultiTask = {
    'default': { capacity: 3, available: true },
    'voice': { capacity: 1, available: false },
    'chat': { capacity: 1, available: false },
    'sms': { capacity: 1, available: false },
    'video': { capacity: 1, available: false }
  };
  
  const workerChannelsNonMultiTask = {
    'default': { capacity: 1, available: true },
    'voice': { capacity: 1, available: true },
    'chat': { capacity: 1, available: true },
    'sms': { capacity: 1, available: true },
    'video': { capacity: 1, available: true }
  };

  before(function(done) {
    while (taskSids.length !== 0) {
      testTools.deleteTask(credentials.accountSid, credentials.authToken, credentials.nonMultiTaskWorkspaceSid, taskSids.pop());
    }
    while (taskSidsMulti.length !== 0) {
      testTools.deleteTask(credentials.accountSid, credentials.authToken, credentials.multiTaskWorkspaceSid, taskSidsMulti.pop());
    }
    setTimeout(done, 1000);
  });

  after(function(done) {
    while (taskSids.length !== 0) {
      testTools.deleteTask(credentials.accountSid, credentials.authToken, credentials.nonMultiTaskWorkspaceSid, taskSids.pop());
    }
    while (taskSidsMulti.length !== 0) {
      testTools.deleteTask(credentials.accountSid, credentials.authToken, credentials.multiTaskWorkspaceSid, taskSidsMulti.pop());
    }
    setTimeout(done, 1000);
  });

  afterEach(function(done) {
    while (taskSids.length !== 0) {
      testTools.deleteTask(credentials.accountSid, credentials.authToken, credentials.nonMultiTaskWorkspaceSid, taskSids.pop());
    }
    while (taskSidsMulti.length !== 0) {
      testTools.deleteTask(credentials.accountSid, credentials.authToken, credentials.multiTaskWorkspaceSid, taskSidsMulti.pop());
    }
    setTimeout(done, 1000);
  });

  describe('constructor', function() {
    it('should create an instance of Client', function() {
      const alice = new Worker(aliceToken);
      assert.instanceOf(alice, Worker);
    });

    it('should create an instance of Logger', function() {
      const alice = new Worker(aliceToken, { logLevel: 'trace' });
      assert.instanceOf(alice._log, Logger);
      assert.equal(alice._log.logLevel, 'trace');
    });

    it('should create an instance of Configuration', function() {
      const alice = new Worker(aliceToken);
      assert.instanceOf(alice._config, Configuration);
    });
  });

  describe('initialization of Multi Task Worker', function() {
    it('should populate .activities', function() {
      this.timeout(5000);
      const multiTaskAlice = new Worker(aliceMultiToken);

      return new Promise(function(resolve) {
        multiTaskAlice.on('ready', resolve);
      }).then(function() {
        assert.isNotNull(multiTaskAlice.activities);
        assert.equal(multiTaskAlice.activities.size, 6);
      });
    });

    it('should populate .channels', function() {
      this.timeout(5000);
      const multiTaskAlice = new Worker(aliceMultiToken);

      return new Promise(function(resolve) {
        multiTaskAlice.on('ready', resolve);
      }).then(function() {
        assert.isNotNull(multiTaskAlice.channels);
        assert.equal(multiTaskAlice.channels.size, 5);

        multiTaskAlice.channels.forEach((channel) => {
          assert.equal(channel.capacity, workerChannelsMultiTask[channel.taskChannelUniqueName].capacity);
          assert.equal(channel.available, workerChannelsMultiTask[channel.taskChannelUniqueName].available);
        });
      });
    });

    it('should set the activty on connect if provided', () => {
      this.timeout(5000);
      const multiTaskAlice = new Worker(aliceMultiToken, { connectActivitySid: credentials.multiTaskConnectActivitySid });

      return new Promise((resolve) => {
        multiTaskAlice.on('ready', resolve);
      }).then(() => {
        multiTaskAlice.activities.forEach((activity) => {
          if (activity.name === 'Ready') {
            assert.isTrue(activity.isCurrent);
            assert.equal(multiTaskAlice.activity, activity);
            assert.isTrue(activity.available);
          } else {
            assert.isFalse(activity.isCurrent);
          }
        });
      });
    })

    it('should only have one of .activities as the current activity', function() {
      this.timeout(5000);
      const multiTaskAlice = new Worker(aliceMultiToken, { connectActivitySid: credentials.multiTaskConnectActivitySid });

      return new Promise(function(resolve) {
        multiTaskAlice.on('ready', resolve);
      }).then(() => {
        multiTaskAlice.activities.forEach(function(activity) {
          if (activity.name === 'Ready') {
            assert.isTrue(activity.isCurrent);
            assert.equal(multiTaskAlice.activity, activity);
          } else {
            assert.isFalse(activity.isCurrent);
          }
        });
      });
    });

    it('should populate .reservations with 0 Reservations when none currenty pending', function() {
      this.timeout(5000);
      const multiTaskAlice = new Worker(aliceMultiToken, { connectActivitySid: credentials.multiTaskConnectActivitySid });

      return new Promise(function(resolve) {
        multiTaskAlice.on('ready', resolve);
      }).then(function() {
        assert.equal(multiTaskAlice.reservations.size, 0);
      });
    });
  });

  describe('Multi Task Worker with pending Reservations', function() {
    before(function(done) {
      // turn the worker online so that Reservations can be created
      testTools.updateWorkerActivity(credentials.accountSid, credentials.authToken, credentials.multiTaskWorkspaceSid, credentials.multiTaskAliceSid, credentials.multiTaskConnectActivitySid);

      for (let i = 0; i < 3; i++) {
        testTools.createTask(credentials.accountSid, credentials.authToken, credentials.multiTaskWorkspaceSid, credentials.multiTaskWorkflowSid, '{ "selected_language": "en" }').then(function(taskPayload) {
          taskSidsMulti.push(taskPayload.sid);
        });
      }
      setTimeout(done, 1000);
    });

    it('should populate pending .reservations', function() {
      this.timeout(5000);
      const multiTaskAlice = new Worker(aliceMultiToken, { connectActivitySid: credentials.multiTaskConnectActivitySid });
      
      return new Promise(function(resolve) {
        multiTaskAlice.on('ready', resolve);
      }).then(function() {
        assert.equal(multiTaskAlice.reservations.size, 3);

        multiTaskAlice.channels.forEach(function(channel) {
          if (channel.name === 'default') {
            assert.isFalse(channel.available);
          }
        });
      });
    });
  });

  describe('initialization of Non Multi Task Worker', function() {
    it('should populate .activities', function() {
      this.timeout(5000);
      const alice = new Worker(aliceToken);

      return new Promise(function(resolve) {
        alice.on('ready', resolve);
      }).then(() => {
        assert.isNotNull(alice.activities);
        assert.equal(alice.activities.size, 6);
      });
    });

    it('should populate .channels', function() {
      this.timeout(5000);
      const alice = new Worker(aliceToken);

      return new Promise(function(resolve) {
        alice.on('ready', resolve);
      }).then(function() {
        assert.isNotNull(alice.channels);
        assert.equal(alice.channels.size, 5);

        alice.channels.forEach(function(channel) {
          assert.equal(channel.capacity, workerChannelsNonMultiTask[channel.taskChannelUniqueName].capacity);
          assert.equal(channel.available, workerChannelsNonMultiTask[channel.taskChannelUniqueName].available);
        });
      });
    });

    it('should set the activty on connect if provided', () => {
      this.timeout(5000);
      const alice = new Worker(aliceToken, { connectActivitySid: credentials.nonMultiTaskConnectActivitySid });

      return new Promise((resolve) => {
        alice.on('ready', resolve);
      }).then(() => {
        alice.activities.forEach((activity) => {
          if (activity.name === 'Ready') {
            assert.isTrue(activity.isCurrent);
            assert.equal(alice.activity, activity);
            assert.isTrue(activity.available);
          } else {
            assert.isFalse(activity.isCurrent);
          }
        });
      });
    })

    it('should only have one of .activities as the current activity', function() {
      this.timeout(5000);
      const alice = new Worker(aliceToken, { connectActivitySid: credentials.nonMultiTaskConnectActivitySid });

      return new Promise(function(resolve) {
        alice.on('ready', resolve);
      }).then(function() {
        alice.activities.forEach(function(activity) {
          if (activity.name === 'Ready') {
            assert.isTrue(activity.isCurrent);
            assert.equal(alice.activity, activity);
          } else {
            assert.isFalse(activity.isCurrent);
          }
        });
      });
    });

    it('should populate .reservations with 0 Reservations when none currenty pending', function() {
      this.timeout(5000);
      const alice = new Worker(aliceToken, { connectActivitySid: credentials.nonMultiTaskConnectActivitySid });

      return new Promise(function(resolve) {
        alice.on('ready', resolve);
      }).then(function() {
        assert.equal(alice.reservations.size, 0);
      });
    });
  });

  describe('Non Multi Task Worker with pending Reservations', function() {
    before(function(done) {
      // turn the worker online so that Reservations can be created
      testTools.updateWorkerActivity(credentials.accountSid, credentials.authToken, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskBobSid, credentials.nonMultiTaskConnectActivitySid);

      for (let i = 0; i < 2; i++) {
        testTools.createTask(credentials.accountSid, credentials.authToken, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskWorkflowSid, '{ "selected_language": "es" }').then(function(taskPayload) {
          taskSids.push(taskPayload.sid);
        });
      }
      setTimeout(done, 1000);
    });

    it('should populate pending .reservations', function() {
      this.timeout(5000);
      const bob = new Worker(bobToken, { connectActivitySid: credentials.nonMultiTaskConnectActivitySid });
      
      return new Promise(function(resolve) {
        bob.on('ready', resolve);
      }).then(function() {
        assert.equal(bob.reservations.size, 1);
      });
    });
  });

  describe('#setAttributes(newAttributes)', function() {
    it('should set the attributes of the worker', function() {
      this.timeout(5000);
      const alice = new Worker(aliceToken);
      const newAttributes = { languages:['en'], name: 'Ms. Alice' };
      const spy = sinon.spy();

      alice.on('attributesUpdated', spy);

      return alice.setAttributes(newAttributes).then(function(updatedAlice) {
        expect(alice).to.equal(updatedAlice);
        expect(alice.attributes).to.deep.equal(newAttributes);
        expect(spy).to.have.been.calledOnce;
      });
    });

    it('should return an error if unable to set the attributes', () => {
      this.timeout(5000);
      const alice = new Worker(aliceToken);
      const badAttributes = 'a string of attributes';

      return alice.setAttributes(badAttributes).catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });
    });
  });

  describe('#updateToken(newToken)', function() {
    it('should update the token on the Signaling instance', function() {
      this.timeout(5000);
      const alice = new Worker(aliceToken);
      const spy = sinon.spy();

      alice.on('tokenUpdated', spy);

      let updateAliceToken = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskAliceSid);
      alice.updateToken(updateAliceToken);
      assert.equal(alice._config.token, updateAliceToken);
      assert.isTrue(spy.calledOnce);
    });

    it('should return an error if unable to update the token', function() {
      this.timeout(5000);
      const alice = new Worker(aliceToken);
      const badTokenError = Errors.INVALID_TOKEN.clone('Twilio token malformed. Unable to decode token.');
      const badToken = 'asdfasdf';

      assert.throws(() => alice.updateToken('abc'), Error, badTokenError);

    });
  });

  describe('#getTasks()', function() {
    before(function(done) {
      for (let i = 0; i < 2; i++) {
        testTools.createTask(credentials.accountSid, credentials.authToken, credentials.multiTaskWorkspaceSid, credentials.multiTaskWorkflowSid, '{ "selected_language": "es" }').then(function(taskPayload) {
          taskSidsMulti.push(taskPayload.sid);
        });
      }
      setTimeout(done, 1000);
    });

    it('should get the Task instances', function() {
      this.timeout(5000);
      const multiTaskBob = new Worker(bobMultiToken, { connectActivitySid: credentials.multiTaskConnectActivitySid });

      return new Promise(function(resolve) {
        multiTaskBob.on('ready', resolve);
      }).then(function() {
        return multiTaskBob.getTasks().then(function(tasks) {
          expect(tasks.size).to.equal(2);
        });
      });
    });
  });
});
