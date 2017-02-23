'use strict';

const Twilio = require('twilio');
const AccessToken = Twilio.jwt.AccessToken;
const TaskRouterGrant = AccessToken.TaskRouterGrant;

module.exports.getAccessToken = function(accountSid, authToken, workspaceSid, workerSid, expirationTime) {
  const client = new Twilio(accountSid, authToken);

  const identity = "ccis@twilio.com";
  const taskRouterGrant = new TaskRouterGrant({
    workerSid: workerSid,
    workspaceSid: workspaceSid,
    role: 'worker'
  });

  return client.account.newKeys.create().then((key) => {
    // create access token with the specified ttl in seconds (defaults to 3600 sec)
    const accessToken = new AccessToken(accountSid, key.sid, key.secret, { ttl: expirationTime });

    accessToken.addGrant(taskRouterGrant);
    accessToken.identity = identity;

    return Promise.resolve(accessToken.toJwt());
  });
};
