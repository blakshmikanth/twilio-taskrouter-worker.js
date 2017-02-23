'use strict';

const chai = require('chai');
const assert = chai.assert;
const Errors = require('../../../../lib/util/constants').twilioErrors;
const EventBridgeSignaling = require('../../../../lib/signaling/eventbridge');
const Logger = require('../../../../lib/util/logger');
const Worker = require('../../../../lib/worker');

const initialToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxMTMxIiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4Iiwicm9sZSI6IndvcmtlciJ9fSwiaWF0IjoxNDg3NTcxMTMxLCJleHAiOjE0ODc1NzQ3MzEsImlzcyI6IlNLeHh4Iiwic3ViIjoiQUN4eHgifQ.d7M8HaDL25C1yvywBGOQ4G3YQRNUSJ1miKKANzEis2k';
const updatedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxMjkxIiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4Iiwicm9sZSI6IndvcmtlciJ9fSwiaWF0IjoxNDg3NTcxMjkxLCJleHAiOjE0ODc1NzQ4OTEsImlzcyI6IlNLeHh4Iiwic3ViIjoiQUN4eHgifQ.5xEFBZpAXdTBG5eN2s8ogbsnRgJUv6FQHrD6TPct5sg';

describe('EventBridgeSignaling', () => {
  describe('constructor', () => {
    it('should throw an error if no Worker client is found', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('<Worker>worker is a required parameter to construct EventBridgeSignaling.');
      assert.throws(() => new EventBridgeSignaling(), Error, missingParamError);
    });

    it('should throw an error if the token is malformed', () => {
      const invalidParamError = Errors.INVALID_TOKEN.clone('Twilio token malformed. Unable to decode token.');
      assert.throws(() => new EventBridgeSignaling('abc'), Error, invalidParamError);
    });

    it('should set the environment and the closeExistingSessions options', () => {

      const worker = new Worker(initialToken);
      const options = {
        closeExistingSessions: true
      };

      const signaling = new EventBridgeSignaling(worker, options);

      assert.instanceOf(signaling._log, Logger);
      assert.isTrue(signaling.closeExistingSessions);
      assert.equal(signaling.worker, worker);
    });

    it('should set optional closeExistingSessions to false if not provided', () => {
      const worker = new Worker(initialToken);

      const signaling = new EventBridgeSignaling(worker);
      assert.isFalse(signaling.closeExistingSessions);
    });
  });

  describe('#updateToken(newToken)', () => {
    it('should throw an error if newToken is missing', () => {
      const worker = new Worker(initialToken);
      const signaling = new EventBridgeSignaling(worker);

      const missingParamError = Errors.INVALID_ARGUMENT.clone('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
      assert.throws(() => signaling.updateToken(), Error, missingParamError);
    });
  });
});