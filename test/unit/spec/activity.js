'use strict';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');
require('sinon-as-promised');

const Activity = require('../../../lib/activity');
const Configuration = require('../../../lib/util/configuration');
const Errors = require('../../../lib/util/constants').twilioErrors;
const fakePayloads = require('../../util/fakeWorkerResponses').fakePayloads;
const Logger = require('../../../lib/util/logger');
const Request = require('../../../lib/util/request');
const Worker = require('../../../lib/worker');

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxMTMxIiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4Iiwicm9sZSI6IndvcmtlciJ9fSwiaWF0IjoxNDg3NTcxMTMxLCJleHAiOjE0ODc1NzQ3MzEsImlzcyI6IlNLeHh4Iiwic3ViIjoiQUN4eHgifQ.d7M8HaDL25C1yvywBGOQ4G3YQRNUSJ1miKKANzEis2k';

describe('Activity', function() {

  const worker = new Worker(token);
  const offlineActivityPayload = fakePayloads.activities.activities[0];
  const idleActivityPayload = fakePayloads.activities.activities[1];
  const reservedActivityPayload = fakePayloads.activities.activities[2];
  const busyActivityPayload = fakePayloads.activities.activities[3];
  const awayActivityPayload = fakePayloads.activities.activities[4];

  describe('constructor', () => {
    it('should throw an error if payload is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error instantiating Activity: <Object>payload is a required parameter');
      assert.throws(() => new Activity(null, worker), Error, missingParamError);
    });

    it('should throw an error if worker is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error instantiating Activity: <Worker>worker is a required parameter');
      assert.throws(() => new Activity(offlineActivityPayload, null), Error, missingParamError);
    });

    it('should set properties using the payload', () => {
      const offlineActivity = new Activity(offlineActivityPayload, worker);

      assert.equal(offlineActivity.accountSid, offlineActivityPayload.account_sid);
      assert.equal(offlineActivity.available, offlineActivityPayload.available);
      assert.equalDate(offlineActivity.dateCreated, new Date(offlineActivityPayload.date_created));
      assert.equalDate(offlineActivity.dateUpdated, new Date(offlineActivityPayload.date_updated));
      assert.equal(offlineActivity.isCurrent, false);
      assert.equal(offlineActivity.name, offlineActivityPayload.friendly_name);
      assert.equal(offlineActivity.sid, offlineActivityPayload.sid);
      assert.equal(offlineActivity.workspaceSid, offlineActivityPayload.workspace_sid);

      assert.instanceOf(offlineActivity._config, Configuration);
      assert.instanceOf(offlineActivity._log, Logger);
      assert.instanceOf(offlineActivity._worker, Worker);
    });
  });
  
  describe('#setAsCurrent', () => {

    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';
    const requestParams = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
      method: 'POST',
      params: { ActivitySid: 'WAyyy' },
      event_type: 'activityUpdated',
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should set this Activity to be the current activity of the Worker', () => {
      requestStub.withArgs(requestURL, requestParams).returns(Promise.resolve(fakePayloads.workerActivityUpdate));

      const activities = new Map();
      fakePayloads.activities.activities.forEach((activityPayload) => {
        activities.set(activityPayload.sid, new Activity(activityPayload, worker));
      });

      worker._activities = activities;
      
      let idleActivity;

      worker.activities.forEach((activity) => {
        if (activity.name === 'Offline') {
          activity._isCurrent = true;
          worker._activity = activity;

          assert.equal(worker.activity, activity);
          assert.isTrue(worker.activity.isCurrent);
        } else {
          if (activity.name === 'Idle') {
            idleActivity = activity;
          }
          assert.notEqual(worker.activity, activity);
          assert.isFalse(activity.isCurrent);
        }
      });

      // expect to update the activity from Offline -> Idle
      return idleActivity.setAsCurrent().then(() => {
        expect(idleActivity.isCurrent).to.be.true;
        expect(idleActivity).to.equal(worker.activity);
        
        worker.activities.forEach((activity) => {
          if (activity.name !== 'Idle') {
            expect(activity.isCurrent).to.be.false;
            expect(worker.activity).to.not.equal(activity);
          }
        });
      });
    });

    it('should return an error if unable to set the activity', () => {
      requestStub.withArgs(requestURL, requestParams).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const activities = fakePayloads.activities.activities.map(activityPayload => new Activity(activityPayload, worker));
      worker._activities = activities;

      let idleActivity;
      let offlineActivity;

      worker.activities.forEach((activity) => {
        if (activity.name === 'Offline') {
          activity._isCurrent = true;
          worker._activity = activity;
          offlineActivity = activity;
        }
        if(activity.name === 'Idle') {
          idleActivity = activity;
        }
      });

      return idleActivity.setAsCurrent().catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');

        expect(worker.activity).to.equal(offlineActivity);
        expect(offlineActivity.isCurrent).to.be.true;
      });

    });
  });  

  describe('#_emitEvent(eventType, payload)', () => {
    it('should emit Event:on(nameUpdated)', () => {
      const spy = sinon.spy();
    
      const awayActivity = new Activity(awayActivityPayload, worker);
      awayActivity.on('nameUpdated', spy);

      awayActivity._emitEvent('nameUpdated', fakePayloads.activityNameUpdate);

      assert.equalDate(awayActivity.dateCreated, new Date(fakePayloads.activityNameUpdate.date_created));
      assert.equalDate(awayActivity.dateUpdated, new Date(fakePayloads.activityNameUpdate.date_updated));
      assert.equal(awayActivity.sid, fakePayloads.activityNameUpdate.sid);
      assert.equal(awayActivity.name, fakePayloads.activityNameUpdate.friendly_name);
      assert.equal(awayActivity.available, fakePayloads.activityNameUpdate.available);
      assert.isFalse(awayActivity.isCurrent);
    });
  });

});


