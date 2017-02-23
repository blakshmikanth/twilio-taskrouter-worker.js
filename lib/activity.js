'use strict';

const constants = require('./util/constants');
const Errors = constants.twilioErrors;
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const Logger = require('./util/logger');
const tools = require('./util/tools');

/**
 * Construct an {@link Activity}.
 * @class
 * @classdesc An {@link Activity} represents a state that a {@link Worker} can be in (e.g. Idle, Offline, Busy, ...)
 * @param {Object} payload - A payload representing the {@link Activity}
 * @param {Worker} worker - The {@link Worker}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {boolean} available - If the {@link Worker} can handle Tasks in this state
 * @property {Date} dateCreated - The date this {@link Activity} was created
 * @property {Date} dateUpdated - The date this {@link Activity} was last updated
 * @property {boolean} isCurrent - If this particular {@link Activity} represents the current state of the {@link Worker}
 * @property {string} name - The friendly name of this {@link Activity}
 * @property {string} sid - The sid of this {@link Activity}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link Activity}
 * @fires Activity#nameUpdated
 */
function Activity(payload, worker) {
  if (!payload) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Activity: <Object>payload is a required parameter');
  }

  if (!worker) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Activity: <Worker>worker is a required parameter');
  }

  // verify the JWT token before proceeding
  const jwt = tools.verifyJWT(worker._config.token);

  const log = new Logger('Activity', { logLevel: worker._config.logLevel });

  payload = payload || {};

  EventEmitter.call(this);

  const accountSid = jwt.sub;
  const workspaceSid = jwt.grants.task_router.workspace_sid;

  // initialize the Activity object with what is necessary from the REST API
  Object.defineProperties(this, {
    _available: {
      value: payload.available,
      writable: true
    },
    _config: {
      value: worker._config
    },
    _dateCreated: {
      value: new Date(payload.date_created),
      writable: true
    },
    _dateUpdated: {
      value: new Date(payload.date_updated),
      writable: true
    },
    _isCurrent: {
      value: false,
      writable: true
    },
    _log: {
      value: log
    },
    _name: {
      value: payload.friendly_name,
      writable: true
    },
    _worker: {
      value: worker
    },
    accountSid: {
      value: accountSid,
      enumerable: true
    },
    available: {
      enumerable: true,
      get: function() {
        return this._available;
      }
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
    isCurrent: {
      enumerable: true,
      get: function() {
        return this._isCurrent;
      }
    },
    name: {
      enumerable: true,
      get: function() {
        return this._name;
      }
    },
    sid: {
      enumerable: true,
      value: payload.sid
    },
    workspaceSid: {
      enumerable: true,
      value: workspaceSid
    }
  });
}

inherits(Activity, EventEmitter);

/**
 * Make this {@link Activity} the current state of the Worker
 * @returns {Promise<this>} - Rejected if the {@link Worker}'s activity state could not be set
 */
Activity.prototype.setAsCurrent = function() {
  const self = this;
  return this._worker._updateWorkerActivity(this.sid).then(function() {
    return self;
  });
};

/**
 * Emit an event
 * @param {string} eventType - The event to emit
 * @param {Object} payload - The payload to emit
 * @private
 */
Activity.prototype._emitEvent = function _emitEvent(eventType, payload) {
  if (!eventType) {
    throw Errors.INVALID_ARGUMENT.clone('Error calling _emitEvent(). <string>eventType is a required parameter.');
  }

  if (!payload) {
    throw Errors.INVALID_ARGUMENT.clone('Error calling method _emitEvent(). <Object>payload is a required parameter.');
  }

  tools.updateProperties(this, payload, 'activity');
  this.emit(eventType, this);
};


/**
 * The {@link Activity}'s name was updated
 * @event Activity#nameUpdated
 * @param {Activity} activity - The {@link Activity} whose name was updated
 */

module.exports = Activity;
