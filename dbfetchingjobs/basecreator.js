function createBaseDbFetchingJob (execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    JobOnDestroyable = qlib.JobOnDestroyable;

  function DbFetchingJobBase (usernamecolumnname, passwordcolumnname, sink, defer) {
    JobOnDestroyable.call(this, sink, defer);
    this.usernamecolumnname = usernamecolumnname;
    this.passwordcolumnname = passwordcolumnname;
  }
  lib.inherit(DbFetchingJobBase, JobOnDestroyable);
  DbFetchingJobBase.prototype.destroy = function () {
    this.passwordcolumnname = null;
    this.usernamecolumnname = null;
    JobOnDestroyable.prototype.destroy.call(this);
  };
  DbFetchingJobBase.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    this.goWithSink();
    return ok.val;
  };
  DbFetchingJobBase.prototype.goWithSink = function () {
  };
  DbFetchingJobBase.prototype.userNameValueOf = function (obj) {
    return obj ? obj[this.usernamecolumnname] : void 0;
  };

  mylib.DbFetchingJobBase = DbFetchingJobBase;
}
module.exports = createBaseDbFetchingJob;
