function createDbResolverManipulatorBase (lib, mylib) {
  'use strict';

  function DbResolverManipulatorBase (prophash) {
    this.namecolumn = prophash.namecolumn || 'username';
    this.passwordcolumn = prophash.passwordcolumn || 'password';
    this.dbSink = null;
  }
  DbResolverManipulatorBase.prototype.destroy = function () {
    if (this.dbSink) {
      this.dbSink.destroy();
    }
    this.dbSink = null;
    this.passwordcolumn = null;
    this.namecolumn = null;
  };
  DbResolverManipulatorBase.prototype.subConnectToDbSink = function (dbsink) {
    var dbchannel = this.dbChannelName();
    if (!dbchannel) {
      return q(null);
    }
    return dbsink.subConnect('.', {name: dbchannel, role: dbchannel}).then(
      this.onDbSink.bind(this)
    );
  };
  DbResolverManipulatorBase.prototype.onDbSink = function (sink) {
    this.dbSink = sink;
    return sink;
  };
  DbResolverManipulatorBase.prototype.dbChannelName = function () {
    return null; //don't subconnect to DB
  };

  mylib.Base = DbResolverManipulatorBase;
}
module.exports = createDbResolverManipulatorBase;
