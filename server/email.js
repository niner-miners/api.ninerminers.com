var AWS = require('aws-sdk');
var fs = require('fs');
var path = require('path');

var ses;
var html;

debug();
configure();
content();

module.exports = function (req, res) {
   // check email for UNCC address
   var isValidEmail = req.params.email.match(/^[a-zA-Z]+@uncc\.edu$/);

   // handle unathorized
   if (!isValidEmail) return res.sendStatus(401);

   var code = 'sada89y113ewdsadas';

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
      console.log(err);
      res.sendStatus(err ? 500 : 200)
   });

}

function configure () {
   AWS.config.region = 'us-east-1';
   ses = new AWS.SES({apiVersion: '2010-12-01'});
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