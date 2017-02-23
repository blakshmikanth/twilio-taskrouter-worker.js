'use strict';

const constants = require('./util/constants');
const Errors = constants.twilioErrors;
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const Logger = require('./util/logger');
const Request = require('./util/request');
const Task = require('./task');
const tools = require('./util/tools');

/**
 * Construct a {@link Reservation}.
 * @class
 * @classdesc A {@link Reservation} represents that a {@link Task} has been assigned to a {@link Worker}
 * @param {Object} payload - The payload representing the {@link Reservation}
 * @param {Configuration} config - The {@link Configuration} of the {@link Worker}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {Date} dateCreated - The date the {@link Reservation} was created
 * @property {Date} dateUpdated - The date the {@link Reservation} was last updated
 * @property {string} sid - The sid of the {@link Reservation}
 * @property {string} status - The current state of the {@link Reservation}
 * @property {string} taskChannelSid - The sid of the Task Channel associated to the {@link Reservation}
 * @property {string} taskChannelUniqueName - The unique name of the Task Channel associated to the {@link Reservation}
 * @property {string} taskSid - The sid of the {@link Task} associated to the {@link Reservation}
 * @property {string} workerSid - The sid of the {@link Worker}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link Reservation}
 * @fires Reservation#accepted
 * @fires Reservation#canceled
 * @fires Reservation#rejected
 * @fires Reservation#rescinded
 * @fires Reservation#timedOut
 */
function Reservation(payload, config) {
  if (!payload) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Reservation: <Object>payload is a required parameter');
  }

  if (!config) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Reservation: <Configuration>config is a required parameter');
  }

  // verify the JWT token before proceeding
  const jwt = tools.verifyJWT(config.token);

  // instantiate logger
  const log = new Logger('Reservation', { logLevel: config.logLevel });

  const accountSid = jwt.sub;
  const workerSid = jwt.grants.task_router.worker_sid;
  const workspaceSid = jwt.grants.task_router.workspace_sid;

  Object.defineProperties(this, {
    _config: {
      value: config
    },
    _dateCreated: {
      value: new Date(payload.date_created * 1000),
      writable: true
    },
    _dateUpdated: {
      value: new Date(payload.date_updated * 1000),
      writable: true
    },
    _log: {
      value: log
    },
    _status: {
      value: 'pending',
      writable: true
    },
    _taskChannelSid: {
      value: payload.task_channel_sid,
      writable: true
    },
    _taskChannelUniqueName: {
      value: payload.task_channel_unique_name,
      writable: true
    },
    _taskSid: {
      // if via reservation.created event => taskSid === payload.sid
      // if via GET pending reservations => taskSid === payload.task_sid
      value: payload.task_sid || payload.sid,
      writable: true
    },
    _workerSid: {
      value: workerSid,
      writable: true
    },
    accountSid: {
      enumerable: true,
      value: accountSid
    },
    dateCreated: {
      enumerable: true,
      get: function() {
        return this._dateCreated;
      }
    },
    dateUpdated: {
      enumerable: true,
      get: function() {
        return this._dateUpdated;
      }
    },
    sid: {
      enumerable: true,
      // a Reservation created via _getPendingReservations when the Client is initialized
      // returns a different payload then the payload sent on Worker#reservationCreated event
      // payload.reservation_sid for event and payload.sid for _getPendingReservations
      value: payload.reservation_sid || payload.sid,
    },
    status: {
      enumerable: true,
      get: function() {
        return this._status;
      }
    },
    taskChannelSid: {
      enumerable: true,
      get: function() {
        return this._taskChannelSid;
      }
    },
    taskChannelUniqueName: {
      enumerable: true,
      get: function() {
        return this._taskChannelUniqueName;
      }
    },
    taskSid: {
      enumerable: true,
      get: function() {
        return this._taskSid;
      }
    },
    workerSid: {
      enumerable: true,
      get: function() {
        return this._workerSid;
      }
    },
    workspaceSid: {
      enumerable: true,
      value: workspaceSid,
    }
  });
}

inherits(Reservation, EventEmitter);

/**
 * Fetch the {@link Task} associated to this {@link Reservation}
 * @returns {Promise<Task>} - Rejected if unable to fetch the {@link Task}
 */
Reservation.prototype.getTask = function getTask() {
  const requestURL = this._config.TR_SERVER + '/Tasks/' + this.taskSid;

  const request = {
    url: requestURL,
    method: 'GET',
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return new Task(payload, self._config);
  });
};

/**
 * Accept the {@link Reservation}
 * @returns {Promise<this>} - Rejected if unable to issue Accept instruction on the {@link Reservation}
 */
Reservation.prototype.accept = function accept() {
  const requestURL = this._config.TR_SERVER + '/Tasks/' + this.taskSid + '/Reservations/' + this.sid;

  const requestParam = { ReservationStatus: 'accepted' };

  const request = {
    url: requestURL,
    method: 'POST',
    params: requestParam,
    event_type: 'accepted',   // eslint-disable-line camelcase
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return tools.updateProperties(self, payload, 'reservation');
  });
};

/**
 * Reject the {@link Reservation}
 * @param {Reservation.RejectOptions} [options]
 * @returns {Promise<this>} - Rejected if unable to issue Reject instruction on the {@link Reservation}
 *//**
 * @typedef {Object} Reservation.RejectOptions
 * @property {string} [activitySid=null] - The sid of the {@link Activity} to update the worker to
 *   upon rejecting the {@link Reservation}
 */
Reservation.prototype.reject = function reject(options) {
  options = options || {};

  const requestURL = this._config.TR_SERVER + '/Tasks/' + this.taskSid + '/Reservations/' + this.sid;

  const requestParam = {
    ReservationStatus: 'rejected',
    WorkerActivitySid: options.activitySid
  };

  const request = {
    url: requestURL,
    method: 'POST',
    params: requestParam,
    event_type: 'rejected',   // eslint-disable-line camelcase
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return tools.updateProperties(self, payload, 'reservation');
  });
};

/**
 * Issue a Call to a {@link Worker}
 * @param {string} from - The caller id for the call to a {@link Worker}
 * @param {string} url - A valid TwiML URI that is executed on the answering Worker's leg
 * @param {Reservation.CallOptions} [options]
 * @returns {Promise<this>} - Rejected if unable to issue Call instruction on the {@link Reservation}
 *//**
 * @typedef {Object} Reservation.CallOptions
 * @property {string} [statusCallbackUrl=null] - A valid status status callback url
 * @property {boolean} [accept=false] - Represents whether the {@link Task} should be
 *   accepted before initiating the call
 * @property {boolean} [record=false] - To record the call or not
 * @property {string} [to=null] - The number or endpoint that should be called.
 *   If not provided, the contact_uri defined in the {@link Worker} attributes will be used
 */
Reservation.prototype.call = function call(from, url, options) {
  if (!from) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to issue Instruction: call on Reservation. <string>from is a required parameter.');
  }

  if (!url) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to issue Instruction: call on Reservation. <string>url is a required parameter.');
  }

  options = options || {};

  const requestURL = this._config.TR_SERVER + '/Tasks/' + this.taskSid + '/Reservations/' + this.sid;

  const requestParams = {
    Instruction: 'call',
    CallFrom: from,
    CallUrl: url,
    CallTo: options.to,
    CallAccept: options.accept,
    CallRecord: options.record,
    CallTimeout: options.timeout,
    CallStatusCallbackUrl: options.statusCallbackUrl
  };

  const request = {
    url: requestURL,
    method: 'POST',
    params: requestParams,
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return tools.updateProperties(self, payload, 'reservation');
  });
};

/**
 * Dequeue the {@link Reservation} to the {@link Worker}. This will perform telephony to dequeue a
 *   {@link Task} that was enqueued using the Enqueue TwiML verb. A contact_uri must exist
 *   in the {@link Worker}'s attributes for this call to go through.
 * @param {Reservation.DequeueOptions} [options]
 * @returns {Promise<this>} - Rejected if unable to issue Dequeue instruction on the {@link Reservation}
 *//**
 * @typedef {Object} Reservation.DequeueOptions
 * @property {string} [from=null] - The caller id for the call to the {@link Worker}.
 *   Must be a verified Twilio number.
 * @property {string} [to=null] - The contact uri of the {@link Worker}; can be a phone
 *   number or a client ID. Required, if no contact_uri on the {@link Worker}'s attributes.
 * @property {string} [postWorkActivitySid=null] - The activitySid to update the
 *   {@link Worker} to after dequeuing the {@link Reservation}.
 * @property {string} [record='do-not-record'] - Defines which legs of the call
 *   should be recorded.
 * @property {int} [timeout=60] - The integer number of seconds that
 *   Twilio should allow the call to ring before assuming there is no answer.
 * @property {string} [statusCallbackUrl=null] - A URL that Twilio will send
 *   asynchronous webhook requests to on a completed call event.
 * @property {string} [statusCallbackEvents=null] - A comma separated string of the events to subscribe to
 */
Reservation.prototype.dequeue = function dequeue(options) {
  options = options || {};

  const requestURL = this._config.TR_SERVER + '/Tasks/' + this.taskSid + '/Reservations/' + this.sid;

  const requestParams = {
    Instruction: 'dequeue',
    DequeueTo: options.to,
    DequeueFrom: options.from,
    DequeuePostWorkActivitySid: options.postWorkActivitySid,
    DequeueRecord: options.record,
    DequeueTimeout: options.timeout,
    DequeueStatusCallbackUrl: options.statusCallbackUrl,
    DequeueStatusCallbackEvent: options.statusCallbackEvents
  };

  const request = {
    url: requestURL,
    method: 'POST',
    params: requestParams,
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return tools.updateProperties(self, payload, 'reservation');
  });
};


/**
 * Redirect the active Call tied to this {@link Reservation}
 * @param {string} callSid - The sid of the Call to redirect
 * @param {string} url - A valid TwiML URI that is executed on the Caller's leg upon redirecting
 * @param {Reservation.RedirectOptions} [options]
 * @returns {Promise<this>} - Rejected if unable to issue Redirect instruction on the {@link Reservation}
 *//**
 * @typedef {Object} Reservation.RedirectOptions
 * @property {boolean} [accept=false] - Represents whether the {@link Task} should be
 *   accepted before initiating the call
 */
Reservation.prototype.redirect = function redirect(callSid, url, options) {
  if (!callSid) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to issue Instruction: redirect on Reservation. <string>callSid is a required parameter.');
  }

  if (!url) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to issue Instruction: redirect on Reservation. <string>url is a required parameter.');
  }

  options = options || {};

  const requestURL = this._config.TR_SERVER + '/Tasks/' + this.taskSid + '/Reservations/' + this.sid;

  const requestParams = {
    Instruction: 'redirect',
    RedirectCallSid: callSid,
    RedirectUrl: url,
    RedirectAccept: options.accept || false
  };

  const request = {
    url: requestURL,
    method: 'POST',
    params: requestParams,
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return tools.updateProperties(self, payload, 'reservation');
  });
};

/**
 * Emit an event specific to the {@link Reservation}
 * @param {string} eventType - The event type
 * @param {Object} payload - The payload of the event
 * @private
 */
Reservation.prototype._emitEvent = function _emitEvent(eventType, payload) {
  const status = new Map([
    ['reservationAccepted', ['accepted']],
    ['reservationRejected', ['rejected']],
    ['reservationTimedOut', ['timeout', 'timedOut']],
    ['reservationCanceled', ['canceled']],
    ['reservationRescinded', ['rescinded']]
  ]).get(eventType);

  tools.updateProperties(this, payload, 'reservation');
  this._status = status[0];
  this.emit(status[1] || status[0], this);
};

/**
 * Fired when a {@link Reservation} has been accepted for this {@link Worker}
 *
 * @event Reservation#accepted
 * @param {Reservation} reservation - The accepted {@link Reservation}
 */

/**
 * Fired when a {@link Reservation} has been rejected for this {@link Worker}
 *
 * @event Reservation#rejected
 * @param {Reservation} reservation - The rejected {@link Reservation}
 */

/**
 * Fired when a {@link Reservation} has been canceled for this {@link Worker}
 *
 * @event Reservation#canceled
 * @param {Reservation} reservation - The canceled {@link Reservation}
 */

/**
 * Fired when a {@link Reservation} has been timed out for this {@link Worker}
 *
 * @event Reservation#timedOut
 * @param {Reservation} reservation - The timed out {@link Reservation}
 */

/**
 * Fired when a {@link Reservation} has been rescinded for the {@link Worker}
 * @event Reservation#rescinded
 * @param {Reservation} reservation - The rescinded {@link Reservation}
 */

module.exports = Reservation;
