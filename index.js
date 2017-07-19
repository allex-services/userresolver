function createServicePack(execlib) {
  'use strict';

  return {
    service: {
      dependencies: ['.', 'allex_saltandhashlib']
    },
    sinkmap: {
      dependencies: ['.']
    }
  };
}

module.exports = createServicePack;
