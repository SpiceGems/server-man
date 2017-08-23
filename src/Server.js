/* ഓം ബ്രഹ്മാർപ്പണം. */

/*
 * src/Server.js
 * Created: Wed Aug 23 2017 12:29:38 GMT+0530 (IST)
 * Copyright 2017 Harish.K<harish2704@gmail.com>
 */

const keyDb = require('./keyDb');
const fs = require('fs');
const path = require('path');
const AuthKeys = require('./AuthKeys');
const { exec, uid, log } = require('./utils');

const TMP_DIR = path.join( process.env.PWD, 'temp' );
const AUTHORIZED_KEYS = '.ssh/authorized_keys';

if( !fs.existsSync( TMP_DIR ) ){
  fs.mkdirSync( TMP_DIR );
}

class Server{

  constructor( host, port ){
    this.sshHost = host;
    this.sshPort = port || 22;
    this.keyLoadingTask = this.getAuthorizedKeys()
    .then( file => {
      this.authKeys = new AuthKeys( file );
    });
  }

  getAuthorizedKeys(){
    return exec( `ssh -p ${this.sshPort} ${this.sshHost} "mkdir -p .ssh && touch ${AUTHORIZED_KEYS} && cat ${AUTHORIZED_KEYS}"` );
  }

  async writeAuthKeys(){
    const tempFname = uid();
    const tempFile = path.join( TMP_DIR, tempFname );

    fs.writeFileSync( tempFile, this.authKeys.toFile() );
    const cmd = `scp -P ${this.sshPort} ${tempFile} ${this.sshHost}:${AUTHORIZED_KEYS}`;
    return exec( cmd )
    .tap(() => fs.rmFileSync(tempFile) );
  }

  async listAccess(){
    await this.keyLoadingTask;
    const users = [];
    this.authKeys.lines.map(function( line ){
      const user = keyDb.getUsernameByKey( line.id ) || line.toString();
      if( users.indexOf( user ) === -1 ){
        users.push( user );
      }
    });
    return users;
  }

  async revokeAccess( usernames ){
    if( !Array.isArray( usernames ) ){
      usernames = [ usernames ];
    }
    await this.keyLoadingTask;
    usernames.forEach( username =>{
      const userKeys = keyDb.getUserKeys( username );
      log( 'Revoking access for', userKeys.lines.length, username );
      this.authKeys.removeKey( userKeys.lines );
    });
    await this.writeAuthKeys();
  }

  async grantAccess( usernames ){
    if( !Array.isArray( usernames ) ){
      usernames = [ usernames ];
    }
    await this.keyLoadingTask;
    usernames.forEach( username =>{
      const userKeys = keyDb.getUserKeys( username );
      this.authKeys.addAccess( userKeys.lines );
    });
    await this.writeAuthKeys();
  }

}

module.exports = Server;
