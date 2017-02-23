'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const sinon = require('sinon');
const Configuration = require('../../../../lib/util/configuration');
const Errors = require('../../../../lib/util/constants').twilioErrors;

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxMTMxIiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4Iiwicm9sZSI6IndvcmtlciJ9fSwiaWF0IjoxNDg3NTcxMTMxLCJleHAiOjE0ODc1NzQ3MzEsImlzcyI6IlNLeHh4Iiwic3ViIjoiQUN4eHgifQ.d7M8HaDL25C1yvywBGOQ4G3YQRNUSJ1miKKANzEis2k';
const updatedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxMjkxIiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4Iiwicm9sZSI6IndvcmtlciJ9fSwiaWF0IjoxNDg3NTcxMjkxLCJleHAiOjE0ODc1NzQ4OTEsImlzcyI6IlNLeHh4Iiwic3ViIjoiQUN4eHgifQ.5xEFBZpAXdTBG5eN2s8ogbsnRgJUv6FQHrD6TPct5sg';

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