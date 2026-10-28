const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// keyDb resolves its keys directory from PWD at require time, so point it at
// an isolated tree before requiring it.
const tmpRoot = fs.mkdtempSync( path.join( os.tmpdir(), 'server-man-test-' ) );
fs.mkdirSync( path.join( tmpRoot, 'keys' ) );
fs.writeFileSync( path.join( tmpRoot, 'keys', 'alice' ), 'ssh-rsa AAAAalice alice@laptop\n' );
fs.writeFileSync( path.join( tmpRoot, 'keys', 'bob' ), 'ssh-rsa AAAAbob bob@pc\n' );
fs.writeFileSync( path.join( tmpRoot, 'keys', 'carol' ), 'ssh-rsa AAAAcarol carol@pc\n' );
process.env.PWD = tmpRoot;

const keyDb = require('../src/keyDb');
const AuthKeys = require('../src/AuthKeys');

// authorized_keys of a server, containing data server-man does not manage.
const SERVER_FILE = [
  '# managed by server-man',
  '',
  'ssh-rsa AAAAalice alice@laptop',
  '# commented-out key',
  '# ssh-rsa AAAAold old-admin@pc',
  'no-port-forwarding,command="echo \\"login as admin\\"; exit 142" ssh-rsa AAAAsysadmin sysadmin-key',
  'ssh-rsa AAAAbob bob@pc',
  '',
].join('\n');

after( () => fs.rmSync( tmpRoot, { recursive: true, force: true } ) );

describe( 'keyDb', function(){

  it( 'getUserKeys returns an empty key set for unknown usernames instead of crashing', function(){
    assert.deepEqual( keyDb.getUserKeys( 'nobody' ).lines, [] );
    assert.deepEqual( keyDb.getUserKeys( 'ssh-rsa AAAAsomekey full-line@dumped' ).lines, [] );
  });

  it( 'authKeysToUsernames maps known keys to usernames and keeps unknown lines as-is', function(){
    const authKeys = new AuthKeys( SERVER_FILE );
    assert.deepEqual( keyDb.authKeysToUsernames( authKeys ), [
      'alice',
      'no-port-forwarding,command="echo \\"login as admin\\"; exit 142" ssh-rsa AAAAsysadmin sysadmin-key',
      'bob',
    ]);
  });

});

describe( 'setAccess semantics ( revokeUnlistedUsers )', function(){

  it( 'revokes known users not in the list while preserving all unmanaged data', function(){
    const authKeys = new AuthKeys( SERVER_FILE );

    // setAccess( 'alice', 'carol' ): bob must lose access, alice keeps it,
    // carol gets added; comments, commented-out keys and the restricted
    // sysadmin entry ( unknown user ) must survive untouched.
    keyDb.revokeUnlistedUsers( authKeys, [ 'alice', 'carol' ] );
    authKeys.addAccess( keyDb.getUserKeys( 'alice' ).lines );
    authKeys.addAccess( keyDb.getUserKeys( 'carol' ).lines );

    assert.deepEqual( keyDb.authKeysToUsernames( authKeys ), [
      'alice',
      'no-port-forwarding,command="echo \\"login as admin\\"; exit 142" ssh-rsa AAAAsysadmin sysadmin-key',
      'carol',
    ]);

    const result = authKeys.toFile();
    assert.ok( result.includes( '# managed by server-man' ) );
    assert.ok( result.includes( '# ssh-rsa AAAAold old-admin@pc' ) );
    assert.ok( result.includes( 'no-port-forwarding,command="echo \\"login as admin\\"; exit 142" ssh-rsa AAAAsysadmin sysadmin-key' ) );
    assert.ok( !result.includes( 'ssh-rsa AAAAbob bob@pc' ) );
  });

  it( 'is a no-op when every known user is listed', function(){
    const authKeys = new AuthKeys( SERVER_FILE );
    keyDb.revokeUnlistedUsers( authKeys, [ 'alice', 'bob', 'carol' ] );
    assert.equal( authKeys.toFile(), SERVER_FILE );
  });

});
