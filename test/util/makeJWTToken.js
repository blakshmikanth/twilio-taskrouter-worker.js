'use strict';

const Twilio = require('twilio');

module.exports.getJWTToken = function(accountSid, authToken, workspaceSid, workerSid, env, expirationTime) {

    let capability;
    switch (env) {
        case 'prod':
            capability = new Twilio.TaskRouterWorkerCapability(accountSid, authToken, workspaceSid, workerSid);
            break;
        case 'stage':
            capability = new Twilio.TaskRouterWorkerCapability(accountSid, authToken, workspaceSid, workerSid,
                    'https://taskrouter.stage.twilio.com/v1', 'https://event-bridge.stage-us1.twilio.com/v1/wschannels');
            break;
        case 'dev':
            capability = new Twilio.TaskRouterWorkerCapability(accountSid, authToken, workspaceSid, workerSid,
                    'https://taskrouter.dev.twilio.com/v1', 'https://event-bridge.dev-us1.twilio.com/v1/wschannels');
            break;
    }

    capability.allowActivityUpdates();
    capability.allowReservationUpdates();
    capability.allowFetchSubresources();
    capability.allowUpdatesSubresources();

    let token;
    if (expirationTime) {
        token = capability.generate(expirationTime);
    } else {
        token = capability.generate();
    }

    return token;
};
