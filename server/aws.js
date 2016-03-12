var aws = require('aws-sdk');

// DEBUG 
aws.config.credentials = new aws.SharedIniFileCredentials({ profile: 'niner-miners' });

// set config
aws.config.region = 'us-east-1';

// intialize services
module.exports = {
   client: new aws.DynamoDB.DocumentClient(),
   ses: new aws.SES()
}