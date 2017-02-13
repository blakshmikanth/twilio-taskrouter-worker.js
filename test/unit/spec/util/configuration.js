'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const sinon = require('sinon');
const Configuration = require('../../../../lib/util/configuration');
const Errors = require('../../../../lib/util/constants').twilioErrors;

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBQ3h4eCIsImV4cCI6MTQ4MTE0OTUwMSwidmVyc2lvbiI6InYxIiwiZnJpZW5kbHlfbmFtZSI6IldLeHh4IiwicG9saWNpZXMiOlt7InVybCI6Imh0dHBzOi8vZXZlbnQtYnJpZGdlLnR3aWxpby5jb20vdjEvd3NjaGFubmVscy9BQ3h4eC9XS3h4eCIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly9ldmVudC1icmlkZ2UudHdpbGlvLmNvbS92MS93c2NoYW5uZWxzL0FDeHh4L1dLeHh4IiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4IiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L0FjdGl2aXRpZXMiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvVGFza3MvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eCIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6eyJBY3Rpdml0eVNpZCI6eyJyZXF1aXJlZCI6dHJ1ZX19LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTeHh4L1Rhc2tzLyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4L1Jlc2VydmF0aW9ucy8qKiIsIm1ldGhvZCI6IlBPU1QiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1N4eHgvV29ya2Vycy9XS3h4eC8qKiIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XU3h4eC9Xb3JrZXJzL1dLeHh4LyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9XSwiYWNjb3VudF9zaWQiOiJBQ3h4eCIsImNoYW5uZWwiOiJXS3h4eCIsIndvcmtzcGFjZV9zaWQiOiJXU3h4eCIsIndvcmtlcl9zaWQiOiJXS3h4eCIsImlhdCI6MTQ4MTE0NTkwMX0.p3NZqOT7Qx_zQrS2pVczzbEJ6Car3qzZ-Qq5xa0fZfM';
const updatedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBQ2YzMTFmODQyODc2NjFhYzU3NjFmOWE3NDQ4ZmQxMmQ3IiwiZXhwIjoxNDgzNDkyNjU4LCJ2ZXJzaW9uIjoidjEiLCJmcmllbmRseV9uYW1lIjoiV0thNzc1MzU1ZjQ5MjYyOWRjMjVjNDYxMmQzMzM2MWEzOCIsInBvbGljaWVzIjpbeyJ1cmwiOiJodHRwczovL2V2ZW50LWJyaWRnZS50d2lsaW8uY29tL3YxL3dzY2hhbm5lbHMvQUNmMzExZjg0Mjg3NjYxYWM1NzYxZjlhNzQ0OGZkMTJkNy9XS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4IiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL2V2ZW50LWJyaWRnZS50d2lsaW8uY29tL3YxL3dzY2hhbm5lbHMvQUNmMzExZjg0Mjg3NjYxYWM1NzYxZjlhNzQ0OGZkMTJkNy9XS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4IiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL1dvcmtlcnMvV0thNzc1MzU1ZjQ5MjYyOWRjMjVjNDYxMmQzMzM2MWEzOCIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL0FjdGl2aXRpZXMiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1M0NWZkMDQ5ZDJhNjg1YzQyMzU2ZDVmZjQ2N2Q5NjFhYy9UYXNrcy8qKiIsIm1ldGhvZCI6IkdFVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL1dvcmtlcnMvV0thNzc1MzU1ZjQ5MjYyOWRjMjVjNDYxMmQzMzM2MWEzOC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJHRVQiLCJxdWVyeV9maWx0ZXIiOnt9LCJwb3N0X2ZpbHRlciI6e30sImFsbG93Ijp0cnVlfSx7InVybCI6Imh0dHBzOi8vdGFza3JvdXRlci50d2lsaW8uY29tL3YxL1dvcmtzcGFjZXMvV1M0NWZkMDQ5ZDJhNjg1YzQyMzU2ZDVmZjQ2N2Q5NjFhYy9Xb3JrZXJzL1dLYTc3NTM1NWY0OTI2MjlkYzI1YzQ2MTJkMzMzNjFhMzgiLCJtZXRob2QiOiJQT1NUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnsiQWN0aXZpdHlTaWQiOnsicmVxdWlyZWQiOnRydWV9fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL1Rhc2tzLyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9LHsidXJsIjoiaHR0cHM6Ly90YXNrcm91dGVyLnR3aWxpby5jb20vdjEvV29ya3NwYWNlcy9XUzQ1ZmQwNDlkMmE2ODVjNDIzNTZkNWZmNDY3ZDk2MWFjL1dvcmtlcnMvV0thNzc1MzU1ZjQ5MjYyOWRjMjVjNDYxMmQzMzM2MWEzOC9SZXNlcnZhdGlvbnMvKioiLCJtZXRob2QiOiJQT1NUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTNDVmZDA0OWQyYTY4NWM0MjM1NmQ1ZmY0NjdkOTYxYWMvV29ya2Vycy9XS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4LyoqIiwibWV0aG9kIjoiR0VUIiwicXVlcnlfZmlsdGVyIjp7fSwicG9zdF9maWx0ZXIiOnt9LCJhbGxvdyI6dHJ1ZX0seyJ1cmwiOiJodHRwczovL3Rhc2tyb3V0ZXIudHdpbGlvLmNvbS92MS9Xb3Jrc3BhY2VzL1dTNDVmZDA0OWQyYTY4NWM0MjM1NmQ1ZmY0NjdkOTYxYWMvV29ya2Vycy9XS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4LyoqIiwibWV0aG9kIjoiUE9TVCIsInF1ZXJ5X2ZpbHRlciI6e30sInBvc3RfZmlsdGVyIjp7fSwiYWxsb3ciOnRydWV9XSwiYWNjb3VudF9zaWQiOiJBQ2YzMTFmODQyODc2NjFhYzU3NjFmOWE3NDQ4ZmQxMmQ3IiwiY2hhbm5lbCI6IldLYTc3NTM1NWY0OTI2MjlkYzI1YzQ2MTJkMzMzNjFhMzgiLCJ3b3Jrc3BhY2Vfc2lkIjoiV1M0NWZkMDQ5ZDJhNjg1YzQyMzU2ZDVmZjQ2N2Q5NjFhYyIsIndvcmtlcl9zaWQiOiJXS2E3NzUzNTVmNDkyNjI5ZGMyNWM0NjEyZDMzMzYxYTM4In0.dYFFdSDV13G_0j4IOLdiSAwuy4K3rx_-cpUt-eNaaTU';

describe('Configuration', () => {
  describe('constructor', () => {

    it('should throw an error if the token is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to instantiate Configuration. <string>token is a required parameter.');
      assert.throws(() => new Configuration(), Error, missingParamError);
    });
    
    it('should throw an error if the token is malformed', () => {
      const invalidParamError = Errors.INVALID_TOKEN.clone('Twilio token malformed. Unable to decode token.');
      assert.throws(() => new Configuation('abc'), Error, invalidParamError);
    });

    it('should set environment and log level options if passed in', () => {
      const options = {
        environment: 'dev',
        logLevel: 'trace'
      };
      const config = new Configuration(token, options);

      assert.equal(config.logLevel, 'trace');
      assert.equal(config.TR_SERVER, 'https://taskrouter.dev.twilio.com/v1/Workspaces/WSxxx');
      assert.equal(config.EB_SERVER, 'https://event-bridge.dev-us1.twilio.com/v1/wschannels/ACxxx/WKxxx')
      assert.equal(config.WS_SERVER, 'wss://event-bridge.dev-us1.twilio.com/v1/wschannels/ACxxx/WKxxx');
    });

    it('should use environment and log level defaults if options not provided', () => {
      const config = new Configuration(token);

      assert.equal(config.logLevel, 'error');
      assert.equal(config.TR_SERVER, 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx');
      assert.equal(config.EB_SERVER, 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx')
      assert.equal(config.WS_SERVER, 'wss://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx');
    });
  });

  describe('#updateToken', () => {

    it('should throw an error if the token is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('To update the Twilio token, a new Twilio token must be passed in. <string>token is a required parameter.');
      const config = new Configuration(token);

      assert.throws(() => config.updateToken(), Error, missingParamError);
    });
    
    it('should throw an error if the token is malformed', () => {
      const invalidParamError = Errors.INVALID_TOKEN.clone('Twilio token malformed. Unable to decode token.');
      const config = new Configuration(token);

      assert.throws(() => config.updateToken('abc'), Error, invalidParamError);
    });

    it('should update the token value', () => {
      const config = new Configuration(token);
      
      assert.equal(config.token, token);

      config.updateToken(updatedToken);
      assert.equal(config.token, updatedToken);
    });

  });

});