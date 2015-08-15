# UserResolverService

Works like this:

1. Needs a `data` hash in its constuctor propertyhash, like
```javascript
{
  data: {
    modulename: 'allex__somenamespace_usertableservice'
  }
}
```
2. In the constructor a static subservice sink will be acquired, named 'db',
sinking the instance of propertyhash.data.modulename instantiated with the very
`data` hash as the propertyhash.

3. `user` role will expose methods 

  - `resolveUser`
  - `fetchUser`
  - `registerUser`
  - `usernamesLike`
  - 'usernameExists`
  
4. The methods exposed above will be usable through the EntryPoint instance of 
the allex_entrypointservice (or its child), via http calls.