/* ഓം ബ്രഹ്മാർപ്പണം. */

/*
 * src/AuthKeyLine.js
 * Created: Wed Aug 23 2017 13:15:44 GMT+0530 (IST)
 * Copyright 2017 Harish.K<harish2704@gmail.com>
 */

/*
 * An authorized_keys entry has the format:
 *
 *   [options] key-type base64-key-blob [comment]
 *
 * `options` (when present) is a comma separated list of options, each being
 * either a flag (`no-port-forwarding`) or a key=value pair where the value may
 * be a double quoted string. Quoted strings can contain spaces, commas,
 * semicolons and backslash-escaped quotes ( `\"` ), e.g.:
 *
 *   no-port-forwarding,command="echo \"hi\"; sleep 10; exit 142" ssh-rsa AAAA.. comment
 */

// Every key type understood by OpenSSH, including certificate variants.
const KEY_TYPE_RE = /^(ssh-(?:rsa|dss|ed25519|xmss)(?:-cert-v01@openssh\.com)?|ecdsa-sha2-nistp(?:256|384|521)(?:-cert-v01@openssh\.com)?|sk-(?:ssh-ed25519|ecdsa-sha2-nistp256)@openssh\.com)$/;

// A long base64 blob, e.g. the key material of an ssh key.
const BASE64_BLOB_RE = /^[A-Za-z0-9+/]{40,}={0,3}$/;

const DELIM = '=,';

// `=`, `,` or any whitespace character terminates a bare token.
const isDelim = ( c ) => c === undefined || DELIM.includes( c ) || c <= ' ';

/**
 * Advance past a double quoted string starting at `pos` (which must point at
 * the opening quote). Handles backslash escaped characters. Returns the
 * position just after the closing quote, or end-of-line if unterminated.
 */
function readQuotedString( line, pos ){
  pos++; // skip the opening quote
  while( pos < line.length ){
    if( line[ pos ] === '\\' ){
      pos += 2;
    } else if( line[ pos ] === '"' ){
      return pos + 1;
    } else {
      pos++;
    }
  }
  return pos;
}

/**
 * Determine whether the bare word at `wordStart..pos` is the key type ( and
 * hence the end of the options section ) rather than just another option.
 */
function isKeyType( line, wordStart, pos ){
  const word = line.slice( wordStart, pos );
  if( KEY_TYPE_RE.test( word ) ){
    return true;
  }
  // Unknown/ future key types: a token followed by a base64 blob must be the
  // key type, since no real option is followed by a blob.
  const nextWord = line.slice( pos ).trim().split( /\s+/ )[ 0 ] || '';
  return BASE64_BLOB_RE.test( nextWord );
}

/**
 * Scan the leading comma separated options list ( if any ).
 * Returns the options string and the position where the key itself starts.
 */
function parseOptions( line ){
  let pos = 0;
  let optionsEnd = 0; // length of options confirmed so far ( past the last ',' )

  for( ;; ){
    const wordStart = pos;

    // Read an option name or key type, up to '=', ',' or whitespace.
    while( !isDelim( line[ pos ] ) ){
      pos++;
    }

    // key=value option. The value is either quoted or a bare token.
    if( line[ pos ] === '=' ){
      pos++;
      if( line[ pos ] === '"' ){
        pos = readQuotedString( line, pos );
      } else {
        while( !isDelim( line[ pos ] ) ){
          pos++;
        }
      }
    }

    if( line[ pos ] === ',' ){
      // A comma always means another option follows.
      pos++;
      optionsEnd = pos;
      continue;
    }

    // The item ended at whitespace ( or end of line ). If the bare word was
    // actually the key type, options stopped at the previous comma.
    if( pos < line.length && wordStart < pos && isKeyType( line, wordStart, pos ) ){
      return { options: line.slice( 0, optionsEnd ).trim(), pos: optionsEnd };
    }

    // Otherwise it was a trailing flag option ( e.g. "no-pty" ), or the line
    // has no options at all.
    optionsEnd = pos;
    return { options: line.slice( 0, optionsEnd ).trim(), pos: optionsEnd };
  }
}

/**
 * Parse the portion after the options into key type, key blob and comment.
 */
function parseKey( line, pos ){
  const match = line.slice( pos ).trim().match( /(\S+)\s+(\S+)(?:\s+(.*))?/ ) || [];
  return {
    keyType: match[ 1 ],
    key: match[ 2 ],
    comment: match[ 3 ] || '',
  };
}

class AuthKeyLine{
  constructor( line , lineNo ){
    this.fullLine = line;
    this.lineNo = lineNo;

    const { options, pos } = parseOptions( line );
    const { keyType, key, comment } = parseKey( line, pos );

    this.options = options;   // e.g. 'no-port-forwarding,command="echo ..."' or ''
    this.rsa = keyType;       // key type, e.g. 'ssh-rsa'
    this.id = key;            // base64 key blob. Used as the unique id of this key
    this.name = comment;      // trailing comment, e.g. 'user@host'
  }

  static create( line, lineNo ){
    return new AuthKeyLine( line, lineNo );
  }

  toString(){
    return this.fullLine;
  }
}

module.exports  = AuthKeyLine;
