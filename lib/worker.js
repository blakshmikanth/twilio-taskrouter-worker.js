'use strict';

const Activity = require('./activity');
const Channel = require('./channel');
const Configuration = require('./util/configuration');
const constants = require('./util/constants');
const Errors = constants.twilioErrors;
const EventBridgeSignaling = require('./signaling/eventbridge');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const Logger = require('./util/logger');
const Request = require('./util/request');
const Reservation = require('./reservation');
const tools = require('./util/tools');

/**
 * Construct a {@link Worker}
 * @class
 * @classdesc Create a {@link Worker} client representing a TaskRouter Worker
 * @param {string} token - The string token
 * @param {Worker.Options} [options]
 * @property {string} accountSid - The sid of the Twilio account
 * @property {Map<string, Activity>} activities - The list of possible states a {@link Worker} can be
 * @property {Activity} activity - The current {@link Activity} of the {@link Worker}
 * @property {Object} attributes - A JSON representation of the {@link Worker}'s attributes
 * @property {Map<string, Channel>} channels - The list of available {@link Channel}s
 * @property {string} connectActivitySid - The {@link Activity} to set the {@link Worker} as on connect
 * @property {Date} dateCreated - The date this {@link Worker} was created
 * @property {Date} dateStatusChanged - The date this {@link Worker}'s activity was last changed
 * @property {Date} dateUpdated - The date this {@link Worker} was last updated
 * @property {string} disconnectActivitySid - The {@link Activity} to set the {@link Worker} on disconnect
 * @property {string} name - The friendly name of the {@link Worker}
 * @property {Map<string, Reservation>} reservations - A list of pending {@link Reservation}s
 * @property {string} sid - The sid of the {@link Worker}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link Worker}
 * @fires Worker#activityUpdated
 * @fires Worker#attributesUpdated
 * @fires Worker#disconnected
 * @fires Worker#error
 * @fires Worker#ready
 * @fires Worker#tokenUpdated
 *//**
 * @typedef {Object} Worker.Options
 * @property {string} [connectActivitySid=''] - The {@link Activity} state of the Worker upon connect
 * @property {string} [disconnectActivitySid=''] - The {@link Activity} state of the Worker upon disconnect
 * @property {boolean} [closeExistingSessions=false] - - Whether other open sessions of this {@link Worker}
 *   should be terminated
 * @property {string} [logLevel='error'] - The level of logging to enable
 *   ['silent', 'error', 'warn', 'info', 'debug', 'trace']
 */
function Worker(token, options) {
  if (!token) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to instantiate Worker. <string>token is a required parameter.');
  }

  // verify the JWT token before proceeding
  const jwt = tools.verifyJWT(token);

  EventEmitter.call(this);

  const accountSid = jwt.account_sid;
  const workspaceSid = jwt.workspace_sid;
  const sid = jwt.worker_sid;

  // check options
  options = Object.assign({}, {
    connectActivitySid: '',
    disconnectActivitySid: '',
    closeExistingSessions: false,
    logLevel: 'error'
  }, options);

  // instantiate logger
  const log = new Logger('Worker', { logLevel: options.logLevel });

  // create configurations
  const workerConfig = new Configuration(token, { environment: 'prod', logLevel: options.logLevel });

  Object.defineProperties(this, {
    _activities: {
      value: new Map(),
      writable: true
    },
    _activity: {
      value: null,
      writable: true
    },
    _attributes: {
      value: null,
      writable: true
    },
    _channels: {
      value: new Map(),
      writable: true,
    },
    _config: {
      value: workerConfig,
      writable: true
    },
    _dateCreated: {
      value: null,
      writable: true
    },
    _dateStatusChanged: {
      value: null,
      writable: true
    },
    _dateUpdated: {
      value: null,
      writable: true
    },
    _log: {
      value: log
    },
    _name: {
      value: null,
      writable: true
    },
    _reservations: {
      value: new Map(),
      writable: true
    },
    _signaling: {
      value: null,
      writable: true
    },
    accountSid: {
      value: accountSid,
    },
    activities: {
      enumerable: true,
      get: function() {
        return this._activities;
      }
    },
    activity: {
      enumerable: true,
      get: function() {
        return this._activity;
      }
    },
    attributes: {
      enumerable: true,
      get: function() {
        return this._attributes;
      }
    },
    channels: {
      enumerable: true,
      get: function() {
        return this._channels;
      }
    },
    connectActivitySid: {
      enumerable: true,
      value: options.connectActivitySid
    },
    dateCreated: {
      enumerable: true,
      get: function() {
        return this._dateCreated;
      }
    },
    dateStatusChanged: {
      enumerable: true,
      get: function() {
        return this._dateStatusChanged;
      }
    },
    dateUpdated: {
      enumerable: true,
      get: function() {
        return this._dateUpdated;
      }
    },
    disconnectActivitySid: {
      enumerable: true,
      value: options.disconnectActivitySid
    },
    name: {
      enumerable: true,
      get: function() {
        return this._name;
      }
    },
    reservations: {
      enumerable: true,
      get: function() {
        return this._reservations;
      }
    },
    sid: {
      enumerable: true,
      value: sid
    },
    workspaceSid: {
      enumerable: true,
      value: workspaceSid
    }
  });

  // create a signaling instance
  const workerSignaling = new EventBridgeSignaling(this, { closeExistingSessions: options.closeExistingSessions });
  this._signaling = workerSignaling;

  // re-emit corresponding signaling events
  handleWorkerSignalingEvents(this, workerSignaling);
}

inherits(Worker, EventEmitter);

/**
 * Get all {@link Tasks} currently assigned to the {@link Worker}
 * @returns {Promise<Map<string, Task>>} - Rejected if unable to get the {@link Task}s
 */
Worker.prototype.getTasks = function getTasks() {
  const self = this;
  const tasks = new Map();

  if (this.reservations.size === 0) {
    return Promise.resolve(tasks);
  }

  return new Promise(function(resolve, reject) {
    self.reservations.forEach(function(reservation) {
      reservation.getTask().then(function(task) {
        tasks.set(task.sid, task);

        if (tasks.size === self.reservations.size) {
          resolve(tasks);
        }
      }).catch(function(err) {
        reject(err);
      });
    });
  });
};

/**
 * Update attributes
 * @param {Object} attributes - A JSON representation of attributes
 * @returns {Promise<this>} - Rejected if the attributes cannot be set
 */
Worker.prototype.setAttributes = function setAttributes(attributes) {
  if (!attributes) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to set attributes on Worker. <string>attributes is a required parameter.');
  }

  const requestURL = this._config.TR_SERVER + '/Workers/' + this.sid;

  const requestParams = { Attributes: JSON.stringify(attributes) };

  const request = {
    url: requestURL,
    method: 'POST',
    params: requestParams,
    event_type: 'attributesUpdated',    // eslint-disable-line camelcase
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return tools.updateProperties(self, payload, 'worker');
  });
};

/**
 * Update token
 * @param {string} newToken - The new token that should be used for authentication
 * @returns {void} - Emits error if unable to update token
 */
Worker.prototype.updateToken = function updateToken(newToken) {
  if (!newToken) {
    throw Errors.INVALID_ARGUMENT.clone('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
  }

  // verify the JWT token before proceeding
  tools.verifyJWT(newToken);

  this._log.info('Proceeding to update the Worker\'s current active token with a new token');
  this._log.debug('New token: ' + newToken);

  try {
    this._signaling.updateToken(newToken);
    this._config.updateToken(newToken);
    this.emit('tokenUpdated');
  } catch (err) {
    this.emit('error', err);
  }
};

/**
 * Update the Worker's Activity
 * @param {string} activitySid - The sid of the {@link Activity} to update to
 * @returns {Promise<this>}
 * @private
 */
Worker.prototype._updateWorkerActivity = function(activitySid) {
  if (!activitySid) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to update Worker activity. <string>activitySid is a required parameter.');
  }

  const requestURL = this._config.TR_SERVER + '/Workers/' + this.sid;
  const requestParam = { ActivitySid: activitySid };

  const request = {
    url: requestURL,
    method: 'POST',
    params: requestParam,
    event_type: 'activityUpdated',    // eslint-disable-line camelcase
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    self.activity._isCurrent = false;

    const newActivity = self.activities.get(activitySid);
    self._activity = newActivity;
    self.activity._isCurrent = true;

    return tools.updateProperties(self, payload, 'worker');
  });
};

function _initializeWorker(worker) {
  worker._log.info('Initializing Worker ' + worker.sid);

  const requestURL = worker._config.TR_SERVER + '/Workers/' + worker.sid;

  const getWorkerRequest = {
    url: requestURL,
    method: 'GET',
    token: worker._config.token
  };

  let workerPayload;
  Request.post(worker._config.EB_SERVER, getWorkerRequest).then(function(payload) {
    workerPayload = payload;

    worker._name = workerPayload.friendly_name;
    worker._attributes = JSON.parse(workerPayload.attributes);
    worker._dateCreated = new Date(workerPayload.date_created);
    worker._dateUpdated = new Date(workerPayload.date_updated);
    worker._dateStatusChanged = new Date(workerPayload.date_status_changed);

    return Promise.all([
      _getWorkerActivities(worker),
      _getWorkerChannels(worker),
      _getPendingReservations(worker)
    ]);
  }).then(function(response) {
    worker._activities = response[0];
    worker._log.info('Worker ' + worker.sid + ' activities successfully initialized');

    worker._channels = response[1];
    worker._log.info('Worker ' + worker.sid + ' channels successfully initialized');

    worker._reservations = response[2];
    worker._log.info('Worker ' + worker.sid + ' currently pending reservations successfully initalized');

    // set the current activity of the Worker
    _setCurrentActivity(worker, workerPayload.activity_sid);
    if (worker.connectActivitySid) {
      _setWorkerConnectActivity(worker).then(function() {
        worker._log.info('Worker ' + worker.sid + ' sucessfully initialized');
        worker.emit('ready', worker);
      });
    } else {
      worker._log.info('Worker ' + worker.sid + ' sucessfully initialized');
      worker.emit('ready', worker);
    }
  }).catch(function(err) {
    worker.emit('error', 'Unable to initialize Worker.');
    worker._log.error('Unable to initialize Worker ' + worker.sid);
    worker._log.error(err);
  });
}

function _setCurrentActivity(worker, currentActivitySid) {
  const activity = worker.activities.get(currentActivitySid);
  worker._activity = activity;
  worker.activity._isCurrent = true;
}

function _setWorkerConnectActivity(worker) {
  return worker._updateWorkerActivity(worker.connectActivitySid).then(function() {
    worker._log.info('Successfully set Worker to Activity ' + worker.connectActivitySid + ' on connect.');
  }).catch(function(err) {
    worker._log.warn('Unable to set Worker ' + worker.sid + ' activity to ' + worker.connectActivitySid + ' on successful connection.');
    worker._log.warn('Warning: ' + err);
  });
}

function _getPendingReservations(worker) {
  const requestURL = worker._config.TR_SERVER + '/Workers/' + worker.sid + '/Reservations';

  const requestParam = { ReservationStatus: 'pending' };

  const request = {
    url: requestURL,
    method: 'GET',
    params: requestParam,
    token: worker._config.token
  };


  const workerReservations = new Map();
  return Request.post(worker._config.EB_SERVER, request).then(function(response) {
    response.reservations.forEach(function(reservationPayload) {
      workerReservations.set(reservationPayload.sid, new Reservation(reservationPayload, worker._config));
    });
    return workerReservations;
  });
}

function _getWorkerActivities(worker) {

  const requestURL = worker._config.TR_SERVER + '/Activities';

  const request = {
    url: requestURL,
    method: 'GET',
    token: worker._config.token
  };

  const workerActivities = new Map();
  return Request.post(worker._config.EB_SERVER, request).then(function(response) {
    response.activities.forEach(function(activityPayload) {
      workerActivities.set(activityPayload.sid, new Activity(activityPayload, worker));
    });
    return workerActivities;
  });
}

function _getWorkerChannels(worker) {

  const requestURL = worker._config.TR_SERVER + '/Workers/' + worker.sid + '/Channels';

  const request = {
    url: requestURL,
    method: 'GET',
    token: worker._config.token
  };

  const workerChannels = new Map();
  return Request.post(worker._config.EB_SERVER, request).then(function(response) {
    response.channels.forEach(function(channelPayload) {
      workerChannels.set(channelPayload.sid, new Channel(channelPayload, worker._config));
    });
    return workerChannels;
  });
}

function handleWorkerSignalingEvents(worker, signaling) {
  signaling.on('connected', function() {
    _initializeWorker(worker);
  });

  signaling.on('disconnected', function() {
    worker.emit('disconnected');
    if (worker.disconnectActivitySid) {
      worker._updateWorkerActivity(worker.disconnectActivitySid).then(function() {
        worker._log.info('Updating Worker ' + worker.sid + ' to Activity ' + worker.disconnectActivitySid + ' on disconnect');
      }).catch(function(err) {
        worker._log.error('Unable to update Worker ' + worker.sid + ' activity to ' + worker.disconnectActivitySid + ' on disconnect');
        worker._log.error('Error: ' + err);
      });
    }
  });

  signaling.on('error', function(err) {
    worker.emit('error', err);
  });

  signaling.on('tokenExpired', function() {
    worker._log.info('Token for Worker ' + worker.sid + ' has expired');
    worker.emit('tokenExpired');
  });

  // Events From Event-Bridge
  signaling.on('workerActivityUpdated', function(payload) {
    worker.activity._isCurrent = false;

    const newActivity = worker.activities.get(payload.activity_sid);
    worker._activity = newActivity;
    newActivity._isCurrent = true;

    tools.updateProperties(worker, payload, 'worker');
    worker.emit('activityUpdated', worker);
  });

  signaling.on('workerAttributesUpdated', function(payload) {
    tools.updateProperties(worker, payload, 'worker');
    worker.emit('attributesUpdated', worker);
  });

  signaling.on('workerCapacityUpdated', function(payload) {
    const channel = worker.channels.get(payload.sid);
    channel._emitEvent('capacityUpdated', payload);
  });

  signaling.on('workerChannelAvailabilityUpdated', function(payload) {
    const channel = worker.channels.get(payload.sid);
    channel._emitEvent('availabilityUpdated', payload);
  });

  signaling.on('activityUpdated', function(payload) {
    const activity = worker.activities.get(payload.sid);
    activity._emitEvent('nameUpdated', payload);
  });

  signaling.on('reservationCreated', function(payload) {
    const reservation = new Reservation(payload, worker._config);
    worker._reservations.set(reservation.sid, reservation);
    worker.emit('reservationCreated', reservation);
  });

  signaling.on('reservationAccepted', function(payload) {
    const reservation = worker.reservations.get(payload.reservation_sid);
    if (reservation) {
      reservation._emitEvent('reservationAccepted', payload);
    } else {
      worker._log.error('Reservation not found for Client. Unable to emit Event: on(\'accepted\')');
    }
  });

  ['Rejected', 'TimedOut', 'Canceled', 'Rescinded'].forEach(function(eventType) {
    signaling.on('reservation' + eventType, function(payload) {
      _emitReservationDeletedEvent(worker, eventType, payload);
    });
  });
}

function _emitReservationDeletedEvent(worker, eventType, payload) {
  const reservation = worker.reservations.get(payload.reservation_sid);

  if (reservation) {
    worker.reservations.delete(reservation.sid);
    reservation._emitEvent('reservation' + eventType, payload);
  } else {
    worker._log.error('Reservation not found for Client. Unable to emit Event: on(\'' + event + '\')');
  }
}

/**
  * {@link Worker} activity has updated
  * @event Worker#activityUpdated
  * @param {Worker} worker - The updated {@link Worker}
  */

/**
 * {@link Worker} attributes have updated
 * @event Worker#attributesUpdated
 * @param {Worker} worker - The updated {@link Worker}
 */

/**
 * The signaling layer has lost the websocket connection
 * @event Worker#disconnected
 */

/**
 * An error has occurred
 * @event Worker#error
 * @param {Error} error - The Error that occurred
 */

/**
 * {@link Worker} is ready to listen for events and take action
 * @event Worker#ready
 */

/**
 * The {@link Worker} token has successfully updated
 * @event Worker#tokenUpdated
 */

module.exports = Worker;
