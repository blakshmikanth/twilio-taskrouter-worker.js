'use strict';

const constants = require('./util/constants');
const Errors = constants.twilioErrors;
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const Logger = require('./util/logger');
const Request = require('./util/request');
const tools = require('./util/tools');

/**
 * Construct a {@link Task}.
 * @class
 * @classdesc A {@link Task} represents an item of work
 * @param {Object} payload - The payload representing the {@link Task}
 * @param {Configuration} config - The {@link Configuration} of the {@link Worker}
 * @property {string} accountSid - The sid of the Twilio account
 * @property {int} age - The age of the {@link Task} in seconds
 * @property {Object} attributes - The attributes of the {@link Task}
 * @property {Date} dateCreated - The date the {@link Task} was created
 * @property {Date} dateUpdated - The date the {@link Task} was last updated
 * @property {int} priority - The priority of the {@link Task}
 * @property {string} reason - The reason the {@link Task} was completed or canceled, if applicable
 * @property {string} sid - The sid of the {@link Task}
 * @property {string} status - The status of the {@link Task}
 * @property {string} taskChannelSid - The sid of the Task Channel associated to the {@link Task} in MultiTask mode
 * @property {string} taskChannelUniqueName - The unique name of the Task Channel associated to the {@link Task} in MultiTask mode
 * @property {string} taskQueueName - The friendly name of the TaskQueue the {@link Task} is currently in
 * @property {string} taskQueueSid - The sid of the TaskQueue the {@link Task} is currently in
 * @property {int} timeout - The number of seconds the {@link Task} is allowed to live
 * @property {string} workflowName - The name of the Workflow responsible for routing the {@link Task}
 * @property {string} workflowSid - The sid of the Workflow responsible for routing the {@link Task}
 * @property {string} workspaceSid - The sid of the Workspace owning this {@link Task}
 */
function Task(payload, config) {
  if (!payload) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Task: <Object>payload is a required parameter.');
  }

  if (!config) {
    throw Errors.INVALID_ARGUMENT.clone('Error instantiating Task: <Configuration>config is a required parameter.');
  }

  // verify the JWT token before proceeding
  const jwt = tools.verifyJWT(config.token);

  // instantiate logger
  const log = new Logger('Task', { logLevel: config.logLevel });

  const accountSid = jwt.sub;
  const workerSid = jwt.grants.task_router.worker_sid;
  const workspaceSid = jwt.grants.task_router.workspace_sid;

  payload = payload || {};

  Object.defineProperties(this, {
    _addons: {
      value: JSON.parse(payload.addons),
      writable: true
    },
    _age: {
      value: payload.age,
      writable: true
    },
    _attributes: {
      value: JSON.parse(payload.attributes),
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
    _priority: {
      value: payload.priority,
      writable: true
    },
    _reason: {
      value: payload.reason,
      writable: true
    },
    _sid: {
      value: payload.sid,
      writable: true
    },
    _status: {
      value: payload.assignment_status,
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
    _taskQueueName: {
      value: payload.task_queue_friendly_name,
      writable: true
    },
    _taskQueueSid: {
      value: payload.task_queue_sid,
      writable: true
    },
    _timeout: {
      value: payload.timeout,
      writable: true
    },
    _workerSid: {
      value: workerSid,
      enumerable: false
    },
    _workflowName: {
      value: payload.workflow_friendly_name,
      writable: true
    },
    _workflowSid: {
      value: payload.workflow_sid,
      writable: true
    },
    accountSid: {
      enumerable: true,
      value: accountSid
    },
    addons: {
      enumerable: true,
      get: function() {
        return this._addons;
      }
    },
    age: {
      enumerable: true,
      get: function() {
        return this._age;
      }
    },
    attributes: {
      enumerable: true,
      get: function() {
        return this._attributes;
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
    priority: {
      enumerable: true,
      get: function() {
        return this._priority;
      }
    },
    reason: {
      enumerable: true,
      get: function() {
        return this._reason;
      }
    },
    sid: {
      enumerable: true,
      get: function() {
        return this._sid;
      }
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
    taskQueueName: {
      enumerable: true,
      get: function() {
        return this._taskQueueName;
      }
    },
    taskQueueSid: {
      enumerable: true,
      get: function() {
        return this._taskQueueSid;
      }
    },
    timeout: {
      enumerable: true,
      get: function() {
        return this._timeout;
      }
    },
    workflowName: {
      enumerable: true,
      get: function() {
        return this._workflowName;
      }
    },
    workflowSid: {
      enumerable: true,
      get: function() {
        return this._workflowSid;
      }
    },
    workspaceSid: {
      enumerable: true,
      value: workspaceSid
    }
  });
}

inherits(Task, EventEmitter);

/**
 * Update the {@link Task} status to 'completed'
 * @param {string} - The reason for completing the {@link Task}
 * @return {Promise<this>} - Rejected if the {@link Task} state could not be updated to 'completed'
 */
Task.prototype.complete = function complete(reason) {
  if (!reason) {
    throw Errors.INVALID_ARGUMENT.clone('A reason must be provided to move a Task to the \'Completed\' state. <string>reason is a required parameter.');
  }

  let requestURL = this._config.TR_SERVER + '/Tasks/' + this.sid;

  let requestParams = {
    AssignmentStatus: 'completed',
    Reason: reason
  };

  let request = {
    url: requestURL,
    method: 'POST',
    params: requestParams,
    event_type: 'taskCompleted',    // eslint-disable-line camelcase
    token: this._config.token
  };

  const self = this;
  return Request.post(this._config.EB_SERVER, request).then(function(payload) {
    return tools.updateProperties(self, payload, 'task');
  });
};

module.exports = Task;
