function createPlainManipulator (lib, mylib) {
  'use strict';
  var q = lib.q,
    qlib = lib.qlib;

  function PlainManipulator (prophash) {
    mylib.Base.call(this, prophash);
  }
  lib.inherit(PlainManipulator, mylib.Base);
  PlainManipulator.prototype.dbChannelName = function () {
    return 'user';
  };

  mylib.PlainManipulator = PlainManipulator;
}
module.exports = createPlainManipulator;
