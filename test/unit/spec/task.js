'use strict';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-datetime'));
chai.should();
const sinon = require('sinon');
require('sinon-as-promised');

const Configuration = require('../../../lib/util/configuration');
const Errors = require('../../../lib/util/constants').twilioErrors;
const fakePayloads = require('../../util/fakeWorkerResponses').fakePayloads;
const Logger = require('../../../lib/util/logger');
const Request = require('../../../lib/util/request');
const Reservation = require('../../../lib/reservation');
const Task = require('../../../lib/task');

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBQ3h4eCIsImV4cCI6MTQ4MTE0OTUwMSwidmVyc2lvbiI6InYxIiwiZnJpZW5kbHlfbmFtZSI6IldLeHh4IiwicG9saWNpZXMiOlt7InVybCI6Imh0dHBzOi8vZXZlbnQtYnJpZGdlLnR3aWxpby5jb20vdjEvd3NjaGFubmVscy9BQ3h4eC9XS3h4eCIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly9ldmVudC1icmlkZ2UudHdpbGlvLmNvbS92MS93c2NoYW5uZWxzL0FDeHh4L1dLeHh4IiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4IiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L0FjdGl2aXRpZXMiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvVGFza3MvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eCIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6eyJBY3Rpdml0eVNpZCI6eyJyZXF1aXJlZCI6dHJ1ZX19LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L1Rhc2tzLyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4L1Jlc2VydmF0aW9ucy8qKiIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC8qKiIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4LyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9XSwiYWNjb3VudF9zaWQiOiJBQ3h4eCIsImNoYW5uZWwiOiJXS3h4eCIsIndvcmtzcGFjZV9zaWQiOiJXU3h4eCIsIndvcmtlcl9zaWQiOiJXS3h4eCIsImlhdCI6MTQ4MTE0NTkwMX0.p3NZqOT7Qx_zQrS2pVczzbEJ6Car3qzZ-Qq5xa0fZfM';

describe('Task', () => {
  const config = new Configuration(token, 'prod');
  const taskPayload = fakePayloads.task;

  describe('constructor', () => {
    it('should throw an error if payload is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error instantiating Reservation: <Object>payload is a required parameter');
      assert.throws(() => new Task(null, config), Error, missingParamError);
    });

    it('should throw an error if config is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error instantiating Reservation: <Configuration>config is a required parameter');
      assert.throws(() => new Task(taskPayload, null), Error, missingParamError);
    });

    it('should set Task properties', () => {
      const task = new Task(taskPayload, config);

      assert.equal(task.age, taskPayload.age);
      assert.equal(task.accountSid, taskPayload.account_sid);
      assert.deepEqual(task.attributes, JSON.parse(taskPayload.attributes));
      assert.equalDate(task.dateCreated, new Date(taskPayload.date_created));
      assert.equalDate(task.dateUpdated, new Date(taskPayload.date_updated));
      assert.equal(task.priority, taskPayload.priority);
      assert.equal(task.reason, taskPayload.reason);
      assert.equal(task.sid, taskPayload.sid);
      assert.equal(task.status, taskPayload.assignment_status);
      assert.equal(task.taskChannelSid, taskPayload.task_channel_sid);
      assert.equal(task.taskChannelUniqueName, taskPayload.task_channel_unique_name);
      assert.equal(task.taskQueueName, taskPayload.task_queue_friendly_name);
      assert.equal(task.taskQueueSid, taskPayload.task_queue_sid);
      assert.equal(task.timeout, taskPayload.timeout);
      assert.equal(task.workflowName, taskPayload.workflow_friendly_name);
      assert.equal(task.workflowSid, taskPayload.workflow_sid);
      assert.equal(task.workspaceSid, taskPayload.workspace_sid);
    });
  });

  describe('#complete(reason)', () => {
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';
    const completeReqParams = {
      AssignmentStatus: 'completed',
      Reason: 'Work is finished.'
    };
    const request = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
      method: 'POST',
      params: completeReqParams,
      event_type: 'taskCompleted',
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should throw an Error if a <String>reason is not provided as argument', () => {
      const task = new Task(taskPayload, config);

      const missingParamError = Errors.INVALID_ARGUMENT.clone('A reason must be provided to move a Task to the \'Completed\' state. <string>reason is a required parameter.');

      assert.throws(() => task.complete(), Error, missingParamError);
    });

    it('should update the Task reason and properties upon successful execution', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.resolve(fakePayloads.completedTask));

      const task = new Task(taskPayload, config);

      return task.complete('Work is finished.').then(function() {
        expect(task.reason).to.equal('Work is finished.');
        expect(task.workflowSid).to.equal(fakePayloads.completedTask.workflow_sid);
        expect(task.workflowName).to.equal(fakePayloads.completedTask.workflow_friendly_name);
        expect(task.taskQueueSid).to.equal(fakePayloads.completedTask.task_queue_sid);
        expect(task.taskQueueName).to.equal(fakePayloads.completedTask.task_queue_friendly_name);
        expect(task.taskChannelSid).to.equal(fakePayloads.completedTask.task_channel_sid);
        expect(task.taskChannelUniqueName).to.equal(fakePayloads.completedTask.task_channel_unique_name);
        expect(task.status).to.equal(fakePayloads.completedTask.assignment_status);
        expect(task.attributes).to.deep.equal(JSON.parse(fakePayloads.completedTask.attributes));
        expect(task.age).to.equal(fakePayloads.completedTask.age);
        expect(task.priority).to.equal(fakePayloads.completedTask.priority);
        expect(task.timeout).to.equal(fakePayloads.completedTask.timeout);
        expect(task.dateCreated).to.equalDate(new Date(fakePayloads.completedTask.date_created));
        expect(task.dateUpdated).to.equalDate(new Date(fakePayloads.completedTask.date_updated));
      });

    });

    it('should return an error if unable to complete the Task', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const task = new Task(taskPayload, config);

      return task.complete('Work is finished.').catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
        expect(task.reason).to.not.equal('Work is finished.');
      });
    });

    it('should not change any Task properties if unable to complete the Task', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const task = new Task(taskPayload, config);

      return task.complete('Work is finished.').catch((err) => {
        expect(task.age).to.equal(taskPayload.age);
        expect(task.accountSid).to.equal(taskPayload.account_sid);
        expect(task.attributes).to.deep.equal(JSON.parse(taskPayload.attributes));
        expect(task.dateCreated).to.equalDate(new Date(taskPayload.date_created));
        expect(task.dateUpdated).to.equalDate(new Date(taskPayload.date_updated));
        expect(task.priority).to.equal(taskPayload.priority);
        expect(task.reason).to.equal(taskPayload.reason);
        expect(task.sid).to.equal(taskPayload.sid);
        expect(task.status).to.equal(taskPayload.assignment_status);
        expect(task.taskChannelSid).to.equal(taskPayload.task_channel_sid);
        expect(task.taskChannelUniqueName).to.equal(taskPayload.task_channel_unique_name);
        expect(task.taskQueueName).to.equal(taskPayload.task_queue_friendly_name);
        expect(task.taskQueueSid).to.equal(taskPayload.task_queue_sid);
        expect(task.timeout).to.equal(taskPayload.timeout);
        expect(task.workflowName).to.equal(taskPayload.workflow_friendly_name);
        expect(task.workflowSid).to.equal(taskPayload.workflow_sid);
        expect(task.workspaceSid).to.equal(taskPayload.workspace_sid);
      });
    });

  });
});