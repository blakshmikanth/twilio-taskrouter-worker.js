'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');

const Configuration = require('../../../lib/util/configuration');
const credentials = require('../../env');
const credsMulti = credentials.MultiTask;
const credsNonMulti = credentials.NonMultiTask;
const Errors = require('../../../lib/util/constants').twilioErrors;
const fakePayloads = require('../../util/fakeWorkerResponses').fakePayloads;
const JWT = require('../../util/makeJWTToken');
const Logger = require('../../../lib/util/logger');
const Worker = require('../../../lib/worker');


describe('Channel', function() {

  const multiTaskToken = JWT.getJWTToken(credsMulti.AccountSid, credsMulti.AuthToken, credsMulti.WorkspaceSid, credsMulti.WorkerAlice, 'prod');
  const nonMultiTaskToken = JWT.getJWTToken(credsNonMulti.AccountSid, credsNonMulti.AuthToken, credsNonMulti.WorkspaceSid, credsNonMulti.WorkerAlice, 'prod');

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

  describe('constructor', function() {
    it('should create 5 specific channels in MultiTask mode', function() {
      this.timeout(5000);
      const worker = new Worker(multiTaskToken);

      return new Promise(function(resolve) {
        worker.on('ready', resolve);
      }).then(function() {
        assert.isNotNull(worker.channels);
        assert.equal(worker.channels.size, 5);

        worker.channels.forEach((channel) => {
          assert.equal(channel.capacity, workerChannelsMultiTask[channel.taskChannelUniqueName].capacity);
          assert.equal(channel.available, workerChannelsMultiTask[channel.taskChannelUniqueName].available);
        });
      });
    });

    it('should create 5 specific channels in NonMultiTask mode', function() {
      this.timeout(5000);
      const worker = new Worker(nonMultiTaskToken);

      return new Promise(function(resolve) {
        worker.on('ready', resolve);
      }).then(function() {
        assert.isNotNull(worker.channels);
        assert.equal(worker.channels.size, 5);

        worker.channels.forEach((channel) => {
          assert.equal(channel.capacity, workerChannelsNonMultiTask[channel.taskChannelUniqueName].capacity);
          assert.isTrue(workerChannelsNonMultiTask[channel.taskChannelUniqueName].available);
        });
      });
    });
  });

  describe('#setAvailability(isAvailable)', function() {
    it('should set the availability', function() {
      this.timeout(5000);

      const worker = new Worker(multiTaskToken);
      let chatChannel;

      return new Promise(function(resolve) {
        worker.on('ready', resolve);
      }).then(function() {

        assert.isNotNull(worker.channels);

        worker.channels.forEach(function(channel) {
          if (channel.taskChannelUniqueName === 'chat') {
            chatChannel = channel;
          }
        });
        assert.isFalse(chatChannel.available);
        assert.equal(chatChannel.capacity, 1);
        return chatChannel.setAvailability(true);
      }).then(function() {
        assert.isTrue(chatChannel.available);
        return chatChannel.setAvailability(false);
      }).then(function() {
        assert.isFalse(chatChannel.available);
      });
    });

    it('should emit an event availabilityUpdated', function() {
      this.timeout(5000);

      const worker = new Worker(multiTaskToken);
      const spy = sinon.spy();
      let chatChannel;

      return new Promise(function(resolve) {
        worker.on('ready', resolve);
      }).then(function() {

        worker.channels.forEach(function(channel) {
          if (channel.taskChannelUniqueName === 'chat') {
            chatChannel = channel;
          }
        });
        chatChannel.on('availabilityUpdated', spy);
        return chatChannel.setAvailability(true);
      }).then(function() {
        return chatChannel.setAvailability(false);
      }).then(function() {
        assert.isTrue(spy.calledTwice);
      });
    });
  });

  describe('#setCapacity(capacity)', function() {
    it('should set the capacity', function() {
      this.timeout(5000);

      const worker = new Worker(multiTaskToken);
      let chatChannel;

      return new Promise(function(resolve) {
        worker.on('ready', resolve);
      }).then(function() {
        assert.isNotNull(worker.channels);

        worker.channels.forEach(function(channel) {
          if (channel.taskChannelUniqueName === 'chat') {
            chatChannel = channel;
          }
        });
        assert.isFalse(chatChannel.available);
        assert.equal(chatChannel.capacity, 1);
        return chatChannel.setCapacity(4);
      }).then(function() {
        assert.equal(chatChannel.capacity, 4);
        return chatChannel.setCapacity(1);
      }).then(function() {
        assert.equal(chatChannel.capacity, 1);
      });
    });

    it('should emit an event capacityUpdated', function() {
      this.timeout(5000);

      const worker = new Worker(multiTaskToken);
      const spy = sinon.spy();
      let chatChannel;

      return new Promise(function(resolve) {
        worker.on('ready', resolve);
      }).then(function() {
        worker.channels.forEach(function(channel) {
          if (channel.taskChannelUniqueName === 'chat') {
            chatChannel = channel;
          }
        });
        chatChannel.on('capacityUpdated', spy);
        return chatChannel.setCapacity(4);
      }).then(function() {
        return chatChannel.setCapacity(1);
      }).then(function() {
        assert.isTrue(spy.calledTwice);
      });
    });
  });
});