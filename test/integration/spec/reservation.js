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
const JWT = require('../../util/makeAccessToken');
const Logger = require('../../../lib/util/logger');
const Task = require('../../../lib/task');
const testTools = require('../../util/testTools');
const Worker = require('../../../lib/worker');

describe('Reservation', function() {
  const taskSids = [];

  let aliceToken;
  let bobToken;

  before(function(done) {
    JWT.getAccessToken(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkerAlice).then(function(accessToken) {
      aliceToken = accessToken;
    });

    JWT.getAccessToken(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkerBob).then(function(accessToken) {
      bobToken = accessToken;
    });

    while (taskSids.length !== 0) {
      testTools.deleteTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, taskSids.pop());
    }
    setTimeout(done, 1000);
  });

  afterEach(function(done) {
    while (taskSids.length !== 0) {
      testTools.deleteTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, taskSids.pop());
    }
    setTimeout(done, 1000);
  });

  after(function(done) {
    while (taskSids.length !== 0) {
      testTools.deleteTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, taskSids.pop());
    }
    setTimeout(done, 1000);
  });

  describe('constructor', function() {
    before(function(done) {
      for (let i = 0; i < 2; i++) {
        testTools.createTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkflowSid, '{ "selected_language": "en" }').then(function(task) {
          taskSids.push(task.sid);
        });
      }
      setTimeout(done, 1000);
    });

    it('should set the Reservation as pending', function() {
      this.timeout(3000);

      const alice = new Worker(aliceToken, { connectActivitySid: credentials.ConnectActivitySid });
      
      return new Promise(function(resolve) {
        alice.on('ready', resolve);
      }).then(function() {
        assert.equal(alice.reservations.size, 1);
        alice.reservations.forEach(function(reservation) {
          assert.equal(reservation.status, 'pending');
        });
      });
    });
  });

  describe('Event:on(\'reservationCreated\')', function() {
    let bob;
    before(function(done) {
      bob = new Worker(bobToken, { connectActivitySid: credentials.ConnectActivitySid });

      bob.on('ready', function(readyBob) {
        done();
      });
    });

    it('should create a Reservation instance', function() {
      this.timeout(5000);

      return new Promise(function(resolve) {
        bob.on('reservationCreated', function(reservation) {
          resolve(reservation);
        });

        testTools.createTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkflowSid, '{ "selected_language": "es" }').then(function(taskPayload) {
          taskSids.push(taskPayload.sid);
        });
      }).then(function(reservation) {
        assert.equal(bob.reservations.size, 1);
        assert.equal(reservation.status, 'pending');
        assert.equal(reservation.sid.substring(0, 2), 'WR');
        assert.equal(reservation.taskSid.substring(0, 2), 'WT');
        // bug in WDS: should be 'default', but is null
        // assert.equal(reservation.taskChannelUniqueName, 'default');
        assert.isNull(reservation.taskChannelUniqueName);
      });
    });
  });

  describe('#getTask()', function() {
    let bob;
    beforeEach(function(done) {
      bob = new Worker(bobToken, { connectActivitySid: credentials.ConnectActivitySid });

      bob.on('ready', function(readyBob) {
        done();
      });
    });

    it('should get the Task instance', function() {
      this.timeout(5000);
      return new Promise(function(resolve) {
        bob.on('reservationCreated', function(reservation) {
          resolve(reservation);
        });

        testTools.createTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkflowSid, '{ "selected_language": "es" }').then(function(taskPayload) {
          taskSids.push(taskPayload.sid);
        });
      }).then(function(reservation) {
        return reservation.getTask().then(function(task) {
          expect(task).to.be.an.instanceOf(Task);
          expect(task.sid.substring(0,2)).to.equal('WT');
          expect(task.status).to.equal('reserved');
          expect(task.attributes).to.deep.equal({ "selected_language": "es" });
        });
      });
    });
  });

  describe('#accept()', function() {
    let bob;
    beforeEach(function(done) {
      bob = new Worker(bobToken, { connectActivitySid: credentials.ConnectActivitySid });

      bob.on('ready', function(readyBob) {
        done();
      });
    });

    it('should accept the Reservation', function() {
      this.timeout(5000);
      return new Promise(function(resolve) {
        bob.on('reservationCreated', function(reservation) {
          resolve(reservation);
        });

        testTools.createTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkflowSid, '{ "selected_language": "es" }').then(function(taskPayload) {
          taskSids.push(taskPayload.sid);
        });
      }).then(function(reservation) {
        return reservation.accept().then(function(updatedReservation) {
          expect(reservation).to.equal(updatedReservation);
          expect(reservation.status).equal('accepted');
        });
      });
    });
  });

  describe('#reject(options)', function() {
    let bob;
    beforeEach(function(done) {
      bob = new Worker(bobToken, { connectActivitySid: credentials.ConnectActivitySid });

      bob.on('ready', function(readyBob) {
        done();
      });
    });

    it('should reject the Reservation', function() {
      this.timeout(5000);
      return new Promise(function(resolve) {
        bob.on('reservationCreated', function(reservation) {
          resolve(reservation);
        });

        testTools.createTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkflowSid, '{ "selected_language": "es" }').then(function(taskPayload) {
          taskSids.push(taskPayload.sid);
        });
      }).then(function(reservation) {
        return reservation.reject().then(function(updatedReservation) {
          expect(reservation).to.equal(updatedReservation);
          expect(reservation.status).equal('rejected');
        });
      });
    });

    it('should reject the Reservation with options', function() {
      this.timeout(5000);
      return new Promise(function(resolve) {
        bob.on('reservationCreated', function(reservation) {
          resolve(reservation);
        });

        testTools.createTask(credentials.AccountSid, credentials.AuthToken, credentials.WorkspaceSid, credentials.WorkflowSid, '{ "selected_language": "es" }').then(function(taskPayload) {
          taskSids.push(taskPayload.sid);
        });
      }).then(function(reservation) {
        return reservation.reject({ activitySid: credentials.DisconnectActivitySid }).then(function(updatedReservation) {
          expect(reservation).to.equal(updatedReservation);
          expect(reservation.status).equal('rejected');

          expect(bob.activity.name).to.equal('Gone Home');
        });
      });
    });
  });
});
