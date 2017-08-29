
## Organizing ssh keys of users

* create a file `<username>` inside directory called `keys` and add any number of keys there. A user can have multiple ssh keys.
* Eg: create a file `keys/jake` and add any number of keys in the that file. All these keys will  be treated as Jake's key

## Organizing server list

* Create a file called `servers.js` which should export an hash map of `servername` => [ 'user@host', portnumber ]
Eg
```javascript
module.exports = {
  app1Testing: [ 'devuser@8.8.8.8', 1122 ], // Non standard port number
  app1Staging: ['devuser@8.8.8.7'], // Default port number
  app2Testing: [ 'devuser@8.8.8.6', 1122 ],
  app2Staging: ['devuser@8.8.8.5'],
};
```


## Adding removing ssh keys

#### CLI interface
1. list currently loaded server names and usernames
  > bin/server-man.js -a
2. list status of all servers.
  > bin/server-man.js -l
3. grant access to username 'jake' on server called 'devserver'
  > bin/server-man.js -n devserver -g jake
4. set access of server 'devserver' to user 'jake' only
  > bin/server-man.js -n devserver -s jake
5. revoke access to username 'jake' on server called 'devserver'
  > bin/server-man.js -n devserver -r jake


#### API usage
```
var server = new Server( [ 'devuser@8.8.8.8', 1122 ] );

// list the usernames in the server
server.listAccess(); // -> Promise( Array<String> )

server.grantAccess( 'hari' ); // -> Promise( Array<String> )

server.revokeAccess( 'hari' ); // -> Promise( Array<String> )

server.setAccess( 'hari' ); // -> Promise( Array<String> )

```
