'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const sinon = require('sinon');

const Errors = require('../../../../lib/util/constants').twilioErrors;
const fakePayloads = require('../../../util/fakeWorkerResponses').fakePayloads;
const Task = require('../../../../lib/task');
const tools = require('../../../../lib/util/tools');
const Worker = require('../../../../lib/worker');

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxMTMxIiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4Iiwicm9sZSI6IndvcmtlciJ9fSwiaWF0IjoxNDg3NTcxMTMxLCJleHAiOjE0ODc1NzQ3MzEsImlzcyI6IlNLeHh4Iiwic3ViIjoiQUN4eHgifQ.d7M8HaDL25C1yvywBGOQ4G3YQRNUSJ1miKKANzEis2k';
const badToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxNDQ4IiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4In19LCJpYXQiOjE0ODc1NzE0NDgsImV4cCI6MTQ4NzU3NTA0OCwiaXNzIjoiU0t4eHgiLCJzdWIiOiJBQ3h4eCJ9.HZt81w9XCxZH6cc6lHi1gt_I289KQBBavKZqsdfebJI';

describe('Tools', () => {
  describe('#updateProperties(target, source, type)', () => {
    it('should throw an error if target parameter is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to update properties. <Object>target is a required parameter.');
      assert.throws(() => tools.updateProperties(null, {}, 'fakeEvent'), Error, missingParamError);
    });

    it('should throw an error if the source parameter is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to update properties. <Object>source is a required parameter.');
      assert.throws(() => tools.updateProperties({}, null, 'fakeEvent'), Error, missingParamError);
    });

    it('should throw an error if the eventType parameter is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to update properties. <string>eventType is a required parameter.');
      assert.throws(() => tools.updateProperties({}, {}, null), Error, missingParamError);
    });

    it('should update the properties of the source using the payload', () => {
      const worker = new Worker(token);

      const task = new Task(fakePayloads.task, worker._config);
      const sourcePayload = fakePayloads.completedTask;

      tools.updateProperties(task, sourcePayload, 'task');
      assert.equal(task.status, sourcePayload.assignment_status);
    });
  });

  describe('#verifyJWT(token)', () => {
    it('should throw an error if token parameter is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to verify JWT. <string>token is a required parameter.');
      assert.throws(() => tools.verifyJWT(), Error, missingParamError);
    });

    it('should throw an error if unable to objectize the JWT', () => {
      const invalidError = Errors.INVALID_TOKEN.clone('Twilio token malformed. Unable to decode token.');
      assert.throws(() => tools.verifyJWT('abc'), Error, invalidError);   
    });

    it('should throw an error if missing role field', () => {
      const missingRoleError = Errors.INVALID_TOKEN.clone('Twilio access token missing required \'role\' parameter in the TaskRouter grant.');
      assert.throws(() => tools.verifyJWT(badToken), Error, missingRoleError);
    });
  });
});