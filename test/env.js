'use strict';

// Pre-populate with test.json if it exists.
var env = {};
try {
  env = require('../test.json');
} catch (error) {
  // Do nothing.
}

// Copy environment variables
[
  ['ACCOUNT_SID',               'accountSid'],
  ['AUTH_TOKEN',                'authToken'],
  ['SIGNING_KEY_SID',           'signingKeySid'],
  ['SIGNING_KEY_SECRET',        'signingKeySecret'],

  ['NON_MULTI_WORKSPACE_SID',   'nonMultiTaskWorkspaceSid'],
  ['NON_MULTI_WORKFLOW_SID',    'nonMultiTaskWorkflowSid'],
  ['NON_MULTI_ALICE_SID',       'nonMultiTaskAliceSid'],
  ['NON_MULTI_BOB_SID',         'nonMultiTaskBobSid'],
  ['NON_MULTI_CONNECT_SID',     'nonMultiTaskConnectActivitySid'],
  ['NON_MULTI_DISCONNECT_SID',  'nonMultiTaskDisconnectActivitySid'],

  ['MULTI_WORKSPACE_SID',       'multiTaskWorkspaceSid'],
  ['MULTI_WORKFLOW_SID',        'multiTaskWorkflowSid'],
  ['MULTI_ALICE_SID',           'multiTaskAliceSid'],
  ['MULTI_BOB_SID',             'multiTaskBobSid'],
  ['MULTI_CONNECT_SID',         'multiTaskConnectActivitySid'],
  ['MULTI_DISCONNECT_SID',      'multiTaskDisconnectActivitySid']
].forEach(function forEachKeyPair(keyPair) {
  var processEnvKey = keyPair[0];
  var envKey = keyPair[1];
  if (processEnvKey in process.env) {
    env[envKey] = process.env[processEnvKey];
  }
});

// Ensure required variables are present
[
  'accountSid',
  'authToken',
  'signingKeySid',
  'signingKeySecret',
  'nonMultiTaskWorkspaceSid',
  'nonMultiTaskWorkflowSid',
  'nonMultiTaskAliceSid',
  'nonMultiTaskBobSid',
  'nonMultiTaskConnectActivitySid',
  'nonMultiTaskDisconnectActivitySid',
  'multiTaskWorkspaceSid',
  'multiTaskWorkflowSid',
  'multiTaskAliceSid',
  'multiTaskBobSid',
  'multiTaskConnectActivitySid',
  'multiTaskDisconnectActivitySid'
].forEach(function forEachRequiredKey(key) {
  if (!(key in env)) {
    throw new Error('Missing ' + key);
  }
});

module.exports = env;
