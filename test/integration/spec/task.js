'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');

const Configuration = require('../../../lib/util/configuration');
const credentials = require('../../env').NonMultiTask;
const Errors = require('../../../lib/util/constants').twilioErrors;
const fakePayloads = require('../../util/fakeWorkerResponses').fakePayloads;
const JWT = require('../../util/makeJWTToken');
const Logger = require('../../../lib/util/logger');
const Task = require('../../../lib/task');
const testTools = require('../../util/testTools');
const Worker = require('../../../lib/worker');

describe('Task', function() {
  const taskSids = [];
  const aliceToken = JWT.getJWTToken(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkerAlice, 'prod');
 
  afterEach(function(done) {
    while (taskSids.length !== 0) {
      testTools.deleteTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, taskSids.pop());
    }
    setTimeout(done, 1000);
  });

  describe('#complete(reason)', function() {
    let alice;
    beforeEach(function(done) {
      alice = new Worker(aliceToken, { connectActivitySid: credentials.ConnectActivitySid });

      alice.on('ready', function(readyAlice) {
        done();
      });
    });

    it('should update the Task', function() {
      return new Promise(function(resolve) {
        alice.on('reservationCreated', function(reservation) {
          resolve(reservation);
        });

        testTools.createTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkflowSid, { "selected_language": "en" }).then(function(taskPayload) {
          taskSids.push(taskPayload.sid);
        });
      }).then(function(reservation) {
        return reservation.accept().then(function(updatedReservation) {
          return updatedReservation.getTask();
        }).then(function(task) {
          return task.complete('Work is done');
        }).then(function(updatedTask) {
          expect(updatedTask.status).to.equal('completed');
          expect(updatedTask.reason).to.equal('Work is done');
        });
      });
    });
  });
});