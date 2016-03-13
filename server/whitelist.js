var cp = require('child_process');

const EXEC = '/home/nick/Desktop/niner-miners/core/actions/exec';

module.exports = function (req, res) {
   var query = {
         TableName: 'whitelist-unverified',
         Key: {
            code: req.params.code
         }
      }

   AWS.client.scan(query, (err, data) => {
      if (err || !data.Count) 
         return res.sendStatus(500);

      // pass verified user
      addToWhitelist(data.Items[0]);
   });

   function addToWhitelist (user) {
      AWS.client.put({
         TableName: 'whitelist',
         Item: {
            email: user.email,
            first: user.first,
            last: user.last,
            username: user.username
         }
      }, (err) => {
         if (err) return res.sendStatus(500);

         // unwhitelist old username
         removeOldFromWhitelist(user.email, () => {
            // continue to add new to whitelist
            cp.exec(`echo ${EXEC} whitelist add ${user.username}`, deleteToken);
         });
      });
   }

   // returns username of old
   function removeOldFromWhitelist (email, callback) {
      AWS.client.query({
         TableName : 'whitelist',
         Key: {
            'email': email
         }
      }, (err, data) => {
         if (err || !data.Count) 
            return callback();
         
         var user = data.Items[0];

         cp.exec(`echo ${EXEC} whitelist remove ${user.username}`, callback);
      });
   }

   // complete transfer from unverified to whitelist
   function deleteToken () {
      AWS.client.delete(query, (err) => {
         res.sendStatus(err ? 500 : 200);
      });
   }
}