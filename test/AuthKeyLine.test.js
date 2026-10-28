const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const AuthKeyLine = require('../src/AuthKeyLine');

const RESTRICTED_LINE = 'no-port-forwarding,no-agent-forwarding,no-X11-forwarding,command="echo \'Please login as the user \\"superadmin\\" rather than the user \\"root\\".\';echo;sleep 10;exit 142" ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDDHTlyq5F7/bahVDoTeP7EqrA5xKpDgY4yJSwIi+J+dPsJTsPigubryqSk3zxBEd8f2XNqm7evTGDSrX69XIbrkqZtmfSXlSI7+dyO43P4VXm4qVqmVtoVN4BsxwSg4jYj6TUhkGjnKndEeV0sDVpMDpO3i4ghnWiAArmj9TwWmNEFfdJC6uXXwtrjc8f3vVcDd1jqbMAGUJipQZIRSm9Os43yMkmKRARHJ8UwM28AyCbzYlUaeutH28u/mnYDQn98PVKda+oQLk7uN8BtTijokmeKWx8i3TJA+ClerXab0tPN+045IkEZ33323bdnBiF1R7zHgL3+/ql+ini4euLPGld0nIF1dJFwgu5sX2d23qBbzYMtI63/6OiOjYZRt0OQzmrWBHcsb3h3n5H6LLPhdvbmwXtxlDY9rd9GBywReFThrKrSu2dufjLnGoyvMiewEfxd8G6AxqmjTYftqdtSazAKdgbvrW0EwFnW6LP3XGyLLaIfPiblhaSkcfGn5Fc= generated-by-cloud-init';

const RESTRICTED_KEY_BLOB = RESTRICTED_LINE.match( /ssh-rsa (\S+)/ )[ 1 ];

describe( 'AuthKeyLine', function(){

  it( 'parses a plain key line without options', function(){
    const line = new AuthKeyLine( 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDemoKey user@host', 1 );
    assert.equal( line.options, '' );
    assert.equal( line.rsa, 'ssh-rsa' );
    assert.equal( line.id, 'AAAAB3NzaC1yc2EAAAADAQABAAABgQDemoKey' );
    assert.equal( line.name, 'user@host' );
  });

  it( 'parses a plain key line without comment', function(){
    const line = new AuthKeyLine( 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample', 1 );
    assert.equal( line.options, '' );
    assert.equal( line.rsa, 'ssh-ed25519' );
    assert.equal( line.id, 'AAAAC3NzaC1lZDI1NTE5AAAAIExample' );
    assert.equal( line.name, '' );
  });

  it( 'parses flag-only options', function(){
    const line = new AuthKeyLine( 'no-pty ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDemoKey user@host', 1 );
    assert.equal( line.options, 'no-pty' );
    assert.equal( line.rsa, 'ssh-rsa' );
    assert.equal( line.id, 'AAAAB3NzaC1yc2EAAAADAQABAAABgQDemoKey' );
    assert.equal( line.name, 'user@host' );
  });

  it( 'parses restricted entries with a quoted command containing spaces, commas and escaped quotes', function(){
    const line = new AuthKeyLine( RESTRICTED_LINE, 1 );
    assert.equal( line.id, RESTRICTED_KEY_BLOB );
    assert.equal( line.rsa, 'ssh-rsa' );
    assert.equal( line.name, 'generated-by-cloud-init' );
    assert.equal(
      line.options,
      'no-port-forwarding,no-agent-forwarding,no-X11-forwarding,command="echo \'Please login as the user \\"superadmin\\" rather than the user \\"root\\".\';echo;sleep 10;exit 142"'
    );
  });

  it( 'parses options with unquoted values', function(){
    const line = new AuthKeyLine( 'from="10.0.0.?",no-pty ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDemoKey user@host', 1 );
    assert.equal( line.options, 'from="10.0.0.?",no-pty' );
    assert.equal( line.id, 'AAAAB3NzaC1yc2EAAAADAQABAAABgQDemoKey' );
    assert.equal( line.name, 'user@host' );
  });

  it( 'preserves the full line so it round-trips through toFile()', function(){
    const line = new AuthKeyLine( RESTRICTED_LINE, 1 );
    assert.equal( line.toString(), RESTRICTED_LINE );
  });

  it( 'handles leading whitespace', function(){
    const line = new AuthKeyLine( '  ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDemoKey user@host', 1 );
    assert.equal( line.options, '' );
    assert.equal( line.rsa, 'ssh-rsa' );
    assert.equal( line.id, 'AAAAB3NzaC1yc2EAAAADAQABAAABgQDemoKey' );
    assert.equal( line.name, 'user@host' );
  });

});
