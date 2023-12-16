"use strict";

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/index.production.js');
} else {
  module.exports = require('./cjs/index.js');
}