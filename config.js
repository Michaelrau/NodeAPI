if(typeof process.env.NODE_ENV != 'undefined')
{
  module.exports = require('./config.'+process.env.NODE_ENV+'.js');
}
else {
  module.exports = require('./config.PRO.js');
}
