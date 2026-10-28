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
    // `entries` preserves the structure of the source file verbatim: comment
    // lines ( including commented-out keys ), blank lines and the order of
    // all entries, along with the key lines. `lines` and `keyIndex` are
    // derived from it and contain key lines only.
    const rawLines = ( buf || '' ).split(/\r?\n/);
    if( rawLines.length === 1 && rawLines[ 0 ] === '' ){
      rawLines.pop(); // empty file
    }
    this.entries = rawLines.map(function( raw, lineNo ){
      const trimmed = raw.trim();
      if( trimmed !== '' && !trimmed.startsWith('#') ){
        return new AuthKeyLine( raw, lineNo );
      }
      return raw; // comment line or blank line, kept as-is
    });
    this.indexLines();
  }

  indexLines(){
    this.lines = this.entries.filter( entry => entry instanceof AuthKeyLine );
    const keyIndex = {};
    this.lines.forEach(function(line){
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
      this.entries.push( keyLine );
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
      this.entries.splice( this.entries.indexOf( existing ), 1 );
      this.indexLines();
    }
  }

  toFile(){
    return this.entries
      .map( entry => entry instanceof AuthKeyLine ? entry.fullLine : entry )
      .join('\n');
  }

}

module.exports = AuthKeys;
