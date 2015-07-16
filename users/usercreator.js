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
    var db = this.__service.subservices.get('db');
    if(!db){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      return;
    }
    taskRegistry.run('readFromDataSink', {
      sink: db,
      cb: this.onDBUserFound.bind(this, defer, credentials),
      errorcb: defer.reject.bind(defer),
      filter:{
        op: 'eq',
        field: this.userNameColumnName(),
        value: this.userNameValueOf(credentials)
      },
      singleshot: true
    });
  };
  User.prototype.registerUser = function (datahash, defer) {
    var db = this.__service.subservices.get('db');
    if(!db){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      return;
    }
    //cook the password here...
    db.call('create',datahash).done(
      defer.resolve.bind(defer),
      defer.reject.bind(defer),
      defer.notify.bind(defer)
    );
  };
  User.prototype.usernamesLike = function (startingstring, defer) {
    var db = this.__service.subservices.get('db');
    if(!db){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      return;
    }
    taskRegistry.run('readFromDataSink', {
      sink: db,
      filter: {
        op: 'startingwith',
        field: 'username',
        value: startingstring
      },
      cb: console.log.bind(console,'usernamesLike')
    });
  };
  User.prototype.usernameExists = function (username, defer) {
    var db = this.__service.subservices.get('db');
    if(!db){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      return;
    }
    taskRegistry.run('readFromDataSink', {
      sink: db,
      filter: {
        op: 'eq',
        field: 'username',
        value: username
      },
      cb: function(records) {
        console.log('readFromDataSink:',records);
        defer.resolve((records && records.length>0).toString());
      }
    });
  };
  User.prototype.onDBUserFound = function (defer, credentials, dbuserhash) {
    if (!dbuserhash) {
      defer.resolve(null);
      return;
    }
    //have fun with password hashing etc...
    defer.resolve(this.validateCredentialsAgainstDBUser(credentials, dbuserhash) ? {
      name: this.userNameValueOf(dbuserhash),
      role: 'user',
      profile: dbuserhash
    } : null);
  };
  User.prototype.validateCredentialsAgainstDBUser = function (credentials, dbuserhash) {
    console.log(credentials,'ok against',dbuserhash,'?');
    //for now, plain and stupid
    return this.userNameValueOf(credentials)===this.userNameValueOf(dbuserhash) && credentials.password===dbuserhash.password;
  };
  User.prototype.userNameValueOf = function (obj) {
    return obj ? obj[this.userNameColumnName()] : void 0;
  };
  User.prototype.userNameColumnName = function () {
    return this.__service.namecolumn;
  };


  return User;
}

module.exports = createUser;
