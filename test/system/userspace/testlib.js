var chai = require('chai'),
  expect = chai.expect,
  _testCredentials = {username: 'andra', password: '123'};

chai.use(require('chai-as-promised'));

function createTestLib (execlib) {

  'use strict';
  var lib = execlib.lib,
    qlib = lib.qlib, 
    registerObj = {role: 'user'};

  lib.extend(registerObj, _testCredentials);

  function expectOnSink(sink) {
    return expect(sink.call.apply(sink, Array.prototype.slice.call(arguments, 1)));
  }

  function test_resolveUser_to_null (sink) {
    return expectOnSink(sink, 'resolveUser', _testCredentials).to.eventually.equal(null);
  };

  function test_registerUser (sink) {
    return expectOnSink(sink, 'registerUser', registerObj).to.eventually.have.property('username');
  }

  function test_resolveUser_to_self (sink) {
    return expectOnSink(sink, 'resolveUser', _testCredentials).to.eventually.have.deep.property('profile.username', 'andra');
  };

  function test_fetchUser (sink) {
    return expectOnSink(sink, 'fetchUser', _testCredentials).to.eventually.have.deep.property('profile.username', 'andra');
  };

  function test_usernamesLike(sink) {
    return expectOnSink(sink, 'usernamesLike', 'andr').to.eventually.have.deep.property('profile.username', 'andra');
  };

  function test_usernameExists(sink) {
    return expectOnSink(sink, 'usernameExists', 'andra').to.eventually.be.true;
  };

  return {
    test_resolveUser_to_null: test_resolveUser_to_null,
    test_resolveUser_to_self: test_resolveUser_to_self,
    test_registerUser: test_registerUser,
    test_fetchUser: test_fetchUser,
    test_usernamesLike : test_usernamesLike,
    test_usernameExists : test_usernameExists
  };

}

module.exports = createTestLib;
