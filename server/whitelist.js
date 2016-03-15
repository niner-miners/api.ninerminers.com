var cp = require('child_process');

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

      var user = data.Items[0];

      // check for old credentials, update / create
      removeOldUsername(user, () => {
         addToWhitelist(user, deleteToken);
      });
   });

   function addToWhitelist (user, callback) {
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
         command(`whitelist add ${user.username}`, callback);
      });
   }

   // returns username of old
   function removeOldUsername (user, callback) {
      AWS.client.scan({
         TableName : 'whitelist',
         Key: {
            'email': user.email
         }
      }, (err, data) => {
         if (err) return res.sendStatus(500);
         if (!data.Count) return callback();
         
         var user = data.Items[0];
         
         command(`whitelist remove ${user.username}`, callback);
      });
   }

   // complete transfer from unverified to whitelist
   function deleteToken () {
      AWS.client.delete(query, (err) => {
         res.sendStatus(err ? 500 : 200);
      });
   }
}