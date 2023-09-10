
## Organizing ssh keys of users

* create a file `<username>` inside directory called `keys` and add any number of keys there. A user can have multiple ssh keys.
* Eg: create a file `keys/jake` and add any number of keys in the that file. All these keys will  be treated as Jake's key

## Organizing server list

* Create a file called `servers.js` which should export an array of <Server> objects
* Each <Server> object can have the following properties
  - `host:` hostname or IP addreess
  - `name:` A name to indentify the server.
  - `port:` Port number ( Optional. default 22 )
  - `user:` ssh user ( Optional : default: devuser )

**Eg**
```javascript
module.exports = [
    {
      name: 'app1Dev',
      host: '8.8.8.8',
    },
    {
      name: 'app1Staging',
      host: '8.8.8.9',
    },
];
```


## Adding removing ssh keys

#### CLI interface
1. list currently loaded server names and usernames
  >npx ssh-access-manager -a
2. list status of all servers.
  >npx ssh-access-manager -l
3. grant access to username 'jake' on server called 'devserver'
  >npx ssh-access-manager -n devserver -g jake
4. set access of server 'devserver' to user 'jake' only
  >npx ssh-access-manager -n devserver -s jake
5. revoke access to username 'jake' on server called 'devserver'
  >npx ssh-access-manager -n devserver -r jake
5. Dump curret Access-Control-List ( ACL ) for servers. ( Ie, simply dump output of `-l` command as json )
  >npx ssh-access-manager -l -j
6. Update server access from `acl.js` file.
  >npx ssh-access-manager -U

  We can create a acl.js file by simply dumping current state in all the servers.
  >npx ssh-access-manager -l -j >> acl.json



#### API usage
```
var server = new Server( [ 'devuser@8.8.8.8', 1122 ] );

// list the usernames in the server
server.listAccess(); // -> Promise( Array<String> )

server.grantAccess( 'hari' ); // -> Promise( Array<String> )

server.revokeAccess( 'hari' ); // -> Promise( Array<String> )

server.setAccess( 'hari' ); // -> Promise( Array<String> )

```
