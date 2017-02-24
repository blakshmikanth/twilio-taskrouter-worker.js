'use strict';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');
require('sinon-as-promised');

const Channel = require('../../../lib/channel');
const Configuration = require('../../../lib/util/configuration');
const Errors = require('../../../lib/util/constants').twilioErrors;
const EventEmitter = require('events').EventEmitter;
const fakePayloads = require('../../util/fakeWorkerResponses').fakePayloads;
const Logger = require('../../../lib/util/logger');
const Request = require('../../../lib/util/request');
const WebSocket = require('ws');

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxMTMxIiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4Iiwicm9sZSI6IndvcmtlciJ9fSwiaWF0IjoxNDg3NTcxMTMxLCJleHAiOjE0ODc1NzQ3MzEsImlzcyI6IlNLeHh4Iiwic3ViIjoiQUN4eHgifQ.d7M8HaDL25C1yvywBGOQ4G3YQRNUSJ1miKKANzEis2k';

describe('Channel', function() {

  const config = new Configuration(token, 'prod');
  const channelsPayload = fakePayloads.channels.channels;

  describe('constructor', () => {
    it('should throw an error if payload is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error instantiating Channel: <Object>payload is a required parameter');
      assert.throws(() => new Channel(null, config), Error, missingParamError);
    });

    it('should throw an error if config is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error instantiating Channel: <Configuration>config is a required parameter');
      assert.throws(() => new Channel(channelsPayload[0], null), Error, missingParamError);
    });

    it('should set properties using the payload', () => {
      const ipmChannel = new Channel(channelsPayload[0], config);

      assert.equal(ipmChannel.accountSid, channelsPayload[0].account_sid);
      assert.equal(ipmChannel.assignedTasks, channelsPayload[0].assigned_tasks);
      assert.equal(ipmChannel.available, channelsPayload[0].available);
      assert.equal(ipmChannel.capacity, channelsPayload[0].configured_capacity);
      assert.equal(ipmChannel.availableCapacityPercentage, channelsPayload[0].available_capacity_percentage);
      assert.equalDate(ipmChannel.dateCreated, new Date(channelsPayload[0].date_created));
      assert.equalDate(ipmChannel.dateUpdated, new Date(channelsPayload[0].date_updated));
      assert.equal(ipmChannel.sid, channelsPayload[0].sid);
      assert.equal(ipmChannel.taskChannelSid, channelsPayload[0].task_channel_sid);
      assert.equal(ipmChannel.taskChannelUniqueName, channelsPayload[0].task_channel_unique_name);
      assert.equal(ipmChannel.workerSid, channelsPayload[0].worker_sid);
      assert.equal(ipmChannel.workspaceSid, channelsPayload[0].workspace_sid);
      assert.equal(ipmChannel._config, config);
      assert.instanceOf(ipmChannel._log, Logger);
    });
  });

  describe('#setAvailability(isAvailable)', () => {
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';
    const requestParams = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels/WCxxx',
      method: 'POST',
      params: { Available: 'false' },
      event_type: 'availabilityUpdated',
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should throw an error if required isAvailable parameter is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error calling method setAvailability(). <boolean>isAvailable is a required parameter.');

      const ipmChannel = new Channel(channelsPayload[0], config);
      assert.throws(() => ipmChannel.setAvailability(), Error, missingParamError);
    });

    it('should set the availability of the Channel', () => {
        requestStub.withArgs(requestURL, requestParams).returns(Promise.resolve(fakePayloads.channelAvailabilityUpdate));

        const ipmChannel = new Channel(channelsPayload[0], config);
        return ipmChannel.setAvailability(false).then(() => {
          expect(ipmChannel.available).to.equal(false);
          expect(ipmChannel.dateCreated).to.equalDate(new Date(channelsPayload[0].date_created));
          expect(ipmChannel.dateUpdated).to.equalDate(new Date(channelsPayload[0].date_updated));
          expect(ipmChannel.capacity).to.equal(channelsPayload[0].configured_capacity);
          expect(ipmChannel.assignedTasks).to.equal(channelsPayload[0].assigned_tasks);
          expect(ipmChannel.availableCapacityPercentage).to.equal(channelsPayload[0].available_capacity_percentage);
        });
    });

    it('should return an error if unable to set availability of the Channel', () => {
      requestStub.withArgs(requestURL, requestParams).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const ipmChannel = new Channel(channelsPayload[0], config);
      return ipmChannel.setAvailability(false).catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message, 'Failed to parse JSON.');
      });

    });
  });

  describe('#setCapacity(capacity)', () => {
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';
    const requestParams = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels/WCxxx',
      method: 'POST',
      params: { Capacity: '5' },
      event_type: 'capacityUpdated',
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should throw an error if required capacity parameter is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error calling method setCapacity(). <int>capacity is a required parameter.');

      const ipmChannel = new Channel(channelsPayload[0], config);
      assert.throws(() => ipmChannel.setCapacity(), Error, missingParamError);

    });

    it('should set the capacity of the Channel and update its properties', () => {
      requestStub.withArgs(requestURL, requestParams).returns(Promise.resolve(fakePayloads.channelCapacityUpdate));

      const ipmChannel = new Channel(channelsPayload[0], config);
      return ipmChannel.setCapacity(5).then(() => {
        expect(ipmChannel.capacity).to.equal(5);
        expect(ipmChannel.available).to.equal(false);
        expect(ipmChannel.dateCreated).to.equalDate(new Date(channelsPayload[0].date_created));
        expect(ipmChannel.dateUpdated, new Date(channelsPayload[0].date_updated));
        expect(ipmChannel.assignedTasks).to.equal(channelsPayload[0].assigned_tasks);
        expect(ipmChannel.availableCapacityPercentage).to.equal(channelsPayload[0].available_capacity_percentage);
      });
    });

    it('should return an error if unable to set capacity of the channel', () => {
      requestStub.withArgs(requestURL, requestParams).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const ipmChannel = new Channel(channelsPayload[0], config);
      return ipmChannel.setCapacity(5).catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });
    });
  });

  describe('#_emitEvent(eventType, payload)', () => {
    it('should emit Event:on(capacityUpdated)', () => {
      const spy = sinon.spy();
    
      const ipmChannel = new Channel(channelsPayload[0], config);
      ipmChannel.on('capacityUpdated', spy);

      ipmChannel._emitEvent('capacityUpdated', fakePayloads.channelCapacityUpdate);

      assert.isTrue(spy.calledOnce);
      assert.equal(ipmChannel.capacity, 5);
      assert.equal(ipmChannel.available, false);
      assert.equalDate(ipmChannel.dateCreated, new Date(channelsPayload[0].date_created));
      assert.equalDate(ipmChannel.dateUpdated, new Date(channelsPayload[0].date_updated));
      assert.equal(ipmChannel.assignedTasks, channelsPayload[0].assigned_tasks);
      assert.equal(ipmChannel.availableCapacityPercentage, channelsPayload[0].available_capacity_percentage);
    });

    it('should emit Event:on(availabilityUpdated)', () => {
      const spy = sinon.spy();

      const ipmChannel = new Channel(channelsPayload[0], config);
      ipmChannel.on('availabilityUpdated', spy);

      ipmChannel._emitEvent('availabilityUpdated', fakePayloads.channelAvailabilityUpdate);

      assert.isTrue(spy.calledOnce);
      assert.equal(ipmChannel.available, false);
      assert.equalDate(ipmChannel.dateCreated, new Date(channelsPayload[0].date_created));
      assert.equalDate(ipmChannel.dateUpdated, new Date(channelsPayload[0].date_updated));
      assert.equal(ipmChannel.capacity, channelsPayload[0].configured_capacity);
      assert.equal(ipmChannel.assignedTasks, channelsPayload[0].assigned_tasks);
      assert.equal(ipmChannel.availableCapacityPercentage, channelsPayload[0].available_capacity_percentage);
    });
  });

});
