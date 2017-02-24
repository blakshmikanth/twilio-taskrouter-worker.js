'use strict';

const Worker = require('./worker');
Worker.version = require('../package.json').version;

module.exports = Worker;
