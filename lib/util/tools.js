'use strict';

const constants = require('./constants');
const needsDateTransfiguration = constants.needsDateTransfiguration;
const needsJSONTransfiguration = constants.needsJSONTransfiguration;
const taskRouterProperties = constants.taskRouterProperties;
const Errors = constants.twilioErrors;
const JWTUtil = require('./jwt');

module.exports.updateProperties = function(target, source, type) {
  if (!target) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to update properties. <Object>target is a required parameter.');
  }

  if (!source) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to update properties. <Object>source is a required parameter.');
  }

  if (!type) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to update properties. <string>type is a required parameter.');
  }

  const properties = taskRouterProperties[type];

  for (let property in properties) {
    if (needsDateTransfiguration.has(property)) {
      target[properties[property]] = (typeof source[property]  === 'number') ? new Date(source[property] * 1000) : new Date(source[property]);
    } else if (needsJSONTransfiguration.has(property)) {
      target[properties[property]] = JSON.parse(source[property]);
    } else {
      target[properties[property]] = source[property];
    }
  }
  return target;
};

module.exports.verifyJWT = function(token) {
  if (!token) {
    throw Errors.INVALID_ARGUMENT.clone('Unable to verify JWT. <string>token is a required parameter.');
  }

  let jwt;
  try {
    jwt = JWTUtil.objectize(token);
  } catch (err) {
    throw Errors.INVALID_TOKEN.clone('Twilio token malformed. Unable to decode token.');
  }

  if (!jwt.account_sid || !jwt.workspace_sid || !jwt.worker_sid) {
    throw Errors.INVALID_TOKEN.clone('Twilio token missing one or more minimum payload values: ' +
      ' AccountSid, WorkspaceSid and WorkerSid');
  }
  return jwt;
};
