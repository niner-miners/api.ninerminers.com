const ONE_DAY = 86400000;

module.exports = function () {
   AWS.client.scan({
      TableName: 'whitelist-unverified',
      FilterExpression: '#date <= :yesterday',
      ExpressionAttributeNames:{
        "#date": "date"
      },
      ExpressionAttributeValues: {
         ':yesterday': ((new Date()).getTime() - ONE_DAY)
      }
   }, (err, data) => {
      data.Items.forEach((item) => {
         AWS.client.delete({
            TableName: 'whitelist-unverified',
            Key: {
               code: item.code
            }
         }, () => {
            // done
         });
      });
   });
}