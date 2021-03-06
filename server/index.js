var email = require('./email');
var expire = require('./expire');
var express = require('express');
var path = require('path');
var schedule = require('node-schedule');
var whitelist = require('./whitelist');

// save AWS config to the global scope
global.AWS = require('./aws');

// save Minecraft command to global function
global.command = require('./command');

// create routers
var app = express();
var api = express.Router();

// set top level routes
app.use('/api/', api);

// configure API endpoints
api.post('/new/:email/:first/:last/:username/', email);
api.post('/whitelist/:code/', whitelist);

// start server
var PORT = (process.env.API_PORT || 3000);
app.listen(PORT, () => {
   console.log(`Server starting at http://localhost:${PORT}`)
});

// expire old tokens
schedule.scheduleJob('0 0 * * *', expire);