function run (execlib, sink){
  'use strict';
  var lib = execlib.lib,
    qlib = lib.qlib,
    testlib = require('./testlib')(execlib);
    
  qlib.promise2console(new qlib.PromiseChainerJob([
    testlib.test_resolveUser_to_null.bind(null, sink),
    testlib.test_registerUser.bind(null, sink),
    testlib.test_resolveUser_to_self.bind(null, sink),
    testlib.test_fetchUser.bind(null, sink)
  ]).go(), 'test');
}

function waitToRun(execlib, sink) {
  execlib.lib.runNext(run.bind(null, execlib, sink), 200);
}

function go(taskobj) {
  require('child_process').exec('mongo resolvertestdb --eval "db.users.drop()"', null, run.bind(null, taskobj.execlib, taskobj.sink));
}

module.exports = go;
