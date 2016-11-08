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


const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBQ3h4eCIsImV4cCI6MTQ4MTE0OTUwMSwidmVyc2lvbiI6InYxIiwiZnJpZW5kbHlfbmFtZSI6IldLeHh4IiwicG9saWNpZXMiOlt7InVybCI6Imh0dHBzOi8vZXZlbnQtYnJpZGdlLnR3aWxpby5jb20vdjEvd3NjaGFubmVscy9BQ3h4eC9XS3h4eCIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly9ldmVudC1icmlkZ2UudHdpbGlvLmNvbS92MS93c2NoYW5uZWxzL0FDeHh4L1dLeHh4IiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4IiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L0FjdGl2aXRpZXMiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvVGFza3MvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eCIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6eyJBY3Rpdml0eVNpZCI6eyJyZXF1aXJlZCI6dHJ1ZX19LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L1Rhc2tzLyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4L1Jlc2VydmF0aW9ucy8qKiIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC8qKiIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4LyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9XSwiYWNjb3VudF9zaWQiOiJBQ3h4eCIsImNoYW5uZWwiOiJXS3h4eCIsIndvcmtzcGFjZV9zaWQiOiJXU3h4eCIsIndvcmtlcl9zaWQiOiJXS3h4eCIsImlhdCI6MTQ4MTE0NTkwMX0.p3NZqOT7Qx_zQrS2pVczzbEJ6Car3qzZ-Qq5xa0fZfM';

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
