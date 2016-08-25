function createUserResolverService(execlib, ParentService) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q;

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
    this.passwordcolumn = prophash.passwordcolumn || 'cryptedpassword';
    if (!prophash.skipdata) {
      this.startSubServiceStatically(prophash.data.modulename,'db',prophash.data).then(
        this.readyToAcceptUsersDefer.resolve.bind(this.readyToAcceptUsersDefer, true),
        this.close.bind(this)
      );
    }
  }
  ParentService.inherit(UserResolverService, factoryCreator);
  UserResolverService.prototype.__cleanUp = function() {
    ParentService.prototype.__cleanUp.call(this);
  };
  UserResolverService.prototype.isInitiallyReady = function (prophash) {
    return false;
  };
  
  return UserResolverService;
}

module.exports = createUserResolverService;
