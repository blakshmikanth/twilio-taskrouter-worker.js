'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');

const Configuration = require('../../../lib/util/configuration');
const credentials = require('../../env');
const Errors = require('../../../lib/util/constants').twilioErrors;
const fakePayloads = require('../../util/fakeWorkerResponses').fakePayloads;
const JWT = require('../../util/makeAccessToken');
const Logger = require('../../../lib/util/logger');
const Worker = require('../../../lib/worker');

describe('Activity', function() {

  let token = JWT.getAccessToken(credentials.accountSid, credentials.nonMultiTaskWorkspaceSid, credentials.nonMultiTaskAliceSid);

  describe('#setAsCurrent', function() {
    it('should set this particular activity as the current of the Worker', function() {
      this.timeout(5000);
      
      const worker = new Worker(token, { connectActivitySid: credentials.nonMultiTaskConnectActivitySid });

      let idleActivity;
      let readyActivity;

      return new Promise(function(resolve) {
        worker.on('ready', resolve);
      }).then(function() {
        assert.isNotNull(worker.activities);

        worker.activities.forEach(function(activity) {
          if (activity.name === 'Idle') {
            idleActivity = activity;
          }
          if (activity.name === 'Ready') {
            readyActivity = activity;
          }
        });

        assert.equal(worker.activity, readyActivity);
        return idleActivity.setAsCurrent();
      }).then(function(updatedActivity) {
        assert.equal(worker.activity, idleActivity);
        assert.equal(worker.activity, updatedActivity);
        assert.isTrue(idleActivity.isCurrent);
        assert.isFalse(readyActivity.isCurrent);
      });
    });
  });
});
