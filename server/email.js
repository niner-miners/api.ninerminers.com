var AWS = require('aws-sdk');
var fs = require('fs');
var path = require('path');

var ses, client; // AWS
var html;

debug();
configure();
content();

module.exports = function (req, res) {
   // ensure matching is correct
   req.params.email = req.params.email.toLowerCase();

   // check email for UNCC address
   var isValidEmail = req.params.email.match(/^[a-zA-Z]+@uncc\.edu$/);

   // handle unathorized
   if (!isValidEmail) return res.sendStatus(401);

   // generate random code
   var code = Math.random().toString(36).substring(2);

   saveToDatabase();

   function saveToDatabase () {
      var username_old;

      client.query({
         TableName: 'whitelist',
         KeyConditionExpression: "#email = :email",
         ExpressionAttributeNames:{
            "#email": "email"
         },
         ExpressionAttributeValues: {
            ":email": req.params.email
         }
      }, (err, data) => {
         // hande error
         if (err) return res.sendStatus(500);

         // save old username if user already exists
         if (data.Count) username_old = data.Items[0].username;
         
         client.put({
            TableName: 'whitelist',
            Item: {
               email: req.params.email,
               first: 'User',
               last: 'Smith',
               username: 'an_mc_user',
               username_old,
               verification: code
            }
         }, (err) => {
            err ? res.sendStatus(500) : sendEmail();
         });
      });
   }

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
         res.sendStatus(err ? 500 : 200)
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