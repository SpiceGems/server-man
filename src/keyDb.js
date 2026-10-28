
const fs = require('fs');
const path = require('path');

const AuthKeys = require('./AuthKeys');
const { log } = require('./utils');

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
    fs.mkdirSync(KEY_DIR, { recursive: true });
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
    const user = this.users[ username ];
    if( !user ){
      // Unknown username ( e.g. a typo, or a full key line dumped by `listAccess` ).
      // Returning an empty key set keeps grant/ revoke a no-op instead of crashing.
      log( 'Unknown user', username );
      return new AuthKeys('');
    }
    return user.authKeys;
  }

  /**
   * Revoke access of every known user not present in `usernames`, leaving all
   * other entries of `authKeys` ( comments, commented-out keys, keys of unknown
   * users, restricted entries with options etc ) untouched.
   */
  revokeUnlistedUsers( authKeys, usernames ){
    Object.keys( this.users )
      .filter( username => usernames.indexOf( username ) === -1 )
      .forEach( username => authKeys.removeKey( this.getUserKeys( username ).lines ) );
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
