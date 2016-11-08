/* eslint-disable */
'use strict';
const JWTUtil = require('./jwt');

// Properties that need updating for the Activity
const ACTIVITY_PROPERTIES = {
  friendly_name: '_name',
  date_created: '_dateCreated',
  date_updated: '_dateUpdated'
};

// Properties that need updating for the Channel
const CHANNEL_PROPERTIES = {
  configured_capacity: '_capacity',
  available: '_available',
  assigned_tasks: '_assignedTasks',
  available_capacity_percentage: '_availableCapacityPercentage',
  date_created: '_dateCreated',
  date_updated: '_dateUpdated'
};

// Properties that need updating for the Reservation
const RESERVATION_PROPERTIES = {
  task_sid: '_taskSid',
  worker_sid: '_workerSid',
  worker_name: '_workerName',
  reservation_status: '_status',
  task_channel_sid: '_taskChannelSid',
  task_channel_unique_name: '_taskChannelUniqueName',
  date_created: '_dateCreated',
  date_updated: '_dateUpdated'
};

// Properties that need updating for the Task
const TASK_PROPERTIES = {
  sid: '_sid',
  workflow_sid: '_workflowSid',
  workflow_friendly_name: '_workflowName',
  task_queue_sid: '_taskQueueSid',
  task_queue_friendly_name: '_taskQueueName',
  task_channel_sid: '_taskChannelSid',
  task_channel_unique_name: '_taskChannelUniqueName',
  assignment_status: '_status',
  attributes: '_attributes',
  addons: '_addons',
  age: '_age',
  priority: '_priority',
  reason: '_reason',
  timeout: '_timeout',
  date_created: '_dateCreated',
  date_updated: '_dateUpdated',
};

// Properties that need updating for the Worker
const WORKER_PROPERTIES = {
  friendly_name: '_name',
  attributes: '_attributes',
  date_created: '_dateCreated',
  date_updated: '_dateUpdated',
  date_status_changed: '_dateStatusChanged'
};

module.exports.taskRouterProperties = {
  activity: ACTIVITY_PROPERTIES,
  channel: CHANNEL_PROPERTIES,
  task: TASK_PROPERTIES,
  reservation: RESERVATION_PROPERTIES,
  worker: WORKER_PROPERTIES
};

// List of API response properties that require new Date(unformatedDate) conversion
module.exports.needsDateTransfiguration = new Set(['date_created', 'date_updated', 'date_status_changed']);

// List of API response properties that require JSON parse conversion
module.exports.needsJSONTransfiguration = new Set(['attributes', 'addons']);

// Define common set of Twilio errors
const TwilioError = require('./twilioerror');
const errors = [
  { name: 'INVALID_ARGUMENT', message: 'One or more arguments passed were invalid.' },
  { name: 'INVALID_TOKEN', message: 'The token is invalid or malformed.' },

  { name: 'TOKEN_EXPIRED', message: 'Worker\'s active token has expired.' },

  { name: 'GATEWAY_CONNECTION_FAILED', message: 'Could not connect to Twilio\'s servers.' },
  { name: 'GATEWAY_DISCONNECTED', message: 'Connection to Twilio\'s servers was lost.' },
  { name: 'INVALID_GATEWAY_MESSAGE', message: 'The JSON message received was malformed.'},

  { name: 'TASKROUTER_ERROR', message: 'TaskRouter failed to completed the request.'}
];

module.exports.twilioErrors = errors.reduce(function(errs, error) {
  errs[error.name] = new TwilioError(error);
  return errs;
}, { });
