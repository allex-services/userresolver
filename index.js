function createServicePack(execlib) {
  'use strict';
  var ret = require('./clientside')(execlib),
    execSuite = execlib.execSuite,
    ParentServicePack = execSuite.registry.get('.');

  ret.Service = require('./servicecreator')(execlib, ParentServicePack);
  return ret;
}

module.exports = createServicePack;
