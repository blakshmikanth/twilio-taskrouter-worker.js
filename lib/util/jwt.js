'use strict';

const Twilio = require('twilio');

function memoize(fn) {
  return function() {
    const args = Array.prototype.slice.call(arguments, 0);
    fn.memo = fn.memo || {};

    if (!fn.memo[args]) {
      fn.memo[args] = fn.apply(null, args);
    }
    return fn.memo[args];

  };
}

function decodePayload(encodedPayload) {
  const remainder = encodedPayload.length % 4;
  if (remainder > 0) {
    const padlen = 4 - remainder;
    encodedPayload += new Array(padlen + 1).join('=');
  }
  encodedPayload = encodedPayload.replace(/-/g, '+')
                                   .replace(/_/g, '/');
  const decodedPayload = _atob(encodedPayload);
  return JSON.parse(decodedPayload);
}

const memoizedDecodePayload = memoize(decodePayload);

/**
* Decodes a token.
*
* @name decode
* @exports decode as Twilio.decode
* @memberOf Twilio
* @function
* @param {string} token The JWT
* @return {object} The payload
*/
function decode(token) {
  const segs = token.split('.');
  if (segs.length !== 3) {
    throw new Error('Wrong number of segments');
  }
  const encodedPayload = segs[1];
  const payload = memoizedDecodePayload(encodedPayload);
  return payload;
}

/**
* Wrapper for atob.
*
* @name atob
* @exports _atob as Twilio.atob
* @memberOf Twilio
* @function
* @param {string} encoded The encoded string
* @return {string} The decoded string
*/
function _atob(encoded) {
  try {
    return atob(encoded);
  } catch (e) {
    try {
      return new Buffer(encoded, 'base64').toString('ascii');
    } catch (f) {
      return Twilio._phpjs_atob(encoded);
    }
  }
}

function objectize(token) {
  const jwt = decode(token);
  return jwt;
}

const memoizedObjectize = memoize(objectize);

exports.decode = decode;
exports.atob = _atob;
exports.objectize = memoizedObjectize;
