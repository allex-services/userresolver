function createServicePack(execlib) {
  'use strict';

  return {
    service: {
      dependencies: ['.', 'allex:saltandhash:lib']
    },
    sinkmap: {
      dependencies: ['.']
    }
  };
}

module.exports = createServicePack;
