#!/usr/bin/env node

const program = require('commander');
const keyDb = require('../src/keyDb');
const Bluebird = require('bluebird');
const path = require('path');
const Server = require('../src/Server');
const selfPackage = require('../package.json');
const { log } = require('../src/utils');

const opts = program
  .version( selfPackage.version )
  .option('-a, --list-all', 'List available servers and users')
  .option('-c, --config [ ./servers.js ]', 'File exports hashmap of { servername: [ "user@host", optionalPort ]}')
  .option('-n, --server-name [ testserver ]', 'Comma separated list of server names to operate')
  .option('-l, --list', 'List allowed users in all the servers')
  .option('-g, --grant [ user1 ]', 'Grant access to comma separated list of users')
  .option('-r, --revoke [ user1 ]', 'Revoke access of comma separated list of users')
  .option('-s, --set-access [ user1 ]', 'Set access to comma separated list of users only')
  .parse(process.argv);


const servers  = require( path.resolve( opts.config || './servers' ) );
const selectedServers = opts.serverName ? opts.serverName.split(',') : servers.map( v => v.name );


function runAction( method, arg ){
  const task = {};
  servers.forEach(function( srvData ){
    if( selectedServers.indexOf( srvData.name ) === -1 ){
      return ;
    }
    const server = new Server( srvData );
    const taskPromise = arg ? server[ method ]( arg ) : server[ method ]();
    task[ srvData.name ] = taskPromise
      .catch(function(){
        log( 'failed to connet to server ', srvData.name, srvData.host  );
        return '-- Failed  to connect --';
      });
  });
  return Bluebird.props( task )
    .then(function( items ){
      console.log( items );
    });
}


function listAll(){
  console.log( 'Server list');
  console.log( '-----------');
  console.log( servers.map( v=> v.name ) );
  console.log( '\n' );
  console.log('User list');
  console.log('---------');
  console.log( Object.keys(keyDb.users));
}

if( require.main === module ){
  if( opts.list ){
    return runAction( 'listAccess' );
  } else if( opts.grant ){
    return runAction( 'grantAccess', opts.grant.split(',' ));
  } else if( opts.listAll ){
    return listAll();
  } else if( opts.setAccess ){
    return runAction( 'setAccess', opts.setAccess.split(',' ));
  } else if( opts.revoke ){
    return runAction( 'revokeAccess', opts.revoke.split(',' ));
  } else {
    opts.help();
  }
}
