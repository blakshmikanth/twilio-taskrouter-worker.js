'use strict';

const constants = require('./util/constants');
const Errors = constants.twilioErrors;
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const Logger = require('./util/logger');
const Request = require('./util/request');
const tools = require('./util/tools');

/**
 * Construct a {@link Channel}.
 * @class
 * @classdesc A {@link Channel} distinguishes Tasks into specific types
 *   (e.g. Default, Chat, SMS, Video, Voice)
 * @param {Object} payload - The payload representing this {@link Channel}
 * @param {Configuration} config - The {@link Configuration} of the {@link Worker}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {boolean} available - If the {@link Worker} should be assigned {@link Task}s of this {@link Channel} type
 * @property {int} capacity - The number of {@link Task}s that a {@link Worker} can handle of this {@link Channel} type
 * @property {int} availableCapacityPercentage - The current available capacity of this {@link Worker} to handle
 *   {@link Task}s of this {@link Channel} type
 * @property {Date} dateCreated - The date this {@link Channel} was created
 * @property {Date} dateUpdated - The date this {@link Channel} was last updated
 * @property {string} sid - The sid of this {@link Activity}
 * @property {string} taskChannelSid - The sid of the TaskChannel associated to this {@link Worker} {@link Channel}
 * @property {string} taskChannelUniqueName - The friendly name of this {@link Channel}
 * @property {string} workerSid - The sid of the {@link Worker} owning this {@link Channel}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link Activity}
 * @fires Channel#capacityUpdated
 * @fires Channel#availabilityUpdated
 */
function Channel(payload, config) {
  if (!payload) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Channel: <Object>payload is a required parameter');
  }

  if (!config) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Channel: <Configuration>config is a required parameter');
  }

  // verify the JWT token before proceeding
  const jwt = tools.verifyJWT(config.token);

  // instantiate logger for this module
  const log = new Logger('Channel', { logLevel: config.logLevel });

  const accountSid = jwt.account_sid;
  const workerSid = jwt.worker_sid;
  const workspaceSid = jwt.workspace_sid;

  Object.defineProperties(this, {
    _assignedTasks: {
      value: payload.assigned_tasks,
      writable: true,
    },
    _available: {
      value: payload.available,
      writable: true,
    },
    _availableCapacityPercentage: {
      value: payload.available_capacity_percentage,
      writable: true
    },
    _capacity: {
      value: payload.configured_capacity,
      writable: true
    },
    _config: {
      value: config
    },
    _dateCreated: {
      value: new Date(payload.date_created),
      writable: true
    },
    _dateUpdated: {
      value: new Date(payload.date_updated),
      writable: true
    },
    _log: {
      value: log
    },
    accountSid: {
      value: accountSid,
      enumerable: true
    },
    assignedTasks: {
      enumerable: true,
      get: function() {
        return this._assignedTasks;
      }
    },
    available: {
      enumerable: true,
      get: function() {
        return this._available;
      }
    },
    capacity: {
      enumerable: true,
      get: function() {
        return this._capacity;
      }
    },
    availableCapacityPercentage: {
      enumerable: true,
      get: function() {
        return this._availableCapacityPercentage;
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
    sid: {
      enumerable: true,
      value: payload.sid
    },
    taskChannelSid: {
      enumerable: true,
      value: payload.task_channel_sid
    },
    taskChannelUniqueName: {
      enumerable: true,
      value: payload.task_channel_unique_name
    },
    workerSid: {
      enumerable: true,
      value: workerSid
    },
    workspaceSid: {
      enumerable: true,
      value: workspaceSid
    }
  });
}

inherits(Channel, EventEmitter);

/**
 * Set the availability of a {@link Channel}
 * @param {boolean} isAvailable - Whether the {@link Worker} should be available to receive
 *   {@link Task}s of this {@link Channel} type
 * @return {Promise<this>} - Rejected if the {@link Channel}'s availability could not be updated
 */
Channel.prototype.setAvailability = function setAvailability(isAvailable) {
  if (typeof (isAvailable) !== 'boolean') {
    throw Errors.INVALID_ARGUMENT.clone('Error calling method setAvailability(). <boolean>isAvailable is a required parameter.');
  }

  const requestURL = this._config.TR_SERVER + '/Workers/' + this.workerSid + '/Channels/' + this.sid;

  const requestParam = { Available: isAvailable.toString() };

  const request = {
    url: requestURL,
    method: 'POST',
    params: requestParam,
    event_type: 'availabilityUpdated',    // eslint-disable-line camelcase
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return tools.updateProperties(self, payload, 'channel');
  });
};

/**
 * Set the capacity of a {@link Channel}
 * @param {int} capacity - The total number of {@link Task}s the {@link Worker}
 *   can handle of this {@link Channel} type
 * @returns {Promise<this>} - Rejected if the {@link Channel}'s capacity could not be updated
 */
Channel.prototype.setCapacity = function setCapacity(capacity) {
  if (!capacity) {
    throw Errors.INVALID_ARGUMENT.clone('Error calling method setCapacity(). <int>capacity is a required parameter.');
  }

  const requestURL = this._config.TR_SERVER + '/Workers/' + this.workerSid + '/Channels/' + this.sid;

  const requestParam = { Capacity: capacity.toString() };

  const request = {
    url: requestURL,
    method: 'POST',
    params: requestParam,
    event_type: 'capacityUpdated',    // eslint-disable-line camelcase
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return tools.updateProperties(self, payload, 'channel');
  });
};


/**
 * Emit events from this {@link Channel}
 * @param {string} eventType - The event to emit
 * @param {Object} payload - The payload to emit
 * @private
 */
Channel.prototype._emitEvent = function _emitEvent(eventType, payload) {
  if (!eventType) {
    throw Errors.INVALID_ARGUMENT.clone('Error calling _emitEvent(). <string>eventType is a required parameter.');
  }

  if (!payload) {
    throw Errors.INVALID_ARGUMENT.clone('Error calling method _emitEvent(). <object>payload is a required parameter.');
  }

  tools.updateProperties(this, payload, 'channel');
  this.emit(eventType, this);
};


/**
 * The capacity of this {@link Channel} was updated
 * @event Channel#capacityUpdated
 * @param {Channel} channel - The {@link Channel} whose capacity was updated
 */

/**
 * The availability of this {@link Channel} was updated
 * @event Channel#availabilityUpdated
 * @param {Channel} channel - The {@link Channel} whose availability was updated
 */

module.exports = Channel;
