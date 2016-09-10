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
    qlib.promise2defer(this.__service.resolveUser(credentials), defer);
  };
  User.prototype.fetchUser = function (trusteduserhash, defer) {
    qlib.promise2defer((new qlib.PromiseChainerJob([
      this.__service.fetchUserFromDB.bind(this.__service, trusteduserhash),
      this.__service.hashOfDBHashPromised.bind(this.__service)
    ])).go(), defer);
  };
  User.prototype.updateUser = function (trusteduserhash, datahash, options, defer) {
    qlib.promise2defer(this.__service.updateUser(trusteduserhash, datahash, options), defer);
  };
  User.prototype.registerUser = function (datahash, defer) {
    qlib.promise2defer(this.__service.registerUser(datahash), defer);
  };
  User.prototype.usernamesLike = function (startingstring, defer) {
    qlib.promise2defer(this.__service.usernamesLike(startingstring), defer);
  };
  User.prototype.usernameExists = function (username, defer) {
    qlib.promise2defer(this.__service.usernameExists(username), defer);
  };
  User.prototype.changePassword = function (username, oldpassword, newpassword, defer) {
    qlib.promise2defer(this.__service.changePassword(username, oldpassword, newpassword), defer);
  };
  User.prototype.forcePassword = function (username, forcedpassword, defer) {
    qlib.promise2defer(this.__service.forcePassword(username, forcedpassword), defer);
  };
  return User;
}

module.exports = createUser;
