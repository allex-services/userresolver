function createExistsFetcher (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function ExistsFetcher (usernamecolumnname, passwordcolumnname, username, sink, defer) {
    mylib.DbFetchingJob.call(this, usernamecolumnname, passwordcolumnname, sink, defer);
    this.username = username;
  }
  lib.inherit(ExistsFetcher, mylib.DbFetchingJob);
  ExistsFetcher.prototype.destroy = function () {
    this.username = null;
    mylib.DbFetchingJob.prototype.destroy.call(this);
  };
  ExistsFetcher.prototype.createFilter = function () {
    return {
      op: 'eq',
      field: this.usernamecolumnname,
      value: this.username
    };
  };
  ExistsFetcher.prototype.isSingleShot = function () {
    return false;
  };
  ExistsFetcher.prototype.visibleFields = function () {
    return [this.usernamecolumnname];
  };

  ExistsFetcher.prototype.onRecordsFetched = function (records) {
    this.resolve(records && records.length>0);
  };

  mylib.ExistsFetcher = ExistsFetcher;

}
module.exports = createExistsFetcher;
