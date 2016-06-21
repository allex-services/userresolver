function createServicePack(execlib) {
  'use strict';

  return {
    service: {
      dependencies: ['.']
    },
    sinkmap: {
      dependencies: ['.']
    }
  };
}

module.exports = createServicePack;
