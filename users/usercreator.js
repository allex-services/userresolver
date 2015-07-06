function createUser(execlib, ParentUser) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  if (!ParentUser) {
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function User(prophash) {
    ParentUser.call(this, prophash);
  }
  ParentUser.inherit(User, require('../methoddescriptors/user'), [/*visible state fields here*/]/*or a ctor for StateStream filter*/);
  User.prototype.__cleanUp = function () {
    ParentUser.prototype.__cleanUp.call(this);
  };
  User.prototype.resolveUser = function (credentials, defer) {
    console.log('resolveUser on credentials',credentials);
    var db = this.__service.subservices.get('db');
    if(!db){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      return;
    }
    db.subConnect('.',{name:'-',role:'user',filter:{
      op: 'eq',
      field: 'username',
      value: credentials.username
    }}).done(
      this.onDBUserSink.bind(this, credentials, defer),
      //defer.reject.bind(defer),
      function(reason){
        console.error(reason);
        defer.reject(reason);
      }
    );
  };
  User.prototype.onDBUserSink = function (credentials,defer,sink){
    var foundobj = {found: false};
    taskRegistry.run('materializeData',{
      sink: sink,
      data: [],
      onRecordCreation: this.onDBUserFound.bind(this, defer, foundobj),
      onInitiated: function () {
        if (!foundobj.found) {
          defer.resolve(null);
        }
        lib.runNext(sink.destroy.bind(sink));
      }
    });
  };
  User.prototype.onDBUserFound = function (defer, foundobj, dbuserhash) {
    foundobj.found = true;
    //have fun with password hashing etc...
    defer.resolve({
      name: dbuserhash.username,
      role: 'user',
      profile: dbuserhash
    });
  };

  return User;
}

module.exports = createUser;
