var fs = require('fs');
var path = require('path');
var request = require('request');

var html = render();

module.exports = function (req, res) {
   // input validation
   req.params.email = req.params.email.toLowerCase();

   req.params.first = req.params.first[0].toUpperCase() 
                      + req.params.first.substring(1).toLowerCase();

   req.params.last = req.params.last[0].toUpperCase() 
                      + req.params.last.substring(1).toLowerCase();

   req.params.username = req.params.username.toLowerCase();

   // check email for UNCC address
   var isValidEmail = req.params.email.match(/^[a-zA-Z0-9]*@uncc\.edu$/);

   // handle unathorized
   if (!isValidEmail) return res.sendStatus(401);

   // generate random code
   var code = Math.random().toString(36).substring(2);

   // verify username is valid with Mojang   
   verifyUsername(() => {
      // ensure no other user already claimed this username
      verifyUniqueUsername(() => {
         // save valid credentials to staging database
         saveToDatabase(() => {
            // send email to user to verify email address
            sendEmail();
         });
      });
   });

   // add user to staging list
   function saveToDatabase (callback) {
      AWS.client.put({
         TableName: 'whitelist-unverified',
         Item: {
            code,
            date: (new Date()).getTime(),
            email: req.params.email,
            first: req.params.first,
            last: req.params.last,
            username: req.params.username,
         }
      }, (err) => {
         err ? res.sendStatus(500) : callback();
      });
   }

   // send code to move to whitelist
   function sendEmail () {
      AWS.ses.sendEmail({
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

   function verifyUsername (callback) {
      request(`https://api.mojang.com/users/profiles/minecraft/${req.params.username}`, (err, outRes, body) => {
         if (outRes.statusCode == 204) return res.sendStatus(406); // not acceptable
         callback();
      });
   }

   // check unique username
   function verifyUniqueUsername (callback) {
      AWS.client.scan({
         TableName : 'whitelist',
         Key: {
            'username': req.params.username
         }
      }, (err, data) => {
         // internal error
         if (err) return res.sendStatus(500);

         // no match or same user email
         if (!data.Count || data.Items[0].email === req.params.email) 
            return callback();
         
         // else
         res.sendStatus(409); // HTTP conflict
      });
   }
}

function render () {
   var views = path.join(__dirname, '../views/');

   var html = fs.readFileSync(path.join(views, 'email.html'));
   var css = fs.readFileSync(path.join(views, 'email.css'));

   return html.toString().replace('@css', css.toString());
}
