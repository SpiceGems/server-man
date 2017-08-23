
const Bluebird = require('bluebird');
var _exec = Bluebird.promisify( require('child_process').exec );
const crypto = require('crypto');

function exec( cmd, envVars ){
  return _exec( cmd, { env: envVars });
}

function uid(){
  return crypto.randomBytes(16).toString('hex');
}

function log( a, b, c ){
  // console.log( 'Log: ', a, b, c );
}

module.exports = {
  exec,
  uid,
  log,
};

