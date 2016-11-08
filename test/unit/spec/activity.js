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

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBQ3h4eCIsImV4cCI6MTQ4MTE0OTUwMSwidmVyc2lvbiI6InYxIiwiZnJpZW5kbHlfbmFtZSI6IldLeHh4IiwicG9saWNpZXMiOlt7InVybCI6Imh0dHBzOi8vZXZlbnQtYnJpZGdlLnR3aWxpby5jb20vdjEvd3NjaGFubmVscy9BQ3h4eC9XS3h4eCIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly9ldmVudC1icmlkZ2UudHdpbGlvLmNvbS92MS93c2NoYW5uZWxzL0FDeHh4L1dLeHh4IiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4IiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L0FjdGl2aXRpZXMiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvVGFza3MvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eCIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6eyJBY3Rpdml0eVNpZCI6eyJyZXF1aXJlZCI6dHJ1ZX19LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L1Rhc2tzLyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4L1Jlc2VydmF0aW9ucy8qKiIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC8qKiIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4LyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9XSwiYWNjb3VudF9zaWQiOiJBQ3h4eCIsImNoYW5uZWwiOiJXS3h4eCIsIndvcmtzcGFjZV9zaWQiOiJXU3h4eCIsIndvcmtlcl9zaWQiOiJXS3h4eCIsImlhdCI6MTQ4MTE0NTkwMX0.p3NZqOT7Qx_zQrS2pVczzbEJ6Car3qzZ-Qq5xa0fZfM';

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


