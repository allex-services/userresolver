function createUserResolverService(execlib, ParentService, saltandhashlib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function factoryCreator(parentFactory) {
    return {
      'service': require('./users/serviceusercreator')(execlib, parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib, parentFactory.get('user')) 
    };
  }

  function UserResolverService(prophash) {
    if(!(prophash.skipdata || prophash.data)){
      throw new lib.Error('NO_DATA_IN_PROPERTYHASH','UserResolverService propertyhash misses the data field');
    }
    if(!(prophash.skipdata || prophash.data.modulename)){
      throw new lib.Error('NO_DATA_MODULENAME_IN_PROPERTYHASH','UserResolverService propertyhash misses the data.modulename field');
    }
    ParentService.call(this, prophash);
    this.namecolumn = prophash.namecolumn || 'username';
    this.passwordcolumn = prophash.passwordcolumn || 'password';
    this.encryptpassword = !prophash.skipencryption;
    this.dbUserSink = null;
    if (!prophash.skipdata) {
      this.startSubServiceStatically(prophash.data.modulename,'db',prophash.data).then(
        this.onServiceDB.bind(this),
        this.close.bind(this)
      );
    }
  }
  ParentService.inherit(UserResolverService, factoryCreator);
  UserResolverService.prototype.__cleanUp = function() {
    this.dbUserSink = null;
    this.skipencryption = null;
    this.passwordcolumn = null;
    this.namecolumn = null;
    ParentService.prototype.__cleanUp.call(this);
  };
  UserResolverService.prototype.isInitiallyReady = function (prophash) {
    return false;
  };

  UserResolverService.prototype.onServiceDB = function (dbsink) {
    dbsink.subConnect('.', {name: 'user', role: 'user'}).then(
      this.onUserDB.bind(this),
      this.readyToAcceptUsersDefer.reject.bind(this.readyToAcceptUsersDefer)
    );
  };

  UserResolverService.prototype.onUserDB = function (dbsink) {
    if (this.encryptpassword && !(dbsink.visibleFields && dbsink.visibleFields.indexOf('salt')>=0)){
      this.readyToAcceptUsersDefer.reject(new lib.Error('NO_SALT_IN_DB_VISIBLE_FIELDS'));
      return;
    }
    this.dbUserSink = dbsink;
    this.readyToAcceptUsersDefer.resolve(true);
  };

  UserResolverService.prototype.resolveUser = function (credentials) {
    return (new qlib.PromiseChainerJob([
      this.fetchUserFromDB.bind(this, credentials),
      this.match.bind(this, credentials)
    ])).go();
  };

  UserResolverService.prototype.fetchUserFromDB = function (credentials) {
    var d;
    if(!this.dbUserSink){
      return q.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
    }
    d = q.defer();
    taskRegistry.run('readFromDataSink', {
      sink: this.dbUserSink,
      cb: d.resolve.bind(d),
      errorcb: d.reject.bind(d),
      filter:{
        op: 'eq',
        field: this.userNameColumnName(credentials),
        value: this.userNameValueOf(credentials)
      },
      singleshot: true
    });
    return d.promise;
  };

  UserResolverService.prototype.usernamesLike = function (startingstring) {
    var d;
    if(!this.dbUserSink){
      return q.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
    }
    d = q.defer();
    taskRegistry.run('readFromDataSink', {
      sink: this.dbUserSink,
      cb: d.resolve.bind(d), 
      errorcb: d.reject.bind(d),
      filter: {
        op: 'startingwith',
        field: this.userNameColumnName(),
        value: startingstring
      }
    });
    return d.promise;
  };

  UserResolverService.prototype.usernameExists = function (username) {
    var d;
    if(!this.dbUserSink){
      return q.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
    }
    d = q.defer();
    taskRegistry.run('readFromDataSink', {
      sink: this.dbUserSink,
      cb: function(records) {
        //console.log('readFromDataSink:',records);
        d.resolve(records && records.length>0);
        d = null;
      },
      errorcb: function (reason) {
        d.reject(reason);
        d = null;
      },
      filter: {
        op: 'eq',
        field: this.userNameColumnName(),
        value: username
      }
    });
    return d.promise;
  };

  UserResolverService.prototype.match = function (credentials, dbhash) {
    if (!this.encryptpassword) {
      return q(this.simpleMatch(credentials, dbhash) ? this.hashOfDBHash(dbhash) : null);
    }
    return this.encryptedMatch(credentials, dbhash).then(
      this.onMatch.bind(this, credentials, dbhash)
    );
  };

  UserResolverService.prototype.onMatch = function (credentials, dbhash, match) {
    return q(match ? this.hashOfDBHash(dbhash) : null);
  };

  UserResolverService.prototype.simpleMatch = function (credentials, dbuserhash) {
    return this.userNameValueOf(credentials)===this.userNameValueOf(dbuserhash) && credentials.password===dbuserhash.password;
  };

  UserResolverService.prototype.encryptedMatch = function (credentials, dbuserhash) {
    if (!dbuserhash) {
      return q(false);
    }
    if (!dbuserhash.salt) {
      return q(false);
    }
    return saltandhashlib.verifyPassword(credentials[this.passwordcolumn],dbuserhash.salt,Buffer(dbuserhash[this.passwordcolumn], 'hex'));
  };

  UserResolverService.prototype.hashOfDBHash = function (dbhash) {
    if (!dbhash) {
      return null;
    }
    return {
      name: this.userNameValueOf(dbhash),
      role: 'user',
      profile: lib.pickExcept(dbhash, [this.passwordcolumn, 'salt'])
    };
  };

  UserResolverService.prototype.hashOfDBHashPromised = function (dbhash) {
    return q(this.hashOfDBHash(dbhash));
  };

  UserResolverService.prototype.pickedHashPromised = function (dbhash) {
    return q(lib.pickExcept(dbhash, [this.passwordcolumn, 'salt']));
  };

  UserResolverService.prototype.onSaltAndHash = function (datahash) {
    datahash[this.passwordcolumn] = datahash[this.passwordcolumn].toString('hex');
    return q(datahash);
  };

  UserResolverService.prototype.doSaltAndHash = function (datahash) {
    return this.encryptpassword ? saltandhashlib.saltAndHash(datahash[this.passwordcolumn], datahash, this.passwordcolumn).then(
      this.onSaltAndHash.bind(this)
    ) : q(datahash);
  };

  UserResolverService.prototype.registerUser = function (datahash) {
    var _q = q;
    if(!this.dbUserSink){
      return q.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
    }
    //cook the password here...
    return this.doSaltAndHash(datahash).then(
      this.dbUserSink.call.bind(this.dbUserSink, 'create')
    ).then(
      this.pickedHashPromised.bind(this)
    );
  };

  UserResolverService.prototype.updateUser = function (trusteduserhash, datahash, options) {
    var chain;
    if(!this.dbUserSink){
      return q.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
    }
    chain = [];
    if (datahash.hasOwnProperty('password')) {
      chain.push(this.doSaltAndHash.bind(this, datahash));
    }
    chain.push(this.dbUserSink.call.bind(this.dbUserSink, 'update', {
      op: 'eq',
      field: this.userNameColumnName(trusteduserhash),
      value: this.userNameValueOf(trusteduserhash)
    }, datahash, options));
    chain.push(this.pickedHashPromised.bind(this));
    return (new qlib.PromiseChainerJob(chain)).go();
  };

  UserResolverService.prototype.changePassword = function (username, oldpassword, newpassword) {
    var usernameandpasswordhash;
    if (!this.dbUserSink) {
      return q.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
    }
    usernameandpasswordhash = this.hashFromUsernameAndPassword(username, oldpassword);
    return this.resolveUser(usernameandpasswordhash).then(
      this.onUserResolvedForPasswordChange.bind(this, username, newpassword)
    );
  };
  UserResolverService.prototype.onUserResolvedForPasswordChange = function (username, newpassword, resolutionresult) {
    var usernamehash, passwordhash;
    if (!resolutionresult) {
      return q.reject(new lib.Error('BAD_ORIGINAL_PASSWORD', 'Password changed denied because original password did not match'));
    }
    if (!this.dbUserSink) {
      return q.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
    }
    usernamehash = this.hashFromUsername(username);
    passwordhash = this.hashFromPassword(newpassword);
    return this.doSaltAndHash(passwordhash).then(
      (saltandhashobj) => {
        var ret = this.dbUserSink.call(
          'update',
          {op: 'eq', field: this.userNameColumnName(usernamehash), value: username},
          saltandhashobj,
          {op: 'set'}
        );
        username = null;
        usernamehash = null;
        return ret;
      });
  };

  UserResolverService.prototype.forcePassword = function (username, forcedpassword) {
    var usernamehash, passwordhash;
    if (!this.dbUserSink) {
      return q.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
    }
    usernamehash = this.hashFromUsername(username);
    passwordhash = this.hashFromPassword(forcedpassword);
    return this.doSaltAndHash(passwordhash).then(
      (saltandhashobj) => {
        var ret = this.dbUserSink.call(
          'update',
          {op: 'eq', field: this.userNameColumnName(usernamehash), value: username},
          saltandhashobj,
          {op: 'set'}
        );
        username = null;
        usernamehash = null;
        return ret;
      });
  };

  UserResolverService.prototype.hashFromUsername = function (username) {
    var ret = {};
    ret[this.namecolumn] = username;
    return ret;
  };
  
  UserResolverService.prototype.hashFromPassword = function (password) {
    var ret = {};
    ret[this.passwordcolumn] = password;
    return ret;
  };

  UserResolverService.prototype.hashFromUsernameAndPassword = function (username, password) {
    var ret = {};
    ret[this.namecolumn] = username;
    ret[this.passwordcolumn] = password;
    return ret;
  };
  
  UserResolverService.prototype.userNameValueOf = function (obj) {
    return obj ? obj[this.userNameColumnName(obj)] : void 0;
  };

  UserResolverService.prototype.userNameColumnName = function (credentials) {
    return this.namecolumn;
  };

  return UserResolverService;
}

module.exports = createUserResolverService;
