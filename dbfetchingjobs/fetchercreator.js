function createDbFetchingJob (execlib, mylib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function DbFetchingJob (usernamecolumnname, passwordcolumnname, sink, defer) {
    mylib.DbFetchingJobBase.call(this, usernamecolumnname, passwordcolumnname, sink, defer);
  }
  lib.inherit(DbFetchingJob, mylib.DbFetchingJobBase);
  DbFetchingJob.prototype.goWithSink = function () {
    taskRegistry.run('readFromDataSink', {
      sink: this.destroyable,
      cb: this.onRecordsFetched.bind(this),
      errorcb: this.reject.bind(this),
      filter: this.createFilter(),
      singleshot: this.isSingleShot(),
      visiblefields: this.visibleFields()
    });
  };
  DbFetchingJob.prototype.createFilter = function () {
    return {};
  };
  DbFetchingJob.prototype.isSingleShot = function () {
    return false;
  };
  DbFetchingJob.prototype.visibleFields = function () {
    return null;
  };

  DbFetchingJob.prototype.onRecordsFetched = function (records) {
    this.resolve(records);
  };

  mylib.DbFetchingJob = DbFetchingJob;
}
module.exports = createDbFetchingJob;
