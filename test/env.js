'use strict';

// ccis@twilio.com Worker SDK account
const nonMultiTaskEnv = {
  AccountSid: '',
  AuthToken: '',
  WorkspaceSid: '',
  WorkflowSid: '',
  WorkerAlice: '',
  WorkerBob: '',
  ConnectActivitySid: '',
  DisconnectActivitySid: ''
};

const multiTaskEnv = {
  AccountSid: '',
  AuthToken: '',
  WorkspaceSid: '',
  WorkerAlice: '',
  WorkerBob: '',
  ConnectActivitySid: '',
  DisconnectActivitySid: ''
};

const env = { NonMultiTask: nonMultiTaskEnv, MultiTask: multiTaskEnv };
module.exports = env;
