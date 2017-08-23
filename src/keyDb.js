
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
}



module.exports = new KeyDb();
