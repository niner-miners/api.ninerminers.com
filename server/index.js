var email = require('./email');
var express = require('express');
var whitelist = require('./whitelist');

// save AWS config to the global scope
global.AWS = require('./aws');

// create routers
var app = express();
var api = express.Router();

// set top level routes
app.use('/api/', api);

// configure API endpoints
api.post('/email/:email/:first/:last/:username/', email);
api.post('/whitelist/:code/', whitelist);

// start server
var PORT = (process.env.PORT || 3000);
app.listen(PORT, () => {
   console.log(`Server starting at http://localhost:${PORT}`)
});