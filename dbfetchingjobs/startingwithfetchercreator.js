function createStartingWithFetcher (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function StartingWithFetcher (usernamecolumnname, passwordcolumnname, startingstring, sink, defer) {
    mylib.DbFetchingJob.call(this, usernamecolumnname, passwordcolumnname, sink, defer);
    this.startingstring = startingstring;
  }
  lib.inherit(StartingWithFetcher, mylib.DbFetchingJob);
  StartingWithFetcher.prototype.destroy = function () {
    this.startingstring = null;
    mylib.DbFetchingJob.prototype.destroy.call(this);
  };
  StartingWithFetcher.prototype.createFilter = function () {
    return {
      op: 'startingwith',
      field: this.usernamecolumnname,
      value: this.startingstring
    };
  };
  StartingWithFetcher.prototype.isSingleShot = function () {
    return false;
  };
  StartingWithFetcher.prototype.visibleFields = function () {
    return [this.usernamecolumnname];
  };

  mylib.StartingWithFetcher = StartingWithFetcher;
}
module.exports = createStartingWithFetcher;
