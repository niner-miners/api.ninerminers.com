var express = require('express');
var email = require('./email');
var whitelist = require('./whitelist');

var app = express();
var api = express.Router();

app.use('/api/', api);
api.post('/email/:email/:first/:last/:username/', email);
api.post('/whitelist/:code/', whitelist);

app.listen(process.env.PORT || 3000);