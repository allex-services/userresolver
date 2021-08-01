function createFetcherByHashUsernameJob (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function FetcherByHashUserName (usernamecolumnname, passwordcolumnname, credentials, sink, defer) {
    mylib.DbFetchingJob.call(this, usernamecolumnname, passwordcolumnname, sink, defer);
    this.credentials = credentials;
  }
  lib.inherit(FetcherByHashUserName, mylib.DbFetchingJob);
  FetcherByHashUserName.prototype.destroy = function () {
    this.credentials = null;
    mylib.DbFetchingJob.prototype.destroy.call(this);
  };
  FetcherByHashUserName.prototype.createFilter = function () {
    return {
      op: 'eq',
      field: this.usernamecolumnname,
      value: this.userNameValueOf(this.credentials)
    };
  };
  FetcherByHashUserName.prototype.isSingleShot = function () {
    return true;
  };

  mylib.FetcherByHashUserName = FetcherByHashUserName;
}
module.exports = createFetcherByHashUsernameJob;
