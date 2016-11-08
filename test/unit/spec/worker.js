'use strict';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');

const Activity = require('../../../lib/activity');
const Configuration = require('../../../lib/util/configuration');
const Errors = require('../../../lib/util/constants').twilioErrors;
const fakePayloads = require('../../util/fakeWorkerResponses').fakePayloads;
const Logger = require('../../../lib/util/logger');
const Request = require('../../../lib/util/request');
const Reservation = require('../../../lib/reservation');
const Signaling = require('../../../lib/signaling/eventbridge');
const Task = require('../../../lib/task');
const Worker = require('../../../lib/worker');

const initialToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBQ3h4eCIsImV4cCI6MTQ4MTE0OTUwMSwidmVyc2lvbiI6InYxIiwiZnJpZW5kbHlfbmFtZSI6IldLeHh4IiwicG9saWNpZXMiOlt7InVybCI6Imh0dHBzOi8vZXZlbnQtYnJpZGdlLnR3aWxpby5jb20vdjEvd3NjaGFubmVscy9BQ3h4eC9XS3h4eCIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly9ldmVudC1icmlkZ2UudHdpbGlvLmNvbS92MS93c2NoYW5uZWxzL0FDeHh4L1dLeHh4IiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4IiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L0FjdGl2aXRpZXMiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvVGFza3MvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eCIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6eyJBY3Rpdml0eVNpZCI6eyJyZXF1aXJlZCI6dHJ1ZX19LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L1Rhc2tzLyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4L1Jlc2VydmF0aW9ucy8qKiIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC8qKiIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4LyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9XSwiYWNjb3VudF9zaWQiOiJBQ3h4eCIsImNoYW5uZWwiOiJXS3h4eCIsIndvcmtzcGFjZV9zaWQiOiJXU3h4eCIsIndvcmtlcl9zaWQiOiJXS3h4eCIsImlhdCI6MTQ4MTE0NTkwMX0.p3NZqOT7Qx_zQrS2pVczzbEJ6Car3qzZ-Qq5xa0fZfM';
const updatedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBQ2YzMTFmODQyODc2NjFhYzU3NjFmOWE3NDQ4ZmQxMmQ3IiwiZXhwIjoxNDgzNjQzMjA5LCJ2ZXJzaW9uIjoidjEiLCJmcmllbmRseV9uYW1lIjoiV0thNzc1MzU1ZjQ5MjYyOWRjMjVjNDYxMmQzMzM2MWEzOCIsInBvbGljaWVzIjpbeyJ1cmwiOiJodHRwczovL2V2ZW50LWJyaWRnZS50d2lsaW8uY29tL3YxL3dzY2hhbm5lbHMvQUNmMzExZjg0Mjg3NjYxYWM1NzYxZjlhNzQ0OGZkMTJkNy9XS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4IiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL2V2ZW50LWJyaWRnZS50d2lsaW8uY29tL3YxL3dzY2hhbm5lbHMvQUNmMzExZjg0Mjg3NjYxYWM1NzYxZjlhNzQ0OGZkMTJkNy9XS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4IiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL1dvcmtlcnMvV0thNzc1MzU1ZjQ5MjYyOWRjMjVjNDYxMmQzMzM2MWEzOCIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL0FjdGl2aXRpZXMiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1M0NWZkMDQ5ZDJhNjg1YzQyMzU2ZDVmZjQ2N2Q5NjFhYy9UYXNrcy8qKiIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL1dvcmtlcnMvV0thNzc1MzU1ZjQ5MjYyOWRjMjVjNDYxMmQzMzM2MWEzOC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1M0NWZkMDQ5ZDJhNjg1YzQyMzU2ZDVmZjQ2N2Q5NjFhYy9Xb3JrZXJzL1dLYTc3NTM1NWY0OTI2MjlkYzI1YzQ2MTJkMzMzNjFhMzgiLCJtZXRob2QiOiJQT1NUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnsiQWN0aXZpdHlTaWQiOnsicmVxdWlyZWQiOnRydWV9fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL1Rhc2tzLyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL1dvcmtlcnMvV0thNzc1MzU1ZjQ5MjYyOWRjMjVjNDYxMmQzMzM2MWEzOC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJQT1NUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTNDVmZDA0OWQyYTY4NWM0MjM1NmQ1ZmY0NjdkOTYxYWMvV29ya2Vycy9XS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4LyoqIiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTNDVmZDA0OWQyYTY4NWM0MjM1NmQ1ZmY0NjdkOTYxYWMvV29ya2Vycy9XS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4LyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9XSwiYWNjb3VudF9zaWQiOiJBQ2YzMTFmODQyODc2NjFhYzU3NjFmOWE3NDQ4ZmQxMmQ3IiwiY2hhbm5lbCI6IldLYTc3NTM1NWY0OTI2MjlkYzI1YzQ2MTJkMzMzNjFhMzgiLCJ3b3Jrc3BhY2Vfc2lkIjoiV1M0NWZkMDQ5ZDJhNjg1YzQyMzU2ZDVmZjQ2N2Q5NjFhYyIsIndvcmtlcl9zaWQiOiJXS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4In0.LRd0OblK4V-aeVgpMFtzblYesUluj0vNwCznnGJFu94';

describe('Worker', () => {
  describe('constructor', () => {
    it('should throw an error if the token is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to instantiate Worker. <string>token is a required parameter.');
      assert.throws(() => new Worker(), Error, missingParamError);
    });

    it('should throw an error if the token is malformed', () => {
      const invalidParamError = Errors.INVALID_TOKEN.clone('Twilio token malformed. Unable to decode token. blah balh');
      assert.throws(() => new Worker('abc'), Error, invalidParamError);
    });

    it('should create a Worker Configuration with the token and any options', () => {
      const configSpy = sinon.spy(Configuration);
      const worker = new Worker(initialToken);

      assert.isNotNull(worker._config);
    });

    it('should create a signaling instance', () => {
      const signalingSpy = sinon.spy(Signaling);
      const worker = new Worker(initialToken);

      assert.isNotNull(worker._signaling);
    });

    it('should create an instance of Logger at the optional logLevel', () => {
      const worker = new Worker(initialToken, { logLevel: 'trace' });
      assert.instanceOf(worker._log, Logger);
      assert.equal(worker._log.logLevel, 'trace');
    });

  });

  describe('#getTasks()', () => {
    let worker;
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';

    const request = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
      method: 'GET',
      token: initialToken
    };

    beforeEach(() => {
      worker = new Worker(initialToken);
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should return a Map of Tasks', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.resolve(fakePayloads.task));

      const reservations = new Map();
      const reservation = new Reservation(fakePayloads.reservation, worker._config);
      reservations.set(reservation.sid, reservation);
      worker._reservations = reservations;

      return worker.getTasks().then((tasksMap) => {
        expect(tasksMap.size).to.equal(1);
        tasksMap.forEach((task) => {
          expect(task).instanceOf(Task);
        });
      });
    });

    it('should return an error if unable to fetch Tasks', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));
      
      const reservations = new Map();
      const reservation = new Reservation(fakePayloads.reservation, worker._config);
      reservations.set(reservation.sid, reservation);
      worker._reservations = reservations;

      return worker.getTasks().catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });
    });
  })

  describe('#setAttributes(attributes)', () => {

    let worker;
    let requestStub;
    let setAttributesSpy;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';
    const requestParams = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
      method: 'POST',
      params: { Attributes: '{"languages":["en"]}' },
      event_type: 'attributesUpdated',
      token: initialToken
    };

    beforeEach(() => {
      worker = new Worker(initialToken);
      setAttributesSpy = sinon.spy(worker, 'setAttributes');
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      setAttributesSpy.reset();
      requestStub.restore();
    });

    it('should throw an error if parameter attributes is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to set attributes on Worker. <string>attributes is a required parameter.');
      assert.throws(() => worker.setAttributes(), Error, missingParamError);
    });

    it('should not update the attributes, if none provided', () => {
      // set initial attributes
      worker._attributes = '{"languages":["es"]}';

      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to set attributes on Worker. <string>attributes is a required parameter.');
      assert.throws(() => worker.setAttributes(), Error, missingParamError);
      assert.equal(worker.attributes, '{"languages":["es"]}');
    });

    it('should set the attributes of the Worker', () => {
      requestStub.withArgs(requestURL, requestParams).returns(Promise.resolve(fakePayloads.workerAttributesUpdate));

      // set initial attributes
      worker._attributes = '{"languages":["es"]}';

      return worker.setAttributes({ languages: ["en"] }).then((updatedWorker) => {
        expect(worker).to.equal(updatedWorker);
        expect(worker.attributes).to.deep.equal({ languages: ["en"] });
        expect(worker.dateCreated).to.deep.equal(new Date(fakePayloads.workerAttributesUpdate.date_created));
        expect(worker.dateUpdated).to.deep.equal(new Date(fakePayloads.workerAttributesUpdate.date_updated));
        expect(worker.dateStatusChanged).to.deep.equal(new Date(fakePayloads.workerAttributesUpdate.date_status_changed));

        expect(setAttributesSpy).to.have.been.calledOnce;
        expect(setAttributesSpy.withArgs({"languages":["en"]}).calledOnce).to.be.true;
        expect(requestStub).to.have.been.calledOnce;
        expect(requestStub.withArgs(requestURL, requestParams).calledOnce).to.be.true;
      });
    });

    it('should return an error if attributes update failed', () => {
      requestStub.withArgs(requestURL, requestParams).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      return worker.setAttributes({ languages: ["en"] }).catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });

    });

    it('should not update any unrelated Worker properties', () => {
      const unUpdatedWorker = worker;

      requestStub.withArgs(requestURL, requestParams).returns(Promise.resolve(fakePayloads.workerAttributesUpdate));

      // set initial attributes
      worker._attributes = '{"languages":["es"]}';

      return worker.setAttributes({ languages: ["en"] }).then((updatedWorker) => {
        expect(worker).to.equal(updatedWorker);
        expect(worker.attributes).to.deep.equal({ languages: ["en"] });
        
        expect(unUpdatedWorker.accountSid).to.equal(worker.accountSid);
        expect(unUpdatedWorker.activities).to.equal(worker.activities);
        expect(unUpdatedWorker.activity).to.equal(worker.activity);
        expect(unUpdatedWorker.channels).to.equal(worker.channels);
        expect(unUpdatedWorker.connectActivitySid).to.equal(worker.connectActivitySid);
        expect(unUpdatedWorker.dateCreated).to.equal(worker.dateCreated);
        expect(unUpdatedWorker.dateStatusChanged).to.equal(worker.dateStatusChanged);
        expect(unUpdatedWorker.dateUpdated).to.equal(worker.dateUpdated);
        expect(unUpdatedWorker.disconnectActivitySid).to.equal(worker.disconnectActivitySid);
        expect(unUpdatedWorker.name).to.equal(worker.name);
        expect(unUpdatedWorker.reservations).to.equal(worker.reservations);
        expect(unUpdatedWorker.sid).to.equal(worker.sid);
        expect(unUpdatedWorker.workspaceSid).to.equal(worker.workspaceSid);

        expect(setAttributesSpy).to.have.been.calledOnce;
        expect(setAttributesSpy.withArgs({"languages":["en"]}).calledOnce).to.be.true;
        expect(requestStub).to.have.been.calledOnce;
        expect(requestStub.withArgs(requestURL, requestParams).calledOnce).to.be.true;
      });
    });
  });

  describe('#updateToken(newToken)', () => {

    let signalingSpy;
    let configSpy;

    beforeEach(() => {
      signalingSpy = sinon.spy(Signaling.prototype, 'updateToken');
      configSpy = sinon.spy(Configuration.prototype, 'updateToken');
    });

    afterEach(() => {
      signalingSpy.restore();
      configSpy.restore();
    });

    it('should throw an error if newToken not provided', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');

      assert.throws(() => worker.updateToken(updatedToken), Error, missingParamError);

    });

    it('should update the token if provided', () => {
      const worker = new Worker(initialToken);
      assert.equal(worker._config.token, initialToken);

      const spy = sinon.spy();
      worker.on('tokenUpdated', spy);

      worker.updateToken(updatedToken);

      assert.equal(spy.callCount, 1);

      expect(signalingSpy).to.have.been.calledOnce;
      assert.isTrue(signalingSpy.withArgs(updatedToken).calledOnce);

      expect(configSpy).to.have.been.calledOnce;
      assert.isTrue(configSpy.withArgs(updatedToken).calledOnce)

    });

  });

  describe('#_updateWorkerActivity(activitySid)', () => {

    let worker;
    let activities;
    let requestStub;
    let _updateWorkerActivitySpy;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';
    const requestParams = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
      method: 'POST',
      params: { ActivitySid: 'WAyyy' },
      event_type: 'activityUpdated',
      token: initialToken
    };

    beforeEach(() => {
      worker = new Worker(initialToken);
      activities = new Map();
      fakePayloads.activities.activities.forEach((activityPayload) => {
        activities.set(activityPayload.sid, new Activity(activityPayload, worker));
      });

      _updateWorkerActivitySpy = sinon.spy(worker, '_updateWorkerActivity');
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      _updateWorkerActivitySpy.reset();
      requestStub.restore();
    });

    it('should throw an error if parameter attributes is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to update Worker activity. <string>activitySid is a required parameter.');

      assert.throws(() => worker._updateWorkerActivity(), Error, missingParamError);

    });

    it('should update the activity of the Worker', () => {
      requestStub.withArgs(requestURL, requestParams).returns(Promise.resolve(fakePayloads.workerActivityUpdate));

      worker._activities = activities;
      worker.activities.forEach((activity) => {
        if (activity.name === 'Offline') {
          activity._isCurrent = true;
          worker._activity = activity;
          assert.equal(worker.activity, activity);
          assert.isTrue(worker.activity.isCurrent);
        } else {
          assert.isFalse(activity.isCurrent);
          assert.notEqual(worker.activity, activity);
        }
      });

      // update Worker activity from Offline to Idle
      return worker._updateWorkerActivity('WAyyy').then((updatedWorker) => {
        expect(worker).to.equal(updatedWorker);
        expect(worker.activity.sid).to.equal('WAyyy');

        worker.activities.forEach((activity) => {
          if (activity.name === 'Idle') {
            expect(activity.isCurrent).to.be.true;
            expect(worker.activity).to.equal(activity);
          } else {
            expect(activity.isCurrent).to.be.false;
            expect(worker.activity).to.not.equal(activity);
          }
        });
      });
    });

    it('should return an Error if the update failed', () => {
      requestStub.withArgs(requestURL, requestParams).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      return worker._updateWorkerActivity('WAyyy').catch(function(err) {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });
    });

  });

});
