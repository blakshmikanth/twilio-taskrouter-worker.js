'use strict';

const Twilio = require('twilio');

module.exports.createTask = function(accountSid, authToken, workspaceSid, workflowSid, attributes) {
  const client = new Twilio.TaskRouterClient(accountSid, authToken, workspaceSid);

  return new Promise(function(resolve, reject) {
    client.workspace.tasks.create({
      attributes: JSON.stringify(attributes),
      workflowSid: workflowSid
    }, function(err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
};

module.exports.deleteTask = function(accountSid, authToken, workspaceSid, taskSid) {
  const client = new Twilio.TaskRouterClient(accountSid, authToken, workspaceSid);

  return new Promise(function(resolve, reject) {
    client.workspace.tasks(taskSid).delete(function(err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
};

module.exports.deleteAllTasks = function(accountSid, authToken, workspaceSid) {
  const client = new Twilio.TaskRouterClient(accountSid, authToken, workspaceSid);
  
  client.workspace.tasks.list(function(err, data) {
    if (data) {
      data.tasks.forEach(function(task) {
          client.workspace.tasks(task.sid).delete();
      });
    }
  });
};

module.exports.updateWorkerActivity = function(accountSid, authToken, workspaceSid, workerSid, activitySid) {
  const client = new Twilio.TaskRouterClient(accountSid, authToken, workspaceSid);

  return new Promise(function(resolve, reject) {
    client.workspace.workers(workerSid).update({
      activitySid: activitySid
    }, function(err, worker) {
      if (err) {
        reject(err);
      }
      resolve(worker);
    });
  });
};
