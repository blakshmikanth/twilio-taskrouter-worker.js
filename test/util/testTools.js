'use strict';

const Twilio = require('twilio');

module.exports.createTask = function(accountSid, authToken, workspaceSid, workflowSid, attributes) {
  const client = new Twilio(accountSid, authToken);

  return client.taskrouter.v1.workspaces(workspaceSid).tasks.create({ workflowSid: workflowSid, attributes: attributes });
};

module.exports.deleteTask = function(accountSid, authToken, workspaceSid, taskSid) {
  const client = new Twilio(accountSid, authToken);

  return client.taskrouter.v1.workspaces(workspaceSid).tasks(taskSid).remove();
};

module.exports.deleteAllTasks = function(accountSid, authToken, workspaceSid) {
  const client = new Twilio(accountSid, authToken);

  client.taskrouter.v1.workspaces(workspaceSid).tasks.list().then(function(tasks) {
    tasks.forEach(function(task) {
      task.remove();
    });
  });
};

module.exports.updateWorkerActivity = function(accountSid, authToken, workspaceSid, workerSid, activitySid) {
  const client = new Twilio(accountSid, authToken);

  return client.taskrouter.v1.workspaces(workspaceSid).workers(workerSid).update({ activitySid: activitySid });
};
