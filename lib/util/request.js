'use strict';

const XHR = require('xmlhttprequest').XMLHttpRequest;
const Errors = require('./constants').twilioErrors;

function request(method, url, params) {

  return new Promise(function(resolve, reject) {
    const xhr = new XHR();

    xhr.open(method, url, true);

    xhr.onload = function onload() {

      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const responseJSON = JSON.parse(xhr.responseText);
          const payload = responseJSON.payload;

          resolve(payload);

        } else if (xhr.status === 400) {
          reject(Errors.TASKROUTER_ERROR.clone('Failed to parse JSON.'));
        } else if (xhr.status === 401) {
          reject(Errors.INVALID_TOKEN.clone('JWT token has expired. Update token.'));
        } else if (xhr.status === 403) {
          reject(Errors.INVALID_TOKEN.clone('Problems verifiying JWT token during request to Twilio server. Invalid JWT or Access Policy.'));
        } else if (xhr.status === 404) {
          reject(Errors.TASKROUTER_ERROR.clone('Invalid endpoint.'));
        } else if (xhr.status === 500) {
          reject(Errors.TASKROUTER_ERROR.clone('Internal error occured.'));
        } else {
          reject(Errors.TASKROUTER_ERROR.clone('Error making request.'));
        }
      }
    };

    xhr.timeout = 5000;

    xhr.send(params);
  });
}

const Request = request;

Request.post = function post(url, params) {
  return request('POST', url, JSON.stringify(params));
};

module.exports = Request;
