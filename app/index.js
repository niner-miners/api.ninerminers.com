const express = require('express');

module.exports = function (options) {
  const app = express();

  app.get('/', (req, res) => res.send('hi') );

  return app;
}
