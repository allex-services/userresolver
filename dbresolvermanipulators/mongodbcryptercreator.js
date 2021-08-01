function createMongoDbCrypter (lib, mylib) {
  'use strict';
  var q = lib.q,
    qlib = lib.qlib;

  function MongoDbCrypter (prophash) {
    mylib.Crypter.call(this, prophash);
  }
  lib.inherit(MongoDbCrypter, mylib.Crypter);
  MongoDbCrypter.prototype.onDbSink = function (sink) {
    if (!(sink && sink.visibleFields && sink.visibleFields.indexOf('salt')>=0)){
      throw new lib.Error('NO_SALT_IN_DB_VISIBLE_FIELDS');
    }
    return mylib.Crypter.prototype.onDbSink.call(this, sink);
  };
  MongoDbCrypter.prototype.dbChannelName = function () {
    return 'crypto';
  };

  mylib.MongoDbCrypter = MongoDbCrypter;
}
module.exports = createMongoDbCrypter;
