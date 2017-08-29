
const fs = require('fs');
const path = require('path');

const AuthKeys = require('./AuthKeys');

const KEY_DIR = path.join( process.env.PWD, 'keys' );

class SshUser{
  constructor( username, authKeys ){
    this.username = username;
    this.authKeys = authKeys;
  }
}

class KeyDb{
  constructor(){
    this.users = {};
    this.loadKeys();
    this.indexUsers();

  }

  indexUsers(){
    const userIndex = {};
    Object.entries(this.users)
    .forEach( function([ username, user ]){
      user.authKeys.lines.forEach(function(key){
        userIndex[ key.id ] = username;
      });
    });
    this.userIndex = userIndex;
  }

  loadKeys(){
    const users = this.users;
    fs.readdirSync( KEY_DIR )
      .forEach(function( fname ){
        if( fname[ 0 ] === '.' ){
          return;
        }
        const userKeys = new AuthKeys( fs.readFileSync( path.join( KEY_DIR, fname ), 'utf-8' ) );
        const user = new SshUser( fname, userKeys );
        users[ user.username ] = user;
      });

    return users;
  }

  getUsernameByKey( keyId ){
    return this.userIndex[ keyId ];
  }

  getUserKeys( username ){
    return this.users[ username ].authKeys;
  }

  authKeysToUsernames( authKeys ){
    const usernames = [];
    authKeys.lines.forEach( line => {
      const user = this.getUsernameByKey( line.id ) || line.toString();
      if( usernames.indexOf( user ) === -1 ){
        usernames.push( user );
      }
    });
    return usernames;
  }
}



module.exports = new KeyDb();
