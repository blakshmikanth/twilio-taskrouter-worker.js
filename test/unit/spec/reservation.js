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

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS3h4eC0xNDg3NTcxMTMxIiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiY2Npc0B0d2lsaW8uY29tIiwidGFza19yb3V0ZXIiOnsid29ya3NwYWNlX3NpZCI6IldTeHh4Iiwid29ya2VyX3NpZCI6IldLeHh4Iiwicm9sZSI6IndvcmtlciJ9fSwiaWF0IjoxNDg3NTcxMTMxLCJleHAiOjE0ODc1NzQ3MzEsImlzcyI6IlNLeHh4Iiwic3ViIjoiQUN4eHgifQ.d7M8HaDL25C1yvywBGOQ4G3YQRNUSJ1miKKANzEis2k';

describe('Reservation', () => {
  const config = new Configuration(token, 'prod');
  const reservationPayload = fakePayloads.reservation;

  describe('constructor', () => {
    it('should throw an error if payload is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error instantiating Reservation: <Object>payload is a required parameter');
      assert.throws(() => new Reservation(null, config), Error, missingParamError);
    });

    it('should throw an error if config is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Error instantiating Reservation: <Configuration>config is a required parameter');
      assert.throws(() => new Reservation(reservationPayload, null), Error, missingParamError);
    });

    it('should set the properties of the Reservation', () => {
      const res = new Reservation(reservationPayload, config);

      assert.equal(res.accountSid, reservationPayload.account_sid);
      assert.equalDate(res.dateCreated, new Date(reservationPayload.date_created * 1000));
      assert.equalDate(res.dateUpdated, new Date(reservationPayload.date_updated * 1000));
      assert.equal(res.taskSid, reservationPayload.sid);
      assert.equal(res.sid, reservationPayload.reservation_sid);
      assert.equal(res.status, 'pending');
      assert.equal(res.taskChannelSid, reservationPayload.task_channel_sid);
      assert.equal(res.taskChannelUniqueName, reservationPayload.task_channel_unique_name);
      assert.equal(res.workspaceSid, reservationPayload.workspace_sid);
      assert.equal(res._config, config);
      assert.instanceOf(res._log, Logger);
    });

  });

  describe('#accept', () => {
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';

    const request = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
      method: 'POST',
      params: { ReservationStatus: 'accepted' },
      event_type: 'accepted',
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should accept the reservation', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.resolve(fakePayloads.acceptedReservation));

      const res = new Reservation(reservationPayload, config);
      return res.accept().then((updatedReservation) => {
        expect(updatedReservation).to.equal(res);
        expect(res.status).to.equal('accepted'); 
      });

    });

    it('should return an error if unable to accept the reservation', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const reservation = new Reservation(reservationPayload, config);
      return reservation.accept().catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });

    });
  });

  describe('#reject(options)', () => {
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';
    const request = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
      method: 'POST',
      params: { ReservationStatus: 'rejected', WorkerActivitySid: undefined },
      event_type: 'rejected',
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should reject the reservation', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.resolve(fakePayloads.rejectedReservation));

      const reservation = new Reservation(reservationPayload, config);
      return reservation.reject().then((updatedReservation) => {
        expect(updatedReservation).to.equal(reservation);
        expect(reservation.status).to.equal('rejected');
      });
    });

    it('should return an error if unable to reject the reservation', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const reservation = new Reservation(reservationPayload, config);
      return reservation.reject().catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });

    });

  });

  describe('#call(from, url, options)', () => {
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';

    const requestParams = {
      Instruction: 'call',
      CallFrom: '+12345678901',
      CallUrl: 'https://handler.twilio.com/twiml/EHcbe53cec06c0cdc662c7fa799aeeede7',
      CallTo: undefined,
      CallAccept: undefined,
      CallRecord: undefined,
      CallTimeout: undefined,
      CallStatusCallbackUrl: undefined
    };

    const request = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
      method: 'POST',
      params: requestParams,
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should throw an error if the from parameter is not provided', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to issue Instruction: call on Reservation. <string>from is a required parameter.');
      const reservation = new Reservation(reservationPayload, config);

      assert.throws(() => reservation.call(null, 'https://handler.twilio.com/twiml/EHcbe53cec06c0cdc662c7fa799aeeede7'), Error, missingParamError);
    });

    it('should throw an error if the url parameter is not provided', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to issue Instruction: call on Reservation. <string>url is a required parameter.');
      const reservation = new Reservation(reservationPayload, config);

      assert.throws(() => reservation.call('+112345678901', null), Error, missingParamError);
    });

    it('should return an error if unable to issue a call instruction', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const reservation = new Reservation(reservationPayload, config);
      return reservation.call('+12345678901', 'https://handler.twilio.com/twiml/EHcbe53cec06c0cdc662c7fa799aeeede7').catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });
    });

    it('should issue a call instruction', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.resolve(fakePayloads.callReservation));

      const reservation = new Reservation(reservationPayload, config);
      return reservation.call('+12345678901', 'https://handler.twilio.com/twiml/EHcbe53cec06c0cdc662c7fa799aeeede7').then((updatedReservation) => {
        expect(updatedReservation).to.equal(reservation);

        expect(reservation.status).to.equal('pending');
      });
    });
  });

  describe('#dequeue(options)', () => {
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';

    const requestParams = {
      Instruction: 'dequeue',
      DequeueTo: undefined,
      DequeueFrom: undefined,
      DequeuePostWorkActivitySid: undefined,
      DequeueRecord: undefined,
      DequeueTimeout: undefined,
      DequeueStatusCallbackUrl: undefined,
      DequeueStatusCallbackEvent: undefined
    };

    const request = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
      method: 'POST',
      params: requestParams,
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should throw an error if unable to issue dequeue instruction', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const reservation = new Reservation(reservationPayload, config);
      return reservation.dequeue().catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });
    });

    it('should dequeue the reservation', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.resolve(fakePayloads.dequeuedReservation));

      const reservation = new Reservation(reservationPayload, config);
      return reservation.dequeue().then((updatedReservation) => {
        expect(updatedReservation).to.equal(reservation);
        expect(reservation.status).to.equal('pending');
      });
    });
  });

describe('#redirect(callSid, url, options)', () => {
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';

    const requestParams = {
      Instruction: 'redirect',
      RedirectCallSid: 'CA8d7a41c9c98d9ff2c16e1ae93bff381e',
      RedirectUrl: 'https://handler.twilio.com/twiml/EHcbe53cec06c0cdc662c7fa799aeeede7',
      RedirectAccept: false
    };

    const request = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
      method: 'POST',
      params: requestParams,
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should throw an error if callSid is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to issue Instruction: redirect on Reservation. <string>callSid is a required parameter.');
      const reservation = new Reservation(reservationPayload, config);

      assert.throws(() => reservation.redirect(null, 'https://handler.twilio.com/twiml/EHcbe53cec06c0cdc662c7fa799aeeede7'), Error, missingParamError);
    });

    it('should throw an error if url is missing', () => {
      const missingParamError = Errors.INVALID_ARGUMENT.clone('Unable to issue Instruction: redirect on Reservation. <string>url is a required parameter.');
      const reservation = new Reservation(reservationPayload, config);

      assert.throws(() => reservation.redirect('CA8d7a41c9c98d9ff2c16e1ae93bff381e', null), Error, missingParamError);
    }); 

    it('should throw an error if unable to issue redirect instruction', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const reservation = new Reservation(reservationPayload, config);

      return reservation.redirect('CA8d7a41c9c98d9ff2c16e1ae93bff381e', 'https://handler.twilio.com/twiml/EHcbe53cec06c0cdc662c7fa799aeeede7').catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });
    });

    it('should redirect the reservation', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.resolve(fakePayloads.redirectedReservation));

      const reservation = new Reservation(reservationPayload, config);
      return reservation.redirect('CA8d7a41c9c98d9ff2c16e1ae93bff381e', 'https://handler.twilio.com/twiml/EHcbe53cec06c0cdc662c7fa799aeeede7').then((updatedReservation) => {
        expect(updatedReservation).to.equal(reservation);
        expect(reservation.status).to.equal('pending');
      });
    });
  });

  describe('#getTask()', () => {
    let requestStub;

    const requestURL = 'https://event-bridge.twilio.com/v1/wschannels/ACxxx/WKxxx';

    const request = {
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
      method: 'GET',
      token: token
    };

    beforeEach(() => {
      requestStub = sinon.stub(Request, 'post');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should return a Task instance', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.resolve(fakePayloads.task));

      const reservation = new Reservation(reservationPayload, config);

      return reservation.getTask().then((task) => {
        expect(task.age).to.equal(fakePayloads.task.age);
        expect(task.accountSid).to.equal(fakePayloads.task.account_sid);
        expect(task.attributes).to.deep.equal(JSON.parse(fakePayloads.task.attributes));
        expect(task.dateCreated).to.equalDate(new Date(fakePayloads.task.date_created));
        expect(task.dateUpdated).to.equalDate(new Date(fakePayloads.task.date_updated));
        expect(task.priority).to.equal(fakePayloads.task.priority);
        expect(task.reason).to.equal(fakePayloads.task.reason);
        expect(task.sid).to.equal(fakePayloads.task.sid);
        expect(task.status).to.equal(fakePayloads.task.assignment_status);
        expect(task.taskChannelSid).to.equal(fakePayloads.task.task_channel_sid);
        expect(task.taskChannelUniqueName).to.equal(fakePayloads.task.task_channel_unique_name);
        expect(task.taskQueueName).to.equal(fakePayloads.task.task_queue_friendly_name);
        expect(task.taskQueueSid).to.equal(fakePayloads.task.task_queue_sid);
        expect(task.timeout).to.equal(fakePayloads.task.timeout);
        expect(task.workflowName).to.equal(fakePayloads.task.workflow_friendly_name);
        expect(task.workflowSid).to.equal(fakePayloads.task.workflow_sid);
        expect(task.workspaceSid).to.equal(fakePayloads.task.workspace_sid);
      });
    });

    it('should return an error if unable to get Task', () => {
      requestStub.withArgs(requestURL, request).returns(Promise.reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.')));

      const reservation = new Reservation(reservationPayload, config);

      return reservation.getTask().catch((err) => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Failed to parse JSON.');
      });
    })
  });

  describe('Reservation events', () => {
    it('should re-emit accepted event', () => {
      const spy = sinon.spy();

      const reservation = new Reservation(reservationPayload, config);
      reservation.on('accepted', spy);
      reservation._emitEvent('reservationAccepted', fakePayloads.acceptedReservation);

      assert.isTrue(spy.calledOnce);
      assert.equal(reservation.status, 'accepted');

    });

    it('should re-emit rejected event', () => {
      const spy = sinon.spy();

      const reservation = new Reservation(reservationPayload, config);
      reservation.on('rejected', spy);
      reservation._emitEvent('reservationRejected', fakePayloads.rejectedReservation);

      assert.isTrue(spy.calledOnce);
      assert.equal(reservation.status, 'rejected');
    });

    it('should re-emit timedOut event', () => {
      const spy = sinon.spy();

      const reservation = new Reservation(reservationPayload, config);
      reservation.on('timedOut', spy);
      reservation._emitEvent('reservationTimedOut', fakePayloads.timedOutReservation);

      assert.isTrue(spy.calledOnce);
      assert.equal(reservation.status, 'timeout');
    });

    it('should re-emit canceled event', () => {
      const spy = sinon.spy();

      const reservation = new Reservation(reservationPayload, config);
      reservation.on('canceled', spy);
      reservation._emitEvent('reservationCanceled', fakePayloads.canceledReservation);

      assert.isTrue(spy.calledOnce);
      assert.equal(reservation.status, 'canceled');
    });

    it('should re-emit rescinded event', () => {
      const spy = sinon.spy();

      const reservation = new Reservation(reservationPayload, config);
      reservation.on('rescinded', spy);
      reservation._emitEvent('reservationRescinded', fakePayloads.canceledReservation);

      assert.isTrue(spy.calledOnce);
      assert.equal(reservation.status, 'rescinded');
    });
  });
});


