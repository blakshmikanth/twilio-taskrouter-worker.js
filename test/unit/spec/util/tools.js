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

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBQ3h4eCIsImV4cCI6MTQ4MTE0OTUwMSwidmVyc2lvbiI6InYxIiwiZnJpZW5kbHlfbmFtZSI6IldLeHh4IiwicG9saWNpZXMiOlt7InVybCI6Imh0dHBzOi8vZXZlbnQtYnJpZGdlLnR3aWxpby5jb20vdjEvd3NjaGFubmVscy9BQ3h4eC9XS3h4eCIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly9ldmVudC1icmlkZ2UudHdpbGlvLmNvbS92MS93c2NoYW5uZWxzL0FDeHh4L1dLeHh4IiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4IiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L0FjdGl2aXRpZXMiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvVGFza3MvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eCIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6eyJBY3Rpdml0eVNpZCI6eyJyZXF1aXJlZCI6dHJ1ZX19LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L1Rhc2tzLyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4L1Jlc2VydmF0aW9ucy8qKiIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC8qKiIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4LyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9XSwiYWNjb3VudF9zaWQiOiJBQ3h4eCIsImNoYW5uZWwiOiJXS3h4eCIsIndvcmtzcGFjZV9zaWQiOiJXU3h4eCIsIndvcmtlcl9zaWQiOiJXS3h4eCIsImlhdCI6MTQ4MTE0NTkwMX0.p3NZqOT7Qx_zQrS2pVczzbEJ6Car3qzZ-Qq5xa0fZfM';

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
  });
});