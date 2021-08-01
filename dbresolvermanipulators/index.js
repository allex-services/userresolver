function createDbResolverManipulatorsLib (execlib) {
  'use strict';

  var lib = execlib.lib,
    mylib = {};

  require('./basecreator')(lib, mylib);
  require('./plaincreator')(lib, mylib);
  require('./cryptercreator')(lib, mylib);
  require('./mongodbcryptercreator')(lib, mylib);

  return mylib;
}
module.exports = createDbResolverManipulatorsLib;
