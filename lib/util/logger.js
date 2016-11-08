'use strict';

const Errors = require('./constants').twilioErrors;
const log = require('loglevel');

/**
 * Construct a custom {@link Logger}
 * @class
 * @classdesc Log messages to console at a given logging level
 * @param {string} moduleName - The name of the logging module
 * @param {Logger.Options} [options]
 * @property {string} name - The name of the module owning this {@link Logger}
 * @property {string} logLevel - The logging level of the {@link Logger}
 *//**
 * @typedef {Object} Logger.Options
 * @property {string} [logLevel='error'] - The logging level
 */
function Logger(moduleName, options) {
  if (!moduleName) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Logger. <string>moduleName is a required parameter.');
  }

  // get the minimum log level option
  options = Object.assign({}, {
    logLevel: 'error'
  }, options);

  if (['trace', 'debug', 'info', 'warn', 'error'].indexOf(options.logLevel) === -1) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Logger. <string>logLevel must be one of [\'trace\', \'debug\', \'info\', \'warn\', \'error\']');
  }

  const logger = log.getLogger(moduleName);
  logger.setLevel(options.logLevel);

  Object.defineProperties(this, {
    _log: {
      value: logger
    },
    name: {
      value: moduleName
    },
    logLevel: {
      value: options.logLevel
    }
  });
}

/**
 * Log a trace message
 * @param {string} msg - The message to output
 */
Logger.prototype.trace = function trace(msg) {
  this._log.trace(msg);
};

/**
 * Log a debug message
 * @param {string} msg - The message to output
 */
Logger.prototype.debug = function debug(msg) {
  this._log.debug(msg);
};

/**
 * Log an informational message
 * @param {string} msg - The message to output
 */
Logger.prototype.info = function info(msg) {
  this._log.info(msg);
};


/**
 * Log a warning message
 * @param {string} msg - The message to output
 */
Logger.prototype.warn = function warn(msg) {
  this._log.warn(msg);
};

/**
 * Log an error message
 * @param {string} msg - The message to output
 */
Logger.prototype.error = function error(msg) {
  this._log.error(msg);
};

module.exports = Logger;
