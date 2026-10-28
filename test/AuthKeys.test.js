const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const AuthKeys = require('../src/AuthKeys');
const AuthKeyLine = require('../src/AuthKeyLine');

const FILE = [
  '# managed by server-man',
  '',
  'ssh-rsa AAAAalice alice@laptop',
  '# commented-out key',
  '# ssh-rsa AAAAold old-admin@pc',
  'no-pty,command="echo \\"login as admin\\"; exit 142" ssh-rsa AAAAsysadmin sysadmin-key',
  'ssh-rsa AAAAbob bob@pc',
  '',
].join('\n');

describe( 'AuthKeys file preservation', function(){

  it( 'round-trips comments, blank lines and option entries verbatim', function(){
    const keys = new AuthKeys( FILE );
    assert.equal( keys.toFile(), FILE );
  });

  it( 'preserves a trailing newline', function(){
    const keys = new AuthKeys( FILE + '\n' );
    assert.equal( keys.toFile(), FILE + '\n' );
  });

  it( 'exposes only key lines through .lines', function(){
    const keys = new AuthKeys( FILE );
    // commented-out AAAAold is excluded; AAAAsysadmin has an options prefix
    assert.deepEqual( keys.lines.map( l => l.id ), [ 'AAAAalice', 'AAAAsysadmin', 'AAAAbob' ] );
  });

  it( 'removeKey removes only the matching key, everything else stays intact', function(){
    const keys = new AuthKeys( FILE );
    keys.removeKey( new AuthKeyLine( 'ssh-rsa AAAAbob bob@pc', 0 ) );
    assert.deepEqual( keys.lines.map( l => l.id ), [ 'AAAAalice', 'AAAAsysadmin' ] );
    // comments, blank lines and the option entry are still there
    assert.ok( keys.toFile().includes( '# managed by server-man' ) );
    assert.ok( keys.toFile().includes( '# ssh-rsa AAAAold old-admin@pc' ) );
    assert.ok( keys.toFile().includes( 'no-pty,command="echo \\"login as admin\\"; exit 142" ssh-rsa AAAAsysadmin sysadmin-key' ) );
  });

  it( 'addAccess appends a new key without touching existing structure', function(){
    const keys = new AuthKeys( FILE );
    keys.addAccess( new AuthKeyLine( 'ssh-rsa AAAAcarol carol@pc', 0 ) );
    assert.deepEqual( keys.lines.map( l => l.id ), [ 'AAAAalice', 'AAAAsysadmin', 'AAAAbob', 'AAAAcarol' ] );
    assert.ok( keys.toFile().startsWith( FILE + '\n' ) );
  });

  it( 'addAccess de-duplicates by key blob, keeping the existing entry as-is', function(){
    const keys = new AuthKeys( FILE );
    // same blob, different options/ comment
    keys.addAccess( new AuthKeyLine( 'ssh-rsa AAAAbob not-bob@elsewhere', 0 ) );
    assert.equal( keys.lines.length, 3 );
    assert.ok( keys.toFile().includes( 'ssh-rsa AAAAbob bob@pc' ) );
  });

  it( 'handles an empty file', function(){
    const keys = new AuthKeys( '' );
    assert.equal( keys.toFile(), '' );
    keys.addAccess( new AuthKeyLine( 'ssh-rsa AAAAalice alice@laptop', 0 ) );
    assert.equal( keys.toFile(), 'ssh-rsa AAAAalice alice@laptop' );
  });

});
