function createCrypter (lib, mylib) {
  'use strict';
  var q = lib.q;

  function Crypter(prophash) {
    mylib.Base.call(this, prophash);
  }
  lib.inherit(Crypter, mylib.Base);

  mylib.Crypter = Crypter;
}

module.exports = createCrypter;
