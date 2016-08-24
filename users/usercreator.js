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
    this.internalFetchUser(credentials, true, defer); //do the checking
  };
  User.prototype.fetchUser = function (trusteduserhash, defer) {
    this.internalFetchUser(trusteduserhash, false, defer); //do not do the checking
  };
  User.prototype.internalFetchUser = function (credentials, docheck, defer) {
    var db = this.__service.subservices.get('db');
    if(!db){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      defer = null;
      credentials = null;
      docheck = null;
      return;
    }
    taskRegistry.run('readFromDataSink', {
      sink: db,
      cb: this.onDBUserFound.bind(this, defer, credentials, docheck),
      errorcb: defer.reject.bind(defer),
      filter:{
        op: 'eq',
        field: this.userNameColumnName(credentials),
        value: this.userNameValueOf(credentials)
      },
      singleshot: true
    });
    defer = null;
    credentials = null;
    docheck = null;
  };
  User.prototype.updateUser = function (trusteduserhash, datahash, options, defer) {
    var db = this.__service.subservices.get('db');
    if(!db){
      defer.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
      return;
    }
    qlib.promise2defer(db.call('update', {
      op: 'eq',
      field: this.userNameColumnName(trusteduserhash),
      value: this.userNameValueOf(trusteduserhash)
    }, datahash, options), defer);
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
        field: this.userNameColumnName(),
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
    console.log('usernameExists?', this.userNameColumnName(), '===', username);
    taskRegistry.run('readFromDataSink', {
      sink: db,
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
  User.prototype.onDBUserFound = function (defer, credentials, docheck, dbuserhash) {
    if (!dbuserhash) {
      defer.resolve(null);
      return;
    }
    if (docheck) {
    //have fun with password hashing etc...
      defer.resolve(this.validateCredentialsAgainstDBUser(credentials, dbuserhash) ? {
        name: this.userNameValueOf(dbuserhash),
        role: 'user',
        profile: dbuserhash
      } : null);
    } else {
      defer.resolve({
        name: this.userNameValueOf(dbuserhash),
        role: 'user',
        profile: dbuserhash
      });
    }
    defer = null;
    credentials = null;
    docheck = null;
  };
  User.prototype.validateCredentialsAgainstDBUser = function (credentials, dbuserhash) {
    //console.log(credentials,'ok against',dbuserhash,'?', this.userNameValueOf(credentials)===this.userNameValueOf(dbuserhash) && credentials.password===dbuserhash.password);
    //for now, plain and stupid
    return this.userNameValueOf(credentials)===this.userNameValueOf(dbuserhash) && credentials.password===dbuserhash.password;
  };
  User.prototype.userNameValueOf = function (obj) {
    return obj ? obj[this.userNameColumnName(obj)] : void 0;
  };
  User.prototype.userNameColumnName = function (credentials) {
    return this.__service.namecolumn;
  };


  return User;
}

module.exports = createUser;
