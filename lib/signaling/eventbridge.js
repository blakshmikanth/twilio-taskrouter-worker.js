'use strict';

const constants = require('../util/constants');
const Errors = constants.twilioErrors;
const EventEmitter = require('events').EventEmitter;
const Heartbeat = require('../util/heartbeat').Heartbeat;
const inherits = require('util').inherits;
const Logger = require('../util/logger');
const tools = require('../util/tools');
const topLevel = global.window || global;
const WebSocket = topLevel.WebSocket ? topLevel.WebSocket : require('ws');

/**
 * Construct an {@EventBridgeSignaling}.
 * @class
 * @classdesc The signaling layer transmitting requests between TaskRouter and the client
 * @param {Worker} worker - The {@link Worker}
 * @param {EventBridgeSignaling.Options} [options]
 * @property {boolean} closeExistingSessions - A boolean marking whether other open sessions should be terminated
 * @property {Configuration} configuration - The {@link Configuration} to be used
 * @property {Worker} worker - The {@link Worker}
 * @fires EventBridgeSignaling#activityUpdated
 * @fires EventBridgeSignaling#connected
 * @fires EventBridgeSignaling#disconnected
 * @fires EventBridgeSignaling#error
 * @fires EventBridgeSignaling#reservationAccepted
 * @fires EventBridgeSignaling#reservationCanceled
 * @fires EventBridgeSignaling#reservationCreated
 * @fires EventBridgeSignaling#reservationRejected
 * @fires EventBridgeSignaling#reservationRescinded
 * @fires EventBridgeSignaling#reservationTimedOut
 * @fires EventBridgeSignaling#tokenExpired
 * @fires EventBridgeSignaling#workerActivityUpdated
 * @fires EventBridgeSignaling#workerAttributesUpdated
 * @fires EventBridgeSignaling#workerCapacityUpdated
 * @fires EventBridgeSignaling#workerChannelAvailabilityUpdated
 *//**
 * @typedef {Object} EventBridgeSignaling.Options
 * @property {boolean} [closeExistingSessions=false] - A boolean defining whether other open sessions of the
 *   {@link Worker} should be terminated
 */
function EventBridgeSignaling(worker, options) {
  if (!worker) {
    throw Errors.INVALID_ARGUMENT.clone('<Worker>worker is a required parameter to construct EventBridgeSignaling.');
  }

  EventEmitter.call(this);

  // create log
  const log = new Logger('EventBridgeSignaling', { logLevel: worker._config.logLevel });

  // parse options
  options = Object.assign({}, {
    closeExistingSessions: false
  }, options);

  // verify the JWT token before proceeding
  const jwt = tools.verifyJWT(worker._config.token);

  // start the clock on token expiration event
  const expiredJWTTime = jwt.exp;
  _setTokenExpirationEvent(this, expiredJWTTime);

  Object.defineProperties(this, {
    _heartbeat: {
      value: null,
      writable: true
    },
    _log: {
      value: log
    },
    _worker: {
      value: worker,
      writable: true
    },
    closeExistingSessions: {
      value: options.closeExistingSessions
    },
    config: {
      value: worker._config
    },
    worker: {
      get: function() {
        return this._worker;
      }
    }
  });

  _setUpWebSocket(this);
}

inherits(EventBridgeSignaling, EventEmitter);


/**
 * Update the token
 * @param {string} newToken - The new token to be used
 */
EventBridgeSignaling.prototype.updateToken = function updateToken(newToken) {
  if (!newToken) {
    throw Errors.INVALID_ARGUMENT.clone('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
  }

  // verify the JWT token before proceeding
  const jwt = tools.verifyJWT(newToken);

  // set a timer to emit a token.expired event
  const expiredJWTTime = jwt.exp;
  _setTokenExpirationEvent(this, expiredJWTTime);

  this._log.info('Updated token for Worker ' + jwt.grants.task_router.worker_sid);
};


function _setTokenExpirationEvent(signaling, expirationTime) {
  const currentTime = Math.round(new Date().getTime() / 1000);

  // give a 5 second buffer to emit the tokenExpired event before the token expires
  const timeToExpiration = expirationTime - currentTime - 5;

  // setTimeout requires time in ms; multiply by a factor of 1000
  setTimeout(function() {
    signaling.emit('tokenExpired');
  }, timeToExpiration * 1000);
}

function _setUpWebSocket(signaling) {
  let numAttempts = 1;
  const queryParam = `?token=${signaling.config.token}&closeExistingSessions=${signaling.closeExistingSessions}`;

  // A heart beat is sent every 30 secs by EBS, if none received within 60 secs; disconnect the websocket
  if (signaling._heartbeat) {
    // reset Heartbeat.onsleep() function to do nothing
    signaling._heartbeat.onsleep = function() {};
  }
  signaling._heartbeat = new Heartbeat({ interval: 60 });

  createWebSocket();

  /**
   * Creates the WebSocket
   */
  function createWebSocket() {
    const webSocket = new WebSocket(signaling.config.WS_SERVER + queryParam);

    webSocket.onopen = function() {
      // reset the number of attempts made to 1
      // when a successful connection is opened
      numAttempts = 1;
      signaling.emit('connected');

      // upon successful websocket connection, set heartbeat's onsleep() function to disconnect the websocket
      // if no beat is felt in the 60 sec interval
      signaling._heartbeat.onsleep = function() {
        signaling._log.info('Heartbeat not received in the past 60 seconds. Proceeding to disconnect websocket.');
        webSocket.onclose();
      };
      // kick off the 60 sec interval with a heartbeat
      signaling._heartbeat.beat();
    };

    webSocket.onmessage = function(response) {
      // a heart beat is received
      signaling._heartbeat.beat();
      if (response.data.trim().length === 0) {
        return;
      }

      // a message is received
      let json;
      try {
        json = JSON.parse(response.data);
      } catch (e) {
        signaling._log.error('Received data is not valid JSON: ' + response.data);
        signaling.emit('error', Errors.INVALID_GATEWAY_MESSAGE);
        return;
      }

      // messages from EventBridge contain an EventType and the Payload
      const eventType = json.event_type;
      const payload = json.payload;

      _emitEvent(signaling, eventType, payload);
    };

    webSocket.onerror = function(response) {
      signaling._log.error('WebSocket error occured: ' + response);
      signaling.emit('error', Errors.GATEWAY_CONNECTION_FAILED);
    };

    webSocket.onclose = function() {
      signaling._log.info('WebSocket connection has closed. Trying to reconnect.');
      signaling.emit('disconnected');

      // do not try to disconnect the websocket again if the 60 sec interval is met
      signaling._heartbeat.onsleep = function() {};

      // try to reconnect usingclear a backoff algorithm
      const time = generateBackOffInterval(numAttempts);

      setTimeout(function() {
        numAttempts++;

        createWebSocket();
      }, time);
    };
  }

  /**
   * Backoff algorithm for connection retry
   */
  function generateBackOffInterval(k) {
    return Math.min(30, (Math.pow(2, k) - 1)) * 1000;
  }
}

function _emitEvent(signaling, eventType, payload) {
  if (payload) {
    switch (eventType) {

      // Events for a Worker
      case 'worker.activity.update':
        signaling.emit('workerActivityUpdated', payload);
        break;
      case 'worker.attributes.update':
        signaling.emit('workerAttributesUpdated', payload);
        break;
      case 'worker.capacity.update':
        signaling.emit('workerCapacityUpdated', payload);
        break;
      case 'worker.channel.availability.update':
        signaling.emit('workerChannelAvailabilityUpdated', payload);
        break;

      // Events for an Activity
      case 'activity.updated':
        signaling.emit('activityUpdated', payload);
        break;

      // Events for a Reservation
      case 'reservation.created':
        signaling.emit('reservationCreated', payload);
        break;
      case 'reservation.accepted':
        signaling.emit('reservationAccepted', payload);
        break;
      case 'reservation.rejected':
        signaling.emit('reservationRejected', payload);
        break;
      case 'reservation.timeout':
        signaling.emit('reservationTimedOut', payload);
        break;
      case 'reservation.canceled':
        signaling.emit('reservationCanceled', payload);
        break;
      case 'reservation.rescinded':
        signaling.emit('reservationRescinded', payload);
        break;
    }
  } else {
    signaling.emit(eventType);
  }
}

/**
 * An {@link Activity} was updated
 * @event EventBridgeSignaling#activityUpdated
 * @param {Object} payload - The payload received
 */

/**
 * The websocket connected
 * @event EventBridgeSignaling#connected
 */

/**
 * The websocket disconnected
 * @event EventBridgeSignaling#disconnected
 */

/**
 * An error occurred
 * @event EventBridgeSignaling#error
 * @param {Error} error - The error triggered
 */

/**
 * {@link Worker} activity was updated
 * @event EventBridgeSignaling#workerActivityUpdated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Worker} attributes was updated
 * @event EventBridgeSignaling#workerAttributesUpdated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Channel} capacity was updated
 * @event EventBridgeSignaling#workerCapacityUpdated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Channel} availability was updated
 * @event EventBridgeSignaling#workerChannelAvailabilityUpdated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was accepted
 * @event EventBridgeSignaling#reservationAccepted
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was canceled
 * @event EventBridgeSignaling#reservationCanceled
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was created
 * @event EventBridgeSignaling#reservationCreated
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was rejected
 * @event EventBridgeSignaling#reservationRejected
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was rescinded
 * @event EventBridgeSignaling#reservationRescinded
 * @param {Object} payload - The payload received
 */

/**
 * {@link Reservation} was timed out
 * @event EventBridgeSignaling#reservationTimedOut
 * @param {Object} payload - The payload received
 */

 /**
  * The token expired
  * @event EventBridgeSignaling#tokenExpired
  */

module.exports = EventBridgeSignaling;
