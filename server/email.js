var AWS = require('aws-sdk');
var fs = require('fs');
var path = require('path');

var ses, client; // AWS
var html;

debug();
configure();
content();

module.exports = function (req, res) {
   // input validation
   req.params.email = req.params.email.toLowerCase();

   req.params.first = req.params.first[0].toUpperCase() 
                      + req.params.first.substring(1).toLowerCase();

   req.params.last = req.params.last[0].toUpperCase() 
                      + req.params.last.substring(1).toLowerCase();

   // check email for UNCC address
   var isValidEmail = req.params.email.match(/^[a-zA-Z]+@uncc\.edu$/);

   // handle unathorized
   if (!isValidEmail) return res.sendStatus(401);

   // generate random code
   var code = Math.random().toString(36).substring(2);

   saveToDatabase();

   // add user to staging list
   function saveToDatabase () {
      client.put({
         TableName: 'whitelist-unverified',
         Item: {
            code,
            date: (new Date()).toString(),
            email: req.params.email,
            first: req.params.first,
            last: req.params.last,
            username: req.params.username,
         }
      }, (err) => {
         err ? res.sendStatus(500) : sendEmail();
      });
   }

   // send code to move to whitelist
   function sendEmail () {
      ses.sendEmail({
         Source: 'Niner Miners <whitelist@ninerminers.com>',
         Destination: {
            ToAddresses: [ req.params.email ]
         },
         Message: {
            Subject: {
               Data: 'Whitelist Confirmation'
            },
            Body: {
               Html: {
                  Data: html.replace(/@code/g, code)
               }
            }
         }
      }, (err) => {
         res.sendStatus(err ? 500 : 200);
      });
   }

}

function configure () {
   AWS.config.region = 'us-east-1';
   ses = new AWS.SES({apiVersion: '2010-12-01'});
   client = new AWS.DynamoDB.DocumentClient();
}

function content () {
   var views = path.join(__dirname, '../views/');

   fs.readFile(path.join(views, 'email.html'), (err, rawHTML) => {
      fs.readFile(path.join(views, 'email.css'), (err, rawCSS) => {
         html = rawHTML.toString()
            .replace('@css', rawCSS.toString());
      });
   });
}

function debug () {
   AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'niner-miners'});
}