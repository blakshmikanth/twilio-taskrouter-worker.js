'use strict';

const Errors = require('./constants').twilioErrors;
const tools = require('./tools');

/**
 * Construct the {@link Configuration} for the {@link Worker}
 * @class
 * @classdesc The configuration settings
 * @param {string} token - The {@link Worker}'s token
 * @param {Configuration.Options} [options]
 * @property {string} token - The token
 * @property {string} EB_SERVER - The EventBridge URI
 * @property {string} TR_SERVER - The TaskRouter URI
 * @property {string} WS_SERVER - The WebSocket URI
 *//**
 * @typedef {Object} Configuration.Options
 * @property {string} [environment='prod'] - The environment (e.g. 'dev', 'stage', 'prod')
 * @property {string} [logLevel='error'] - The minimum level of logging to output
 */
function Configuration(token, options) {
  if (!token) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to initalize Configuration. <string>token is required.');
  }

  // verify the JWT token before proceeding
  const jwt = tools.verifyJWT(token);

  // parse the access token
  const accountSid = jwt.sub;
  const workspaceSid = jwt.grants.task_router.workspace_sid;
  const workerSid = jwt.grants.task_router.worker_sid;

  options = Object.assign({}, {
    environment: 'prod',
    logLevel: 'error'
  }, options);

  const serverSettings = {
    TR_SERVER: getTaskRouterURI(options.environment, workspaceSid),
    EB_SERVER: getEventBridgeURI(options.environment, accountSid, workerSid),
    WS_SERVER: getWebSocketURI(options.environment, accountSid, workerSid)
  };

  Object.defineProperties(this, {
    _logLevel: {
      value: options.logLevel,
      writable: true
    },
    logLevel: {
      get: function() {
        return this._logLevel;
      }
    },
    _token: {
      value: token,
      writable: true
    },
    token: {
      get: function() {
        return this._token;
      }
    },
    TR_SERVER: {
      value: serverSettings.TR_SERVER
    },
    EB_SERVER: {
      value: serverSettings.EB_SERVER
    },
    WS_SERVER: {
      value: serverSettings.WS_SERVER
    }
  });
}

/**
 * Update the token
 * @param {string} newToken - The new token to be used
 */
Configuration.prototype.updateToken = function updateToken(newToken) {
  if (!newToken) {
    throw Error.INVALID_ARGUMENT.clone('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
  }

  // verify the JWT token before proceeding
  tools.verifyJWT(newToken);

  this._token = newToken;
};

// TaskRouter Server
function getTaskRouterURI(environment, workspaceSid) {
  switch (environment) {
    case 'prod':
      return 'https://taskrouter.twilio.com/v1/Workspaces/' + workspaceSid;
    default:
      return 'https://taskrouter.' + environment + '.twilio.com/v1/Workspaces/' + workspaceSid;
  }
}

// EventBridge Server
function getEventBridgeURI(environment, accountSid, workerSid) {
  switch (environment) {
    case 'prod':
      return 'https://event-bridge.twilio.com/v1/wschannels/' + accountSid + '/' + workerSid;
    default:
        return 'https://event-bridge.' + environment + '-us1.twilio.com/v1/wschannels/' + accountSid + '/' + workerSid;
  }
}

// WebSocket Server
function getWebSocketURI(environment, accountSid, workerSid) {
  switch (environment) {
    case 'prod':
      return 'wss://event-bridge.twilio.com/v1/wschannels/' + accountSid + '/' + workerSid;
    default:
        return 'wss://event-bridge.' + environment + '-us1.twilio.com/v1/wschannels/' + accountSid + '/' + workerSid;
  }
}

module.exports = Configuration;
