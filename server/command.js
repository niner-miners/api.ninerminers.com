var cp = require('child_process');

var script = process.env.NODE_ENV === 'production' ? 
               process.env.MINECRAFT_COMMAND :
               '/home/nick/Desktop/niner-miners/core/actions/exec';

module.exports = function (args, callback) {
   cp.exec(`${script} ${args}`, () => {
      callback();
   });
}