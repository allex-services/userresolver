function createUserResolverService(execlib, ParentServicePack) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    ParentService = ParentServicePack.Service;

  function factoryCreator(parentFactory) {
    return {
      'service': require('./users/serviceusercreator')(execlib, parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib, parentFactory.get('user')) 
    };
  }

  function UserResolverService(prophash) {
    if(!(prophash && prophash.data)){
      throw new lib.Error('NO_DATA_IN_PROPERTYHASH','UserResolverService propertyhash misses the data field');
    }
    if(!prophash.data.modulename){
      throw new lib.Error('NO_DATA_MODULENAME_IN_PROPERTYHASH','UserResolverService propertyhash misses the data.modulename field');
    }
    ParentService.call(this, prophash);
    this.namecolumn = prophash.namecolumn || 'username';
    this.passwordcolumn = prophash.passwordcolumn || 'cryptedpassword';
    this.startSubServiceStatically(prophash.data.modulename,'db',prophash.data);
  }
  ParentService.inherit(UserResolverService, factoryCreator);
  UserResolverService.prototype.__cleanUp = function() {
    ParentService.prototype.__cleanUp.call(this);
  };
  
  return UserResolverService;
}

module.exports = createUserResolverService;
