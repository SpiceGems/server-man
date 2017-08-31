#!/usr/bin/env node

const program = require('commander');
const columnify = require('columnify');
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
  .option('-j, --json', 'Print result as json object instead of table format')
  .option('-U, --update [ ./acl.js ]', 'set access on all servers as specified in acl.js')
  .parse(process.argv);


const servers  = require( path.resolve( opts.config || './servers' ) );
const selectedServers = opts.serverName ? opts.serverName.split(',') : servers.map( v => v.name );
const acl = {};
if( opts.update ){
  Object.assign( acl, require( path.resolve( './acl' ) ) );
}


function runAction( method, arg ){
  const task = {};
  servers.forEach(function( srvData ){
    if( selectedServers.indexOf( srvData.name ) === -1 ){
      return ;
    }
    const server = new Server( srvData );
    if( arg ){
      if( typeof arg === 'function' ){
        arg = arg( srvData );
      }
    }
    const taskPromise = arg ? server[ method ]( arg ) : server[ method ]();
    task[ srvData.name ] = taskPromise
      .catch(function(){
        log( 'failed to connet to server ', srvData.name, srvData.host  );
        return '-- Failed  to connect --';
      });
  });
  return Bluebird.props( task )
    .then(function( items ){
      if( opts.json ){
        items = JSON.stringify( items, null, 2 );
      } else {
        items = columnify( items );
      }
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
  }else if( opts.update ){
    return runAction( 'setAccess', server => acl[ server.name ] );
  } else {
    opts.help();
  }
}
