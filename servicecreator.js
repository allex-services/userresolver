function createUserResolverService(execlib, ParentService, saltandhashlib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  var dbresolvermanipulatorslib = require('./dbresolvermanipulators')(execlib);

  var joblib = require('./dbfetchingjobs')(execlib);

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
    this.dbCryptoSink = null;
    this.plainer = null;
    this.crypter = null;
    if (!prophash.skipdata) {
      this.createCrypter(prophash).then(
        this.onCrypter.bind(this, prophash),
        this.close.bind(this)
      );
    }
  }
  ParentService.inherit(UserResolverService, factoryCreator);
  UserResolverService.prototype.__cleanUp = function() {
    if (this.crypter) {
      this.crypter.destroy();
    }
    this.crypter = null;
    if (this.plainer) {
      this.plainer.destroy();
    }
    this.plainer = null;
    if (this.dbCryptoSink) {
      this.dbCryptoSink.destroy();
    }
    this.dbCryptoSink = null;
    if (this.dbUserSink) {
      this.dbUserSink.destroy();
    }
    this.dbUserSink = null;
    this.skipencryption = null;
    this.passwordcolumn = null;
    this.namecolumn = null;
    ParentService.prototype.__cleanUp.call(this);
    saltandhashlib.release();
  };
  UserResolverService.prototype.isInitiallyReady = function (prophash) {
    return false;
  };
  UserResolverService.prototype.createCrypter = function (prophash) {
    return q(prophash.skipencryption ? dbresolvermanipulatorslib.Crypter : dbresolvermanipulatorslib.MongoDbCrypter);
  };
  UserResolverService.prototype.onCrypter = function (prophash, crypterctor) {
    this.plainer = new (dbresolvermanipulatorslib.PlainManipulator)(prophash);
    this.crypter = new crypterctor(prophash);
    this.startSubServiceStatically(prophash.data.modulename,'db',prophash.data).then(
      this.onServiceDB.bind(this),
      this.close.bind(this)
    );
  };

  UserResolverService.prototype.onServiceDB = function (dbsink) {
    var promises = [
      this.plainer.subConnectToDbSink(dbsink),
      this.crypter.subConnectToDbSink(dbsink)
    ];
    q.all(promises).then(
      this.onDBSinks.bind(this),
      this.readyToAcceptUsersDefer.reject.bind(this.readyToAcceptUsersDefer)
    );
  };

  UserResolverService.prototype.onDBSinks = function (dbsinks) {
    this.dbUserSink = dbsinks[0];
    this.dbCryptoSink = dbsinks[1];
    this.readyToAcceptUsersDefer.resolve(true);
  };

  UserResolverService.prototype.resolveUser = function (credentials) {
    return (new qlib.PromiseChainerJob([
      this.fetchCryptoUserFromDB.bind(this, credentials),
      this.match.bind(this, credentials)
    ])).go();
  };

  UserResolverService.prototype.fetchUserFromDB = function (credentials) {
    return this.genericFetchUserFromDBProc(this.dbUserSink, credentials);
  };

  UserResolverService.prototype.fetchCryptoUserFromDB = function (credentials) {
    return this.genericFetchUserFromDBProc(
      this.encryptpassword ? this.dbCryptoSink : this.dbUserSink,
      credentials
    );
  };

  UserResolverService.prototype.genericFetchUserFromDBProc = function (sink, credentials) {
    return (new joblib.FetcherByHashUserName(this.namecolumn, this.passwordcolumn, credentials, sink)).go();
  };

  UserResolverService.prototype.usernamesLike = function (startingstring) {
    return (new joblib.StartingWithFetcher(this.namecolumn, this.passwordcolumn, startingstring, this.dbUserSink)).go();
  };

  UserResolverService.prototype.usernameExists = function (username) {
    return (new joblib.ExistsFetcher(this.namecolumn, this.passwordcolumn, username, this.dbUserSink)).go();
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
    if (!match) {
      return null;
    }
    if (!this.encryptpassword) {
      return this.hashOfDBHash(dbhash);
    }
    return this.genericFetchUserFromDBProc(this.dbUserSink, credentials).then(
      this.hashOfDBHash.bind(this)
    );
  };

  UserResolverService.prototype.simpleMatch = function (credentials, dbuserhash) {
    if (!credentials) return false;
    if (!dbuserhash) return false;
    return this.userNameValueOf(credentials)===this.userNameValueOf(dbuserhash) && credentials.password===dbuserhash.password;
  };

  UserResolverService.prototype.encryptedMatch = function (credentials, dbuserhash) {
    var password;
    if (!dbuserhash) {
      return q(false);
    }
    if (!dbuserhash.salt) {
      return q(false);
    }
    password = credentials[this.passwordcolumn];
    if (!lib.isVal(password)) {
      return q(false);
    }
    return saltandhashlib.verifyPasswordOuter(password,dbuserhash.salt,Buffer(dbuserhash[this.passwordcolumn], 'hex'));
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
    return this.encryptpassword ? saltandhashlib.saltAndHashOuter(datahash[this.passwordcolumn], datahash, this.passwordcolumn).then(
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

    datahash = lib.pickExcept (datahash, [this.passwordcolumn]);

    chain.push(this.dbUserSink.call.bind(this.dbUserSink, 'update', {
      op: 'eq',
      field: this.userNameColumnName(trusteduserhash),
      value: this.userNameValueOf(trusteduserhash)
    }, datahash, options));

    chain.push(this.pickedHashPromised.bind(this));
    return (new qlib.PromiseChainerJob(chain)).go();
  };

  UserResolverService.prototype.updateUserUnsafe = function (username, datahash, options) {
    var chain, userhash = this.hashFromUsername(username);
    if(!this.dbUserSink){
      return q.reject(new lib.Error('RESOLVER_DB_DOWN','Resolver DB is currently down. Please, try later'));
    }
    if (datahash.hasOwnProperty('password')) {
      return q.reject(new lib.Error('CANNOT_UNSAFE_USER_UPDATE_PASSWORD'));
    }
    return this.dbUserSink.call('update', {
      op: 'eq',
      field: this.userNameColumnName(userhash),
      value: this.userNameValueOf(userhash)
    }, datahash, options);
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
