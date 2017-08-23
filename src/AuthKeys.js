/* ഓം ബ്രഹ്മാർപ്പണം. */

/*
 * src/AuthKeys.js
 * Created: Wed Aug 23 2017 13:15:39 GMT+0530 (IST)
 * Copyright 2017 Harish.K<harish2704@gmail.com>
 */

const AuthKeyLine = require('./AuthKeyLine');
const { log } = require('./utils');
class AuthKeys{

  constructor( buf ){
    const lines = buf.split('\n').filter( Boolean ).map( AuthKeyLine.create );
    this.lines = lines;
    this.indexLines();
  }

  indexLines(){
    const keyIndex = {};
    this.lines
      .forEach(function(line){
        keyIndex[ line.id ] = line;
      });
    this.keyIndex = keyIndex;
  }

  addAccess( keyLine ){
    if( Array.isArray( keyLine ) ){
      return keyLine.forEach( v => this.addAccess(v) );
    }
    const existing = this.keyIndex[ keyLine.id ];
    if( !existing ){
      this.lines.push( keyLine );
      this.indexLines();
    }
  }

  removeKey( keyLine ){
    if( Array.isArray( keyLine ) ){
      return keyLine.forEach( v => this.removeKey(v) );
    }
    log( 'Searching key', keyLine.id );
    const existing = this.keyIndex[ keyLine.id ];
    if( existing ){
      log( 'Found existing key ', existing.id  );
      this.lines.splice( this.lines.indexOf( existing ), 1 );
      this.indexLines();
    }
  }

  toFile(){
    return this.lines.map( v=>v.fullLine ).join('\n');
  }

}

module.exports = AuthKeys;
