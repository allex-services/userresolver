function createUser(execlib, ParentUser) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  if (!ParentUser) {
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function User(prophash) {
    ParentUser.call(this, prophash);
  }
  ParentUser.inherit(User, require('../methoddescriptors/user'), ['havedb']/*or a ctor for StateStream filter*/);
  User.prototype.__cleanUp = function () {
    ParentUser.prototype.__cleanUp.call(this);
  };
  User.prototype.resolveUser = function (credentials, defer) {
    qlib.promise2defer((new qlib.PromiseChainerJob([
      this.__service.fetchUserFromDB.bind(this.__service, credentials),
      this.__service.match.bind(this.__service, credentials)
    ])).go(), defer);
  };
  User.prototype.fetchUser = function (trusteduserhash, defer) {
    qlib.promise2defer((new qlib.PromiseChainerJob([
      this.__service.fetchUserFromDB.bind(this.__service, trusteduserhash),
      this.__service.hashOfDBHashPromised.bind(this.__service)
    ])).go(), defer);
  };
  User.prototype.updateUser = function (trusteduserhash, datahash, options, defer) {
    if(!this.__service.dbUserSink){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      return;
    }
    qlib.promise2defer(this.__service.dbUserSink.call('update', {
      op: 'eq',
      field: this.userNameColumnName(trusteduserhash),
      value: this.userNameValueOf(trusteduserhash)
    }, datahash, options), defer);
  };
  User.prototype.registerUser = function (datahash, defer) {
    qlib.promise2defer(this.__service.registerUser(datahash), defer);
  };
  User.prototype.usernamesLike = function (startingstring, defer) {
    if(!this.__service.dbUserSink){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      return;
    }
    taskRegistry.run('readFromDataSink', {
      sink: this.__service.dbUserSink,
      filter: {
        op: 'startingwith',
        field: this.userNameColumnName(),
        value: startingstring
      },
      cb: console.log.bind(console,'usernamesLike')
    });
  };
  User.prototype.usernameExists = function (username, defer) {
    if(!this.__service.dbUserSink){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      return;
    }
    console.log('usernameExists?', this.userNameColumnName(), '===', username);
    taskRegistry.run('readFromDataSink', {
      sink: this.__service.dbUserSink,
      filter: {
        op: 'eq',
        field: this.userNameColumnName(),
        value: username
      },
      cb: function(records) {
        //console.log('readFromDataSink:',records);
        defer.resolve(records && records.length>0);
        defer = null;
      }
    });
  };
  return User;
}

module.exports = createUser;
